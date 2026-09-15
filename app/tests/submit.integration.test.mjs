/**
 * Authenticated HTTP + DB integration tests.
 *
 * Requires:
 *   - Docker stack running (KVAZI_TEST_BASE_URL, or default http://localhost:8080)
 *   - DB accessible via: docker exec kvazi_db psql -U kvazi -d kvazi
 *   - PHP CLI on PATH (for bcrypt hash generation)
 *
 * Tests cover:
 *   1. Valid first submit → HTTP 200 + sentence/revision/validation_result rows in DB
 *   2. Invalid (non-submitReady) draft → HTTP 422 + no DB rows created
 *   3. Revision lifecycle:
 *      rev1 submit → admin return (via DB) → rev2 resubmit →
 *      attempt rev3 without new return (→ 409) →
 *      admin return rev2 (via DB) → rev3 submit succeeds
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync, execFileSync } from 'node:child_process';

const BASE = (process.env.KVAZI_TEST_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');

// ── Reachability check ────────────────────────────────────────────────────────

async function serverReachable() {
  try {
    const r = await fetch(`${BASE}/api/normative.php`, { signal: AbortSignal.timeout(3000) });
    return r.status < 500;
  } catch { return false; }
}

function dbReachable() {
  try {
    execSync('docker exec kvazi_db psql -U kvazi -d kvazi -c "SELECT 1"', { timeout: 5000 });
    return true;
  } catch { return false; }
}

const httpUp = await serverReachable();
const dbUp   = dbReachable();
const allUp  = httpUp && dbUp;

function integrationTest(name, fn) {
  if (!allUp) {
    test(name, { skip: 'Docker stack not reachable — start with docker compose up -d to run integration tests' }, fn);
  } else {
    test(name, fn);
  }
}

// ── DB helpers ────────────────────────────────────────────────────────────────

function pgStr(v) {
  // Escape a value as a SQL single-quoted literal ('' for embedded single quotes)
  return "'" + String(v).replace(/'/g, "''") + "'";
}

function dbExec(sql, params = {}) {
  // Interpolate :name params directly into SQL (no shell expansion — uses execFileSync)
  const resolved = sql.replace(/:([a-z_]+)/g, (_, k) => {
    const v = params[k];
    if (v === undefined) throw new Error(`Missing DB param :${k}`);
    return /^\d+$/.test(String(v)) ? String(v) : pgStr(v);
  });
  return execFileSync('docker', ['exec', 'kvazi_db', 'psql', '-U', 'kvazi', '-d', 'kvazi', '-t', '-A', '-c', resolved], { timeout: 10000 }).toString().trim();
}

function dbQuery(sql, params = {}) {
  return dbExec(sql, params);
}

function dbCount(table, where = '', params = {}) {
  const sql = `SELECT COUNT(*) FROM ${table}${where ? ' WHERE ' + where : ''}`;
  return parseInt(dbExec(sql, params), 10);
}

// ── Test user setup/teardown ──────────────────────────────────────────────────

const RUN_ID  = Date.now().toString(36);
const USR     = `tst_${RUN_ID}`;
const USR_EMAIL = `${USR}@kvazi.int`;
const USR_PASS  = 'IntegrationTest1!';
const ADM     = `adm_${RUN_ID}`;
const ADM_EMAIL = `${ADM}@kvazi.int`;

function phpHash(password) {
  // Use execFileSync to avoid all shell quoting issues
  const code = `echo password_hash(${JSON.stringify(password)}, PASSWORD_BCRYPT, ['cost' => 10]);`;
  return execFileSync('php', ['-r', code], { timeout: 10000 }).toString().trim();
}

function createTestUser(username, email, password, role = 'USER') {
  const hash = phpHash(password);
  dbExec(`INSERT INTO kvazi.user_account (username, email, password_hash, role)
           VALUES (:u, :e, :h, :r)
           ON CONFLICT (username) DO NOTHING`, { u: username, e: email, h: hash, r: role });
}

function deleteTestUser(username) {
  // Delete sentences first — sentence_revision.submitted_by FK has no CASCADE.
  dbExec('DELETE FROM kvazi.sentence WHERE user_id = (SELECT id FROM kvazi.user_account WHERE username = :u)', { u: username });
  dbExec('DELETE FROM kvazi.user_account WHERE username = :u', { u: username });
}

if (allUp) {
  // Create test users before any test runs.
  createTestUser(USR, USR_EMAIL, USR_PASS, 'USER');
  createTestUser(ADM, ADM_EMAIL, USR_PASS, 'ADMIN');
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function extractCsrfFromForm(html) {
  const m = html.match(/name="csrf"\s+value="([^"]+)"/);
  if (!m) throw new Error('CSRF input not found in login form');
  return m[1];
}

function extractCsrfFromMeta(html) {
  const m = html.match(/name="csrf"\s+content="([^"]+)"/);
  if (!m) throw new Error('CSRF meta not found in page');
  return m[1];
}

function extractCookies(response) {
  const raw = response.headers.getSetCookie
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie') ?? ''];
  // Return a semicolon-joined cookie string
  return raw.map(s => s.split(';')[0]).filter(Boolean).join('; ');
}

/**
 * Login and return { cookie, apiCsrf }.
 * 1. GET /login.php → form CSRF
 * 2. POST /login.php → session cookie
 * 3. GET /konfigurator.php → meta API CSRF
 */
