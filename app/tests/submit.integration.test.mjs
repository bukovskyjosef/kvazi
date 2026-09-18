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
import { readFileSync } from 'node:fs';
import { execSync, execFileSync } from 'node:child_process';

const ACTIVE_VERSION = JSON.parse(readFileSync(new URL('../data/active-release.json', import.meta.url))).version;
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
    execFileSync('docker', ['exec', process.env.KVAZI_DB_CONTAINER || 'kvazi_db', 'psql', '-U', 'kvazi', '-d', 'kvazi', '-c', 'SELECT 1'], {timeout:5000});
    return true;
  } catch { return false; }
}

const httpUp = await serverReachable();
const dbUp   = dbReachable();
const allUp  = httpUp && dbUp;
if (!allUp && process.env.KVAZI_INTEGRATION_REQUIRED === '1') throw new Error('Mandatory integration requires HTTP and DB');

function integrationTest(name, fn) {
  if (!allUp) {
    test(name, { skip: 'Docker stack not reachable — start with docker compose up -d to run integration tests' }, fn);
  } else {
    test(name, fn);
  }
}

// ── DB helpers ────────────────────────────────────────────────────────────────

const DB_CONTAINER = process.env.KVAZI_DB_CONTAINER || 'kvazi_db';

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
  return execFileSync('docker', ['exec', DB_CONTAINER, 'psql', '-U', 'kvazi', '-d', 'kvazi', '-v', 'ON_ERROR_STOP=1', '-q', '-t', '-A', '-c', resolved], { timeout: 10000 }).toString().trim();
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
  dbExec(`INSERT INTO kvazi.user_account (username, email, password_hash, role, email_verified_at)
           VALUES (:u, :e, :h, :r, now())
           ON CONFLICT (username) DO NOTHING`, { u: username, e: email, h: hash, r: role });
}

function deleteTestUser(username) {
  // Disposable fixture cleanup only. Production never bypasses history triggers.
  dbExec(`BEGIN; SET LOCAL session_replication_role = replica;
    DELETE FROM kvazi.validation_result_review WHERE validation_result_id IN (
      SELECT v.id FROM kvazi.validation_result v JOIN kvazi.sentence s ON s.id=v.sentence_id
      WHERE s.user_id=(SELECT id FROM kvazi.user_account WHERE username=:u));
    DELETE FROM kvazi.administrative_decision WHERE sentence_id IN (SELECT id FROM kvazi.sentence WHERE user_id=(SELECT id FROM kvazi.user_account WHERE username=:u));
    DELETE FROM kvazi.validation_result WHERE sentence_id IN (SELECT id FROM kvazi.sentence WHERE user_id=(SELECT id FROM kvazi.user_account WHERE username=:u));
    DELETE FROM kvazi.sentence_revision WHERE submitted_by=(SELECT id FROM kvazi.user_account WHERE username=:u);
    DELETE FROM kvazi.sentence WHERE user_id=(SELECT id FROM kvazi.user_account WHERE username=:u);
    DELETE FROM kvazi.real_word_catalog WHERE admin_id=(SELECT id FROM kvazi.user_account WHERE username=:u);
    DELETE FROM kvazi.morphology_review_decision WHERE admin_id=(SELECT id FROM kvazi.user_account WHERE username=:u);
    DELETE FROM kvazi.user_account WHERE username=:u; COMMIT;`, {u:username});
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

// ── A valid, submitReady draft (pán pl-1 + V-IT present 3pl) ─────────────────
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
      form: { verbFormType: 'present', verbPerson: '3', number: 'plural', aspect: 'imperfective' },
      role: 'predicate', relations: {},
      valency: { modelVerb: '', declaration: 'Opírá se o české sloveso dělat; nevyžaduje doplnění.' },
      evidence: { source: '', reference: '', morphology: 'Přítomný čas 3. osoby plurálu vzoru V-IT.', needsAnalogy: false, explanation: '', analogy: '' },
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

  assert.equal(dbQuery("SELECT to_regclass('kvazi.process_compliance') IS NULL, to_regclass('kvazi.audit_log') IS NULL"), 't|t');
  assert.equal(dbQuery('SELECT rules_version, validator_version FROM kvazi.validation_result WHERE revision_id = :rid', {rid: body.revisionId}), `${ACTIVE_VERSION}|${JSON.parse(readFileSync(new URL(`../data/rules/${ACTIVE_VERSION}/manifest.json`, import.meta.url))).validator_version}`);

  // Authoritative charScore and wordScore in DB must match API response
  const storedScores = dbQuery(
    'SELECT char_score, word_score FROM kvazi.validation_result WHERE sentence_id = :sid AND revision_id = :rid',
    { sid: String(body.id), rid: String(body.revisionId) }
  );
  const [cs, ws] = storedScores.split('|').map(Number);
  assert.equal(cs, 10, 'DB char_score should be 10');
  assert.equal(ws, 2,  'DB word_score should be 2');
  const manifest=JSON.parse(readFileSync(new URL(`../data/rules/${ACTIVE_VERSION}/manifest.json`,import.meta.url)));
  assert.equal(dbQuery('SELECT normative_hash, validator_version FROM kvazi.rules_release WHERE version = :v',{v:ACTIVE_VERSION}),`${manifest.normative_hash}|${manifest.validator_version}`);

});

