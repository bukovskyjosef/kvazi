/**
 * Email verification integration tests.
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

const RUN_ID = 'ev' + Date.now().toString(36);

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

function extractTokenFromOutbox(email) {
  const mails = readOutbox().filter(m => m.to === email);
  if (mails.length === 0) return null;
  const match = mails[mails.length - 1].body.match(/token=([a-f0-9]{64})/);
  return match ? match[1] : null;
}

function phpHash(password) {
  return execFileSync('php', ['-r', `echo password_hash(${JSON.stringify(password)}, PASSWORD_BCRYPT, ['cost' => 10]);`],
    { timeout: 10000 }).toString().trim();
}

// ── Fixture management ──────────────────────────────────────────────────────

const users = [];

function registerUser(suffix) {
  const username = `${RUN_ID}_${suffix}`;
  const email = `${username}@kvazi.int`;
  const password = 'VerifyTest1!';
  users.push(username);
  return { username, email, password };
}

test.after(() => {
  if (!allUp) return;
  for (const name of users) {
    try { db(`DELETE FROM kvazi.user_account WHERE username=${pg(name)}`); } catch { /* ignore */ }
  }
});

// ── Tests ───────────────────────────────────────────────────────────────────

integrationTest('registration creates unverified account (email_verified_at IS NULL)', async () => {
  const u = registerUser('unverified');
  clearOutbox();
  await form('/register.php', { username: u.username, email: u.email, password: u.password, password2: u.password });
  assert.equal(db(`SELECT email_verified_at IS NULL FROM kvazi.user_account WHERE username=${pg(u.username)}`), 't');
});

integrationTest('registration does not auto-login (no 302, stays on register page)', async () => {
  const u = registerUser('noauto');
  clearOutbox();
  const { response, html } = await form('/register.php', { username: u.username, email: u.email, password: u.password, password2: u.password });
  assert.equal(response.status, 200);
  assert.match(html, /Registrace proběhla úspěšně/);
});

integrationTest('outbox contains verification mail with token URL', async () => {
  const u = registerUser('outbox');
  clearOutbox();
  await form('/register.php', { username: u.username, email: u.email, password: u.password, password2: u.password });
  const mails = readOutbox().filter(m => m.to === u.email);
  assert.equal(mails.length, 1);
  assert.match(mails[0].subject, /Ověření e-mailu/);
  assert.match(mails[0].body, /verify-email\.php\?token=[a-f0-9]{64}/);
});

integrationTest('unverified account login rejected with specific message', async () => {
  const u = registerUser('nologin');
  clearOutbox();
  await form('/register.php', { username: u.username, email: u.email, password: u.password, password2: u.password });
  const { html } = await form('/login.php', { identifier: u.email, password: u.password });
  assert.match(html, /E-mail nebyl ověřen/);
  assert.match(html, /resend-verification/);
});

integrationTest('valid token verifies account (email_verified_at IS NOT NULL)', async () => {
  const u = registerUser('verify');
  clearOutbox();
  await form('/register.php', { username: u.username, email: u.email, password: u.password, password2: u.password });
  const token = extractTokenFromOutbox(u.email);
  assert.ok(token, 'token must be in outbox');
  const r = await fetch(`${BASE}/verify-email.php?token=${token}`, { redirect: 'manual' });
  assert.equal(r.status, 200);
  const html = await r.text();
  assert.match(html, /úspěšně ověřen/);
  assert.equal(db(`SELECT email_verified_at IS NOT NULL FROM kvazi.user_account WHERE username=${pg(u.username)}`), 't');
});

integrationTest('after verification, login works (302 redirect)', async () => {
  const u = registerUser('loginafter');
  clearOutbox();
  await form('/register.php', { username: u.username, email: u.email, password: u.password, password2: u.password });
  const token = extractTokenFromOutbox(u.email);
  await fetch(`${BASE}/verify-email.php?token=${token}`);
  const { response } = await form('/login.php', { identifier: u.email, password: u.password });
  assert.equal(response.status, 302);
});

integrationTest('token is single-use (replay fails)', async () => {
  const u = registerUser('replay');
  clearOutbox();
  await form('/register.php', { username: u.username, email: u.email, password: u.password, password2: u.password });
  const token = extractTokenFromOutbox(u.email);
  await fetch(`${BASE}/verify-email.php?token=${token}`);
  const r = await fetch(`${BASE}/verify-email.php?token=${token}`);
  const html = await r.text();
  assert.match(html, /neplatný nebo vypršel/);
});

integrationTest('expired token fails', async () => {
  const u = registerUser('expired');
  clearOutbox();
  await form('/register.php', { username: u.username, email: u.email, password: u.password, password2: u.password });
  const token = extractTokenFromOutbox(u.email);
  // Expire the token in DB
  db(`UPDATE kvazi.auth_token SET expires_at = now() - interval '1 hour'
      WHERE user_id = (SELECT id FROM kvazi.user_account WHERE username=${pg(u.username)})`);
  const r = await fetch(`${BASE}/verify-email.php?token=${token}`);
  const html = await r.text();
  assert.match(html, /neplatný nebo vypršel/);
});

integrationTest('invalid/random token fails', async () => {
  const token = randomBytes(32).toString('hex');
  const r = await fetch(`${BASE}/verify-email.php?token=${token}`);
  const html = await r.text();
  assert.match(html, /neplatný nebo vypršel/);
});

