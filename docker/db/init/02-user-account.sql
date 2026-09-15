-- Migration 02: user_account table + admin seed
-- Implements: docs/architecture/04-comments-auth-admin.md
--             docs/governance/decisions.md  (#35, #36, #37)
--
-- One table for all roles (USER / ADMIN).
-- No separate admin_user identity (the old admin_user table is superseded).

CREATE TABLE IF NOT EXISTS kvazi.user_account (
    id            BIGSERIAL    PRIMARY KEY,
    username      VARCHAR(30)  NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(10)  NOT NULL DEFAULT 'USER',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_ua_username UNIQUE (username),
    CONSTRAINT uq_ua_email    UNIQUE (email),
    CONSTRAINT chk_ua_role    CHECK  (role IN ('USER', 'ADMIN')),
    CONSTRAINT chk_ua_username_chars  CHECK (username ~ '^[A-Za-z0-9_-]+$'),
    CONSTRAINT chk_ua_username_length CHECK (length(username) BETWEEN 3 AND 30)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ua_email    ON kvazi.user_account (email);
CREATE INDEX IF NOT EXISTS idx_ua_username ON kvazi.user_account (username);

-- Seed: admin account
-- Initial password: KvaziAdmin2025!
-- Change via: UPDATE kvazi.user_account SET password_hash = '<hash>' WHERE username = 'josef-bukovsky';
INSERT INTO kvazi.user_account (username, email, password_hash, role)
VALUES (
    'josef-bukovsky',
    'bukovskyjosef@gmail.com',
    '$2y$12$2qApXIPEx4GnX0J9OaV4.eHd/ymcibnSjBSzHuv/X29xVi7WnYxD.',
    'ADMIN'
)
ON CONFLICT (username) DO NOTHING;
