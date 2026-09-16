-- Preserve public-1; register the corrective runtime dataset.
INSERT INTO kvazi.rules_release (version, normative_hash, validator_version, activated_at, description)
VALUES ('public-1.1', 'cfc0e48d78cf34caaa4c7b3949d18264c16f3ee49e94a619f8320f42ec283e58', '1.1.0', '2026-09-15T00:00:00Z', 'Corrective runtime release')
ON CONFLICT (version) DO NOTHING;
