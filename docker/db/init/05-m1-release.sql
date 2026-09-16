-- Register a new release; never overwrite historical releases.
INSERT INTO kvazi.rules_release (version, normative_hash, validator_version, activated_at, description)
VALUES ('public-1.2', '6350d50b4348294b29c66999cfd16c7f9246b7a696e65f7aabb74e2cd680af5f', '1.2.0', '2026-09-16T00:00:00Z', 'M1 actual imperative correction')
ON CONFLICT (version) DO NOTHING;
