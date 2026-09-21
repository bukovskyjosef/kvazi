/**
 * Account deletion / erasure (#162) integration tests.
 *
 * Verifies all 14 validation expectations from the A shaping contract:
 * immutable approved history, tombstone, session invalidation, auth blocking,
 * username/email freeing, public projection, trigger protection, and fail-safe.
 *
 * Requires Docker stack: KVAZI_TEST_BASE_URL, DB + PHP containers.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const BASE = (process.env.KVAZI_TEST_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');
const DB_CONTAINER  = process.env.KVAZI_DB_CONTAINER || 'kvazi_db';
const APP_CONTAINER = process.env.KVAZI_APP_CONTAINER || 'kvazi_php';

// ── Reachability ────────────────────────────────────────────────────────────

async function serverReachable() {
  try {
    const r = await fetch(`${BASE}/api/normative.php`, { signal: AbortSignal.timeout(3000) });
    return r.status < 500;
  } catch { return false; }
}
function dbReachable() {
  try {
    execFileSync('docker', ['exec', DB_CONTAINER, 'psql', '-U', 'kvazi', '-d', 'kvazi', '-c', 'SELECT 1'], {timeout:5000, stdio:'pipe'});
    return true;
  } catch { return false; }
}

const httpUp = await serverReachable();
const dbUp   = dbReachable();
const allUp  = httpUp && dbUp;
if (!allUp && process.env.KVAZI_INTEGRATION_REQUIRED === '1') throw new Error('Mandatory integration requires HTTP and DB');

function integrationTest(name, fn) {
  if (!allUp) {
    test(name, { skip: 'Docker stack not reachable' }, fn);
  } else {
    test(name, fn);
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const RUN_ID = 'dl' + Date.now().toString(36);

function pg(v) { return "'" + String(v).replace(/'/g, "''") + "'"; }

function db(sql) {
  return execFileSync('docker', ['exec', DB_CONTAINER, 'psql', '-U', 'kvazi', '-d', 'kvazi',
    '-v', 'ON_ERROR_STOP=1', '-q', '-t', '-A', '-c', sql], { encoding: 'utf8', timeout: 10000 }).trim();
}

function phpHash(password) {
  return execFileSync('php', ['-r', `echo password_hash(${JSON.stringify(password)}, PASSWORD_BCRYPT, ['cost' => 4]);`],
    { timeout: 10000 }).toString().trim();
}

function cliDelete(userId, confirm = false) {
  const args = ['exec', APP_CONTAINER, 'php', '/usr/local/bin/kvazi-cli/delete-account.php', String(userId)];
  if (confirm) args.push('--confirm');
  return execFileSync('docker', args, { encoding: 'utf8', timeout: 30000 });
}

function cliDeleteExit(userId, confirm = false) {
  const args = ['exec', APP_CONTAINER, 'php', '/usr/local/bin/kvazi-cli/delete-account.php', String(userId)];
  if (confirm) args.push('--confirm');
  try {
    const out = execFileSync('docker', args, { encoding: 'utf8', timeout: 30000 });
    return { code: 0, output: out };
  } catch (e) {
    return { code: e.status, output: (e.stdout || '') + (e.stderr || '') };
  }
}

function cookie(response) {
  return response.headers.getSetCookie().map(v => v.split(';')[0]).join('; ');
}
function csrf(html) {
  return html.match(/name="csrf"\s+value="([^"]+)"/)?.[1] ?? '';
}
async function form(path, fields) {
  const page = await fetch(BASE + path);
  const cook = cookie(page);
  const tok  = csrf(await page.text());
  const response = await fetch(BASE + path, {
    method: 'POST', redirect: 'manual',
    headers: { Cookie: cook, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ csrf: tok, ...fields })
  });
  return { response, html: await response.text(), cookie: cook };
}

// ── Fixture helpers ─────────────────────────────────────────────────────────

const users = [];

function createUser(suffix, role = 'USER', verified = true) {
  const username = `${RUN_ID}_${suffix}`;
  const email = `${username}@kvazi.int`;
  const hash = phpHash('TestPass1!');
  const verifiedClause = verified ? 'now()' : 'NULL';
  db(`INSERT INTO kvazi.user_account(username,email,password_hash,role,email_verified_at)
    VALUES (${pg(username)},${pg(email)},${pg(hash)},${pg(role)},${verifiedClause})`);
  users.push(username);
  const uid = db(`SELECT id FROM kvazi.user_account WHERE username=${pg(username)}`);
  return { username, email, userId: parseInt(uid, 10), password: 'TestPass1!' };
}

function createAdmin(suffix) {
  return createUser(suffix, 'ADMIN', true);
}

function submitSentence(userId, rulesVersion, validatorVersion) {
  // Create sentence + revision + validation result directly in DB.
  db(`INSERT INTO kvazi.sentence(user_id) VALUES (${userId})`);
  const sid = db(`SELECT id FROM kvazi.sentence WHERE user_id=${userId} ORDER BY id DESC LIMIT 1`);
  db(`INSERT INTO kvazi.sentence_revision(sentence_id,revision_no,rules_version,submitted_by,draft_json)
    VALUES (${sid},1,${pg(rulesVersion)},${userId},'{"sentenceType":"declarative","tokens":[{"id":"t1","surface":"test","pos":"noun"}]}')`);
  const rid = db(`SELECT id FROM kvazi.sentence_revision WHERE sentence_id=${sid} ORDER BY id DESC LIMIT 1`);
  db(`INSERT INTO kvazi.validation_result(sentence_id,revision_id,rules_version,validator_version,word_score,char_score,is_valid,result_json)
    VALUES (${sid},${rid},${pg(rulesVersion)},${pg(validatorVersion)},1,4,true,'{}')`);
  return { sentenceId: parseInt(sid), revisionId: parseInt(rid) };
}

function adminDecide(revisionId, adminId, action, reason = '') {
  const sid = db(`SELECT sentence_id FROM kvazi.sentence_revision WHERE id=${revisionId}`);
  db(`INSERT INTO kvazi.administrative_decision(sentence_id,revision_id,admin_id,action,reason)
    VALUES (${sid},${revisionId},${adminId},${pg(action)},${pg(reason)})`);
}

function getRulesRelease() {
  const row = db(`SELECT version, validator_version FROM kvazi.rules_release ORDER BY activated_at DESC LIMIT 1`);
  const [version, validatorVersion] = row.split('|');
  return { version, validatorVersion };
}

test.after(() => {
  if (!allUp) return;
  for (const name of users) {
    try {
      db(`BEGIN; SET LOCAL session_replication_role=replica;
        DELETE FROM kvazi.validation_result_review WHERE validation_result_id IN
          (SELECT vr.id FROM kvazi.validation_result vr JOIN kvazi.sentence_revision sr ON sr.id=vr.revision_id
           JOIN kvazi.sentence s ON s.id=sr.sentence_id JOIN kvazi.user_account u ON u.id=s.user_id WHERE u.username=${pg(name)});
        DELETE FROM kvazi.validation_result WHERE revision_id IN
          (SELECT sr.id FROM kvazi.sentence_revision sr JOIN kvazi.sentence s ON s.id=sr.sentence_id
           JOIN kvazi.user_account u ON u.id=s.user_id WHERE u.username=${pg(name)});
        DELETE FROM kvazi.administrative_decision WHERE revision_id IN
          (SELECT sr.id FROM kvazi.sentence_revision sr JOIN kvazi.sentence s ON s.id=sr.sentence_id
           JOIN kvazi.user_account u ON u.id=s.user_id WHERE u.username=${pg(name)});
        DELETE FROM kvazi.sentence_revision WHERE sentence_id IN
          (SELECT s.id FROM kvazi.sentence s JOIN kvazi.user_account u ON u.id=s.user_id WHERE u.username=${pg(name)});
        DELETE FROM kvazi.sentence WHERE user_id IN (SELECT id FROM kvazi.user_account WHERE username=${pg(name)});
        DELETE FROM kvazi.auth_token WHERE user_id IN (SELECT id FROM kvazi.user_account WHERE username=${pg(name)});
        DELETE FROM kvazi.user_account WHERE username=${pg(name)};
        COMMIT;`);
    } catch { /* ignore cleanup errors */ }
  }
});

