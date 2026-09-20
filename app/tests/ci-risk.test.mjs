// Regression test for CI risk classification patterns.
// Must match the grep pattern in .github/workflows/ci.yml.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

// The CI workflow uses this grep pattern to identify safe (non-risky) paths.
// A path matching this pattern is classified as low-risk (docs-only).
// Any path NOT matching is classified as risky → full gate.
const SAFE_PATTERN = /^(docs\/|\.github\/(ISSUE_TEMPLATE|PULL_REQUEST_TEMPLATE)\/|.*\.md$|LICENSE$)/;

// Paths that MUST trigger the full integration gate.
const MUST_BE_RISKY = [
  'app/public/index.php',
  'app/public/includes/validator.php',
  'app/public/js/konfigurator/validation.mjs',
  'app/public/js/konfigurator/morpho.mjs',
  'app/public/api/submit.php',
  'app/data/active-release.json',
  'app/data/rules/public-1/normative.json',
  'app/tests/run-integration.sh',
  'app/tools/check-releases.mjs',
  '.github/workflows/ci.yml',
  '.github/workflows/releases.yml',
  '.github/workflows/production.yml',
  '.github/workflows/release-gate.yml',
  '.github/ci/package.json',
  '.github/ci/package-lock.json',
  'docker/php/Dockerfile',
  'docker/php/healthcheck.php',
  'docker/db/init/01-schema.sql',
  'docker-compose.yml',
  'app/public/login.php',
  'app/public/konfigurator.php',
];

// Paths that must be classified as safe (docs-only, no code impact).
const MUST_BE_SAFE = [
  'docs/README.md',
  'docs/operations/production-release.md',
  'docs/architecture/03-validation.md',
  'docs/rules/02-rozhodcovska-specifikace.md',
  'docs/operations/cicd-simplification-plan.md',
  'AGENTS.md',
  'CLAUDE.md',
  'README.md',
  'LICENSE',
  '.github/ISSUE_TEMPLATE/bug.md',
  '.github/PULL_REQUEST_TEMPLATE/default.md',
];

test('CI risk: risky paths are never classified as safe', () => {
  for (const path of MUST_BE_RISKY) {
    assert.ok(!SAFE_PATTERN.test(path), `${path} must be risky but matched safe pattern`);
  }
});

test('CI risk: safe paths are recognized as low-risk', () => {
  for (const path of MUST_BE_SAFE) {
    assert.ok(SAFE_PATTERN.test(path), `${path} must be safe but was classified as risky`);
  }
});

test('CI risk: workflow and developer pre-push gate use the tested safe-path pattern', () => {
  const expected = "'^(docs/|\\.github/(ISSUE_TEMPLATE|PULL_REQUEST_TEMPLATE)/|.*\\.md$|LICENSE$)'";
  const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
  const prePush = readFileSync('app/tests/pre-push.sh', 'utf8');
  assert.ok(workflow.includes(expected), 'ci.yml must contain the expected safe-path grep pattern');
  assert.ok(prePush.includes(expected), 'pre-push.sh must use the same safe-path grep pattern as CI');
});


test('developer pre-push runner has valid bash syntax', () => {
  execFileSync('bash', ['-n', 'app/tests/pre-push.sh'], {stdio: 'pipe'});
});
