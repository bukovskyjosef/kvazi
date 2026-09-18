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
