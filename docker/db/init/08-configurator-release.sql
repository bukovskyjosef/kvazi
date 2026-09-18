-- Immutable configurator corrective release registration; conflicting existing identity aborts atomically.
BEGIN;
INSERT INTO kvazi.rules_release(version,normative_hash,validator_version,activated_at,description)
VALUES ('public-1.3.1', '046e65ec75c581a9746741e4aacd92cd9bec44e1b5649a84caf217f65f323ba7', '1.3.1', '2026-09-18T00:00:00Z', 'Optional general morphology evidence (#133)')
ON CONFLICT (version) DO NOTHING;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM kvazi.rules_release WHERE version='public-1.3.1' AND normative_hash='046e65ec75c581a9746741e4aacd92cd9bec44e1b5649a84caf217f65f323ba7' AND validator_version='1.3.1') THEN
    RAISE EXCEPTION 'Configurator release registration conflict';
  END IF;
END $$;
COMMIT;