integrationTest('DB stores only hash, not plaintext token', async () => {
  const u = registerUser('hashonly');
  clearOutbox();
  await form('/register.php', { username: u.username, email: u.email, password: u.password, password2: u.password });
  const token = extractTokenFromOutbox(u.email);
  const stored = db(`SELECT token_hash FROM kvazi.auth_token
    WHERE user_id = (SELECT id FROM kvazi.user_account WHERE username=${pg(u.username)})
    ORDER BY id DESC LIMIT 1`);
  assert.notEqual(stored, token, 'plaintext token must not be stored');
  assert.equal(stored.length, 64);
  assert.match(stored, /^[a-f0-9]{64}$/);
});

integrationTest('resend works for unverified account', async () => {
  const u = registerUser('resend');
  clearOutbox();
  await form('/register.php', { username: u.username, email: u.email, password: u.password, password2: u.password });
  clearOutbox();
  const { html } = await form('/resend-verification.php', { email: u.email });
  assert.match(html, /Pokud je tento e-mail/);
  const mails = readOutbox().filter(m => m.to === u.email);
  assert.equal(mails.length, 1);
});

integrationTest('resend throttle (4th request in 1 hour throttled)', async () => {
  const u = registerUser('throttle');
  clearOutbox();
  await form('/register.php', { username: u.username, email: u.email, password: u.password, password2: u.password });
  // Registration created 1 token. Resend twice more (= 3 total within hour).
  for (let i = 0; i < 2; i++) {
    clearOutbox();
    await form('/resend-verification.php', { email: u.email });
    assert.equal(readOutbox().filter(m => m.to === u.email).length, 1, `resend #${i+2} should send`);
  }
  // 4th request: throttled — no new mail
  clearOutbox();
  await form('/resend-verification.php', { email: u.email });
  assert.equal(readOutbox().filter(m => m.to === u.email).length, 0, '4th resend should be throttled');
});

integrationTest('resend neutral response for unknown email', async () => {
  const { html } = await form('/resend-verification.php', { email: 'unknown_' + RUN_ID + '@example.com' });
  assert.match(html, /Pokud je tento e-mail/);
});

integrationTest('resend neutral response for already verified email', async () => {
  const u = registerUser('verified_resend');
  clearOutbox();
  await form('/register.php', { username: u.username, email: u.email, password: u.password, password2: u.password });
  // Verify directly in DB
  db(`UPDATE kvazi.user_account SET email_verified_at = now() WHERE username=${pg(u.username)}`);
  clearOutbox();
  const { html } = await form('/resend-verification.php', { email: u.email });
  assert.match(html, /Pokud je tento e-mail/);
  assert.equal(readOutbox().filter(m => m.to === u.email).length, 0, 'no mail for already verified');
});

integrationTest('resend CSRF protected', async () => {
  const r = await fetch(BASE + '/resend-verification.php', {
    method: 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email: 'x@example.com' })
  });
  const html = await r.text();
  assert.match(html, /bezpečnostní token/);
});

integrationTest('verify-email.php only accepts GET', async () => {
  const r = await fetch(`${BASE}/verify-email.php?token=abc`, { method: 'POST', redirect: 'manual' });
  assert.equal(r.status, 405);
});

integrationTest('concurrent resend requests cannot bypass throttle via race condition', async () => {
  const u = registerUser('race');
  clearOutbox();
  await form('/register.php', { username: u.username, email: u.email, password: u.password, password2: u.password });
  // Registration created 1 token. Send 1 more sequentially so we are at 2/3.
  clearOutbox();
  await form('/resend-verification.php', { email: u.email });
  assert.equal(readOutbox().filter(m => m.to === u.email).length, 1, 'sequential resend #2 should send');

  // Now at 2 tokens within the hour. One more is allowed, but only ONE.
  // Fire 4 concurrent resend requests — each gets its own CSRF session.
  const sessions = await Promise.all(Array.from({ length: 4 }, async () => {
    const page = await fetch(BASE + '/resend-verification.php');
    return { cookie: cookie(page), csrf: csrf(await page.text()) };
  }));

  clearOutbox();
  const results = await Promise.all(sessions.map(s =>
    fetch(BASE + '/resend-verification.php', {
      method: 'POST', redirect: 'manual',
      headers: { Cookie: s.cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrf: s.csrf, email: u.email })
    }).then(async r => ({ status: r.status, html: await r.text() }))
  ));

  // All responses must be 200 with the neutral message (anti-enumeration).
  for (const r of results) {
    assert.equal(r.status, 200);
    assert.match(r.html, /Pokud je tento e-mail/);
  }

  // The invariant: at most 1 mail should have been sent (total would be 3/3).
  // Without the FOR UPDATE lock, multiple concurrent requests could each see
  // count=2 and all insert, exceeding the limit.
  const mailsSent = readOutbox().filter(m => m.to === u.email).length;
  assert.ok(mailsSent <= 1, `expected at most 1 mail from concurrent batch, got ${mailsSent}`);

  // Total tokens in DB for this user within the hour must not exceed 3.
  const totalTokens = parseInt(db(
    `SELECT count(*) FROM kvazi.auth_token
      WHERE user_id = (SELECT id FROM kvazi.user_account WHERE username=${pg(u.username)})
        AND purpose = 'email_verification'
        AND created_at > now() - interval '1 hour'`
  ), 10);
  assert.ok(totalTokens <= 3, `expected at most 3 tokens within the hour, got ${totalTokens}`);
});