async function loginSession(username, password) {
  // Step 1: GET /login.php
  const loginGet = await fetch(`${BASE}/login.php`);
  const loginHtml = await loginGet.text();
  const formCsrf = extractCsrfFromForm(loginHtml);
  const loginCookie = extractCookies(loginGet);

  // Step 2: POST /login.php
  const loginPost = await fetch(`${BASE}/login.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': loginCookie,
    },
    redirect: 'manual',
    body: new URLSearchParams({ identifier: username, password, csrf: formCsrf }),
  });
  const postCookie = extractCookies(loginPost);
  const sessionCookie = postCookie || loginCookie;

  // Step 3: GET /konfigurator.php → get API CSRF
  const konfPage = await fetch(`${BASE}/konfigurator.php`, {
    headers: { 'Cookie': sessionCookie },
  });
  const konfHtml = await konfPage.text();
  const apiCsrf = extractCsrfFromMeta(konfHtml);

  return { cookie: sessionCookie, apiCsrf };
}

// ── A valid, submitReady draft (pán pl-1 + V-IT present 3sg) ─────────────────
// charScore=10, wordCount=2 (both verified by JS validator above).

const VALID_DRAFT = {
  sentenceType: 'declarative',
  implicitSubject: false,
  closingPunct: null,
  tokens: [
    {
      id: 't1', surface: 'kvazi', kvaziPrefix: '',
      pos: 'noun', lemma: 'kvaz', model: 'pán', lexicalStatus: 'quasi',
      identity: { gender: 'masculine', animacy: 'animate' },
      form: { case: '1', number: 'plural' },
      role: 'subject', relations: { head: 't2' },
      valency: { modelVerb: '', declaration: '' },
      evidence: { source: '', reference: '', morphology: 'Nominativ plurálu vzoru pán.', needsAnalogy: false, explanation: '', analogy: '' },
    },
    {
      id: 't2', surface: 'kvazí', kvaziPrefix: '',
      pos: 'verb', lemma: 'kvazit', model: 'V-IT', lexicalStatus: 'quasi',
      identity: { gender: '', animacy: '' },
      form: { verbFormType: 'present', verbPerson: '3', number: 'singular', aspect: 'imperfective' },
      role: 'predicate', relations: {},
      valency: { modelVerb: '', declaration: 'Opírá se o české sloveso dělat; nevyžaduje doplnění.' },
      evidence: { source: '', reference: '', morphology: 'Přítomný čas 3. osoby singuláru vzoru V-IT.', needsAnalogy: false, explanation: '', analogy: '' },
    },
  ],
};

// An invalid draft (empty tokens → submitReady=false on both engines).
const INVALID_DRAFT = {
  sentenceType: 'declarative',
  implicitSubject: false,
  closingPunct: null,
  tokens: [
    { id: 't1', surface: 'vazi', kvaziPrefix: '', pos: '', lemma: '', model: '', lexicalStatus: '', identity: {}, form: {}, role: 'subject', relations: {}, valency: { modelVerb: '', declaration: '' }, evidence: { morphology: '', needsAnalogy: false, explanation: '', analogy: '' } },
  ],
};

// ── Test 1: Valid submit creates DB rows ──────────────────────────────────────

integrationTest('valid submit: HTTP 200 and DB rows created', async () => {
  const { cookie, apiCsrf } = await loginSession(USR, USR_PASS);

  const beforeSentences = dbCount('kvazi.sentence', 'user_id = (SELECT id FROM kvazi.user_account WHERE username = :u)', { u: USR });

  const r = await fetch(`${BASE}/api/submit.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({ csrf: apiCsrf, draft: VALID_DRAFT }),
  });

  const text = await r.text();
  assert.equal(r.status, 200, `Expected 200, got ${r.status}: ${text}`);
  const body = JSON.parse(text);
  assert.ok(body.ok, `Response ok should be true: ${JSON.stringify(body)}`);
  assert.ok(body.id > 0, 'sentence id should be positive');
  assert.ok(body.revisionId > 0, 'revisionId should be positive');
  assert.equal(body.revisionNo, 1, 'First submit should be revision 1');
  assert.equal(body.charScore, 10, 'charScore should be 10 (authoritative from server)');
  assert.equal(body.wordScore, 2, 'wordScore should be 2');

  // Verify DB rows
  const afterSentences = dbCount('kvazi.sentence', 'user_id = (SELECT id FROM kvazi.user_account WHERE username = :u)', { u: USR });
  assert.equal(afterSentences, beforeSentences + 1, 'sentence row should be created');

  const revCount = dbCount('kvazi.sentence_revision', 'sentence_id = :sid AND revision_no = 1', { sid: String(body.id) });
  assert.equal(revCount, 1, 'sentence_revision row should be created');

  const vrCount = dbCount('kvazi.validation_result', 'sentence_id = :sid AND revision_id = :rid', { sid: String(body.id), rid: String(body.revisionId) });
  assert.equal(vrCount, 1, 'validation_result row should be created');

  const pcCount = dbCount('kvazi.process_compliance', 'sentence_id = :sid AND revision_id = :rid', { sid: String(body.id), rid: String(body.revisionId) });
  assert.equal(pcCount, 1, 'process_compliance row should be created');

  // Authoritative charScore and wordScore in DB must match API response
  const storedScores = dbQuery(
    'SELECT char_score, word_score FROM kvazi.validation_result WHERE sentence_id = :sid AND revision_id = :rid',
    { sid: String(body.id), rid: String(body.revisionId) }
  );
  const [cs, ws] = storedScores.split('|').map(Number);
  assert.equal(cs, 10, 'DB char_score should be 10');
  assert.equal(ws, 2,  'DB word_score should be 2');
});

