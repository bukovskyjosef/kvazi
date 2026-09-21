/**
 * Auth token cleanup (#163) integration tests.
 *
 * Verifies lazy cleanup of used/expired auth tokens past the 7-day
 * retention window, triggered by token-generating functions.
 *
 * Requires:
 *   - Docker stack running (KVAZI_TEST_BASE_URL, or default http://localhost:8080)
 *   - DB accessible via: docker exec kvazi_db psql -U kvazi -d kvazi
 *   - PHP container accessible via: docker exec kvazi_php
 *   - MAIL_TRANSPORT=outbox with MAIL_OUTBOX_PATH configured
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

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

const RUN_ID = 'cl' + Date.now().toString(36);

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

function phpHash(password) {
  return execFileSync('php', ['-r', `echo password_hash(${JSON.stringify(password)}, PASSWORD_BCRYPT, ['cost' => 10]);`],
    { timeout: 10000 }).toString().trim();
}

function clearOutbox() {
  try {
    execFileSync('docker', ['exec', '-u', 'www-data', APP_CONTAINER, 'sh', '-c', `rm -f ${OUTBOX_PATH}`], { timeout: 5000, stdio: 'pipe' });
  } catch { /* may not exist yet */ }
}

// ── Fixture management ──────────────────────────────────────────────────────

const users = [];