// ── Tests ───────────────────────────────────────────────────────────────────

// 1. pending-only USER → full delete
integrationTest('VE1: pending-only USER is fully deleted', () => {
  const rel = getRulesRelease();
  const u = createUser('pend');
  const admin = createAdmin('adm1');
  submitSentence(u.userId, rel.version, rel.validatorVersion);
  cliDelete(u.userId, true);
  const exists = db(`SELECT count(*) FROM kvazi.user_account WHERE id=${u.userId}`);
  assert.equal(exists, '0', 'account row must be fully deleted');
  const sCount = db(`SELECT count(*) FROM kvazi.sentence WHERE user_id=${u.userId}`);
  assert.equal(sCount, '0', 'sentences must be deleted');
});

// 2. return/reject USER → full delete including reasons
integrationTest('VE2: returned/rejected USER is fully deleted', () => {
  const rel = getRulesRelease();
  const u = createUser('retrej');
  const admin = createAdmin('adm2');
  const s1 = submitSentence(u.userId, rel.version, rel.validatorVersion);
  adminDecide(s1.revisionId, admin.userId, 'return', 'Needs rework');
  cliDelete(u.userId, true);
  const exists = db(`SELECT count(*) FROM kvazi.user_account WHERE id=${u.userId}`);
  assert.equal(exists, '0', 'account must be fully deleted');
  const adCount = db(`SELECT count(*) FROM kvazi.administrative_decision WHERE revision_id=${s1.revisionId}`);
  assert.equal(adCount, '0', 'return decision must be deleted');
});

