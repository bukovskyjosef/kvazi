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
  '.github/PULL_REQUEST_TEMPLATE.md',
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


// --- Draft PR → R → Ready for review → PR gate lifecycle (#166) ---

test('CI trigger: PR gate fires only on ready_for_review, not ordinary Draft pushes', () => {
  const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
  assert.ok(
    workflow.includes('types: [ready_for_review]'),
    'ci.yml must declare ready_for_review as the only PR event type',
  );
  assert.ok(
    !workflow.includes('types: [opened') && !workflow.includes('types: [synchronize'),
    'ci.yml must not declare opened/synchronize as PR event types',
  );
});

test('CI trigger: required check job retains exact name "PR gate"', () => {
  const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
  assert.ok(
    workflow.includes("name: PR gate"),
    'ci.yml must contain a job with name "PR gate"',
  );
});

test('D contract: does not require green GitHub gate before R', () => {
  const d = readFileSync('docs/agent/roles/D.md', 'utf8');
  assert.ok(
    d.includes('Draft PR'),
    'D contract must reference Draft PR delivery',
  );
  assert.ok(
    d.includes('bez čekání na GitHub'),
    'D contract must state that R handoff does not wait for GitHub PR gate',
  );
});

test('R contract: requires Draft PR and local pre-push evidence, not green PR gate', () => {
  const r = readFileSync('docs/agent/roles/R.md', 'utf8');
  assert.ok(
    r.includes('Draft PR') || r.includes('Draft'),
    'R contract must reference Draft PR for review entry',
  );
  assert.ok(
    r.includes('local pre-push evidence'),
    'R contract must require local pre-push evidence',
  );
  assert.ok(
    r.includes('WAITING FOR PR GATE'),
    'R contract must define WAITING FOR PR GATE as post-approval state',
  );
});

test('R contract: APPROVED leads to WAITING FOR PR GATE, not directly READY FOR P', () => {
  const r = readFileSync('docs/agent/roles/R.md', 'utf8');
  const approvedLine = r.split('\n').find(l => l.includes('APPROVED') && l.includes('→'));
  assert.ok(approvedLine, 'R contract must have an APPROVED → transition line');
  assert.ok(
    !approvedLine.includes('READY FOR P') || approvedLine.includes('WAITING FOR PR GATE'),
    'R APPROVED must route through WAITING FOR PR GATE before READY FOR P',
  );
});

test('P contract: requires R approval + green required gate on same SHA', () => {
  const p = readFileSync('docs/agent/roles/P.md', 'utf8');
  assert.ok(
    p.includes('R-approved') || p.includes('R approval'),
    'P contract must require R approval',
  );
  assert.ok(
    p.includes('PR gate'),
    'P contract must require green PR gate',
  );
  assert.ok(
    p.includes('Draft PR') || p.includes('nesmí publikovat'),
    'P contract must prohibit publishing Draft PR',
  );
});

test('D contract: corrective post-gate code change requires Draft before push', () => {
  const d = readFileSync('docs/agent/roles/D.md', 'utf8');
  assert.ok(
    d.includes('převede PR zpět na') && d.includes('Draft'),
    'D contract must require returning PR to Draft before corrective push after gate failure',
  );
});

test('P contract: owns gate-entry resolution from WAITING FOR PR GATE', () => {
  const p = readFileSync('docs/agent/roles/P.md', 'utf8');
  assert.ok(
    p.includes('WAITING FOR PR GATE'),
    'P contract must explicitly handle WAITING FOR PR GATE entry',
  );
  assert.ok(
    p.includes('gate green') || p.includes('gate running') || p.includes('gate failed'),
    'P contract must define behavior for each gate outcome',
  );
});

test('R contract: APPROVED handoff routes to P, not to limbo', () => {
  const r = readFileSync('docs/agent/roles/R.md', 'utf8');
  assert.ok(
    r.includes('handoff') && r.includes('P'),
    'R contract must provide P handoff after APPROVED',
  );
  assert.ok(
    r.includes('P vlastní gate-entry') || r.includes('P ověří gate'),
    'R contract must state that P owns gate-entry resolution',
  );
});