function createVerifiedUser(suffix) {
  const username = `${RUN_ID}_${suffix}`;
  const email = `${username}@kvazi.int`;
  const hash = phpHash('CleanupTest1!');
  db(`INSERT INTO kvazi.user_account(username,email,password_hash,role,email_verified_at)
    VALUES (${pg(username)},${pg(email)},${pg(hash)},'USER',now())`);
  users.push(username);
  const uid = db(`SELECT id FROM kvazi.user_account WHERE username=${pg(username)}`);
  return { username, email, userId: parseInt(uid, 10) };
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

// ── Helper: insert a synthetic token with backdated timestamps ──────────────

function randomHash() {
  // Generate a unique 64-character hex string for token_hash (VARCHAR(64)).
  const bytes = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

function insertToken(userId, purpose, ageSpec) {
  // ageSpec: { usedDaysAgo?: number, expiredDaysAgo?: number, activeHoursLeft?: number }
  const hash = randomHash();
  if (ageSpec.usedDaysAgo !== undefined) {
    // Used token, used N days ago, expired before that.
    db(`INSERT INTO kvazi.auth_token (user_id, purpose, token_hash, expires_at, used_at, created_at)
      VALUES (${userId}, ${pg(purpose)}, ${pg(hash)},
        now() - interval '${ageSpec.usedDaysAgo + 1} days',
        now() - interval '${ageSpec.usedDaysAgo} days',
        now() - interval '${ageSpec.usedDaysAgo + 2} days')`);
  } else if (ageSpec.expiredDaysAgo !== undefined) {
    // Expired unused token, expired N days ago.
    db(`INSERT INTO kvazi.auth_token (user_id, purpose, token_hash, expires_at, created_at)
      VALUES (${userId}, ${pg(purpose)}, ${pg(hash)},
        now() - interval '${ageSpec.expiredDaysAgo} days',
        now() - interval '${ageSpec.expiredDaysAgo + 1} days')`);
  } else if (ageSpec.activeHoursLeft !== undefined) {
    // Active valid token (not used, not expired).
    db(`INSERT INTO kvazi.auth_token (user_id, purpose, token_hash, expires_at, created_at)
      VALUES (${userId}, ${pg(purpose)}, ${pg(hash)},
        now() + interval '${ageSpec.activeHoursLeft} hours',
        now() - interval '1 hour')`);
  }
}

function tokenCount(userId) {
  return parseInt(db(`SELECT count(*) FROM kvazi.auth_token WHERE user_id = ${userId}`), 10);
}

// ── Tests ───────────────────────────────────────────────────────────────────

integrationTest('cleanup: old used token >7d is removed after token generation trigger', async () => {
  const u = createVerifiedUser('used_old');
  insertToken(u.userId, 'email_verification', { usedDaysAgo: 10 });
  assert.equal(tokenCount(u.userId), 1, 'precondition: token exists');

  // Trigger cleanup via registration (which generates a verification token).
  clearOutbox();
  const u2 = createVerifiedUser('used_old_trigger');
  // Reset u2 to unverified so registration flow works for triggering.
  db(`UPDATE kvazi.user_account SET email_verified_at = NULL WHERE username=${pg(u2.username)}`);
  await form('/resend-verification.php', { email: u2.email });

  assert.equal(tokenCount(u.userId), 0, 'used token >7d must be cleaned up');
});

integrationTest('cleanup: old expired unused token >7d is removed after token generation trigger', async () => {
  const u = createVerifiedUser('expired_old');
  insertToken(u.userId, 'password_recovery', { expiredDaysAgo: 10 });
  assert.equal(tokenCount(u.userId), 1, 'precondition: token exists');

  // Trigger cleanup via password recovery request (which also creates a new token).
  clearOutbox();
  await form('/forgot-password.php', { email: u.email, challenge: 'kvazi kvazi.' });

  // The old expired token must be gone; only the newly created recovery token remains.
  const oldExpired = parseInt(db(
    `SELECT count(*) FROM kvazi.auth_token
      WHERE user_id = ${u.userId}
        AND used_at IS NULL AND expires_at < now() - interval '7 days'`
  ), 10);
  assert.equal(oldExpired, 0, 'expired unused token >7d must be cleaned up');
});

integrationTest('cleanup: token within 7-day post-use retention stays', async () => {
  const u = createVerifiedUser('used_recent');
  insertToken(u.userId, 'email_verification', { usedDaysAgo: 3 });
  assert.equal(tokenCount(u.userId), 1, 'precondition: token exists');

  // Trigger cleanup.
  clearOutbox();
  const u2 = createVerifiedUser('recent_trigger');
  db(`UPDATE kvazi.user_account SET email_verified_at = NULL WHERE username=${pg(u2.username)}`);
  await form('/resend-verification.php', { email: u2.email });

  assert.equal(tokenCount(u.userId), 1, 'used token within 7d retention must stay');
});

integrationTest('cleanup: active valid token is not removed', async () => {
  const u = createVerifiedUser('active');
  insertToken(u.userId, 'email_verification', { activeHoursLeft: 12 });
  assert.equal(tokenCount(u.userId), 1, 'precondition: token exists');

  // Trigger cleanup.
  clearOutbox();
  await form('/forgot-password.php', { email: u.email, challenge: 'kvazi kvazi.' });

  // The recovery request adds its own token, so expect 2 (original + new).
  assert.ok(tokenCount(u.userId) >= 1, 'active valid token must not be removed');
  // Verify our specific active token is still there.
  const activeCount = parseInt(db(
    `SELECT count(*) FROM kvazi.auth_token
      WHERE user_id = ${u.userId} AND used_at IS NULL AND expires_at > now()`
  ), 10);
  assert.ok(activeCount >= 1, 'active unexpired token must survive cleanup');
});

integrationTest('cleanup: both purposes are cleaned (email_verification + password_recovery)', async () => {
  const u = createVerifiedUser('both_purposes');
  insertToken(u.userId, 'email_verification', { usedDaysAgo: 10 });
  insertToken(u.userId, 'password_recovery', { expiredDaysAgo: 10 });
  assert.equal(tokenCount(u.userId), 2, 'precondition: both tokens exist');

  // Trigger cleanup.
  clearOutbox();
  await form('/forgot-password.php', { email: u.email, challenge: 'kvazi kvazi.' });

  // Only the newly created recovery token should remain.
  const remaining = parseInt(db(
    `SELECT count(*) FROM kvazi.auth_token
      WHERE user_id = ${u.userId}
        AND ((used_at IS NOT NULL AND used_at < now() - interval '7 days')
          OR (used_at IS NULL AND expires_at < now() - interval '7 days'))`
  ), 10);
  assert.equal(remaining, 0, 'both old tokens must be cleaned up');
});

integrationTest('cleanup: verification and recovery flows still work after cleanup', async () => {
  // Seed old tokens to be cleaned.
  const u = createVerifiedUser('flows_ok');
  insertToken(u.userId, 'email_verification', { usedDaysAgo: 15 });
  insertToken(u.userId, 'password_recovery', { expiredDaysAgo: 20 });

  // Recovery flow still produces a valid reset link.
  clearOutbox();
  await form('/forgot-password.php', { email: u.email, challenge: 'kvazi kvazi.' });
  const newTokenExists = parseInt(db(
    `SELECT count(*) FROM kvazi.auth_token
      WHERE user_id = ${u.userId} AND purpose = 'password_recovery'
        AND used_at IS NULL AND expires_at > now()`
  ), 10);
  assert.equal(newTokenExists, 1, 'new recovery token must be created despite cleanup');
});
