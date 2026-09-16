import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { BASE, active, db, pg, post, fixtures, validDraft } from './review-fixtures.mjs';

const f = await fixtures();
after(() => f.cleanup());
const MORPH = '/api/admin/morphology-review.php';
const STATUS = '/api/admin/review-status.php';
const MANAGE = '/api/admin/real-word-catalog.php';
const CATALOG = '/api/real-word-catalog.php';
const a = f.revision();
const input = (ids = a, extra = {}) => ({ ...ids, tokenId: 't1', ...extra });
const lookup = (ids = a) => post(MORPH, f.sessions.admin, input(ids));
const decide = (ids, no, verdict, reason = '') => post(MORPH, f.sessions.admin, input(ids, { expectedDecisionNo: no, verdict, reason }));
const catalog = token => post(CATALOG, f.sessions.user, { token });
const manage = (ids, isApproved, extra = {}) => post(MANAGE, f.sessions.admin, input(ids, { isApproved, ...extra }));
const count = table => Number(db(`SELECT count(*) FROM kvazi.${table}`));
let approvedId;
let concurrentRevision;

test('review: absent exact case is UNKNOWN; approval precondition is unresolved', async () => {
  assert.equal((await lookup()).body.status, 'UNKNOWN');
  const s = await post(STATUS, f.sessions.admin, a);
  assert.equal(s.status, 200); assert.equal(s.body.hasUnknown, true); assert.equal(s.body.allApproved, false);
});
test('review: ADMIN APPROVED appends decision 1 and binds its stable ID', async () => {
  const r = await decide(a, 0, 'APPROVED');
  assert.equal(r.status, 200); assert.equal(r.body.status, 'APPROVED'); assert.equal(r.body.decisionNo, 1);
  approvedId = r.body.usedDecisionId;
  assert.equal(approvedId, Number(r.body.decision.id));
  assert.equal(Number(db(`SELECT review_decision_id FROM kvazi.validation_result_review WHERE validation_result_id=${a.validationResultId}`)), approvedId);
  const s = (await post(STATUS, f.sessions.admin, a)).body;
  assert.equal(s.hasUnknown, false); assert.equal(s.hasRejected, false); assert.equal(s.allApproved, true);
});
test('review: another exact revision reuses APPROVED; JSON ordering and metadata irrelevant', async () => {
  const token = { ...f.token, id: 't1', lexicalStatus: 'real', evidence: { morphology: 'different' },
    identity: { animacy: 'animate', irrelevant: 999, gender: 'masculine' }, form: { number: 'plural', case: '1' } };
  const b = f.revision([token]);
  const r = await lookup(b);
  assert.equal(r.body.status, 'APPROVED'); assert.equal(r.body.usedDecisionId, approvedId);
});
for (const [name, change, rules] of [
  ['identity', { model: 'muž' }, active], ['form', { form: { ...f.token.form, case: '5' } }, active],
  ['surface', { surface: f.token.surface + 'z' }, active], ['rules version', {}, 'public-1.1'],
]) test(`review exactness: changed ${name} is UNKNOWN`, async () => {
  const b = f.revision([{ ...f.token, ...change }], rules);
  const r = await lookup(b); assert.equal(r.status, 200); assert.equal(r.body.status, 'UNKNOWN');
});
test('review: correction appends REJECTED 2, keeps old binding; new revision uses correction', async () => {
  const original = db(`SELECT result_json FROM kvazi.validation_result WHERE id=${a.validationResultId}`);
  const r = await decide(a, 1, 'REJECTED', 'Oprava morfologického posouzení.');
  assert.equal(r.status, 200); assert.equal(r.body.decisionNo, 2); assert.equal(r.body.status, 'REJECTED');
  assert.equal(r.body.usedDecisionId, approvedId); assert.equal(r.body.usedStatus, 'APPROVED');
  assert.equal((await lookup()).body.decisionNo, 2);
  const b = f.revision(); const next = await lookup(b);
  assert.equal(next.body.usedStatus, 'REJECTED'); assert.notEqual(next.body.usedDecisionId, approvedId);
  const s = (await post(STATUS, f.sessions.admin, b)).body;
  assert.equal(s.hasRejected, true); assert.equal(s.allApproved, false);
  assert.equal(Number(db(`SELECT count(*) FROM kvazi.morphology_review_decision WHERE case_id=${r.body.caseId}`)), 2);
  assert.equal(db(`SELECT verdict FROM kvazi.morphology_review_decision WHERE id=${approvedId}`), 'APPROVED');
  assert.equal(db(`SELECT result_json FROM kvazi.validation_result WHERE id=${a.validationResultId}`), original);
});
test('review: REJECTED without non-whitespace reason and invalid verdict are refused', async () => {
  for (const extra of [{ expectedDecisionNo: 2, verdict: 'REJECTED', reason: ' \n\t' },
    { expectedDecisionNo: 2, verdict: 'REJECTED', reason: '\u00a0\u2003' },
    { expectedDecisionNo: 2, verdict: 'UNKNOWN' }, { verdict: 'APPROVED' }, { expectedDecisionNo: '2', verdict: 'APPROVED' }]) {
    assert.equal((await post(MORPH, f.sessions.admin, input(a, extra))).status, 422);
  }
});
test('review: stale correction returns 409 without appending a decision', async () => {
  const before = count('morphology_review_decision');
  assert.equal((await decide(a, 1, 'APPROVED')).status, 409);
  assert.equal(count('morphology_review_decision'), before);
});
test('review: missing revision/result/token and mismatched result are refused', async () => {
  const b = f.revision();
  for (const ids of [{ ...a, revisionId: 999999999 }, { ...a, validationResultId: 999999999 },
    { ...a, validationResultId: b.validationResultId }]) assert.equal((await lookup(ids)).status, 404);
  assert.equal((await post(MORPH, f.sessions.admin, input(a, { tokenId: 'not-in-revision' }))).status, 404);
});
test('admin mutations cannot accept client exact keys or a client role', async () => {
  const before = count('morphology_review_decision');
  for (const path of [MORPH, MANAGE]) {
    assert.equal((await post(path, f.sessions.admin, input(a, { identity: {}, surface: 'injected', role: 'ADMIN' }))).status, 422);
  }
  assert.equal(count('morphology_review_decision'), before);
});
test('review concurrency: two sessions racing decision 1 produce 200/409 and one consistent decision', async () => {
  const b = f.revision([{ ...f.token, lemma: f.tag + 'racez' }]);
  concurrentRevision = b;
  const payload = input(b, { expectedDecisionNo: 0, verdict: 'APPROVED' });
  const results = await Promise.all([post(MORPH, f.sessions.admin, payload), post(MORPH, f.sessions.admin2, payload)]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
  const r = await lookup(b); assert.equal(r.body.decisionNo, 1);
  assert.equal(Number(db(`SELECT count(*) FROM kvazi.morphology_review_decision WHERE case_id=${r.body.caseId}`)), 1);
});
test('review concurrency: two corrections append only decision 2 and reject the stale request', async () => {
  const before = (await lookup(concurrentRevision)).body;
  const payload = input(concurrentRevision, { expectedDecisionNo: 1, verdict: 'REJECTED', reason: 'Souběžná oprava.' });
  const results = await Promise.all([post(MORPH, f.sessions.admin, payload), post(MORPH, f.sessions.admin2, payload)]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
  const current = (await lookup(concurrentRevision)).body;
  assert.equal(current.decisionNo, 2); assert.equal(current.usedDecisionId, before.usedDecisionId);
  assert.equal(db(`SELECT string_agg(decision_no::text, ',' ORDER BY decision_no) FROM kvazi.morphology_review_decision WHERE case_id=${current.caseId}`), '1,2');
});
for (const path of [MORPH, STATUS, MANAGE]) test(`ADMIN-only and CSRF: ${path}`, async () => {
  assert.equal((await post(path, null, input())).status, 401);
  assert.equal((await post(path, f.sessions.user, input())).status, 403);
  assert.equal((await post(path, f.sessions.admin, input(a, { csrf: 'wrong' }))).status, 403);
  assert.equal((await fetch(BASE + path)).status, 405);
});
test('catalog: authenticated complete exact request; not found is only binary false', async () => {
  assert.equal((await post(CATALOG, null, { token: f.token })).status, 401);
  const r = await catalog(f.token);
  assert.equal(r.status, 200); assert.deepEqual(r.body, { ok: true, exactMatch: false });
});
test('catalog: CSRF, method and input format remain server-controlled', async () => {
  assert.equal((await post(CATALOG, f.sessions.user, { token: f.token, csrf: 'wrong' })).status, 403);
  assert.equal((await fetch(BASE + CATALOG)).status, 405);
  const r = await fetch(BASE + CATALOG, { method: 'POST', headers: { Cookie: f.sessions.user.cookie, 'Content-Type': 'application/json' }, body: '{broken' });
  assert.equal(r.status, 400); assert.deepEqual(Object.keys(await r.json()).sort(), ['error', 'ok']);
});
test('catalog: ADMIN confirms exact identity/form/surface; metadata is not exposed', async () => {
  assert.equal((await manage(a, true, { reason: 'Lexikální potvrzení.', source: 'Interní zdroj.' })).status, 200);
  const r = await catalog(f.token); assert.deepEqual(r.body, { ok: true, exactMatch: true });
  assert.equal(db(`SELECT source FROM kvazi.real_word_catalog WHERE identity_json->>'lemma'=${pg(f.token.lemma)}`), 'Interní zdroj.');
  assert.equal(Number(db(`SELECT admin_id FROM kvazi.real_word_catalog WHERE identity_json->>'lemma'=${pg(f.token.lemma)}`)), f.admin);
});
for (const [name, change] of [['identity', { model: 'muž' }], ['form', { form: { ...f.token.form, case: '5' } }],
  ['surface', { surface: f.token.surface + 'z' }]]) test(`catalog exactness: ${name} mismatch returns only false`, async () => {
  const r = await catalog({ ...f.token, ...change }); assert.equal(r.status, 200); assert.deepEqual(r.body, { ok: true, exactMatch: false });
});
test('catalog: uppercase/NFD, JSON order and client metadata preserve exact identity', async () => {
  const r = await catalog({ ...f.token, surface: f.token.surface.toUpperCase(), lemma: f.token.lemma.toUpperCase(),
    identity: { animacy: 'animate', gender: 'masculine', ignored: true }, form: { number: 'plural', case: '1' }, score: 999 });
  assert.deepEqual(r.body, { ok: true, exactMatch: true });
});
test('catalog: partial requests return 422 without candidates, counts or suggestions', async () => {
  for (const token of [{ surface: f.token.surface }, { ...f.token, lemma: '' }, { ...f.token, form: {} }]) {
    const r = await catalog(token); assert.equal(r.status, 422); assert.deepEqual(Object.keys(r.body).sort(), ['error', 'ok']);
  }
});
test('catalog: unapproved behaves exactly like absence; catalog and review histories are separate', async () => {
  const before = count('morphology_review_decision');
  assert.equal((await manage(a, false)).status, 200);
  assert.deepEqual((await catalog(f.token)).body, { ok: true, exactMatch: false });
  assert.deepEqual((await catalog({ ...f.token, surface: f.token.surface + 'zz' })).body, { ok: true, exactMatch: false });
  assert.equal(count('morphology_review_decision'), before);
  assert.equal((await lookup()).body.status, 'REJECTED');
});
test('catalog: not found never blocks an otherwise valid authoritative submit', async () => {
  const draft = validDraft();
  assert.deepEqual((await catalog(draft.tokens[0])).body, { ok: true, exactMatch: false });
  const r = await post('/api/submit.php', f.sessions.user, { draft });
  assert.equal(r.status, 200); assert.equal(r.body.ok, true);
  assert.equal(db(`SELECT is_valid FROM kvazi.validation_result WHERE revision_id=${r.body.revisionId}`), 't');
});
test('catalog: normative functional and auxiliary exceptions never create duplicate entries', async () => {
  for (const token of [{ id: 't1', pos: 'preposition', surface: 'k', lemma: 'k' },
    { id: 't1', pos: 'verb', role: 'auxiliary', surface: 'jsme', lemma: 'být' }]) {
    const ids = f.revision([token]);
    assert.equal((await catalog(token)).status, 422);
    assert.equal((await manage(ids, true)).status, 422);
  }
});
test('catalog: pronoun complete four-field signature, explicit notApplicable and exact field changes', async () => {
  const token = { id: 't1', pos: 'pronoun', surface: 'já', lemma: f.tag + 'pronounz', lexicalStatus: 'real',
    form: { pronoun: { case: '1', number: 'singular', gender: 'notApplicable', person: '1' } } };
  const ids = f.revision([token]);
  assert.equal((await manage(ids, true)).status, 200);
  assert.deepEqual((await catalog(token)).body, { ok: true, exactMatch: true });
  assert.deepEqual((await catalog({ ...token, form: { pronoun: { ...token.form.pronoun, gender: 'feminine' } } })).body, { ok: true, exactMatch: false });
  for (const field of ['case', 'number', 'gender', 'person']) {
    const partial = structuredClone(token); delete partial.form.pronoun[field]; assert.equal((await catalog(partial)).status, 422);
  }
});
test('catalog lifecycle is independent of rules version', async () => {
  const b = f.revision([f.token], 'public-1.1');
  assert.equal((await manage(b, true)).status, 200);
  assert.deepEqual((await catalog(f.token)).body, { ok: true, exactMatch: true });
});
test('revision precondition covers mixed required cases and skips normative exceptions', async () => {
  const second = { ...f.token, id: 't2', lemma: f.tag + 'mixedz' };
  const ids = f.revision([f.token, second, { id: 't3', pos: 'preposition', surface: 'k', lemma: 'k' }]);
  let s = (await post(STATUS, f.sessions.admin, ids)).body;
  assert.equal(s.hasUnknown, true); assert.equal(s.hasRejected, true); assert.equal(s.allApproved, false);
  assert.deepEqual(Object.keys(s.tokens), ['t1', 't2']);
  const r = await post(MORPH, f.sessions.admin, input(ids, { tokenId: 't2', expectedDecisionNo: 0, verdict: 'APPROVED' }));
  assert.equal(r.status, 200);
  s = (await post(STATUS, f.sessions.admin, ids)).body;
  assert.equal(s.hasUnknown, false); assert.equal(s.hasRejected, true); assert.equal(s.allApproved, false);
});
test('revision precondition requires every case APPROVED and locks shared cases before result', async () => {
  const first = { ...f.token, lemma: f.tag + 'allfirstz' };
  const second = { ...f.token, id: '1', lemma: f.tag + 'allsecondz' };
  const ids = f.revision([first, second]);
  for (const token of [first, second]) assert.equal((await post(MORPH, f.sessions.admin,
    input(ids, { tokenId: token.id, expectedDecisionNo: 0, verdict: 'APPROVED' }))).status, 200);
  const reversed = f.revision([second, first]);
  const responses = await Promise.all([post(STATUS, f.sessions.admin, reversed),
    post(MORPH, f.sessions.admin2, input(reversed, { tokenId: 't1', expectedDecisionNo: 1, verdict: 'REJECTED', reason: 'Correction while reviewing multiple cases.' }))]);
  assert.deepEqual(responses.map(r => r.status), [200, 200]);
  const old = (await post(STATUS, f.sessions.admin, ids)).body;
  assert.equal(old.hasUnknown, false); assert.equal(old.hasRejected, false); assert.equal(old.allApproved, true);
});