// ── Test 2: Invalid draft → 422, no revision created ─────────────────────────

integrationTest('optional morphology evidence: accepted HTTP submit; mandatory valency/analogy still reject without persistence', async () => {
  const {cookie, apiCsrf} = await loginSession(USR, USR_PASS);
  const draft = structuredClone(VALID_DRAFT);
  for (const word of draft.tokens) delete word.evidence.morphology;
  const send = async () => fetch(`${BASE}/api/submit.php`, {
    method:'POST', headers:{'Content-Type':'application/json', Cookie:cookie}, body:JSON.stringify({csrf:apiCsrf, draft}),
  });
  const accepted = await send();
  assert.equal(accepted.status, 200, await accepted.text());
  const before = dbCount('kvazi.sentence_revision', 'submitted_by = (SELECT id FROM kvazi.user_account WHERE username = :u)', {u:USR});
  const valency = draft.tokens[1].valency.declaration;
  draft.tokens[1].valency.declaration = '';
  assert.equal((await send()).status, 422);
  draft.tokens[1].valency.declaration = valency;
  Object.assign(draft.tokens[0].evidence, {needsAnalogy:true, explanation:'Obhajoba.', analogy:''});
  assert.equal((await send()).status, 422);
  Object.assign(draft.tokens[0].evidence, {explanation:'', analogy:'Dítě spí.'});
  assert.equal((await send()).status, 422);
  assert.equal(dbCount('kvazi.sentence_revision', 'submitted_by = (SELECT id FROM kvazi.user_account WHERE username = :u)', {u:USR}), before);
});

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

  const snapshot = () => dbQuery('SELECT row_to_json(r) FROM kvazi.sentence_revision r WHERE id = :rid', {rid:revisionId1});
  const resultSnapshot = () => dbQuery('SELECT row_to_json(v) FROM kvazi.validation_result v WHERE revision_id = :rid', {rid:revisionId1});
  const beforeRevision = snapshot(), beforeValidation = resultSnapshot();

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
  assert.equal(rev2.id,sentenceId);

  assert.equal(snapshot(), beforeRevision, 'rev1 remains byte-for-byte immutable');
  assert.equal(resultSnapshot(), beforeValidation, 'rev1 validation remains immutable');
  const preload = async (expectedStatus = 200) => {
    const r = await fetch(`${BASE}/konfigurator.php?sentenceId=${sentenceId}`, {headers:{Cookie:cookie}});
    assert.equal(r.status, expectedStatus);
    const html = await r.text();
    return expectedStatus === 200 ? JSON.parse(html.match(/window\.__resubmit = (.*?);<\/script>/)[1]) : null;
  };
  assert.equal(await preload(409),null,'return rev1 cannot preload pending rev2');
  const read = await fetch(`${BASE}/moje-vety.php`, {headers:{Cookie:cookie}});
  assert.equal(read.status,200);
  const html = await read.text();
  const rev2Section = html.split(`data-revision-id="${revisionId2}"`)[1].split('</article>')[0];
  const rev1Section = html.split(`data-revision-id="${revisionId1}"`)[1].split('</article>')[0];
  assert.ok(rev1Section.includes('Vráceno'));
  assert.ok(!rev2Section.includes('Vráceno'));
  assert.ok(!html.includes('Upravit a znovu odeslat'));

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

  const loaded = await preload();
  assert.equal(loaded.sentenceId,sentenceId);
  assert.deepEqual(loaded.draft, JSON.parse(dbQuery('SELECT draft_json FROM kvazi.sentence_revision WHERE id = :rid',{rid:revisionId2})), 'returned latest revision is preloaded');
  for (const rid of [revisionId1,revisionId2]) {
    assert.equal(dbCount('kvazi.administrative_decision', "sentence_id = :sid AND revision_id = :rid AND action = 'return'",{sid:sentenceId,rid}),1);
  }
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
  assert.equal(rev3.id,sentenceId);

  // Verify 3 revisions exist
  const finalRevCount = dbCount('kvazi.sentence_revision', 'sentence_id = :sid', { sid: String(sentenceId) });
  assert.equal(finalRevCount, 3, 'Three revisions should exist');
  assert.equal(dbCount('kvazi.sentence','id = :sid',{sid:sentenceId}),1);
  assert.equal(dbQuery('SELECT string_agg(CAST(revision_no AS text), \',\' ORDER BY revision_no) FROM kvazi.sentence_revision WHERE sentence_id = :sid',{sid:sentenceId}),'1,2,3');
  assert.equal(snapshot(),beforeRevision);
  assert.equal(resultSnapshot(),beforeValidation);
});


