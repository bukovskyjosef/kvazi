-- Immutable M3 release registration; conflicting existing identity aborts atomically.
BEGIN;
INSERT INTO kvazi.rules_release(version,normative_hash,validator_version,activated_at,description)
VALUES ('public-1.3', '224300ebd186b306baac61abadece4ebdca2d52ab789255632019893fd7a051f', '1.3.0', '2026-09-16T00:00:00Z', 'Explicit pronoun signature (#109)')
ON CONFLICT (version) DO NOTHING;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM kvazi.rules_release WHERE version='public-1.3' AND normative_hash='224300ebd186b306baac61abadece4ebdca2d52ab789255632019893fd7a051f' AND validator_version='1.3.0') THEN
    RAISE EXCEPTION 'M3 release registration conflict';
  END IF;
END $$;
COMMIT;
