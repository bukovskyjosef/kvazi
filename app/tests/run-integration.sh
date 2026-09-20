#!/usr/bin/env bash
set -euo pipefail
trap 'test_gate_exit=$?; if [ "$test_gate_exit" -ne 0 ]; then echo "RELEASE GATE: FAIL" >&2; fi' EXIT
cd "$(dirname "$0")/../.."
export KVAZI_INTEGRATION_REQUIRED=1
export KVAZI_TEST_BASE_URL="${KVAZI_TEST_BASE_URL:-${KVAZI_BASE_URL:-http://localhost:8080}}"
export KVAZI_BASE_URL="$KVAZI_TEST_BASE_URL"
export KVAZI_DB_CONTAINER="${KVAZI_DB_CONTAINER:-kvazi_db}"
command -v docker >/dev/null
command -v php >/dev/null
command -v node >/dev/null
docker info >/dev/null
docker exec "$KVAZI_DB_CONTAINER" pg_isready -U kvazi -d kvazi
docker exec "$KVAZI_DB_CONTAINER" psql -U kvazi -d kvazi -v ON_ERROR_STOP=1 -c 'SELECT 1' >/dev/null
pg_major=$(docker exec "$KVAZI_DB_CONTAINER" psql -U kvazi -d kvazi -t -A -c "SELECT current_setting('server_version_num')::int / 10000")
if [ "$pg_major" != '18' ]; then
  echo 'Mandatory DB runtime must be PostgreSQL 18' >&2
  exit 1
fi
echo 'PostgreSQL version: 18 PASS'
node --input-type=module -e 'const r = await fetch(process.env.KVAZI_TEST_BASE_URL + "/api/normative.php", {signal: AbortSignal.timeout(3000)}); if (!r.ok) throw new Error(`HTTP ${r.status}`); const nd = await r.json(); if (typeof nd.version !== "string") throw new Error("PHP runtime/normative response invalid"); const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || "playwright"); const b = await chromium.launch({headless:true, ...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})}); await b.close();'
log=$(mktemp)
trap 'test_gate_exit=$?; rm -f "$log"; if [ "$test_gate_exit" -ne 0 ]; then echo "RELEASE GATE: FAIL" >&2; fi' EXIT
bash app/tests/check-bootstrap.sh
node app/tools/check-releases.mjs
find app docker/php -name '*.php' -print0 | xargs -0 -n1 php -l
for suite in app/tests/*.test.mjs; do
  printf 'Test suite: %s\n' "$suite"
  node --test --test-reporter=tap "$suite" | tee "$log"
  if ! grep -q '^# skipped 0$' "$log"; then
    echo 'Mandatory integration must report zero skipped tests' >&2
    exit 1
  fi
done
node app/tests/konfigurator.browser.mjs | tee "$log"
if grep -qi 'skipped' "$log"; then
  echo 'Mandatory browser scenarios were skipped' >&2
  exit 1
fi
node app/tests/footer.browser.mjs | tee "$log"
if grep -qi 'skipped' "$log"; then
  echo 'Mandatory footer browser scenarios were skipped' >&2
  exit 1
fi
node app/tests/catalog.browser.mjs | tee "$log"
if grep -qi 'skipped' "$log"; then
  echo 'Mandatory catalog browser scenarios were skipped' >&2
  exit 1
fi
node app/tests/workflow.browser.mjs | tee "$log"
if grep -qi 'skipped' "$log"; then
  echo 'Mandatory M3 browser scenarios were skipped' >&2
  exit 1
fi
node app/tests/analytics-consent.browser.mjs | tee "$log"
if grep -qi 'skipped' "$log"; then
  echo 'Mandatory analytics-consent browser scenarios were skipped' >&2
  exit 1
fi
node app/tests/konfigurator-status.browser.mjs | tee "$log"
if grep -qi 'skipped' "$log"; then
  echo 'Mandatory konfigurator-status browser scenarios were skipped' >&2
  exit 1
fi
node app/tests/player-facing.browser.mjs | tee "$log"
if grep -qi 'skipped' "$log"; then
  echo 'Mandatory player-facing browser scenarios were skipped' >&2
  exit 1
fi
node --test --test-reporter=tap app/tests/deployment.acceptance.mjs | tee "$log"
if ! grep -q '^# skipped 0$' "$log"; then
  echo 'Mandatory deployment acceptance must report zero skipped tests' >&2
  exit 1
fi
echo 'M4.5 DEPLOYMENT PACKAGING: PASS'
echo 'M4 SECURITY BASELINE: PASS'
echo 'M4 LIFECYCLE ACCEPTANCE: PASS'
echo 'RELEASE GATE: PASS'