for (const scenario of ['score','rules version','false prefix','hidden prefix','prefix POS','aspect','agreement']) {
  integrationTest(`tampering: ${scenario}`, async () => {
    const {cookie,apiCsrf} = await loginSession(USR,USR_PASS);
    const draft=structuredClone(VALID_DRAFT);
    const payload={csrf:apiCsrf,draft};
    let status=200, expectedScore=10;
    if (scenario==='score') {
      Object.assign(payload,{charScore:999999,wordScore:999999});
      Object.assign(draft,{charScore:999999,wordScore:999999,validation:{submitReady:true,charScore:999999}});
    }
    if (scenario==='rules version') {payload.rulesVersion='fake-version';draft.rulesVersion='fake-version';}
    if (scenario==='false prefix') draft.tokens[0].kvaziPrefix='kvazi';
    if (scenario==='hidden prefix' || scenario==='prefix POS') {
      Object.assign(draft.tokens[0],{surface:'kvaziqazi',lemma:'kvaziqaz',kvaziPrefix:''});
      expectedScore=9;
      if (scenario==='prefix POS') {draft.tokens[0].pos='adjective';status=422;}
    }
    if (scenario==='aspect') {draft.tokens[1].form.aspect='banana';status=422;}
    if (scenario==='agreement') {draft.tokens[1].form.number='singular';status=422;}
    const count=()=>dbCount('kvazi.sentence_revision','submitted_by = (SELECT id FROM kvazi.user_account WHERE username = :u)',{u:USR});
    const before=count();
    const r=await fetch(`${BASE}/api/submit.php`,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(payload)});
    const body=await r.json();
    assert.equal(r.status,status,JSON.stringify(body));
    if(status===422) {
      assert.equal(count(),before,'rejected tampering persists no revision');
      assert.equal(body.validation.submitReady,false);
    } else {
      assert.equal(count(),before+1);
      const row=dbQuery('SELECT char_score, word_score, rules_version FROM kvazi.validation_result WHERE revision_id = :rid',{rid:body.revisionId});
      assert.equal(row,`${expectedScore}|2|${ACTIVE_VERSION}`);
      assert.equal(body.charScore,expectedScore);
    }
  });
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

// Run cleanup after all tests (teardown hook not supported in node:test for module level;
// we clean up at module exit via process.on('exit')). Users are deleted via CASCADE.
if (allUp) {
  process.on('exit', () => {
    try {
      deleteTestUser(USR);
      deleteTestUser(ADM);
    } catch (e) {
      console.error('Test fixture cleanup failed:', e.message);
      process.exitCode = 1;
    }
  });
}

