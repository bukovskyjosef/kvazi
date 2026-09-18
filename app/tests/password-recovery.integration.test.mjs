/**
 * Password recovery (#105) integration tests.
 *
 * Requires:
 *   - Docker stack running (KVAZI_TEST_BASE_URL, or default http://localhost:8080)
 *   - DB accessible via: docker exec kvazi_db psql -U kvazi -d kvazi
 *   - PHP container accessible via: docker exec kvazi_php
 *   - MAIL_TRANSPORT=outbox with MAIL_OUTBOX_PATH configured
 *   - PHP CLI on PATH (for bcrypt hash generation)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const BASE = (process.env.KVAZI_TEST_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');
const DB_CONTAINER  = process.env.KVAZI_DB_CONTAINER || 'kvazi_db';
const APP_CONTAINER = process.env.KVAZI_APP_CONTAINER || 'kvazi_php';
const OUTBOX_PATH   = '/tmp/kvazi-mail-outbox.jsonl';

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

const RUN_ID = 'pr' + Date.now().toString(36);
const PASSWORD = 'RecoveryTest1!';
const NEW_PASSWORD = 'NewPassword42!';

function pg(v) { return "'" + String(v).replace(/'/g, "''") + "'"; }

function db(sql) {
  return execFileSync('docker', ['exec', DB_CONTAINER, 'psql', '-U', 'kvazi', '-d', 'kvazi',
    '-v', 'ON_ERROR_STOP=1', '-q', '-t', '-A', '-c', sql], { encoding: 'utf8', timeout: 10000 }).trim();
}

function cookie(response) {
  return response.headers.getSetCookie().map(v => v.split(';')[0]).join('; ');
}

function csrf(html) {
  return html.match(/name="csrf"\s+value="([^"]+)"/)?.[1] ?? '';
}

async function form(path, fields, session) {
  const page = session ? null : await fetch(BASE + path);
  const cook = session?.cookie ?? cookie(page);
  const tok  = session?.csrf ?? csrf(await page.text());
  const response = await fetch(BASE + path, {
    method: 'POST', redirect: 'manual',
    headers: { Cookie: cook, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ csrf: tok, ...fields })
  });
  return { response, html: await response.text(), cookie: cook };
}

function readOutbox() {
  try {
    const raw = execFileSync('docker', ['exec', APP_CONTAINER, 'cat', OUTBOX_PATH],
      { encoding: 'utf8', timeout: 5000 });
    return raw.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  } catch { return []; }
}

function clearOutbox() {
  try {
    execFileSync('docker', ['exec', '-u', 'www-data', APP_CONTAINER, 'sh', '-c', `rm -f ${OUTBOX_PATH}`], { timeout: 5000, stdio: 'pipe' });
  } catch { /* may not exist yet */ }
}

function extractResetTokenFromOutbox(email) {
  const mails = readOutbox().filter(m => m.to === email);
  if (mails.length === 0) return null;
  const match = mails[mails.length - 1].body.match(/token=([a-f0-9]{64})/);
  return match ? match[1] : null;
}

function phpHash(password) {
  return execFileSync('php', ['-r', `echo password_hash(${JSON.stringify(password)}, PASSWORD_BCRYPT, ['cost' => 10]);`],
    { timeout: 10000 }).toString().trim();
}

// Valid two-word challenge (surface-valid per canonical rules).
const VALID_CHALLENGE = 'kvazi kvazi.';

// ── Fixture management ──────────────────────────────────────────────────────

const users = [];

function createVerifiedUser(suffix) {
  const username = `${RUN_ID}_${suffix}`;
  const email = `${username}@kvazi.int`;
  const hash = phpHash(PASSWORD);
  db(`INSERT INTO kvazi.user_account(username,email,password_hash,role,email_verified_at)
    VALUES (${pg(username)},${pg(email)},${pg(hash)},'USER',now())`);
  users.push(username);
  return { username, email };
}

function createUnverifiedUser(suffix) {
  const username = `${RUN_ID}_${suffix}`;
  const email = `${username}@kvazi.int`;
  const hash = phpHash(PASSWORD);
  db(`INSERT INTO kvazi.user_account(username,email,password_hash,role)
    VALUES (${pg(username)},${pg(email)},${pg(hash)},'USER')`);
  users.push(username);
  return { username, email };
}