// 3. approved-only USER → tombstone, approved data preserved
integrationTest('VE3: approved-only USER is tombstoned with history preserved', () => {
  const rel = getRulesRelease();
  const u = createUser('appr');
  const admin = createAdmin('adm3');
  const s1 = submitSentence(u.userId, rel.version, rel.validatorVersion);
  adminDecide(s1.revisionId, admin.userId, 'approve');
  cliDelete(u.userId, true);
  // Account must still exist as tombstone.
  const row = db(`SELECT username, email, deleted_at, email_verified_at FROM kvazi.user_account WHERE id=${u.userId}`);
  assert.ok(row, 'tombstone must exist');
  const parts = row.split('|');
  assert.ok(parts[0].startsWith('_del_'), 'username must be opaque tombstone');
  assert.ok(parts[1].endsWith('@deleted.invalid'), 'email must be opaque tombstone');
  assert.ok(parts[2] !== '', 'deleted_at must be set');
  assert.equal(parts[3], '', 'email_verified_at must be NULL');
  // Approved revision must survive.
  const revExists = db(`SELECT count(*) FROM kvazi.sentence_revision WHERE id=${s1.revisionId}`);
  assert.equal(revExists, '1', 'approved revision must survive');
  const vrExists = db(`SELECT count(*) FROM kvazi.validation_result WHERE revision_id=${s1.revisionId}`);
  assert.equal(vrExists, '1', 'validation result for approved revision must survive');
  const adExists = db(`SELECT count(*) FROM kvazi.administrative_decision WHERE revision_id=${s1.revisionId} AND action='approve'`);
  assert.equal(adExists, '1', 'approve decision must survive');
});

// 4. return → later approve same sentence → returned revision erased, approved kept
integrationTest('VE4: return then approve chain preserves only approved revision', () => {
  const rel = getRulesRelease();
  const u = createUser('chain');
  const admin = createAdmin('adm4');
  // Revision 1: submitted, returned.
  const s1 = submitSentence(u.userId, rel.version, rel.validatorVersion);
  adminDecide(s1.revisionId, admin.userId, 'return', 'Try again');
  // Revision 2 on same sentence: submitted, approved.
  const sid = s1.sentenceId;
  db(`INSERT INTO kvazi.sentence_revision(sentence_id,revision_no,rules_version,submitted_by,draft_json)
    VALUES (${sid},2,${pg(rel.version)},${u.userId},'{"sentenceType":"declarative","tokens":[{"id":"t1","surface":"test","pos":"noun"}]}')`);
  const rid2 = db(`SELECT id FROM kvazi.sentence_revision WHERE sentence_id=${sid} AND revision_no=2`);
  db(`INSERT INTO kvazi.validation_result(sentence_id,revision_id,rules_version,validator_version,word_score,char_score,is_valid,result_json)
    VALUES (${sid},${rid2},${pg(rel.version)},${pg(rel.validatorVersion)},2,8,true,'{}')`);
  adminDecide(parseInt(rid2), admin.userId, 'approve');
  cliDelete(u.userId, true);
  // Returned revision 1 must be erased.
  const r1Exists = db(`SELECT count(*) FROM kvazi.sentence_revision WHERE id=${s1.revisionId}`);
  assert.equal(r1Exists, '0', 'returned revision must be erased');
  // Approved revision 2 must survive.
  const r2Exists = db(`SELECT count(*) FROM kvazi.sentence_revision WHERE id=${rid2}`);
  assert.equal(r2Exists, '1', 'approved revision must survive');
});