// ── Test 2: Invalid draft → 422, no revision created ─────────────────────────

integrationTest('invalid draft: HTTP 422 and no DB revision created', async () => {
  const { cookie, apiCsrf } = await loginSession(USR, USR_PASS);

  const beforeRevisions = dbCount('kvazi.sentence_revision', 'submitted_by = (SELECT id FROM kvazi.user_account WHERE username = :u)', { u: USR });

  const r = await fetch(`${BASE}/api/submit.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({ csrf: apiCsrf, draft: INVALID_DRAFT }),
  });

  assert.equal(r.status, 422, `Expected 422 for invalid draft, got ${r.status}`);
  const body = await r.json();
  assert.equal(body.ok, false, 'ok should be false for invalid draft');

  const afterRevisions = dbCount('kvazi.sentence_revision', 'submitted_by = (SELECT id FROM kvazi.user_account WHERE username = :u)', { u: USR });
  assert.equal(afterRevisions, beforeRevisions, 'No new revision should be created for invalid draft');
});

// ── Test 3: Revision lifecycle ────────────────────────────────────────────────
// rev1 → return (admin via DB) → rev2 → attempt rev3 without new return → 409
// → return rev2 (admin via DB) → rev3 succeeds

integrationTest('revision lifecycle: rev1 → return → rev2 → 409 → return rev2 → rev3', async () => {
  const { cookie, apiCsrf } = await loginSession(USR, USR_PASS);

  // ── Submit rev1 ────────────────────────────────────────────────────────────
  let r = await fetch(`${BASE}/api/submit.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({ csrf: apiCsrf, draft: VALID_DRAFT }),
  });
  let text = await r.text();
  assert.equal(r.status, 200, `rev1 submit: ${text}`);
  const rev1 = JSON.parse(text);
  const sentenceId = rev1.id;
  const revisionId1 = rev1.revisionId;
  assert.equal(rev1.revisionNo, 1, 'rev1 should be revision 1');

  // ── Admin return rev1 (insert admin_decision directly via DB) ──────────────
  const adminId = dbQuery('SELECT id FROM kvazi.user_account WHERE username = :u', { u: ADM }).trim();
  dbExec(
    'INSERT INTO kvazi.administrative_decision (sentence_id, revision_id, admin_id, action) VALUES (:sid, :rid, :aid, :act)',
    { sid: String(sentenceId), rid: String(revisionId1), aid: adminId, act: 'return' }
  );

  // ── Resubmit rev2 ──────────────────────────────────────────────────────────
  // Need fresh CSRF for this submit (same session, same cookie)
  const konfPage2 = await fetch(`${BASE}/konfigurator.php`, { headers: { 'Cookie': cookie } });
  const apiCsrf2  = extractCsrfFromMeta(await konfPage2.text());

  r = await fetch(`${BASE}/api/submit.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({ csrf: apiCsrf2, draft: VALID_DRAFT, sentenceId }),
  });
  text = await r.text();
  assert.equal(r.status, 200, `rev2 submit: ${text}`);
  const rev2 = JSON.parse(text);
  assert.equal(rev2.revisionNo, 2, 'resubmit should be revision 2');
  const revisionId2 = rev2.revisionId;

  // ── Attempt rev3 without new return → 409 ─────────────────────────────────
  const konfPage3 = await fetch(`${BASE}/konfigurator.php`, { headers: { 'Cookie': cookie } });
  const apiCsrf3  = extractCsrfFromMeta(await konfPage3.text());

  r = await fetch(`${BASE}/api/submit.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({ csrf: apiCsrf3, draft: VALID_DRAFT, sentenceId }),
  });
  assert.equal(r.status, 409, `Expected 409 for unauthorized rev3, got ${r.status}`);

  // Verify no rev3 row was created
  const revCount = dbCount('kvazi.sentence_revision', 'sentence_id = :sid', { sid: String(sentenceId) });
  assert.equal(revCount, 2, 'Only 2 revisions should exist (rev3 was rejected)');

  // ── Admin return rev2 → rev3 now authorized ────────────────────────────────
  dbExec(
    'INSERT INTO kvazi.administrative_decision (sentence_id, revision_id, admin_id, action) VALUES (:sid, :rid, :aid, :act)',
    { sid: String(sentenceId), rid: String(revisionId2), aid: adminId, act: 'return' }
  );

  const konfPage4 = await fetch(`${BASE}/konfigurator.php`, { headers: { 'Cookie': cookie } });
  const apiCsrf4  = extractCsrfFromMeta(await konfPage4.text());

  r = await fetch(`${BASE}/api/submit.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({ csrf: apiCsrf4, draft: VALID_DRAFT, sentenceId }),
  });
  text = await r.text();
  assert.equal(r.status, 200, `rev3 submit after return rev2: ${text}`);
  const rev3 = JSON.parse(text);
  assert.equal(rev3.revisionNo, 3, 'should be revision 3');

  // Verify 3 revisions exist
  const finalRevCount = dbCount('kvazi.sentence_revision', 'sentence_id = :sid', { sid: String(sentenceId) });
  assert.equal(finalRevCount, 3, 'Three revisions should exist');
});

// ── Cleanup ───────────────────────────────────────────────────────────────────

// Run cleanup after all tests (teardown hook not supported in node:test for module level;
// we clean up at module exit via process.on('exit')). Users are deleted via CASCADE.
if (allUp) {
  process.on('exit', () => {
    try {
      deleteTestUser(USR);
      deleteTestUser(ADM);
    } catch (e) {
      // Non-fatal: test data cleanup failure doesn't affect test results.
    }
  });
}
