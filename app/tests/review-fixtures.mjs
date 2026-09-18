// Disposable exact-service fixtures. Synthetic revisions have is_valid=false;
// they exercise review keys/history without claiming a linguistic validator verdict.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
export const BASE = (process.env.KVAZI_TEST_BASE_URL ?? process.env.KVAZI_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');
export const active = JSON.parse(readFileSync(new URL('../data/active-release.json', import.meta.url))).version;
export const pg = value => "'" + String(value).replaceAll("'", "''") + "'";
export function db(sql) {
  return execFileSync('docker', ['exec', process.env.KVAZI_DB_CONTAINER || 'kvazi_db', 'psql', '-U', 'kvazi', '-d', 'kvazi',
    '-v', 'ON_ERROR_STOP=1', '-q', '-t', '-A', '-c', sql], { encoding: 'utf8', timeout: 10000 }).trim();
}
export async function post(path, session, payload = {}) {
  const response = await fetch(BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(session ? { Cookie: session.cookie } : {}) },
    body: JSON.stringify({ ...(session ? { csrf: session.csrf } : {}), ...payload }), signal: AbortSignal.timeout(10000) });
  const raw = await response.text();
  return { status: response.status, body: raw ? JSON.parse(raw) : null };
}
const cookies = response => response.headers.getSetCookie().map(v => v.split(';')[0]).join('; ');
export async function login(username, password) {
  const get = await fetch(BASE + '/login.php');
  const csrf = (await get.text()).match(/name="csrf"\s+value="([^"]+)"/)[1];
  const response = await fetch(BASE + '/login.php', { method: 'POST', headers: { Cookie: cookies(get), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ identifier: username, password, csrf }), redirect: 'manual' });
  assert.equal(response.status, 302, 'fixture login');
  const cookie = cookies(response);
  const page = await fetch(BASE + '/konfigurator.php', { headers: { Cookie: cookie } });
  const apiCsrf = (await page.text()).match(/name="csrf"\s+content="([^"]+)"/)[1];
  return { cookie, csrf: apiCsrf };
}
export async function fixtures({deferUser = false} = {}) {
  const tag = 'mtest' + randomBytes(8).toString('hex').replace(/[0-9]/g, v => String.fromCharCode(103 + Number(v)));
  const password = 'MilestoneTest1!';
  const hash = execFileSync('php', ['-r', 'echo password_hash($argv[1], PASSWORD_BCRYPT, ["cost" => 10]);', password], { encoding: 'utf8' });
  let user = deferUser ? 0 : Number(db(`INSERT INTO kvazi.user_account(username,email,password_hash,role,email_verified_at)
    VALUES (${pg(tag)},${pg(tag + '@kvazi.int')},${pg(hash)},'USER',now()) RETURNING id`));
  const adminName = tag + 'admin';
  const admin = Number(db(`INSERT INTO kvazi.user_account(username,email,password_hash,role,email_verified_at)
    VALUES (${pg(adminName)},${pg(adminName + '@kvazi.int')},${pg(hash)},'ADMIN',now()) RETURNING id`));
  const sessions = { user: deferUser ? null : await login(tag, password), admin: await login(adminName, password), admin2: await login(adminName, password) };
  const token = { id: 't1', pos: 'noun', surface: tag + 'zi', lemma: tag + 'z', model: 'pán', lexicalStatus: 'quasi',
    identity: { gender: 'masculine', animacy: 'animate' }, form: { case: '1', number: 'plural' }, role: 'subject', relations: {} };
  function revision(tokens = [token], rules = active) {
    const sentence = Number(db(`INSERT INTO kvazi.sentence(user_id) VALUES (${user}) RETURNING id`));
    const revisionId = Number(db(`INSERT INTO kvazi.sentence_revision(sentence_id,revision_no,rules_version,submitted_by,draft_json)
      VALUES (${sentence},1,${pg(rules)},${user},CAST(${pg(JSON.stringify({ sentenceType: 'declarative', implicitSubject: false, tokens }))} AS jsonb)) RETURNING id`));
    const validationResultId = Number(db(`INSERT INTO kvazi.validation_result(sentence_id,revision_id,rules_version,validator_version,is_valid,result_json)
      SELECT ${sentence},${revisionId},version,validator_version,FALSE,'{"fixture":"M2 key isolation"}' FROM kvazi.rules_release WHERE version=${pg(rules)} RETURNING id`));
    return { revisionId, validationResultId };
  }
  function cleanup() {
    // Only this run's users, decisions, unique keys and revision references.
    db(`BEGIN; SET LOCAL session_replication_role = replica;
      DELETE FROM kvazi.validation_result_review WHERE validation_result_id IN (SELECT v.id FROM kvazi.validation_result v JOIN kvazi.sentence s ON s.id=v.sentence_id WHERE s.user_id=${user});
      DELETE FROM kvazi.administrative_decision WHERE sentence_id IN (SELECT id FROM kvazi.sentence WHERE user_id=${user});
      DELETE FROM kvazi.validation_result WHERE sentence_id IN (SELECT id FROM kvazi.sentence WHERE user_id=${user});
      DELETE FROM kvazi.sentence_revision WHERE submitted_by=${user};
      DELETE FROM kvazi.sentence WHERE user_id=${user};
      DELETE FROM kvazi.real_word_catalog WHERE admin_id=${admin} AND identity_json->>'lemma' LIKE ${pg(tag + '%')};
      DELETE FROM kvazi.morphology_review_decision WHERE admin_id=${admin};
      DELETE FROM kvazi.morphology_review_case WHERE identity_json->>'lemma' LIKE ${pg(tag + '%')};
      DELETE FROM kvazi.user_account WHERE id IN (${user},${admin}); COMMIT;`);
  }
  return { tag, get user() { return user; }, registerUser(id) {
    assert.equal(user, 0);
    assert.equal(db(`SELECT username FROM kvazi.user_account WHERE id=${Number(id)}`), tag);
    user = Number(id);
  }, admin, username: tag, adminName, password, sessions, token, revision, cleanup };
}
export const validDraft = () => ({ sentenceType: 'imperative', implicitSubject: true, tokens: [{ id: 't1', surface: 'kvazi', pos: 'verb',
  lemma: 'kvaziit', model: 'V-IT', lexicalStatus: 'quasi', identity: {}, form: { verbFormType: 'imperative', verbPerson: '2sg', aspect: 'biaspectual' },
  role: 'predicate', relations: {}, valency: { declaration: '2. sg V-IT, bez obligatorního doplnění.' }, evidence: { morphology: 'Soutěžní imperativ V-IT.' } }] });