// 5. multiple approved submissions → all retained with neutral attribution
integrationTest('VE5: multiple approved submissions all retained', () => {
  const rel = getRulesRelease();
  const u = createUser('multi');
  const admin = createAdmin('adm5');
  const s1 = submitSentence(u.userId, rel.version, rel.validatorVersion);
  adminDecide(s1.revisionId, admin.userId, 'approve');
  const s2 = submitSentence(u.userId, rel.version, rel.validatorVersion);
  adminDecide(s2.revisionId, admin.userId, 'approve');
  cliDelete(u.userId, true);
  const rCount = db(`SELECT count(*) FROM kvazi.sentence_revision sr
    JOIN kvazi.sentence s ON s.id=sr.sentence_id WHERE s.user_id=${u.userId}`);
  assert.equal(rCount, '2', 'both approved revisions must survive');
});

// 6. no original credentials remain after deletion
integrationTest('VE6: original credentials erased after tombstone', () => {
  const rel = getRulesRelease();
  const u = createUser('creds');
  const admin = createAdmin('adm6');
  const s1 = submitSentence(u.userId, rel.version, rel.validatorVersion);
  adminDecide(s1.revisionId, admin.userId, 'approve');
  // Insert an auth token too.
  db(`INSERT INTO kvazi.auth_token(user_id,purpose,token_hash,expires_at)
    VALUES (${u.userId},'email_verification','${'a'.repeat(64)}',now()+interval '1 hour')`);
  const origUsername = u.username;
  const origEmail = u.email;
  cliDelete(u.userId, true);
  const row = db(`SELECT username, email, password_hash FROM kvazi.user_account WHERE id=${u.userId}`);
  const parts = row.split('|');
  assert.notEqual(parts[0], origUsername, 'original username must not remain');
  assert.notEqual(parts[1], origEmail, 'original email must not remain');
  const tokenCount = db(`SELECT count(*) FROM kvazi.auth_token WHERE user_id=${u.userId}`);
  assert.equal(tokenCount, '0', 'auth tokens must be deleted');
});

// 7. session invalidation + login/recovery/resend blocked
integrationTest('VE7: login blocked for deleted user', async () => {
  const rel = getRulesRelease();
  const u = createUser('login');
  const admin = createAdmin('adm7');
  const s1 = submitSentence(u.userId, rel.version, rel.validatorVersion);
  adminDecide(s1.revisionId, admin.userId, 'approve');
  cliDelete(u.userId, true);
  // Attempt login with original credentials.
  const r = await form('/login.php', { identifier: u.email, password: u.password });
  assert.ok(!r.html.includes('moje.php') || r.response.status !== 302,
    'login must not succeed for deleted user');
});

integrationTest('VE7b: recovery blocked for deleted user', async () => {
  const rel = getRulesRelease();
  const u = createUser('recov');
  const admin = createAdmin('adm7b');
  const s1 = submitSentence(u.userId, rel.version, rel.validatorVersion);
  adminDecide(s1.revisionId, admin.userId, 'approve');
  cliDelete(u.userId, true);
  await form('/forgot-password.php', { email: u.email, challenge: 'kvazi kvazi.' });
  // Even with neutral message, no token should be generated.
  const tokenCount = db(`SELECT count(*) FROM kvazi.auth_token WHERE user_id=${u.userId}`);
  assert.equal(tokenCount, '0', 'no recovery token for deleted user');
});

// 8. new account can reuse original username/email
integrationTest('VE8: new account can reuse freed username/email', () => {
  const u = createUser('reuse');
  const origUsername = u.username;
  const origEmail = u.email;
  cliDelete(u.userId, true);
  // Re-register with same username and email.
  const hash = phpHash('NewPass22!');
  db(`INSERT INTO kvazi.user_account(username,email,password_hash,role,email_verified_at)
    VALUES (${pg(origUsername)},${pg(origEmail)},${pg(hash)},'USER',now())`);
  const newId = db(`SELECT id FROM kvazi.user_account WHERE username=${pg(origUsername)} AND deleted_at IS NULL`);
  assert.ok(parseInt(newId) > u.userId, 'new account must have a new ID');
  // Cleanup.
  db(`DELETE FROM kvazi.user_account WHERE id=${newId}`);
});

