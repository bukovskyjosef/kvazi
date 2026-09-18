#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
db_container="${KVAZI_DB_CONTAINER:-kvazi_db}"
test_db="kvazi_m1_bootstrap_${$}"
docker exec "$db_container" createdb -U kvazi "$test_db"
trap 'docker exec "$db_container" dropdb -U kvazi "$test_db"' EXIT
for sql in docker/db/init/*.sql; do
  docker exec -i "$db_container" psql -U kvazi -d "$test_db" -v ON_ERROR_STOP=1 < "$sql" >/dev/null
done
# Verify historical releases against their actual file manifests, not copied constants.
node --input-type=module - "$test_db" <<'JS'
import {readFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
for(const version of readdirSync('app/data/rules')) {
  const manifest=JSON.parse(readFileSync(`app/data/rules/${version}/manifest.json`));
  const row=execFileSync('docker',['exec',process.env.KVAZI_DB_CONTAINER || 'kvazi_db','psql','-U','kvazi','-d',process.argv[2],'-t','-A','-v','ON_ERROR_STOP=1','-c',`SELECT normative_hash, validator_version FROM kvazi.rules_release WHERE version='${version}'`],{encoding:'utf8'}).trim();
  assert.equal(row,`${manifest.normative_hash}|${manifest.validator_version}`);
}
JS
docker exec -i "$db_container" psql -U kvazi -d "$test_db" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
DO $$ BEGIN
  IF to_regclass('kvazi.process_compliance') IS NOT NULL OR to_regclass('kvazi.audit_log') IS NOT NULL THEN RAISE EXCEPTION 'legacy tables'; END IF;
  IF EXISTS (SELECT 1 FROM kvazi.user_account) THEN RAISE EXCEPTION 'bootstrap must not create accounts or credentials'; END IF;
END $$;
-- Seed historical facts, then re-run the idempotent atomic upgrade below.
INSERT INTO kvazi.user_account (username,email,password_hash,email_verified_at) VALUES ('bootstrap_test','bootstrap@kvazi.test','not-a-login-credential',now());
INSERT INTO kvazi.sentence (user_id) SELECT id FROM kvazi.user_account;
INSERT INTO kvazi.sentence_revision (sentence_id,revision_no,rules_version,submitted_by,draft_json) SELECT id,1,'public-1',user_id,'{"tokens":[]}' FROM kvazi.sentence;
INSERT INTO kvazi.validation_result (sentence_id,revision_id,rules_version,validator_version) SELECT sentence_id,id,'public-1','1.0.0' FROM kvazi.sentence_revision;
CREATE TABLE public.history_before AS SELECT md5(row_to_json(v)::text) AS fingerprint FROM kvazi.validation_result v;
-- Simulate tables present in a pre-M1 installation.
CREATE TABLE kvazi.process_compliance (ai_policy_compliant BOOLEAN);
CREATE TABLE kvazi.audit_log (action TEXT);
SQL
docker exec -i "$db_container" psql -U kvazi -d "$test_db" -v ON_ERROR_STOP=1 < docker/db/init/06-m1-core.sql >/dev/null
docker exec -i "$db_container" psql -U kvazi -d "$test_db" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
DO $$ BEGIN
  IF (SELECT fingerprint FROM public.history_before) <> (SELECT md5(row_to_json(v)::text) FROM kvazi.validation_result v) THEN RAISE EXCEPTION 'historical result changed'; END IF;
  IF to_regclass('kvazi.process_compliance') IS NOT NULL OR to_regclass('kvazi.audit_log') IS NOT NULL THEN RAISE EXCEPTION 'upgrade kept legacy'; END IF;
END $$;
SQL
# Prove M2 -> M3 registration, idempotence and conflict safety in this disposable DB.
docker exec -i "$db_container" psql -U kvazi -d "$test_db" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
BEGIN; SET LOCAL session_replication_role=replica;
DELETE FROM kvazi.rules_release WHERE version='public-1.3';
COMMIT;
SQL
for attempt in 1 2; do
  docker exec -i "$db_container" psql -U kvazi -d "$test_db" -v ON_ERROR_STOP=1 < docker/db/init/07-m3-release.sql >/dev/null
done
docker exec -i "$db_container" psql -U kvazi -d "$test_db" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
DO $$ BEGIN
  IF (SELECT fingerprint FROM public.history_before) <> (SELECT md5(row_to_json(v)::text) FROM kvazi.validation_result v) THEN RAISE EXCEPTION 'M3 upgrade changed history'; END IF;
END $$;
BEGIN; SET LOCAL session_replication_role=replica;
UPDATE kvazi.rules_release SET normative_hash=repeat('x',64) WHERE version='public-1.3';
COMMIT;
SQL
if docker exec -i "$db_container" psql -U kvazi -d "$test_db" -v ON_ERROR_STOP=1 < docker/db/init/07-m3-release.sql >/dev/null 2>&1; then
  echo 'Conflicting M3 registration unexpectedly succeeded' >&2
  exit 1
fi
docker exec -i "$db_container" psql -U kvazi -d "$test_db" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
DO $$ BEGIN
  IF (SELECT normative_hash FROM kvazi.rules_release WHERE version='public-1.3') <> repeat('x',64) THEN RAISE EXCEPTION 'M3 conflict overwrote release'; END IF;
END $$;
SQL
printf 'M2 -> M3 release upgrade, idempotence, conflicting-registration rollback: PASS; historical result preserved\n'
# Corrective configurator registration also preserves history and rejects conflicts.
docker exec -i "$db_container" psql -U kvazi -d "$test_db" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
BEGIN; SET LOCAL session_replication_role=replica;
DELETE FROM kvazi.rules_release WHERE version='public-1.3.1';
COMMIT;
SQL
for attempt in 1 2; do
  docker exec -i "$db_container" psql -U kvazi -d "$test_db" -v ON_ERROR_STOP=1 < docker/db/init/08-configurator-release.sql >/dev/null
done
docker exec -i "$db_container" psql -U kvazi -d "$test_db" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
DO $$ BEGIN
  IF (SELECT fingerprint FROM public.history_before) <> (SELECT md5(row_to_json(v)::text) FROM kvazi.validation_result v) THEN RAISE EXCEPTION 'Configurator upgrade changed history'; END IF;
END $$;
BEGIN; SET LOCAL session_replication_role=replica;
UPDATE kvazi.rules_release SET validator_version='conflicting' WHERE version='public-1.3.1';
COMMIT;
SQL
if docker exec -i "$db_container" psql -U kvazi -d "$test_db" -v ON_ERROR_STOP=1 < docker/db/init/08-configurator-release.sql >/dev/null 2>&1; then
  echo 'Conflicting configurator registration unexpectedly succeeded' >&2
  exit 1
fi
docker exec -i "$db_container" psql -U kvazi -d "$test_db" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
DO $$ BEGIN
  IF (SELECT validator_version FROM kvazi.rules_release WHERE version='public-1.3.1') <> 'conflicting' THEN RAISE EXCEPTION 'Configurator conflict overwrote release'; END IF;
END $$;
SQL
printf 'Configurator release upgrade, idempotence, conflicting-registration rollback: PASS; historical result preserved\n'
# Prove conflicting legacy decisions roll back the whole upgrade; do not choose
# or delete a historical decision on the decision owner's behalf.
docker exec -i "$db_container" psql -U kvazi -d "$test_db" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
CREATE TABLE kvazi.process_compliance (ai_policy_compliant BOOLEAN);
CREATE TABLE kvazi.audit_log (action TEXT);
DROP INDEX kvazi.uidx_ad_final_revision;
UPDATE kvazi.user_account SET role='ADMIN';
INSERT INTO kvazi.administrative_decision (sentence_id,revision_id,admin_id,action)
  SELECT sentence_id,id,submitted_by,'return' FROM kvazi.sentence_revision;
INSERT INTO kvazi.administrative_decision (sentence_id,revision_id,admin_id,action)
  SELECT sentence_id,id,submitted_by,'reject' FROM kvazi.sentence_revision;
SQL
if docker exec -i "$db_container" psql -U kvazi -d "$test_db" -v ON_ERROR_STOP=1 < docker/db/init/06-m1-core.sql >/dev/null 2>&1; then
  echo 'Conflicting upgrade unexpectedly succeeded' >&2
  exit 1
fi
docker exec -i "$db_container" psql -U kvazi -d "$test_db" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
DO $$ BEGIN
  IF to_regclass('kvazi.process_compliance') IS NULL OR to_regclass('kvazi.audit_log') IS NULL THEN RAISE EXCEPTION 'failed upgrade did not roll back'; END IF;
  IF (SELECT count(*) FROM kvazi.administrative_decision) <> 2 THEN RAISE EXCEPTION 'conflicting history changed'; END IF;
  IF (SELECT fingerprint FROM public.history_before) <> (SELECT md5(row_to_json(v)::text) FROM kvazi.validation_result v) THEN RAISE EXCEPTION 'failed upgrade changed result'; END IF;
END $$;
SQL
printf 'Clean bootstrap, idempotent upgrade and conflicting-upgrade rollback: PASS; historical result preserved\n'
