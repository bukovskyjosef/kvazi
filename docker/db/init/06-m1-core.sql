-- M1 core. Also executable as an atomic upgrade after 05-m1-release.sql.
-- Existing historical input/verdict/release rows are preserved. Invalid legacy
-- ownership/version/decision data causes the entire upgrade to fail for review.
BEGIN;
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM kvazi.sentence_revision r JOIN kvazi.sentence s ON s.id=r.sentence_id WHERE r.submitted_by <> s.user_id) THEN
        RAISE EXCEPTION 'Legacy revision ownership conflict requires explicit review';
    END IF;
END $$;
DROP TABLE IF EXISTS kvazi.process_compliance;
DROP TABLE IF EXISTS kvazi.audit_log;

CREATE UNIQUE INDEX IF NOT EXISTS uidx_ua_email_folded ON kvazi.user_account (lower(btrim(email)));
CREATE UNIQUE INDEX IF NOT EXISTS uidx_ua_username_folded ON kvazi.user_account (lower(username));
CREATE UNIQUE INDEX IF NOT EXISTS uidx_release_validator ON kvazi.rules_release(version, validator_version);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_ad_final_revision ON kvazi.administrative_decision(revision_id);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_vr_id_rules ON kvazi.validation_result(id, rules_version);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_vr_release_validator' AND conrelid = 'kvazi.validation_result'::regclass) THEN
        ALTER TABLE kvazi.validation_result ADD CONSTRAINT fk_vr_release_validator
            FOREIGN KEY (rules_version, validator_version) REFERENCES kvazi.rules_release(version, validator_version);
        ALTER TABLE kvazi.validation_result ADD CONSTRAINT chk_vr_scores CHECK (word_score >= 0 AND char_score >= 0);
    END IF;
END $$;
ALTER TABLE kvazi.administrative_decision DROP CONSTRAINT IF EXISTS chk_ad_action;
ALTER TABLE kvazi.administrative_decision ADD CONSTRAINT chk_ad_action CHECK (action IN ('approve', 'return', 'reject'));

-- Exact case keys are canonical complete identity, concrete morphology and surface.
-- UNKNOWN is absence of a decision. Neither table has a public membership API.
CREATE TABLE IF NOT EXISTS kvazi.morphology_review_case (
    id BIGSERIAL PRIMARY KEY,
    rules_version VARCHAR(80) NOT NULL REFERENCES kvazi.rules_release(version),
    identity_json JSONB NOT NULL CHECK (jsonb_typeof(identity_json) = 'object' AND identity_json <> '{}'),
    form_json JSONB NOT NULL CHECK (jsonb_typeof(form_json) = 'object' AND form_json <> '{}'),
    surface_form TEXT NOT NULL CHECK (surface_form <> '' AND surface_form = lower(normalize(surface_form, NFC))),
    UNIQUE (rules_version, identity_json, form_json, surface_form),
    UNIQUE (id, rules_version)
);
CREATE TABLE IF NOT EXISTS kvazi.morphology_review_decision (
    id BIGSERIAL PRIMARY KEY,
    case_id BIGINT NOT NULL,
    rules_version VARCHAR(80) NOT NULL,
    decision_no INT NOT NULL CHECK (decision_no >= 1),
    verdict VARCHAR(10) NOT NULL CHECK (verdict IN ('APPROVED', 'REJECTED')),
    reason TEXT NOT NULL DEFAULT '',
    admin_id BIGINT NOT NULL REFERENCES kvazi.user_account(id),
    decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (verdict <> 'REJECTED' OR btrim(reason) <> ''),
    FOREIGN KEY (case_id, rules_version) REFERENCES kvazi.morphology_review_case(id, rules_version),
    UNIQUE (case_id, decision_no),
    UNIQUE (id, rules_version)
);
-- Latest decision_no per exact case is used for future lookups. Corrections append.
CREATE TABLE IF NOT EXISTS kvazi.validation_result_review (
    validation_result_id BIGINT NOT NULL,
    token_id TEXT NOT NULL CHECK (token_id <> ''),
    review_decision_id BIGINT NOT NULL,
    rules_version VARCHAR(80) NOT NULL,
    PRIMARY KEY (validation_result_id, token_id),
    FOREIGN KEY (validation_result_id, rules_version) REFERENCES kvazi.validation_result(id, rules_version),
    FOREIGN KEY (review_decision_id, rules_version) REFERENCES kvazi.morphology_review_decision(id, rules_version)
);