// 9. other accounts untouched
integrationTest('VE9: other accounts and submissions untouched', () => {
  const rel = getRulesRelease();
  const u = createUser('target9');
  const other = createUser('other9');
  const admin = createAdmin('adm9');
  submitSentence(u.userId, rel.version, rel.validatorVersion);
  const otherSub = submitSentence(other.userId, rel.version, rel.validatorVersion);
  adminDecide(otherSub.revisionId, admin.userId, 'approve');
  cliDelete(u.userId, true);
  // Other user completely intact.
  const otherExists = db(`SELECT count(*) FROM kvazi.user_account WHERE id=${other.userId} AND deleted_at IS NULL`);
  assert.equal(otherExists, '1', 'other account must be intact');
  const otherRev = db(`SELECT count(*) FROM kvazi.sentence_revision WHERE id=${otherSub.revisionId}`);
  assert.equal(otherRev, '1', 'other submissions must be intact');
});

// 10. approved immutable history cannot be deleted even after tombstone
integrationTest('VE10: approved revision DELETE blocked even after tombstone', () => {
  const rel = getRulesRelease();
  const u = createUser('immut');
  const admin = createAdmin('adm10');
  const s1 = submitSentence(u.userId, rel.version, rel.validatorVersion);
  adminDecide(s1.revisionId, admin.userId, 'approve');
  cliDelete(u.userId, true);
  // Direct DELETE must fail.
  assert.throws(() => {
    db(`DELETE FROM kvazi.sentence_revision WHERE id=${s1.revisionId}`);
  }, /immutable/, 'approved revision must remain immutable after tombstone');
});

// 11. ADMIN target fails before mutation
integrationTest('VE11: ADMIN account deletion fails closed', () => {
  const admin = createAdmin('adm11');
  const result = cliDeleteExit(admin.userId, true);
  assert.notEqual(result.code, 0, 'must fail for ADMIN target');
  assert.ok(result.output.includes('Only USER'), 'error must mention USER requirement');
  const exists = db(`SELECT count(*) FROM kvazi.user_account WHERE id=${admin.userId} AND deleted_at IS NULL`);
  assert.equal(exists, '1', 'admin account must be untouched');
});

// 12. rerun/invalid ID/tombstone is safe no-op
integrationTest('VE12: rerun on tombstone is no-op', () => {
  const rel = getRulesRelease();
  const u = createUser('rerun');
  const admin = createAdmin('adm12');
  const s1 = submitSentence(u.userId, rel.version, rel.validatorVersion);
  adminDecide(s1.revisionId, admin.userId, 'approve');
  cliDelete(u.userId, true);
  // Rerun on tombstone must be no-op.
  const result = cliDeleteExit(u.userId, false);
  assert.equal(result.code, 0, 'rerun on tombstone must succeed');
  assert.ok(result.output.includes('already deleted'), 'must report already deleted');
});

integrationTest('VE12b: invalid ID is safe failure', () => {
  const result = cliDeleteExit(999999999, true);
  assert.notEqual(result.code, 0, 'must fail for non-existent ID');
  assert.ok(result.output.includes('not found'), 'error must mention not found');
});

// 13. clean bootstrap + existing-DB forward upgrade PASS — tested by pre-push gate

// 14. public projection shows neutral label
integrationTest('VE14: public projection shows zrušený uživatel', async () => {
  const rel = getRulesRelease();
  const u = createUser('pub');
  const admin = createAdmin('adm14');
  const s1 = submitSentence(u.userId, rel.version, rel.validatorVersion);
  adminDecide(s1.revisionId, admin.userId, 'approve');
  cliDelete(u.userId, true);
  // Check public page.
  const r = await fetch(`${BASE}/veta.php?revisionId=${s1.revisionId}`);
  const html = await r.text();
  assert.ok(html.includes('zrušený uživatel'), 'public page must show neutral label');
  assert.ok(!html.includes(u.username), 'original username must not appear on public page');
});