integrationTest('implicit subject HTTP matrix: expected verdict and no persistence on rejection', async () => {
  const {cookie,apiCsrf}=await loginSession(USR,USR_PASS);
  for (const [type,form,expected] of [
    ['imperative','imperative',200], ['imperative','present',422],
    ['declarative','imperative',422], ['interrogative','imperative',422],
  ]) {
    const draft=structuredClone(VALID_DRAFT);
    draft.sentenceType=type; draft.implicitSubject=true; draft.tokens.shift();
    if(form==='imperative') Object.assign(draft.tokens[0],{surface:'kvazi',lemma:'kvaziit',form:{verbFormType:'imperative',verbPerson:'2sg',aspect:'imperfective'}});
    const before=dbCount('kvazi.sentence_revision');
    const r=await fetch(`${BASE}/api/submit.php`,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({csrf:apiCsrf,draft})});
    assert.equal(r.status,expected,`${type}/${form}: ${await r.text()}`);
    assert.equal(dbCount('kvazi.sentence_revision'),before+(expected===200?1:0));
  }
});

integrationTest('DB ownership, immutable history, release binding and final admin decision', async () => {
  const {cookie,apiCsrf}=await loginSession(USR,USR_PASS);
  const submit=async()=>{
    const r=await fetch(`${BASE}/api/submit.php`,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({csrf:apiCsrf,draft:VALID_DRAFT})});
    assert.equal(r.status,200);return r.json();
  };
  const one=await submit(),two=await submit();
  const uid=dbQuery('SELECT id FROM kvazi.user_account WHERE username=:u',{u:USR});
  const aid=dbQuery('SELECT id FROM kvazi.user_account WHERE username=:u',{u:ADM});
  const rejects=(sql,params={})=>assert.throws(()=>dbExec(sql,params),undefined,sql);
  for(const table of ['sentence_revision','validation_result']) {
    const where=table==='sentence_revision'?`id=${one.revisionId}`:`revision_id=${one.revisionId}`;
    rejects(`UPDATE kvazi.${table} SET created_at=now() WHERE ${where}`);
    rejects(`DELETE FROM kvazi.${table} WHERE ${where}`);
  }
  rejects('UPDATE kvazi.sentence SET user_id=:aid WHERE id=:sid',{aid,sid:one.id});
  rejects('INSERT INTO kvazi.sentence_revision (sentence_id,revision_no,rules_version,submitted_by,draft_json) VALUES (:sid,2,:v,:aid,\'{}\')',{sid:one.id,v:ACTIVE_VERSION,aid});
  rejects('INSERT INTO kvazi.sentence_revision (sentence_id,revision_no,rules_version,submitted_by,draft_json) VALUES (:sid,3,:v,:uid,\'{}\')',{sid:one.id,v:ACTIVE_VERSION,uid});
  rejects('INSERT INTO kvazi.validation_result (sentence_id,revision_id,rules_version,validator_version) VALUES (:sid,:rid,\'public-1\',\'1.0.0\')',{sid:two.id,rid:one.revisionId});
  rejects('INSERT INTO kvazi.validation_result (sentence_id,revision_id,rules_version,validator_version) VALUES (:sid,:rid,\'public-1\',\'fake\')',{sid:one.id,rid:one.revisionId});
  rejects('UPDATE kvazi.rules_release SET normative_hash=repeat(\'a\',64) WHERE version=:v',{v:ACTIVE_VERSION});
  rejects('DELETE FROM kvazi.rules_release WHERE version=\'public-1\'');
  rejects('INSERT INTO kvazi.administrative_decision (sentence_id,revision_id,admin_id,action) VALUES (:sid,:rid,:uid,\'approve\')',{sid:one.id,rid:one.revisionId,uid});
  rejects('INSERT INTO kvazi.administrative_decision (sentence_id,revision_id,admin_id,action) VALUES (:sid,:rid,:aid,\'return\')',{sid:two.id,rid:one.revisionId,aid});
  dbExec('INSERT INTO kvazi.administrative_decision (sentence_id,revision_id,admin_id,action,reason) VALUES (:sid,:rid,:aid,\'return\',\'Needs explanation\')',{sid:one.id,rid:one.revisionId,aid});
  rejects('INSERT INTO kvazi.administrative_decision (sentence_id,revision_id,admin_id,action) VALUES (:sid,:rid,:aid,\'approve\')',{sid:one.id,rid:one.revisionId,aid});
  rejects('UPDATE kvazi.administrative_decision SET action=\'approve\' WHERE revision_id=:rid',{rid:one.revisionId});
});

