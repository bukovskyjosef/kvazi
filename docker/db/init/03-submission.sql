-- Migration 03: sentence, sentence_revision, sentence_process
-- Three-table immutable submission model.
--
-- sentence           — long-lived competition-entry container owned by one user
-- sentence_revision  — immutable snapshot created on every submit
-- sentence_process   — mutable review state, bound to the sentence's current active revision

CREATE TABLE IF NOT EXISTS kvazi.sentence (
    id         BIGSERIAL   PRIMARY KEY,
    user_id    BIGINT      NOT NULL
                 REFERENCES kvazi.user_account(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kvazi.sentence_revision (
    id            BIGSERIAL   PRIMARY KEY,
    sentence_id   BIGINT      NOT NULL
                    REFERENCES kvazi.sentence(id) ON DELETE CASCADE,
    revision_no   INT         NOT NULL DEFAULT 1,
    rules_version VARCHAR(80) NOT NULL,
    draft_json    JSONB       NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (sentence_id, revision_no)
);

-- One row per sentence; revision_id always points to the current active revision.
-- On resubmit: UPDATE revision_id + reset status to 'pending'.
CREATE TABLE IF NOT EXISTS kvazi.sentence_process (
    id          BIGSERIAL   PRIMARY KEY,
    sentence_id BIGINT      NOT NULL
                  REFERENCES kvazi.sentence(id) ON DELETE CASCADE,
    revision_id BIGINT      NOT NULL
                  REFERENCES kvazi.sentence_revision(id),
    status      VARCHAR(20) NOT NULL DEFAULT 'pending',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_proc_status
        CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    UNIQUE (sentence_id)
);

CREATE INDEX IF NOT EXISTS idx_sentence_user   ON kvazi.sentence(user_id);
CREATE INDEX IF NOT EXISTS idx_rev_sentence    ON kvazi.sentence_revision(sentence_id);
CREATE INDEX IF NOT EXISTS idx_proc_sentence   ON kvazi.sentence_process(sentence_id);
CREATE INDEX IF NOT EXISTS idx_proc_status     ON kvazi.sentence_process(status);
CREATE INDEX IF NOT EXISTS idx_rev_created     ON kvazi.sentence_revision(created_at DESC);
