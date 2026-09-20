#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

die() {
  echo "LOCAL PRE-PUSH GATE: FAIL — $*" >&2
  exit 1
}

for cmd in git node docker npm php curl; do
  command -v "$cmd" >/dev/null || die "missing required command: $cmd"
done

branch="$(git branch --show-current)"
[ -n "$branch" ] || die "detached HEAD is not a valid developer push target"
case "$branch" in
  main|develop) die "work on a dedicated feature/fix branch, not directly on $branch" ;;
esac

if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  die "working tree must be clean; commit the exact state before running the pre-push gate"
fi

BASE="${KVAZI_PRE_PUSH_BASE:-origin/main}"
if [[ "$BASE" == origin/* ]]; then
  base_branch="${BASE#origin/}"
  git fetch --quiet origin "$base_branch" || die "cannot refresh $BASE"
fi
git rev-parse --verify "$BASE" >/dev/null 2>&1 || die "base ref $BASE does not exist"

HEAD_SHA="$(git rev-parse HEAD)"
BASE_SHA="$(git rev-parse "$BASE")"

if ! git merge-base --is-ancestor "$BASE" HEAD; then
  die "branch does not contain current $BASE ($BASE_SHA); update/rebase/merge the target branch before push"
fi

CHANGED="$(git diff --name-only "$BASE"...HEAD)"
echo "Pre-push branch: $branch"
echo "Pre-push base:   $BASE ($BASE_SHA)"
echo "Pre-push HEAD:   $HEAD_SHA"

git diff --check "$BASE"...HEAD
KVAZI_RELEASE_BASE="$BASE" node app/tools/check-releases.mjs

if [ -z "$CHANGED" ]; then
  echo "Risk class: low (no changed files)"
  echo "LOCAL PRE-PUSH GATE: PASS — $HEAD_SHA"
  exit 0
fi

RISKY="$(printf '%s\n' "$CHANGED" | grep -v -E '^(docs/|\.github/(ISSUE_TEMPLATE|PULL_REQUEST_TEMPLATE)/|.*\.md$|LICENSE$)' | head -1 || true)"
if [ -z "$RISKY" ]; then
  echo "Risk class: low (docs-only)"
  echo "LOCAL PRE-PUSH GATE: PASS — $HEAD_SHA"
  exit 0
fi

echo "Risk class: full"
echo "First risky path: $RISKY"
printf 'Changed files:\n%s\n' "$CHANGED"

# Keep the disposable pre-push project isolated from the developer's persistent
# Compose volume. Hard-coded container names in docker-compose.yml still mean
# an existing kvazi_db/kvazi_php container must be stopped/removed first.
if docker ps -a --format '{{.Names}}' | grep -Eq '^(kvazi_db|kvazi_php)$'; then
  die "kvazi_db/kvazi_php already exists; stop the normal dev stack with 'docker compose down' (without --volumes) and rerun"
fi

npm ci --prefix .github/ci --ignore-scripts
.github/ci/node_modules/.bin/playwright install chromium

export APP_ENV=development
export DB_NAME=kvazi
export DB_USER=kvazi
export DB_PASSWORD=kvazi
export AUTH_COOKIE_SECURE=0
export TRUSTED_PROXY_CIDRS=''
export MAIL_TRANSPORT=outbox
export MAIL_FROM_ADDRESS=noreply@kvazi.test
export MAIL_FROM_NAME='Nejdelší kvazivěta'
export MAIL_OUTBOX_PATH=/tmp/kvazi-mail-outbox.jsonl
export KVAZI_TEST_BASE_URL=http://127.0.0.1:8080
export KVAZI_BASE_URL="$KVAZI_TEST_BASE_URL"
export PLAYWRIGHT_MODULE="$PWD/.github/ci/node_modules/playwright/index.mjs"
export KVAZI_RELEASE_BASE="$BASE"
export KVAZI_DB_CONTAINER=kvazi_db

project="kvazi_prepush_${$}"
cleanup() {
  docker compose -p "$project" down --volumes --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker info >/dev/null
docker compose version
docker compose -p "$project" up -d --build --wait --wait-timeout 120

ready=0
for attempt in {1..30}; do
  if curl --fail --silent "$KVAZI_TEST_BASE_URL/healthz" >/dev/null; then
    ready=1
    break
  fi
  sleep 2
done
[ "$ready" -eq 1 ] || die "local disposable application did not become healthy"

bash app/tests/run-integration.sh

echo "LOCAL PRE-PUSH GATE: PASS — $HEAD_SHA"
