-- Migration 03: cílový model pro podání, validaci, process compliance a admin decisions.
-- Odpovídá rozhodnutím kvaziautority v #8 a závislostem #7/#9.
--
-- Osy jsou datově odděleny:
--   sentence + sentence_revision  — kontejner a immutable snapshot submitu
--   rules_release                 — immutable manifest normativního releasu
--   validation_result             — obsahový deterministický verdict (per revision + rules_version)
--   process_compliance            — historický fakt o souladu procesu podání
--   administrative_decision       — admin approve/reject/return/archive
--   audit_log                     — auditní stopa admin akcí (#36)
--
-- Disposable dev data: při docker compose down -v se vše smaže; bootstrap
-- vytvoří čisté schéma bez seed dat ani legacy stavu.

-- ─────────────────────────────────────────────────────────
-- RULES RELEASE
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kvazi.rules_release (
    version         VARCHAR(80)  PRIMARY KEY,
    normative_hash  VARCHAR(64)  NOT NULL,
    validator_version VARCHAR(20) NOT NULL,
    activated_at    TIMESTAMPTZ  NOT NULL,
    description     TEXT         NOT NULL DEFAULT ''
);

-- Seed pro první rules verzi. Odpovídá app/data/rules/public-1/manifest.json.
INSERT INTO kvazi.rules_release (version, normative_hash, validator_version, activated_at, description)
VALUES (
    'public-1',
    '3d3efe9df1ed04f13396dd4dee4315da84f76f5a5cf3101b6d9264897cfaec1d',
    '1.0.0',
    '2026-09-15T00:00:00Z',
    'První veřejná rules verze. Normativní morfologická paradigmata, DFA motivové pravidlo, whitelist znaků, auxiliary být, scoring, relation shapes a rekce předložek k/v/z.'
)
ON CONFLICT (version) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- SENTENCE — stabilní kontejner jednoho řešení
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kvazi.sentence (
    id         BIGSERIAL   PRIMARY KEY,
    user_id    BIGINT      NOT NULL
                 REFERENCES kvazi.user_account(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sentence_user ON kvazi.sentence(user_id);

-- ─────────────────────────────────────────────────────────
-- SENTENCE REVISION — immutable snapshot každého submitu
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kvazi.sentence_revision (
    id            BIGSERIAL   PRIMARY KEY,
    sentence_id   BIGINT      NOT NULL
                    REFERENCES kvazi.sentence(id) ON DELETE CASCADE,
    revision_no   INT         NOT NULL,
    rules_version VARCHAR(80) NOT NULL
                    REFERENCES kvazi.rules_release(version),
    submitted_by  BIGINT      NOT NULL
                    REFERENCES kvazi.user_account(id),
    draft_json    JSONB       NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (sentence_id, revision_no),
    -- Cross-sentence integrity: submitted_by must be the sentence owner.
    -- Enforced via trigger below.
    CONSTRAINT chk_rev_no_positive CHECK (revision_no >= 1)
);

-- Composite unique for cross-sentence FK support in child tables.
CREATE UNIQUE INDEX IF NOT EXISTS uidx_rev_sentence_id
    ON kvazi.sentence_revision(sentence_id, id);

CREATE INDEX IF NOT EXISTS idx_rev_sentence  ON kvazi.sentence_revision(sentence_id);
CREATE INDEX IF NOT EXISTS idx_rev_created   ON kvazi.sentence_revision(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rev_rules     ON kvazi.sentence_revision(rules_version);

-- Enforce: revision.submitted_by must equal sentence.user_id
CREATE OR REPLACE FUNCTION kvazi.check_revision_owner() RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM kvazi.sentence
         WHERE id = NEW.sentence_id AND user_id = NEW.submitted_by
    ) THEN
        RAISE EXCEPTION 'sentence_revision.submitted_by must equal sentence.user_id for sentence %', NEW.sentence_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_revision_owner ON kvazi.sentence_revision;
CREATE TRIGGER trg_check_revision_owner
    BEFORE INSERT OR UPDATE ON kvazi.sentence_revision
    FOR EACH ROW EXECUTE FUNCTION kvazi.check_revision_owner();

-- ─────────────────────────────────────────────────────────
-- VALIDATION RESULT — obsahový deterministický verdict
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kvazi.validation_result (
    id                BIGSERIAL    PRIMARY KEY,
    sentence_id       BIGINT       NOT NULL
                        REFERENCES kvazi.sentence(id) ON DELETE CASCADE,
    revision_id       BIGINT       NOT NULL,
    rules_version     VARCHAR(80)  NOT NULL
                        REFERENCES kvazi.rules_release(version),
    validator_version VARCHAR(20)  NOT NULL,
    -- Authoritative scores
    word_score        INT          NOT NULL DEFAULT 0,
    char_score        INT          NOT NULL DEFAULT 0,
    -- Whether all deterministic blockeri passed
    is_valid          BOOLEAN      NOT NULL DEFAULT FALSE,
    -- Full structured result JSON (issues, per-token detail, etc.)
    result_json       JSONB        NOT NULL DEFAULT '{}',
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    -- One result per (sentence_revision, rules_version) — revalidation creates a new row
    UNIQUE (revision_id, rules_version),
    -- Cross-sentence integrity: revision_id must belong to sentence_id
    FOREIGN KEY (sentence_id, revision_id)
        REFERENCES kvazi.sentence_revision(sentence_id, id)
);

CREATE INDEX IF NOT EXISTS idx_vr_revision    ON kvazi.validation_result(revision_id);
CREATE INDEX IF NOT EXISTS idx_vr_sentence    ON kvazi.validation_result(sentence_id);
CREATE INDEX IF NOT EXISTS idx_vr_valid       ON kvazi.validation_result(is_valid);

-- ─────────────────────────────────────────────────────────
-- PROCESS COMPLIANCE — historický fakt o souladu procesu
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kvazi.process_compliance (
    id                     BIGSERIAL    PRIMARY KEY,
    sentence_id            BIGINT       NOT NULL
                             REFERENCES kvazi.sentence(id) ON DELETE CASCADE,
    revision_id            BIGINT       NOT NULL,
    rules_version_at_submit VARCHAR(80) NOT NULL
                             REFERENCES kvazi.rules_release(version),
    -- Immutable after creation; records whether the submission process met AI policy
    ai_policy_compliant    BOOLEAN,
    notes                  TEXT         NOT NULL DEFAULT '',
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    -- One compliance record per revision
    UNIQUE (revision_id),
    FOREIGN KEY (sentence_id, revision_id)
        REFERENCES kvazi.sentence_revision(sentence_id, id)
);

CREATE INDEX IF NOT EXISTS idx_pc_revision ON kvazi.process_compliance(revision_id);

-- ─────────────────────────────────────────────────────────
-- ADMINISTRATIVE DECISION — admin approve/reject/return/archive
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kvazi.administrative_decision (
    id           BIGSERIAL    PRIMARY KEY,
    sentence_id  BIGINT       NOT NULL
                   REFERENCES kvazi.sentence(id) ON DELETE CASCADE,
    revision_id  BIGINT       NOT NULL,
    admin_id     BIGINT       NOT NULL
                   REFERENCES kvazi.user_account(id),
    action       VARCHAR(20)  NOT NULL,
    reason       TEXT         NOT NULL DEFAULT '',
    decided_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_ad_action CHECK (action IN ('approve', 'reject', 'return', 'archive')),
    FOREIGN KEY (sentence_id, revision_id)
        REFERENCES kvazi.sentence_revision(sentence_id, id)
);

CREATE INDEX IF NOT EXISTS idx_ad_revision   ON kvazi.administrative_decision(revision_id);
CREATE INDEX IF NOT EXISTS idx_ad_sentence   ON kvazi.administrative_decision(sentence_id);
CREATE INDEX IF NOT EXISTS idx_ad_decided_at ON kvazi.administrative_decision(decided_at DESC);

-- ─────────────────────────────────────────────────────────
-- AUDIT LOG — auditní stopa citlivých admin operací (#36)
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kvazi.audit_log (
    id          BIGSERIAL    PRIMARY KEY,
    actor_id    BIGINT       REFERENCES kvazi.user_account(id) ON DELETE SET NULL,
    action      VARCHAR(80)  NOT NULL,
    entity_type VARCHAR(40)  NOT NULL,
    entity_id   BIGINT,
    before_json JSONB,
    after_json  JSONB,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_al_actor  ON kvazi.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_al_action ON kvazi.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_al_ts     ON kvazi.audit_log(created_at DESC);