test.after(() => {
  if (!allUp) return;
  for (const name of users) {
    try {
      db(`BEGIN; SET LOCAL session_replication_role=replica;
        DELETE FROM kvazi.auth_token WHERE user_id IN (SELECT id FROM kvazi.user_account WHERE username=${pg(name)});
        DELETE FROM kvazi.user_account WHERE username=${pg(name)}; COMMIT;`);
    } catch { /* ignore */ }
  }
});

// ── Challenge validation tests ──────────────────────────────────────────────

integrationTest('backend rejects empty challenge', async () => {
  const u = createVerifiedUser('empty_ch');
  const { html } = await form('/forgot-password.php', { email: u.email, challenge: '' });
  assert.match(html, /dvouslovnou kvazivětu/i);
});

integrationTest('backend rejects single-word challenge', async () => {
  const u = createVerifiedUser('one_word');
  const { html } = await form('/forgot-password.php', { email: u.email, challenge: 'kvazi.' });
  assert.match(html, /dvě slova|neprošla/i);
});

integrationTest('backend rejects three-word challenge', async () => {
  const u = createVerifiedUser('three_words');
  const { html } = await form('/forgot-password.php', { email: u.email, challenge: 'kvazi kvazi kvazi.' });
  assert.match(html, /dvě slova|neprošla/i);
});

integrationTest('backend rejects challenge without terminal punctuation', async () => {
  const u = createVerifiedUser('no_punct');
  const { html } = await form('/forgot-password.php', { email: u.email, challenge: 'kvazi kvazi' });
  assert.match(html, /tečkou|otazníkem|vykřičníkem/i);
});

integrationTest('backend rejects surface-invalid two-word challenge', async () => {
  const u = createVerifiedUser('bad_surface');
  // 'xyz' contains letters not in the allowed charset [KVQAÁZIÍYÝ]
  const { html } = await form('/forgot-password.php', { email: u.email, challenge: 'xyz abc.' });
  assert.match(html, /neprošla/i);
});

integrationTest('backend accepts valid two-word challenge with period', async () => {
  const u = createVerifiedUser('valid_period');
  clearOutbox();
  const { html } = await form('/forgot-password.php', { email: u.email, challenge: VALID_CHALLENGE });
  assert.match(html, /Pokud váš email známe/);
});

integrationTest('backend accepts valid two-word challenge with question mark', async () => {
  const u = createVerifiedUser('valid_question');
  clearOutbox();
  const { html } = await form('/forgot-password.php', { email: u.email, challenge: 'kvazi kvazi?' });
  assert.match(html, /Pokud váš email známe/);
});

integrationTest('backend accepts valid two-word challenge with exclamation', async () => {
  const u = createVerifiedUser('valid_excl');
  clearOutbox();
  const { html } = await form('/forgot-password.php', { email: u.email, challenge: 'kvazi kvazi!' });
  assert.match(html, /Pokud váš email známe/);
});

// ── Anti-enumeration tests ──────────────────────────────────────────────────

integrationTest('known and unknown email get same neutral response after valid challenge', async () => {
  const u = createVerifiedUser('known');
  clearOutbox();
  const { html: knownHtml } = await form('/forgot-password.php', { email: u.email, challenge: VALID_CHALLENGE });
  clearOutbox();
  const { html: unknownHtml } = await form('/forgot-password.php', { email: 'unknown_' + RUN_ID + '@example.com', challenge: VALID_CHALLENGE });
  // Both must show exactly the same neutral message.
  assert.match(knownHtml, /Pokud váš email známe, odešleme vám odkaz pro obnovu hesla/);
  assert.match(unknownHtml, /Pokud váš email známe, odešleme vám odkaz pro obnovu hesla/);
});

integrationTest('unknown email does not create user_account, token, or mail', async () => {
  const fakeEmail = 'ghost_' + RUN_ID + '@kvazi.int';
  clearOutbox();
  await form('/forgot-password.php', { email: fakeEmail, challenge: VALID_CHALLENGE });
  assert.equal(db(`SELECT count(*) FROM kvazi.user_account WHERE email=${pg(fakeEmail)}`), '0', 'no account created');
  assert.equal(readOutbox().filter(m => m.to === fakeEmail).length, 0, 'no mail sent');
});