integrationTest('review persistence: exact keys, version isolation, immutable corrections and stable used references', async () => {
  const aid=dbQuery('SELECT id FROM kvazi.user_account WHERE username=:u',{u:ADM});
  const {cookie,apiCsrf}=await loginSession(USR,USR_PASS);
  const response=await fetch(`${BASE}/api/submit.php`,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({csrf:apiCsrf,draft:VALID_DRAFT})});
  assert.equal(response.status,200);const revision=await response.json();
  const identity=JSON.stringify({pos:'noun',lemma:'kvaz',model:'pán',gender:'masculine',animacy:'animate'});
  const form=JSON.stringify({case:'1',number:'plural'});
  const params={v:ACTIVE_VERSION,i:identity,f:form,s:'kvazi'};
  const caseId=dbQuery('INSERT INTO kvazi.morphology_review_case (rules_version,identity_json,form_json,surface_form) VALUES (:v,:i,:f,:s) RETURNING id',params);
  const testCases=[caseId];
  process.on('exit',()=>{for(const cid of testCases) dbExec('BEGIN; SET LOCAL session_replication_role=replica; DELETE FROM kvazi.morphology_review_case WHERE id=:cid; COMMIT',{cid});});
  const decisions=()=>dbCount('kvazi.morphology_review_decision','case_id=:cid',{cid:caseId});
  assert.equal(decisions(),0,'UNKNOWN is absence');
  assert.throws(()=>dbExec('INSERT INTO kvazi.morphology_review_case (rules_version,identity_json,form_json,surface_form) VALUES (:v,:i,:f,:s)',params));
  const first=dbQuery("INSERT INTO kvazi.morphology_review_decision (case_id,rules_version,decision_no,verdict,admin_id) VALUES (:cid,:v,1,'APPROVED',:aid) RETURNING id",{cid:caseId,v:ACTIVE_VERSION,aid});
  const resultId=dbQuery('SELECT id FROM kvazi.validation_result WHERE revision_id=:rid',{rid:revision.revisionId});
  dbExec('INSERT INTO kvazi.validation_result_review (validation_result_id,token_id,review_decision_id,rules_version) VALUES (:vid,\'t1\',:did,:v)',{vid:resultId,did:first,v:ACTIVE_VERSION});
  assert.throws(()=>dbExec("INSERT INTO kvazi.morphology_review_decision (case_id,rules_version,decision_no,verdict,admin_id) VALUES (:cid,:v,2,'REJECTED',:aid)",{cid:caseId,v:ACTIVE_VERSION,aid}));
  const second=dbQuery("INSERT INTO kvazi.morphology_review_decision (case_id,rules_version,decision_no,verdict,reason,admin_id) VALUES (:cid,:v,2,'REJECTED','Correction',:aid) RETURNING id",{cid:caseId,v:ACTIVE_VERSION,aid});
  assert.equal(dbQuery('SELECT verdict FROM kvazi.morphology_review_decision WHERE case_id=:cid ORDER BY decision_no DESC LIMIT 1',{cid:caseId}),'REJECTED');
  assert.equal(dbQuery('SELECT review_decision_id FROM kvazi.validation_result_review WHERE validation_result_id=:vid',{vid:resultId}),first);
  assert.throws(()=>dbExec("UPDATE kvazi.validation_result_review SET review_decision_id=:did WHERE validation_result_id=:vid",{did:second,vid:resultId}));
  assert.throws(()=>dbExec("UPDATE kvazi.morphology_review_decision SET verdict='REJECTED' WHERE id=:did",{did:first}));
  for(const change of [{v:'public-1'}, {i:JSON.stringify({pos:'noun',lemma:'kvaz',model:'muž'})}, {f:JSON.stringify({case:'5',number:'plural'})}, {s:'kvazí'}]) {
    assert.equal(dbCount('kvazi.morphology_review_case','rules_version=:v AND identity_json=:i AND form_json=:f AND surface_form=:s',{...params,...change}),0);
  }
  const oldCase=dbQuery('INSERT INTO kvazi.morphology_review_case (rules_version,identity_json,form_json,surface_form) VALUES (\'public-1\',:i,:f,:s) RETURNING id',params);
  testCases.push(oldCase);
  assert.equal(dbCount('kvazi.morphology_review_decision','case_id=:cid',{cid:oldCase}),0);
  const oldDecision=dbQuery("INSERT INTO kvazi.morphology_review_decision (case_id,rules_version,decision_no,verdict,admin_id) VALUES (:cid,'public-1',1,'APPROVED',:aid) RETURNING id",{cid:oldCase,aid});
  assert.throws(()=>dbExec('INSERT INTO kvazi.validation_result_review (validation_result_id,token_id,review_decision_id,rules_version) VALUES (:vid,\'t2\',:did,:v)',{vid:resultId,did:oldDecision,v:ACTIVE_VERSION}));
  dbExec('INSERT INTO kvazi.real_word_catalog (identity_json,form_json,surface_form,is_approved,admin_id) VALUES (:i,:f,:s,TRUE,:aid)',{...params,aid});
  assert.equal(dbCount('kvazi.real_word_catalog','identity_json=:i AND form_json=:f AND surface_form=:s',params),1);
  assert.equal(dbQuery('SELECT verdict FROM kvazi.morphology_review_decision WHERE id=:id',{id:second}),'REJECTED','lexical approval does not change morphology verdict');

});

