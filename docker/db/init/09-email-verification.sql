BEGIN;

ALTER TABLE kvazi.user_account ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ NULL;
-- Grandfather existing accounts so they are not locked out.
UPDATE kvazi.user_account SET email_verified_at = created_at WHERE email_verified_at IS NULL;

CREATE TABLE IF NOT EXISTS kvazi.auth_token (
    id         BIGSERIAL   PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES kvazi.user_account(id) ON DELETE CASCADE,
    purpose    VARCHAR(30) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_at_purpose  CHECK (purpose IN ('email_verification','password_recovery')),
    CONSTRAINT chk_at_hash_hex CHECK (token_hash ~ '^[a-f0-9]{64}$')
);
CREATE INDEX IF NOT EXISTS idx_at_token_hash    ON kvazi.auth_token (token_hash);
CREATE INDEX IF NOT EXISTS idx_at_user_purpose  ON kvazi.auth_token (user_id, purpose);

COMMIT;

BEGIN;
INSERT INTO kvazi.rules_release(version,normative_hash,validator_version,activated_at,description)
VALUES ('public-1.3.2', 'c07b03fff5504eda35c00a24c5035bf431ad693c4770d5c79fd04a801bf076fb', '1.3.2', '2026-09-18T00:00:00Z', 'Password recovery challenge validation and public surface accessor (#105)')
ON CONFLICT (version) DO NOTHING;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM kvazi.rules_release WHERE version='public-1.3.2' AND normative_hash='c07b03fff5504eda35c00a24c5035bf431ad693c4770d5c79fd04a801bf076fb' AND validator_version='1.3.2') THEN
    RAISE EXCEPTION 'Password recovery release registration conflict';
  END IF;
END $$;
COMMIT;
