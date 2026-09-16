#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
export KVAZI_INTEGRATION_REQUIRED=1
export KVAZI_TEST_BASE_URL="${KVAZI_TEST_BASE_URL:-${KVAZI_BASE_URL:-http://localhost:8080}}"
export KVAZI_BASE_URL="$KVAZI_TEST_BASE_URL"
docker info >/dev/null
docker exec kvazi_db pg_isready -U kvazi -d kvazi
docker exec kvazi_db psql -U kvazi -d kvazi -v ON_ERROR_STOP=1 -c 'SELECT 1' >/dev/null
node --input-type=module -e 'const r = await fetch(process.env.KVAZI_TEST_BASE_URL + "/api/normative.php"); if (!r.ok) throw new Error(`HTTP ${r.status}`); await import(process.env.PLAYWRIGHT_MODULE || "playwright");'
log=$(mktemp)
trap 'rm -f "$log"' EXIT
node --test --test-reporter=tap app/tests/submit.integration.test.mjs | tee "$log"
if ! rg -q '^# skipped 0$' "$log"; then
  echo 'Mandatory integration must report zero skipped tests' >&2
  exit 1
fi
node app/tests/konfigurator.browser.mjs | tee "$log"
if rg -i 'skipped' "$log"; then
  echo 'Mandatory browser scenarios were skipped' >&2
  exit 1
fi