function phpRuntime(code) {
  return execFileSync('docker',['exec',process.env.KVAZI_PHP_CONTAINER || 'kvazi_php','php','-r',`require '/var/www/html/includes/auth.php'; ${code}`],{encoding:'utf8',timeout:15000}).trim();
}
integrationTest('ADMIN gate denies anonymous/USER and rechecks persisted ADMIN role', () => {
  const aid=Number(dbQuery('SELECT id FROM kvazi.user_account WHERE username=:u',{u:ADM}));
  const uid=Number(dbQuery('SELECT id FROM kvazi.user_account WHERE username=:u',{u:USR}));
  for(const [user,allowed] of [[null,false],[{id:uid,role:'USER'},false],[{id:aid,role:'ADMIN'},true],[{id:uid,role:'ADMIN'},false]]) {
    const encoded=Buffer.from(JSON.stringify(user)).toString('base64');
    const output=phpRuntime(`auth_session_start(); $_SESSION['auth_user']=json_decode(base64_decode('${encoded}'),true);
      $reached=false; register_shutdown_function(function()use(&$reached){echo json_encode([$reached,http_response_code()]);});
      auth_require_admin(); $reached=true;`);
    const [reached,status]=JSON.parse(output); assert.equal(reached,allowed); if(!allowed) assert.equal(status,403);
  }
});

integrationTest('session policy: HTTPS/proxy Secure, strict IDs, expiry and logout', () => {
  for(const secureMode of ["$_SERVER['HTTPS']='on';", "putenv('AUTH_COOKIE_SECURE=1');"]) {
    const value=JSON.parse(phpRuntime(`${secureMode} session_id('untrusted-fixed-session-id'); auth_session_start();
      $id=session_id(); $params=session_get_cookie_params();
      $_SESSION['auth_user']=['id'=>1,'role'=>'USER']; $_SESSION['started_at']=time()-7201;
      session_write_close(); auth_session_start(); $expired=auth_user()===null; $rotated=session_id()!==$id;
      auth_logout(); echo json_encode([$params,ini_get('session.use_strict_mode'),$id!=='untrusted-fixed-session-id',$expired,$rotated,session_status()]);`));
    assert.equal(value[0].secure,true);assert.equal(value[0].httponly,true);assert.equal(value[0].samesite,'Lax');
    assert.deepEqual(value.slice(1),['1',true,true,true,1]);
  }
});