// ── Login entry point ───────────────────────────────────────────────────────

integrationTest('login.php contains discoverable "Zapomněl jsem heslo" link', async () => {
  const r = await fetch(BASE + '/login.php');
  const html = await r.text();
  assert.match(html, /Zapomněl jsem heslo/);
  assert.match(html, /forgot-password\.php/);
});

// ── Mail and token lifecycle ────────────────────────────────────────────────

integrationTest('valid request for existing account sends reset email via outbox', async () => {
  const u = createVerifiedUser('mail_sent');
  clearOutbox();
  await form('/forgot-password.php', { email: u.email, challenge: VALID_CHALLENGE });
  const mails = readOutbox().filter(m => m.to === u.email);
  assert.equal(mails.length, 1);
  assert.match(mails[0].subject, /Obnova hesla/);
  assert.match(mails[0].body, /reset-password\.php\?token=[a-f0-9]{64}/);
});

integrationTest('valid token resets password; old password fails, new works', async () => {
  const u = createVerifiedUser('reset_ok');
  clearOutbox();
  await form('/forgot-password.php', { email: u.email, challenge: VALID_CHALLENGE });
  const token = extractResetTokenFromOutbox(u.email);
  assert.ok(token, 'reset token must be in outbox');

  const { html } = await form('/reset-password.php?token=' + token, { token, password: NEW_PASSWORD, password2: NEW_PASSWORD });
  assert.match(html, /úspěšně změněno/);

  // Old password fails.
  const { html: oldLogin } = await form('/login.php', { identifier: u.email, password: PASSWORD });
  assert.match(oldLogin, /Nesprávný/);

  // New password works.
  const { response: newLogin } = await form('/login.php', { identifier: u.email, password: NEW_PASSWORD });
  assert.equal(newLogin.status, 302);
});

integrationTest('token is single-use (replay fails)', async () => {
  const u = createVerifiedUser('single_use');
  clearOutbox();
  await form('/forgot-password.php', { email: u.email, challenge: VALID_CHALLENGE });
  const token = extractResetTokenFromOutbox(u.email);

  // First use succeeds.
  await form('/reset-password.php?token=' + token, { token, password: NEW_PASSWORD, password2: NEW_PASSWORD });

  // Replay fails.
  const { html } = await form('/reset-password.php?token=' + token, { token, password: 'AnotherPass1!', password2: 'AnotherPass1!' });
  assert.match(html, /neplatný nebo vypršel/);
});

integrationTest('expired token fails', async () => {
  const u = createVerifiedUser('expired');
  clearOutbox();
  await form('/forgot-password.php', { email: u.email, challenge: VALID_CHALLENGE });
  const token = extractResetTokenFromOutbox(u.email);

  // Expire the token in DB.
  db(`UPDATE kvazi.auth_token SET expires_at = now() - interval '1 hour'
      WHERE user_id = (SELECT id FROM kvazi.user_account WHERE username=${pg(u.username)})
        AND purpose = 'password_recovery'`);

  const { html } = await form('/reset-password.php?token=' + token, { token, password: NEW_PASSWORD, password2: NEW_PASSWORD });
  assert.match(html, /neplatný nebo vypršel/);
});

integrationTest('random invalid token fails', async () => {
  const token = randomBytes(32).toString('hex');
  const { html } = await form('/reset-password.php?token=' + token, { token, password: NEW_PASSWORD, password2: NEW_PASSWORD });
  assert.match(html, /neplatný nebo vypršel/);
});

integrationTest('DB stores only hash, not plaintext token', async () => {
  const u = createVerifiedUser('hash_db');
  clearOutbox();
  await form('/forgot-password.php', { email: u.email, challenge: VALID_CHALLENGE });
  const token = extractResetTokenFromOutbox(u.email);
  const stored = db(`SELECT token_hash FROM kvazi.auth_token
    WHERE user_id = (SELECT id FROM kvazi.user_account WHERE username=${pg(u.username)})
      AND purpose = 'password_recovery'
    ORDER BY id DESC LIMIT 1`);
  assert.notEqual(stored, token, 'plaintext token must not be stored');
  assert.equal(stored.length, 64);
  assert.match(stored, /^[a-f0-9]{64}$/);
});

