-- Migration 10: account deletion / erasure with immutable approved history preservation.
-- Depends on: 02-user-account.sql, 03-submission.sql, 06-m1-core.sql, 09-email-verification.sql
-- Issue: #162, Decision: H-2/H-15/H-16/H-17/H-21/H-22 via #150
--
-- Forward-safe: idempotent over existing DB via IF NOT EXISTS / OR REPLACE.
-- Does not touch approved data. Does not create public HTTP surface.

-- ─────────────────────────────────────────────────────────
-- 1. deleted_at marker on user_account
-- ─────────────────────────────────────────────────────────

ALTER TABLE kvazi.user_account ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

-- ─────────────────────────────────────────────────────────
-- 2. Bounded erasure exception in immutable trigger
-- ─────────────────────────────────────────────────────────
-- Allows DELETE of non-approved submission data when the owner account
-- is marked as deleted. Approved revisions and their binding remain
-- fully immutable. Shared review/catalog/release tables are unaffected.

CREATE OR REPLACE FUNCTION kvazi.reject_history_mutation() RETURNS TRIGGER AS $$
DECLARE
    v_revision_id BIGINT;
BEGIN
    -- UPDATE is always forbidden on immutable history.
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION '% is immutable: UPDATE forbidden', TG_TABLE_NAME;
    END IF;

    -- DELETE: check bounded erasure exception for submission-chain tables only.
    IF TG_OP = 'DELETE' THEN
        -- Resolve the revision_id for the row being deleted.
        IF TG_TABLE_NAME = 'sentence_revision' THEN
            v_revision_id := OLD.id;
        ELSIF TG_TABLE_NAME IN ('validation_result', 'administrative_decision') THEN
            v_revision_id := OLD.revision_id;
        ELSIF TG_TABLE_NAME = 'validation_result_review' THEN
            SELECT vr.revision_id INTO v_revision_id
            FROM kvazi.validation_result vr WHERE vr.id = OLD.validation_result_id;
        ELSE
            -- rules_release, morphology_review_case, morphology_review_decision:
            -- no erasure exception, always immutable.
            RAISE EXCEPTION '% is immutable: DELETE forbidden', TG_TABLE_NAME;
        END IF;

        -- Allow DELETE only when owner is deleted AND revision is not approved.
        IF v_revision_id IS NOT NULL
           AND EXISTS (
               SELECT 1 FROM kvazi.sentence_revision sr
               JOIN kvazi.sentence s ON s.id = sr.sentence_id
               JOIN kvazi.user_account u ON u.id = s.user_id
               WHERE sr.id = v_revision_id AND u.deleted_at IS NOT NULL
           )
           AND NOT EXISTS (
               SELECT 1 FROM kvazi.administrative_decision ad
               WHERE ad.revision_id = v_revision_id AND ad.action = 'approve'
           )
        THEN
            RETURN OLD;
        END IF;
    END IF;

    RAISE EXCEPTION '% is immutable: % forbidden', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

-- Re-apply the trigger on all immutable tables (idempotent).
DO $$ DECLARE t TEXT; BEGIN
    FOREACH t IN ARRAY ARRAY['rules_release', 'sentence_revision', 'validation_result',
        'administrative_decision', 'morphology_review_case', 'morphology_review_decision', 'validation_result_review'] LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_immutable ON kvazi.%I', t);
        EXECUTE format('CREATE TRIGGER trg_immutable BEFORE UPDATE OR DELETE ON kvazi.%I FOR EACH ROW EXECUTE FUNCTION kvazi.reject_history_mutation()', t);
    END LOOP;
END $$;