integrationTest('HTTP login/session CSRF and POST logout invalidate old authenticated cookie', async () => {
  const login=await fetch(`${BASE}/login.php`);const cookie=extractCookies(login);const html=await login.text();
  const flags=login.headers.get('set-cookie'); assert.match(flags,/HttpOnly/i);assert.match(flags,/SameSite=Lax/i);
  const csrf=extractCsrfFromForm(html);
  for(const token of ['', 'invalid']) {
    const r=await fetch(`${BASE}/login.php`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Cookie:cookie},body:new URLSearchParams({csrf:token,identifier:USR,password:USR_PASS}),redirect:'manual'});
    assert.equal(r.status,200);assert.match(await r.text(),/bezpečnostní token/);
  }
  const logged=await fetch(`${BASE}/login.php`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Cookie:cookie},body:new URLSearchParams({csrf,identifier:USR,password:USR_PASS}),redirect:'manual'});
  assert.equal(logged.status,302);const newCookie=extractCookies(logged);assert.notEqual(newCookie,cookie);
  const page=await fetch(`${BASE}/konfigurator.php`,{headers:{Cookie:newCookie}});const apiCsrf=extractCsrfFromMeta(await page.text());assert.notEqual(apiCsrf,csrf);
  const get=await fetch(`${BASE}/logout.php?token=${apiCsrf}`,{headers:{Cookie:newCookie},redirect:'manual'});assert.equal(get.status,405);
  const bad=await fetch(`${BASE}/logout.php`,{method:'POST',headers:{Cookie:newCookie},redirect:'manual'});assert.equal(bad.status,403);
  const out=await fetch(`${BASE}/logout.php`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Cookie:newCookie},body:new URLSearchParams({csrf:apiCsrf}),redirect:'manual'});
  assert.equal(out.status,302);assert.match(out.headers.get('set-cookie'),/expires=/i);
  const submit=await fetch(`${BASE}/api/submit.php`,{method:'POST',headers:{'Content-Type':'application/json',Cookie:newCookie},body:JSON.stringify({csrf:apiCsrf,draft:VALID_DRAFT})});assert.equal(submit.status,401);
});

integrationTest('registration email normalization, DB case-insensitive uniqueness and safe HTML output', async () => {
  const regUser=`${USR}_reg`;const regEmail=`${regUser}@kvazi.int`;
  try {
    const page=await fetch(`${BASE}/register.php`);const html=await page.text();const cookie=extractCookies(page);
    const r=await fetch(`${BASE}/register.php`,{method:'POST',redirect:'manual',headers:{'Content-Type':'application/x-www-form-urlencoded',Cookie:cookie},body:new URLSearchParams({csrf:extractCsrfFromForm(html),username:regUser,email:`  ${regEmail.toUpperCase()}  `,password:USR_PASS,password2:USR_PASS})});
    assert.equal(r.status,200,await r.text());
    assert.equal(dbQuery('SELECT email FROM kvazi.user_account WHERE username=:u',{u:regUser}),regEmail);
    assert.throws(()=>createTestUser(`${USR}_dup`,regEmail.toUpperCase(),USR_PASS));
    const attack='<img src=x onerror="window.pwned=1">';
    const bad=await fetch(`${BASE}/login.php`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Cookie:cookie},body:new URLSearchParams({csrf:'invalid',identifier:attack,password:'bad'})});
    const output=await bad.text();assert.ok(output.includes('&lt;img'));assert.ok(!output.includes(attack));
  } finally {deleteTestUser(regUser);}
});