// ── Throttle ────────────────────────────────────────────────────────────────

integrationTest('recovery throttle (4th request in 1 hour throttled — no mail)', async () => {
  const u = createVerifiedUser('throttle');
  // Send 3 recovery requests.
  for (let i = 0; i < 3; i++) {
    clearOutbox();
    await form('/forgot-password.php', { email: u.email, challenge: VALID_CHALLENGE });
    assert.equal(readOutbox().filter(m => m.to === u.email).length, 1, `request #${i+1} should send`);
  }
  // 4th request: throttled — no new mail.
  clearOutbox();
  await form('/forgot-password.php', { email: u.email, challenge: VALID_CHALLENGE });
  assert.equal(readOutbox().filter(m => m.to === u.email).length, 0, '4th request should be throttled');
});

// ── Password policy ─────────────────────────────────────────────────────────

integrationTest('reset rejects password shorter than 8 characters', async () => {
  const u = createVerifiedUser('short_pw');
  clearOutbox();
  await form('/forgot-password.php', { email: u.email, challenge: VALID_CHALLENGE });
  const token = extractResetTokenFromOutbox(u.email);
  const { html } = await form('/reset-password.php?token=' + token, { token, password: 'short', password2: 'short' });
  assert.match(html, /alespoň 8 znaků/);
});

integrationTest('reset rejects mismatched passwords', async () => {
  const u = createVerifiedUser('mismatch');
  clearOutbox();
  await form('/forgot-password.php', { email: u.email, challenge: VALID_CHALLENGE });
  const token = extractResetTokenFromOutbox(u.email);
  const { html } = await form('/reset-password.php?token=' + token, { token, password: NEW_PASSWORD, password2: 'Different1!' });
  assert.match(html, /neshodují/);
});

// ── Reset does not change email_verified_at ──────────────────────────────────

integrationTest('reset does not change email_verified_at for verified account', async () => {
  const u = createVerifiedUser('verified_stable');
  const before = db(`SELECT email_verified_at FROM kvazi.user_account WHERE username=${pg(u.username)}`);
  clearOutbox();
  await form('/forgot-password.php', { email: u.email, challenge: VALID_CHALLENGE });
  const token = extractResetTokenFromOutbox(u.email);
  await form('/reset-password.php?token=' + token, { token, password: NEW_PASSWORD, password2: NEW_PASSWORD });
  const after = db(`SELECT email_verified_at FROM kvazi.user_account WHERE username=${pg(u.username)}`);
  assert.equal(before, after, 'email_verified_at must not change after password reset');
});

integrationTest('reset does not verify unverified account', async () => {
  const u = createUnverifiedUser('unverified_reset');
  clearOutbox();
  await form('/forgot-password.php', { email: u.email, challenge: VALID_CHALLENGE });
  const token = extractResetTokenFromOutbox(u.email);
  if (token) {
    await form('/reset-password.php?token=' + token, { token, password: NEW_PASSWORD, password2: NEW_PASSWORD });
  }
  assert.equal(db(`SELECT email_verified_at IS NULL FROM kvazi.user_account WHERE username=${pg(u.username)}`), 't',
    'email_verified_at must remain NULL after password reset');
});

// ── CSRF ────────────────────────────────────────────────────────────────────

integrationTest('forgot-password.php CSRF protected', async () => {
  const r = await fetch(BASE + '/forgot-password.php', {
    method: 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email: 'x@example.com', challenge: VALID_CHALLENGE })
  });
  const html = await r.text();
  assert.match(html, /bezpečnostní token/);
});

integrationTest('reset-password.php CSRF protected', async () => {
  const token = randomBytes(32).toString('hex');
  const r = await fetch(BASE + '/reset-password.php?token=' + token, {
    method: 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token, password: NEW_PASSWORD, password2: NEW_PASSWORD })
  });
  const html = await r.text();
  assert.match(html, /bezpečnostní token/);
});
