-- Migration 03: submission table
-- Stores each user's soutěžní přihláška as a JSONB draft snapshot.

CREATE TABLE IF NOT EXISTS kvazi.submission (
    id            BIGSERIAL    PRIMARY KEY,
    user_id       BIGINT       NOT NULL
                    REFERENCES kvazi.user_account(id) ON DELETE CASCADE,
    rules_version VARCHAR(80)  NOT NULL DEFAULT 'configurator-structural-prototype-1',
    draft_json    JSONB        NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'pending',
    submitted_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_sub_status CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn'))
);

CREATE INDEX IF NOT EXISTS idx_sub_user_id    ON kvazi.submission(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_status     ON kvazi.submission(status);
CREATE INDEX IF NOT EXISTS idx_sub_submitted  ON kvazi.submission(submitted_at DESC);