integrationTest('login throttling: shared atomic counter, expiry and success reset', () => {
  // REMOTE_ADDR is a real IP in HTTP; use a unique reserved IPv6 fixture too.
  const stamp=Date.now().toString(16).padStart(12,'0');
  const candidate=`2001:db8:${stamp.match(/.{4}/g).map(v=>Number.parseInt(v,16).toString(16)).join(':')}::18`;
  const remote=phpRuntime(`echo inet_ntop(inet_pton('${candidate}'));`);
  const encoded=Buffer.from(USR).toString('base64'),password=Buffer.from(USR_PASS).toString('base64');
  try {
    const output=phpRuntime(`putenv('TRUSTED_PROXY_CIDRS='); $_SERVER['REMOTE_ADDR']='${remote}'; auth_session_start(); $user=base64_decode('${encoded}'); $password=base64_decode('${password}');
    $failures=[]; for($i=0;$i<10;$i++) $failures[]=auth_login($i%2?$user:'nonexistent-${RUN_ID}','wrong-password');
    $blocked=auth_login($user,$password); $pdo=kvazi_db();
    $pdo->prepare("UPDATE kvazi.login_throttle SET window_started_at=now()-interval '16 minutes' WHERE remote_address=:remote")->execute([':remote'=>'${remote}']);
    $success=auth_login($user,$password);
    $stmt=$pdo->prepare('SELECT count(*) FROM kvazi.login_throttle WHERE remote_address=:remote');$stmt->execute([':remote'=>'${remote}']);
    auth_logout(); echo json_encode([$failures,$blocked,is_array($success),(int)$stmt->fetchColumn()]);`);
    const [failures,blocked,success,count]=JSON.parse(output);
    assert.ok(failures.every(v=>v==='Nesprávný e-mail/uživatelské jméno nebo heslo.'));
    assert.match(blocked,/Příliš mnoho/);assert.equal(success,true);assert.equal(count,0);
  } finally {dbExec('DELETE FROM kvazi.login_throttle WHERE remote_address=:remote',{remote});}
});

integrationTest('active release new verdict leaves an original historical version/result untouched', async () => {
  const uid=dbQuery('SELECT id FROM kvazi.user_account WHERE username=:u',{u:USR});
  const sid=dbQuery('INSERT INTO kvazi.sentence (user_id) VALUES (:uid) RETURNING id',{uid});
  const rid=dbQuery('INSERT INTO kvazi.sentence_revision (sentence_id,revision_no,rules_version,submitted_by,draft_json) VALUES (:sid,1,\'public-1\',:uid,:draft) RETURNING id',{sid,uid,draft:JSON.stringify(VALID_DRAFT)});
  dbExec('INSERT INTO kvazi.validation_result (sentence_id,revision_id,rules_version,validator_version,is_valid,word_score,char_score) VALUES (:sid,:rid,\'public-1\',\'1.0.0\',TRUE,2,10)',{sid,rid});
  const snapshot=()=>dbQuery('SELECT row_to_json(v) FROM kvazi.validation_result v WHERE revision_id=:rid',{rid});
  const before=snapshot();
  const {cookie,apiCsrf}=await loginSession(USR,USR_PASS);
  const r=await fetch(`${BASE}/api/submit.php`,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({csrf:apiCsrf,draft:VALID_DRAFT,rulesVersion:'public-1'})});
  assert.equal(r.status,200);const body=await r.json();
  assert.equal(dbQuery('SELECT rules_version,validator_version FROM kvazi.validation_result WHERE revision_id=:rid',{rid:body.revisionId}),`${ACTIVE_VERSION}|${JSON.parse(readFileSync(new URL(`../data/rules/${ACTIVE_VERSION}/manifest.json`, import.meta.url))).validator_version}`);
  assert.equal(snapshot(),before);
  assert.equal(dbCount('kvazi.validation_result','revision_id=:rid',{rid}),1,'publishing/using new release does not revalidate historical facts');
});

integrationTest('concurrent resubmit from separate sessions creates exactly one next revision', async () => {
  const sessions=await Promise.all([loginSession(USR,USR_PASS),loginSession(USR,USR_PASS)]);
  const post=({cookie,apiCsrf},sentenceId)=>fetch(`${BASE}/api/submit.php`,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({csrf:apiCsrf,draft:VALID_DRAFT,...(sentenceId?{sentenceId}:{})})});
  const r=await post(sessions[0]);assert.equal(r.status,200);const initial=await r.json();
  const aid=dbQuery('SELECT id FROM kvazi.user_account WHERE username=:u',{u:ADM});
  dbExec("INSERT INTO kvazi.administrative_decision (sentence_id,revision_id,admin_id,action) VALUES (:sid,:rid,:aid,'return')",{sid:initial.id,rid:initial.revisionId,aid});
  const responses=await Promise.all(sessions.map(session=>post(session,initial.id)));
  assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
  assert.equal(dbQuery("SELECT string_agg(CAST(revision_no AS text),',' ORDER BY revision_no) FROM kvazi.sentence_revision WHERE sentence_id=:sid",{sid:initial.id}),'1,2');
});
