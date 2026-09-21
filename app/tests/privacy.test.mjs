/**
 * Privacy page and link-placement smoke tests (#161).
 *
 * Verifies:
 * - soukromi.php exists, renders expected heading and #analytika anchor
 * - footer has /soukromi.php link
 * - registration has privacy link
 * - configurator submit surface has privacy link
 * - operations README routes to privacy-requests.md
 * - privacy-requests.md exists
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const publicDir = join(dir, '../public');
const docsOpsDir = join(dir, '../../docs/operations');

// ── Static file existence and content ────────────────────────────────────────

test('soukromi.php exists and contains expected privacy heading', () => {
  const src = readFileSync(join(publicDir, 'soukromi.php'), 'utf8');
  assert.ok(src.includes('Ochrana soukromí'), 'must contain privacy heading');
});

test('soukromi.php contains stable #analytika anchor', () => {
  const src = readFileSync(join(publicDir, 'soukromi.php'), 'utf8');
  assert.ok(src.includes('id="analytika"'), 'must contain id="analytika" anchor');
});

test('soukromi.php contains required content sections', () => {
  const src = readFileSync(join(publicDir, 'soukromi.php'), 'utf8');
  assert.ok(src.includes('Josef Bukovský'), 'must name controller');
  assert.ok(src.includes('veta@kvazi.cz'), 'must state privacy contact');
  assert.ok(src.includes('ÚOOÚ') || src.includes('Úřadu pro ochranu osobních údajů'), 'must mention supervisory authority');
  assert.ok(src.includes('spotřebitelský Gmail') || src.includes('spotřebitelského Gmailu'), 'must describe consumer Gmail accurately');
});

// ── Footer link ──────────────────────────────────────────────────────────────

test('footer.php contains permanent privacy link to /soukromi.php', () => {
  const src = readFileSync(join(publicDir, 'includes/footer.php'), 'utf8');
  assert.ok(src.includes('/soukromi.php'), 'footer must link to /soukromi.php');
});

// ── Registration link ────────────────────────────────────────────────────────

test('register.php contains privacy information link', () => {
  const src = readFileSync(join(publicDir, 'register.php'), 'utf8');
  assert.ok(src.includes('/soukromi.php'), 'register must link to /soukromi.php');
  assert.ok(src.includes('Informace o zpracování osobních údajů'), 'register must have privacy link text');
});

// ── Configurator link ────────────────────────────────────────────────────────

test('konfigurator.php contains privacy information link near submit', () => {
  const src = readFileSync(join(publicDir, 'konfigurator.php'), 'utf8');
  assert.ok(src.includes('/soukromi.php'), 'konfigurator must link to /soukromi.php');
});

// ── Operations docs ──────────────────────────────────────────────────────────

test('operations README routes to privacy-requests.md', () => {
  const src = readFileSync(join(docsOpsDir, 'README.md'), 'utf8');
  assert.ok(src.includes('privacy-requests.md'), 'operations README must reference privacy-requests.md');
});

test('privacy-requests.md exists and contains runbook content', () => {
  const src = readFileSync(join(docsOpsDir, 'privacy-requests.md'), 'utf8');
  assert.ok(src.includes('veta@kvazi.cz'), 'runbook must mention contact channel');
  assert.ok(src.includes('delete-account.php'), 'runbook must reference deletion mechanism');
});

// ── Integration: HTTP rendering (conditional on Docker stack) ────────────────

const BASE = process.env.KVAZI_TEST_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:8080';

async function ping() {
  try {
    const r = await fetch(`${BASE}/api/normative.php`, { signal: AbortSignal.timeout(2000) });
    return r.status < 500;
  } catch { return false; }
}

let serverUp = false;
try { serverUp = await ping(); } catch { /* skip */ }

function skipUnless(condition, name, fn) {
  if (!condition) {
    test(name, { skip: 'Server not reachable' }, fn);
  } else {
    test(name, fn);
  }
}

skipUnless(serverUp, 'GET /soukromi.php returns 200 with privacy content', async () => {
  const r = await fetch(`${BASE}/soukromi.php`);
  assert.equal(r.status, 200);
  const html = await r.text();
  assert.ok(html.includes('Ochrana soukromí'), 'rendered page must contain heading');
  assert.ok(html.includes('id="analytika"'), 'rendered page must contain #analytika anchor');
});

skipUnless(serverUp, 'footer renders /soukromi.php link on homepage', async () => {
  const r = await fetch(`${BASE}/`);
  const html = await r.text();
  assert.ok(html.includes('/soukromi.php'), 'homepage footer must link to privacy page');
});

skipUnless(serverUp, 'register.php renders privacy link', async () => {
  const r = await fetch(`${BASE}/register.php`);
  const html = await r.text();
  assert.ok(html.includes('/soukromi.php'), 'register page must link to privacy page');
});

skipUnless(serverUp, 'konfigurator.php renders privacy link', async () => {
  const r = await fetch(`${BASE}/konfigurator.php`);
  const html = await r.text();
  assert.ok(html.includes('/soukromi.php'), 'konfigurator page must link to privacy page');
});
