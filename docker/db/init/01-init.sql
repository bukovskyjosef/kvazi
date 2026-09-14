-- Inicializace databáze Nejdelší kvazivěta
-- Spouští se automaticky při prvním startu kontejneru.

CREATE SCHEMA IF NOT EXISTS kvazi;

SET search_path TO kvazi;

CREATE TABLE rule_version (
    id BIGSERIAL PRIMARY KEY,
    version VARCHAR(32) NOT NULL UNIQUE,
    status VARCHAR(16) NOT NULL CHECK (status IN ('draft','published','retired')),
    title TEXT NOT NULL,
    content_hash TEXT,
    change_note TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE catalog_version (
    id BIGSERIAL PRIMARY KEY,
    version VARCHAR(32) NOT NULL UNIQUE,
    rule_version_id BIGINT REFERENCES rule_version(id),
    status VARCHAR(16) NOT NULL CHECK (status IN ('draft','published','retired')),
    description TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE part_of_speech (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    name_cs TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE morph_category (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name_cs TEXT NOT NULL,
    description TEXT,
    scope VARCHAR(16) NOT NULL CHECK (scope IN ('identity','form','both')),
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE morph_value (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES morph_category(id),
    code VARCHAR(64) NOT NULL,
    name_cs TEXT NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(category_id, code)
);

CREATE TABLE pos_morph_category (
    part_of_speech_id BIGINT NOT NULL REFERENCES part_of_speech(id),
    morph_category_id BIGINT NOT NULL REFERENCES morph_category(id),
    required BOOLEAN NOT NULL DEFAULT FALSE,
    identity_component BOOLEAN NOT NULL DEFAULT FALSE,
    form_component BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY(part_of_speech_id, morph_category_id)
);

CREATE TABLE morph_pattern (
    id BIGSERIAL PRIMARY KEY,
    part_of_speech_id BIGINT NOT NULL REFERENCES part_of_speech(id),
    code VARCHAR(64) NOT NULL UNIQUE,
    name_cs TEXT NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE reference_source (
    id BIGSERIAL PRIMARY KEY,
    source_type VARCHAR(32),
    title TEXT NOT NULL,
    author TEXT,
    url TEXT,
    citation TEXT,
    note TEXT
);

CREATE TABLE lexeme (
    id BIGSERIAL PRIMARY KEY,
    lemma TEXT NOT NULL,
    part_of_speech_id BIGINT NOT NULL REFERENCES part_of_speech(id),
    kind VARCHAR(16) NOT NULL CHECK (kind IN ('existing','quasi')),
    status VARCHAR(16) NOT NULL CHECK (status IN ('proposed','approved','rejected','retired')),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_at TIMESTAMPTZ
);

CREATE TABLE lexeme_identity (
    id BIGSERIAL PRIMARY KEY,
    lexeme_id BIGINT NOT NULL REFERENCES lexeme(id),
    pattern_id BIGINT REFERENCES morph_pattern(id),
    identity_key TEXT NOT NULL UNIQUE,
    status VARCHAR(16) NOT NULL CHECK (status IN ('proposed','approved','rejected','retired')),
    introduced_catalog_version_id BIGINT REFERENCES catalog_version(id),
    retired_catalog_version_id BIGINT REFERENCES catalog_version(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE identity_morph_value (
    identity_id BIGINT NOT NULL REFERENCES lexeme_identity(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES morph_category(id),
    value_id BIGINT NOT NULL REFERENCES morph_value(id),
    PRIMARY KEY(identity_id, category_id)
);

CREATE TABLE valency_frame (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE valency_slot (
    id BIGSERIAL PRIMARY KEY,
    valency_frame_id BIGINT NOT NULL REFERENCES valency_frame(id) ON DELETE CASCADE,
    role_type VARCHAR(64) NOT NULL,
    case_value_id BIGINT REFERENCES morph_value(id),
    obligatory BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    description TEXT
);

CREATE TABLE identity_valency (
    identity_id BIGINT PRIMARY KEY REFERENCES lexeme_identity(id) ON DELETE CASCADE,
    valency_frame_id BIGINT NOT NULL REFERENCES valency_frame(id)
);

CREATE TABLE accepted_word_form (
    id BIGSERIAL PRIMARY KEY,
    identity_id BIGINT NOT NULL REFERENCES lexeme_identity(id),
    surface_form TEXT NOT NULL,
    normalized_form TEXT NOT NULL,
    status VARCHAR(16) NOT NULL CHECK (status IN ('proposed','approved','rejected','retired')),
    introduced_catalog_version_id BIGINT REFERENCES catalog_version(id),
    retired_catalog_version_id BIGINT REFERENCES catalog_version(id),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_at TIMESTAMPTZ
);

CREATE INDEX accepted_word_form_normalized_idx
    ON accepted_word_form(normalized_form)
    WHERE status = 'approved';

CREATE TABLE word_form_morph_value (
    word_form_id BIGINT NOT NULL REFERENCES accepted_word_form(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES morph_category(id),
    value_id BIGINT NOT NULL REFERENCES morph_value(id),
    PRIMARY KEY(word_form_id, category_id)
);

CREATE TABLE sentence (
    id BIGSERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    status VARCHAR(24) NOT NULL CHECK (status IN ('draft','submitted','under_review','approved','rejected','archived')),
    submitted_rule_version_id BIGINT NOT NULL REFERENCES rule_version(id),
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sentence_revision (
    id BIGSERIAL PRIMARY KEY,
    sentence_id BIGINT NOT NULL REFERENCES sentence(id) ON DELETE CASCADE,
    revision_no INT NOT NULL,
    sentence_text TEXT NOT NULL,
    normalized_text TEXT NOT NULL,
    final_punctuation CHAR(1) NOT NULL CHECK (final_punctuation IN ('.','?','!')),
    word_count INT NOT NULL,
    letter_count INT NOT NULL,
    fictional_meaning TEXT,
    quasi_etymology TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(sentence_id, revision_no)
);

CREATE TABLE sentence_rule_validation (
    sentence_revision_id BIGINT NOT NULL REFERENCES sentence_revision(id) ON DELETE CASCADE,
    rule_version_id BIGINT NOT NULL REFERENCES rule_version(id),
    status VARCHAR(16) NOT NULL CHECK (status IN ('valid','invalid','pending')),
    decided_at TIMESTAMPTZ,
    note TEXT,
    PRIMARY KEY(sentence_revision_id, rule_version_id)
);

CREATE TABLE sentence_token (
    id BIGSERIAL PRIMARY KEY,
    sentence_revision_id BIGINT NOT NULL REFERENCES sentence_revision(id) ON DELETE CASCADE,
    position INT NOT NULL,
    surface_form TEXT NOT NULL,
    normalized_form TEXT NOT NULL,
    UNIQUE(sentence_revision_id, position)
);

CREATE TABLE token_analysis (
    id BIGSERIAL PRIMARY KEY,
    sentence_token_id BIGINT NOT NULL UNIQUE REFERENCES sentence_token(id) ON DELETE CASCADE,
    part_of_speech_id BIGINT NOT NULL REFERENCES part_of_speech(id),
    lexeme_identity_id BIGINT REFERENCES lexeme_identity(id),
    accepted_word_form_id BIGINT REFERENCES accepted_word_form(id),
    lemma_declared TEXT,
    pattern_id BIGINT REFERENCES morph_pattern(id),
    analysis_note TEXT,
    fictional_meaning TEXT
);

CREATE TABLE token_analysis_value (
    token_analysis_id BIGINT NOT NULL REFERENCES token_analysis(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES morph_category(id),
    value_id BIGINT NOT NULL REFERENCES morph_value(id),
    PRIMARY KEY(token_analysis_id, category_id)
);

CREATE TABLE syntax_role (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name_cs TEXT NOT NULL,
    description TEXT
);

CREATE TABLE token_syntax (
    token_analysis_id BIGINT PRIMARY KEY REFERENCES token_analysis(id) ON DELETE CASCADE,
    syntax_role_id BIGINT NOT NULL REFERENCES syntax_role(id),
    head_token_id BIGINT REFERENCES sentence_token(id),
    description TEXT
);

CREATE TABLE token_supplement_syntax (
    token_analysis_id BIGINT PRIMARY KEY REFERENCES token_syntax(token_analysis_id) ON DELETE CASCADE,
    predicate_token_id BIGINT NOT NULL REFERENCES sentence_token(id),
    nominal_token_id BIGINT NOT NULL REFERENCES sentence_token(id),
    CHECK (predicate_token_id <> nominal_token_id)
);

CREATE TABLE token_coordination_syntax (
    token_analysis_id BIGINT PRIMARY KEY REFERENCES token_syntax(token_analysis_id) ON DELETE CASCADE,
    left_member_token_id BIGINT NOT NULL REFERENCES sentence_token(id),
    right_member_token_id BIGINT NOT NULL REFERENCES sentence_token(id),
    CHECK (left_member_token_id <> right_member_token_id)
);

CREATE TABLE validation_run (
    id BIGSERIAL PRIMARY KEY,
    sentence_revision_id BIGINT NOT NULL REFERENCES sentence_revision(id) ON DELETE CASCADE,
    validator_version TEXT NOT NULL,
    scope VARCHAR(32) NOT NULL,
    result VARCHAR(16) NOT NULL CHECK (result IN ('pass','fail','pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE validation_issue (
    id BIGSERIAL PRIMARY KEY,
    validation_run_id BIGINT NOT NULL REFERENCES validation_run(id) ON DELETE CASCADE,
    sentence_token_id BIGINT REFERENCES sentence_token(id),
    code VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL DEFAULT 'error',
    message TEXT NOT NULL,
    metadata_json JSONB
);

CREATE TABLE commenter_identity (
    id BIGSERIAL PRIMARY KEY,
    email_hmac TEXT NOT NULL UNIQUE,
    public_alias TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ
);

CREATE TABLE comment_magic_link (
    id BIGSERIAL PRIMARY KEY,
    commenter_identity_id BIGINT NOT NULL REFERENCES commenter_identity(id),
    sentence_id BIGINT NOT NULL REFERENCES sentence(id),
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE comment (
    id BIGSERIAL PRIMARY KEY,
    sentence_id BIGINT NOT NULL REFERENCES sentence(id),
    commenter_identity_id BIGINT NOT NULL REFERENCES commenter_identity(id),
    parent_comment_id BIGINT REFERENCES comment(id),
    body TEXT NOT NULL,
    status VARCHAR(16) NOT NULL CHECK (status IN ('visible','hidden','deleted')),
    comment_day DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(commenter_identity_id, comment_day)
);

CREATE TABLE admin_user (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sentence_status_history (
    id BIGSERIAL PRIMARY KEY,
    sentence_id BIGINT NOT NULL REFERENCES sentence(id),
    old_status VARCHAR(24),
    new_status VARCHAR(24) NOT NULL,
    admin_user_id BIGINT REFERENCES admin_user(id),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admin_audit_log (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id BIGINT NOT NULL REFERENCES admin_user(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id BIGINT NOT NULL,
    before_json JSONB,
    after_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