-- Separate, operational lexical authority, deliberately not rules-version scoped.
CREATE TABLE IF NOT EXISTS kvazi.real_word_catalog (
    id BIGSERIAL PRIMARY KEY,
    identity_json JSONB NOT NULL CHECK (jsonb_typeof(identity_json) = 'object' AND identity_json <> '{}'),
    form_json JSONB NOT NULL CHECK (jsonb_typeof(form_json) = 'object' AND form_json <> '{}'),
    surface_form TEXT NOT NULL CHECK (surface_form <> '' AND surface_form = lower(normalize(surface_form, NFC))),
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    reason TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT '',
    admin_id BIGINT NOT NULL REFERENCES kvazi.user_account(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (identity_json, form_json, surface_form)
);

CREATE OR REPLACE FUNCTION kvazi.check_review_token() RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM kvazi.validation_result v
        JOIN kvazi.sentence_revision r ON r.id=v.revision_id,
        LATERAL jsonb_array_elements(r.draft_json->'tokens') t
        WHERE v.id=NEW.validation_result_id AND t->>'id'=NEW.token_id
    ) THEN RAISE EXCEPTION 'review reference must target a token of the validated revision'; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_review_token ON kvazi.validation_result_review;
CREATE TRIGGER trg_review_token BEFORE INSERT ON kvazi.validation_result_review FOR EACH ROW EXECUTE FUNCTION kvazi.check_review_token();

CREATE OR REPLACE FUNCTION kvazi.reject_history_mutation() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION '% is immutable: % forbidden', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;
DO $$ DECLARE t TEXT; BEGIN
    FOREACH t IN ARRAY ARRAY['rules_release', 'sentence_revision', 'validation_result',
        'administrative_decision', 'morphology_review_case', 'morphology_review_decision', 'validation_result_review'] LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_immutable ON kvazi.%I', t);
        EXECUTE format('CREATE TRIGGER trg_immutable BEFORE UPDATE OR DELETE ON kvazi.%I FOR EACH ROW EXECUTE FUNCTION kvazi.reject_history_mutation()', t);
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION kvazi.check_revision_owner() RETURNS TRIGGER AS $$
DECLARE next_no INT; BEGIN
    -- Same parent lock as HTTP resubmit; serializes concurrent revision creation.
    PERFORM 1 FROM kvazi.sentence WHERE id = NEW.sentence_id AND user_id = NEW.submitted_by FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'revision submitter must be sentence owner'; END IF;
    SELECT coalesce(max(revision_no), 0) + 1 INTO next_no FROM kvazi.sentence_revision WHERE sentence_id = NEW.sentence_id;
    IF NEW.revision_no <> next_no THEN RAISE EXCEPTION 'revision_no must be next monotonic number %', next_no; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION kvazi.reject_owner_change() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id <> OLD.user_id THEN RAISE EXCEPTION 'sentence owner is immutable'; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_owner_immutable ON kvazi.sentence;
CREATE TRIGGER trg_owner_immutable BEFORE UPDATE ON kvazi.sentence FOR EACH ROW EXECUTE FUNCTION kvazi.reject_owner_change();

CREATE OR REPLACE FUNCTION kvazi.require_deciding_admin() RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM kvazi.user_account WHERE id = NEW.admin_id AND role = 'ADMIN') THEN
        RAISE EXCEPTION 'decision requires ADMIN';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DO $$ DECLARE t TEXT; BEGIN
    FOREACH t IN ARRAY ARRAY['administrative_decision', 'morphology_review_decision', 'real_word_catalog'] LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_deciding_admin ON kvazi.%I', t);
        EXECUTE format('CREATE TRIGGER trg_deciding_admin BEFORE INSERT OR UPDATE ON kvazi.%I FOR EACH ROW EXECUTE FUNCTION kvazi.require_deciding_admin()', t);
    END LOOP;
END $$;
CREATE OR REPLACE FUNCTION kvazi.check_review_sequence() RETURNS TRIGGER AS $$
DECLARE next_no INT; BEGIN
    PERFORM 1 FROM kvazi.morphology_review_case WHERE id = NEW.case_id FOR UPDATE;
    SELECT coalesce(max(decision_no), 0) + 1 INTO next_no FROM kvazi.morphology_review_decision WHERE case_id = NEW.case_id;
    IF NEW.decision_no <> next_no THEN RAISE EXCEPTION 'review decision_no must be %', next_no; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_review_sequence ON kvazi.morphology_review_decision;
CREATE TRIGGER trg_review_sequence BEFORE INSERT ON kvazi.morphology_review_decision FOR EACH ROW EXECUTE FUNCTION kvazi.check_review_sequence();

-- Short-lived operational counters, not account lockout or security event history.
CREATE TABLE IF NOT EXISTS kvazi.login_throttle (
    remote_address TEXT PRIMARY KEY,
    failures INT NOT NULL DEFAULT 0,
    window_started_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMIT;
