#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
export KVAZI_INTEGRATION_REQUIRED=1
export KVAZI_TEST_BASE_URL="${KVAZI_TEST_BASE_URL:-${KVAZI_BASE_URL:-http://localhost:8080}}"
export KVAZI_BASE_URL="$KVAZI_TEST_BASE_URL"
export KVAZI_DB_CONTAINER="${KVAZI_DB_CONTAINER:-kvazi_db}"
docker info >/dev/null
docker exec "$KVAZI_DB_CONTAINER" pg_isready -U kvazi -d kvazi
docker exec "$KVAZI_DB_CONTAINER" psql -U kvazi -d kvazi -v ON_ERROR_STOP=1 -c 'SELECT 1' >/dev/null
node --input-type=module -e 'const r = await fetch(process.env.KVAZI_TEST_BASE_URL + "/api/normative.php", {signal: AbortSignal.timeout(3000)}); if (!r.ok) throw new Error(`HTTP ${r.status}`); const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || "playwright"); const b = await chromium.launch({headless:true, ...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})}); await b.close();'
log=$(mktemp)
trap 'rm -f "$log"' EXIT
bash app/tests/check-bootstrap.sh
node app/tools/check-releases.mjs
find app -name '*.php' -print0 | xargs -0 -n1 php -l
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
node app/tests/catalog.browser.mjs | tee "$log"
if grep -qi 'skipped' "$log"; then
  echo 'Mandatory catalog browser scenarios were skipped' >&2
  exit 1
fi