test('Lifecycle: ROLES.md contains WAITING FOR PR GATE in lifecycle', () => {
  const roles = readFileSync('docs/agent/ROLES.md', 'utf8');
  assert.ok(
    roles.includes('WAITING FOR PR GATE'),
    'ROLES.md lifecycle must include WAITING FOR PR GATE state',
  );
});

// --- Mandatory Issue-level D handoff protocol (#166) ---

test('D contract: Issue-level handoff is mandatory, PR/chat do not substitute', () => {
  const d = readFileSync('docs/agent/roles/D.md', 'utf8');
  assert.ok(
    d.includes('Issue-level durable handoff'),
    'D contract must require Issue-level durable handoff',
  );
  assert.ok(
    d.includes('PR body') && d.includes('nenahrazují'),
    'D contract must state PR body does not substitute for Issue-level handoff',
  );
  assert.ok(
    d.includes('chat') && d.includes('nenahrazují'),
    'D contract must state chat does not substitute for Issue-level handoff',
  );
});

test('D contract: handoff requires PR identity, exact HEAD SHA, scope, evidence and READY FOR R', () => {
  const d = readFileSync('docs/agent/roles/D.md', 'utf8');
  assert.ok(d.includes('PR identity'), 'handoff must require PR identity');
  assert.ok(d.includes('exact current PR HEAD SHA'), 'handoff must require exact current PR HEAD SHA');
  assert.ok(d.includes('final scope'), 'handoff must require final scope');
  assert.ok(d.includes('exact-SHA local pre-push evidence'), 'handoff must require exact-SHA local pre-push evidence');
  assert.ok(d.includes('READY FOR R'), 'handoff must end with READY FOR R');
});

test('D contract: final fresh-read verification of Issue + PR + HEAD before R handoff', () => {
  const d = readFileSync('docs/agent/roles/D.md', 'utf8');
  assert.ok(
    d.includes('fresh-readnout current Issue') && d.includes('fresh-readnout current PR'),
    'D contract must require fresh-read of Issue and PR before R handoff',
  );
  assert.ok(
    d.includes('nesmí vrátit R handoff prompt') && d.includes('verifikace neprojde'),
    'D contract must block R handoff if final verification fails',
  );
});

test('D contract: corrective new HEAD requires fresh Issue-level handoff', () => {
  const d = readFileSync('docs/agent/roles/D.md', 'utf8');
  assert.ok(
    d.includes('zneplatňuje předchozí Issue-level handoff'),
    'D contract must state corrective HEAD invalidates previous handoff',
  );
  assert.ok(
    d.includes('Corrective push sám o sobě R neautorizuje'),
    'D contract must state corrective push alone does not re-authorize R',
  );
});

test('CI risk: current remote base ref is used instead of historical PR base SHA', () => {
  const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');

  assert.ok(
    workflow.includes('KVAZI_RELEASE_BASE: origin/${{ github.base_ref }}'),
    'release integrity must compare against the current target branch ref',
  );
  assert.ok(
    workflow.includes('BASE_REF="${{ github.base_ref }}"'),
    'risk classifier must derive the target branch from github.base_ref',
  );
  assert.ok(
    workflow.includes('git fetch --no-tags origin "+refs/heads/$BASE_REF:refs/remotes/origin/$BASE_REF"'),
    'risk classifier must refresh the current remote target branch',
  );
  assert.ok(
    workflow.includes('BASE="origin/$BASE_REF"'),
    'risk classifier must diff against the refreshed remote target branch',
  );
  assert.ok(
    !workflow.includes('BASE="${{ github.event.pull_request.base.sha }}"'),
    'risk classifier must not use the historical PR base SHA snapshot',
  );
  assert.ok(
    !workflow.includes('KVAZI_RELEASE_BASE: ${{ github.event.pull_request.base.sha'),
    'release integrity must not use the historical PR base SHA snapshot',
  );
});
