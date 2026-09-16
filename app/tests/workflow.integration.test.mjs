import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {workflowFixtures, db, pg, post, validDraft, idsForApi} from './workflow-fixtures.mjs';
let f;
before(async () => {f = await workflowFixtures();});
after(() => f?.cleanup());
const adminDetail = ids => `/admin/veta.php?revisionId=${ids.revisionId}`;
const ownerDetail = ids => `/moje-veta.php?revisionId=${ids.revisionId}`;
const publicDetail = ids => `/veta.php?revisionId=${ids.revisionId}`;
const assertStatus = async (promise, status) => assert.equal((await promise).status, status);
function token(suffix, overrides = {}) {
  return {...structuredClone(f.token), lemma:f.tag + suffix + 'z', surface:f.tag + suffix + 'zi', ...overrides};
}
function facts(ids) {
  return db(`SELECT md5(row_to_json(r)::text || row_to_json(v)::text) FROM kvazi.sentence_revision r JOIN kvazi.validation_result v ON v.revision_id=r.id WHERE r.id=${ids.revisionId}`);
}
async function resolve(ids, approved = false, tokenId = 't1') {
  await assertStatus(f.morph(ids, 'APPROVED', tokenId), 200);
  await assertStatus(f.catalog(ids, approved, tokenId), 200);
}

test('anonymous and USER denied all admin pages and mutation; ADMIN allowed', async () => {
  const ids = f.revision();
  for (const path of ['/admin/vety.php', adminDetail(ids)]) {
    await assertStatus(f.get(path), 302); await assertStatus(f.get(path, f.sessions.user), 403);
    await assertStatus(f.get(path, f.sessions.admin), 200);
  }
  await assertStatus(f.decide(ids,'return','reason',null), 401);
  await assertStatus(f.decide(ids,'return','reason',f.sessions.user), 403);
  await assertStatus(post('/api/admin/sentence-decision.php', f.sessions.admin, {...idsForApi(ids),action:'return',reason:'reason',csrf:'invalid'}),403);
  const get = await f.get('/api/admin/sentence-decision.php', f.sessions.admin); assert.equal(get.status,405);
});

test('GET queue/detail are read-only, show UNKNOWN/ABSENT and exact authoritative scores', async () => {
  const ids = f.revision([token('peek')]);
  const count = () => db('SELECT (SELECT count(*) FROM kvazi.morphology_review_case), (SELECT count(*) FROM kvazi.morphology_review_decision), (SELECT count(*) FROM kvazi.validation_result_review), (SELECT count(*) FROM kvazi.administrative_decision), (SELECT count(*) FROM kvazi.real_word_catalog)');
  const before = count(), snapshot = facts(ids);
  const queue = await f.get('/admin/vety.php',f.sessions.admin);
  assert.equal(queue.status,200); assert.match(queue.html,new RegExp(`href="/admin/veta.php\\?revisionId=${ids.revisionId}"`));
  const detail = await f.get(adminDetail(ids),f.sessions.admin);
  assert.equal(detail.status,200); assert.match(detail.html,/UNKNOWN/); assert.match(detail.html,/ABSENT/);
  assert.match(detail.html,/data-field="word_score">7</); assert.match(detail.html,/data-field="char_score">23</);
  assert.match(detail.html,/Server autoritativně vyhodnotil/); assert.match(detail.html,/Hráč deklaroval/);
  assert.equal(count(),before); assert.equal(facts(ids),snapshot);
});

test('admin detail remains exact immutable rev1 after return and rev2; safe player and reason escaping', async () => {
  const draft = validDraft(); draft.tokens[0].evidence.morphology = '<script>private-player-evidence</script>';
  const first = await f.submit(draft), snapshot = facts(first);
  await assertStatus(f.decide(first,'return','<img src=x onerror=alert(1)>\nPřepracujte'),200);
  const owner = await f.get(ownerDetail(first), f.sessions.user);
  assert.match(owner.html,/&lt;img src=x onerror=alert\(1\)&gt;/); assert.match(owner.html,/Upravit a znovu odeslat/);
  const preload = await f.get(`/konfigurator.php?sentenceId=${first.sentenceId}`,f.sessions.user);
  assert.equal(preload.status,200);
  const loaded = JSON.parse(preload.html.match(/window\.__resubmit = (.*);<\/script>/)[1]);
  assert.deepEqual(loaded.draft, JSON.parse(db(`SELECT draft_json FROM kvazi.sentence_revision WHERE id=${first.revisionId}`)));
  const second = await f.submit(draft, first.sentenceId);
  const detail = await f.get(adminDetail(first),f.sessions.admin);
  assert.match(detail.html,new RegExp(`data-field="revision_id">${first.revisionId}</`));
  assert.match(detail.html,/&lt;script&gt;private-player-evidence&lt;\/script&gt;/);
  assert.doesNotMatch(detail.html,/<script>private-player-evidence/);
  assert.equal(facts(first),snapshot);
  const queue = await f.get('/admin/vety.php',f.sessions.admin);
  assert.doesNotMatch(queue.html,new RegExp(`data-revision-id="${first.revisionId}"`));
  assert.match(queue.html,new RegExp(`data-revision-id="${second.revisionId}"`));
  assert.doesNotMatch((await f.get(ownerDetail(first),f.sessions.user)).html,/Upravit a znovu odeslat/);
  await assertStatus(f.get(`/konfigurator.php?sentenceId=${first.sentenceId}`,f.sessions.user),409);
});

for (const action of ['return','reject']) {
  test(`${action} requires non-whitespace reason, preserves revision/result, leaves queue and renders owner reason`, async () => {
    const ids = f.revision([token(action)]), snapshot = facts(ids);
    for (const reason of ['', ' \t\n', '\u00a0']) await assertStatus(f.decide(ids,action,reason),422);
    await assertStatus(f.decide(ids,action,'<b>Celý důvod</b>\nDruhý řádek'),200);
    assert.equal(facts(ids),snapshot);
    const owner = await f.get(ownerDetail(ids),f.sessions.user);
    assert.equal(owner.status,200); assert.match(owner.html,/&lt;b&gt;Celý důvod&lt;\/b&gt;/);
    assert.equal(owner.html.includes('Upravit a znovu odeslat'),action === 'return');
    const queue = await f.get('/admin/vety.php',f.sessions.admin);
    assert.doesNotMatch(queue.html,new RegExp(`data-revision-id="${ids.revisionId}"`));
    await assertStatus(f.get(publicDetail(ids)),404);
    await assertStatus(f.decide(ids,'reject','second'),409);
    if (action === 'reject') {
      await assertStatus(f.get(`/konfigurator.php?sentenceId=${ids.sentenceId}`,f.sessions.user),409);
      await assertStatus(post('/api/submit.php',f.sessions.user,{draft:validDraft(),sentenceId:ids.sentenceId}),409);
    }
  });
}

test('owner ownership is enforced for USER and ADMIN without bypass; pending read-only', async () => {
  const ids = f.revision([token('owner')]);
  await assertStatus(f.get(ownerDetail(ids)),302);
  await assertStatus(f.get(ownerDetail(ids),f.sessions.foreign),404);
  await assertStatus(f.get(ownerDetail(ids),f.sessions.admin),404);
  await assertStatus(f.get(`/konfigurator.php?sentenceId=${ids.sentenceId}`,f.sessions.foreign),404);
  await assertStatus(post('/api/submit.php',f.sessions.foreign,{draft:validDraft(),sentenceId:ids.sentenceId}),403);
  const own = await f.get(ownerDetail(ids),f.sessions.user); assert.equal(own.status,200);
  assert.doesNotMatch(own.html,/Upravit a znovu odeslat|morphology_review|usedDecisionId|ABSENT/);
  await assertStatus(f.get(`/konfigurator.php?sentenceId=${ids.sentenceId}`,f.sessions.user),409);
  await assertStatus(post('/api/submit.php',f.sessions.user,{draft:validDraft(),sentenceId:ids.sentenceId}),409);
});

test('approval blocked by deterministic invalid, morphology UNKNOWN and REJECTED', async () => {
  const invalid = f.revision([token('invalid')]);
  await resolve(invalid); await assertStatus(f.decide(invalid,'approve'),422);
  const unknown = f.revision([token('unknown')],{valid:true});
  await assertStatus(f.catalog(unknown,false),200); await assertStatus(f.decide(unknown,'approve'),422);
  const rejected = f.revision([token('rejected')],{valid:true});
  await assertStatus(f.morph(rejected,'REJECTED','t1',{reason:'Neplatná morfologie.'}),200);
  await assertStatus(f.catalog(rejected,false),200); await assertStatus(f.decide(rejected,'approve'),422);
});

for (const [status, approved, pass] of [['real',true,true],['real',false,false],['quasi',false,true],['quasi',true,false]]) {
  test(`lexical ${status} + explicit ${approved} -> approval ${pass}`, async () => {
    const ids = f.revision([token(status + String(approved),{lexicalStatus:status})],{valid:true});
    const snapshot = facts(ids);
    await resolve(ids,approved); await assertStatus(f.decide(ids,'approve'),pass ? 200 : 422);
    assert.equal(facts(ids),snapshot);
    const detail = await f.get(adminDetail(ids),f.sessions.admin); assert.match(detail.html,new RegExp(`is_approved=${approved}`));
    await assertStatus(f.get(publicDetail(ids)),pass ? 200 : 404);
    if (pass) {
      assert.doesNotMatch((await f.get('/admin/vety.php',f.sessions.admin)).html,new RegExp(`data-revision-id="${ids.revisionId}"`));
      const own = await f.get(ownerDetail(ids),f.sessions.user); assert.match(own.html,/approved/);
      assert.doesNotMatch(own.html,/Upravit a znovu odeslat/);
      await assertStatus(f.get(`/konfigurator.php?sentenceId=${ids.sentenceId}`,f.sessions.user),409);
      await assertStatus(post('/api/submit.php',f.sessions.user,{draft:validDraft(),sentenceId:ids.sentenceId}),409);
    }
  });
}
for (const status of ['real','quasi']) test(`lexical ${status} + ABSENT blocks approval; failed approval does not bind reviews`, async () => {
  const t = token(status + 'absent',{lexicalStatus:status});
  const prior = f.revision([t]); await assertStatus(f.morph(prior),200);
  const ids = f.revision([t],{valid:true});
  const bindings = () => db(`SELECT count(*) FROM kvazi.validation_result_review WHERE validation_result_id=${ids.validationResultId}`);
  assert.equal(bindings(),'0'); await assertStatus(f.decide(ids,'approve'),422); assert.equal(bindings(),'0');
});

test('pronoun true required and prefix derivative requires approved unprefixed real base', async () => {
  const pronoun = token('pronoun',{pos:'pronoun',model:'',lexicalStatus:'real',form:{pronoun:{case:'4',number:'notApplicable',gender:'notApplicable',person:'notApplicable'}}});
  const ids = f.revision([pronoun],{valid:true});
  await resolve(ids,false); await assertStatus(f.decide(ids,'approve'),422);
  await assertStatus(f.catalog(ids,true),200); await assertStatus(f.decide(ids,'approve'),200);
  const noun = token('base',{surface:'kvazi' + f.tag + 'basezi',lemma:'kvazi' + f.tag + 'basez', lexicalStatus:'quasi'});
  const prefix = f.revision([noun],{valid:true});
  await resolve(prefix,false); await assertStatus(f.decide(prefix,'approve'),422);
  await assertStatus(f.catalog(prefix,true),200); await assertStatus(f.decide(prefix,'approve'),200);
});

test('functional tokens and auxiliary být require neither catalogue nor morphology entries', async () => {
  const functional = {id:'t1',surface:'k',lemma:'k',pos:'preposition',lexicalStatus:'real'};
  const auxiliary = {id:'t2',surface:'by',lemma:'být',pos:'verb',lexicalStatus:'real',role:'auxiliary'};
  const ids = f.revision([functional,auxiliary],{valid:true});
  await assertStatus(f.decide(ids,'approve'),200);
});

test('concurrent decisions serialize to one success and one 409', async () => {
  const ids = f.revision([token('race')]);
  const responses = await Promise.all([f.decide(ids,'return','first',f.sessions.admin),f.decide(ids,'reject','second',f.sessions.admin2)]);
  assert.deepEqual(responses.map(r => r.status).sort(),[200,409]);
  assert.equal(db(`SELECT count(*) FROM kvazi.administrative_decision WHERE revision_id=${ids.revisionId}`),'1');
});

test('wrong validation context, unsupported actions and client authority are denied', async () => {
  const a = f.revision([token('contexta')]), b = f.revision([token('contextb')]);
  await assertStatus(post('/api/admin/sentence-decision.php',f.sessions.admin,{revisionId:a.revisionId,validationResultId:b.validationResultId,action:'return',reason:'wrong'}),404);
  await assertStatus(f.decide(a,'archive','reason'),422);
  await assertStatus(post('/api/admin/sentence-decision.php',f.sessions.admin,{...idsForApi(a),action:'return',reason:'x',isValid:true}),422);
  await assertStatus(post('/api/admin/sentence-decision.php',f.sessions.admin,{revisionId:2147483647,validationResultId:b.validationResultId,action:'return',reason:'missing'}),404);
});

test('ambiguous results fail closed instead of selecting MAX(id)', async () => {
  const ids = f.revision([token('ambiguous')]);
  db(`INSERT INTO kvazi.validation_result(sentence_id,revision_id,rules_version,validator_version)
    VALUES (${ids.sentenceId},${ids.revisionId},'public-1.2','1.2.0')`);
  await assertStatus(f.get(adminDetail(ids),f.sessions.admin),409);
  await assertStatus(f.decide(ids,'return','reason'),409);
  // Resolve only this deliberately ambiguous test fixture so other queue tests continue.
  db(`BEGIN; SET LOCAL session_replication_role=replica; DELETE FROM kvazi.validation_result WHERE revision_id=${ids.revisionId} AND rules_version='public-1.2'; COMMIT;`);
});

for (const rules of ['public-1.1','public-1.2']) test(`historical ${rules}: missing pronoun signature is safe and blocks approve, return/reject work`, async () => {
  const ids = f.revision([token(rules.replace(/[.0-9-]/g,''),{pos:'pronoun',model:'',lexicalStatus:'real',form:{}})],{valid:true,rules});
  const detail = await f.get(adminDetail(ids),f.sessions.admin);
  assert.equal(detail.status,200); assert.match(detail.html,/Historická deklarace neobsahuje dnešní úplnou zájmennou form-signature/);
  assert.match(detail.html,new RegExp(`data-field="rules_version">${rules}</`));
  await assertStatus(f.decide(ids,'approve'),422);
  await assertStatus(f.decide(ids,rules === 'public-1.1' ? 'return' : 'reject','Historical incomplete declaration.'),200);
});

test('historical complete review uses recorded release and stable approved binding after later correction', async () => {
  const t = token('stable');
  const ids = f.revision([t],{valid:true,rules:'public-1.2'});
  await resolve(ids);
  const used = db(`SELECT review_decision_id FROM kvazi.validation_result_review WHERE validation_result_id=${ids.validationResultId}`);
  await assertStatus(f.morph(ids,'REJECTED','t1',{expectedDecisionNo:1,reason:'Correction for future reviews'}),200);
  const detail = await f.get(adminDetail(ids),f.sessions.admin); assert.match(detail.html,/REJECTED/); assert.match(detail.html,/usedStatus: APPROVED/);
  await assertStatus(f.decide(ids,'approve'),200);
  assert.equal(db(`SELECT review_decision_id FROM kvazi.validation_result_review WHERE validation_result_id=${ids.validationResultId}`),used);
  const publicList = (await f.get('/vety.php')).html;
  assert.match(publicList,/Historická schválení — public-1.2/);
  const historical = publicList.split('data-rules-version="public-1.2"')[1].split('</section>')[0];
  assert.ok(historical.includes(`data-revision-id="${ids.revisionId}"`));
  const newer = f.revision([t],{valid:true});
  assert.match((await f.get(adminDetail(newer),f.sessions.admin)).html,/UNKNOWN/);
  await assertStatus(f.decide(newer,'approve'),422);
});

test('public approved subset hides arbitrary evidence, source, email, reason and review internals; escapes text', async () => {
  const t = token('public',{evidence:{morphology:'PRIVATE_EVIDENCE'},valency:{declaration:'PRIVATE_VALENCY'},source:'PRIVATE_SOURCE',form:{case:'1',number:'plural',private:'PRIVATE_FORM'},private:'PRIVATE_TOKEN'});
  const ids = f.revision([t],{valid:true}); await resolve(ids);
  await assertStatus(f.decide(ids,'approve','PRIVATE_ADMIN_REASON'),200);
  const pub = await f.get(publicDetail(ids)); assert.equal(pub.status,200);
  for (const secret of ['PRIVATE_EVIDENCE','PRIVATE_VALENCY','PRIVATE_SOURCE','PRIVATE_FORM','PRIVATE_TOKEN','PRIVATE_ADMIN_REASON',f.adminName,f.username+'@kvazi.int','usedDecisionId','review_decision','identity_json','is_approved']) assert.ok(!pub.html.includes(secret),secret);
  assert.match(pub.html,/Jazykový rozbor/); assert.match(pub.html,/word_score/);
  assert.match((await f.get('/vety.php')).html,new RegExp(`href="/veta.php\\?revisionId=${ids.revisionId}"`));
  // Separate malicious surface fixture tests rendering, without claiming validator acceptance.
  const escaped = f.revision([token('escape',{surface:'<img src=x onerror=alert(1)>'})],{valid:true});
  db(`INSERT INTO kvazi.administrative_decision(sentence_id,revision_id,admin_id,action) VALUES (${escaped.sentenceId},${escaped.revisionId},${f.admin},'approve')`);
  const html = (await f.get(publicDetail(escaped))).html;
  assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/); assert.doesNotMatch(html,/<img src=x/);
});

test('real HTTP return -> resubmit -> review -> approve publishes only the new revision', async () => {
  const first = await f.submit(); const snapshot = facts(first);
  await assertStatus(f.decide(first,'return','Znovu posoudit.'),200);
  const second = await f.submit(validDraft(),first.sentenceId);
  // Explicit API reads may bind, unlike GET rendering. Reuse existing approved verdict if present.
  const lookup = await post('/api/admin/morphology-review.php',f.sessions.admin,{...idsForApi(second),tokenId:'t1'});
  if (lookup.body.status === 'UNKNOWN') await assertStatus(f.morph(second),200);
  else assert.equal(lookup.body.usedStatus,'APPROVED');
  await assertStatus(f.catalog(second,false),200);
  await assertStatus(f.decide(second,'approve'),200);
  await assertStatus(f.get(publicDetail(first)),404); await assertStatus(f.get(publicDetail(second)),200);
  const list = (await f.get('/vety.php')).html;
  assert.ok(list.includes(`data-revision-id="${second.revisionId}"`)); assert.ok(!list.includes(`data-revision-id="${first.revisionId}"`));
  assert.equal(facts(first),snapshot);
});

test('public missing and pending IDs return indistinguishable 404', async () => {
  const pending = f.revision([token('privatepending')]);
  const missing = await f.get('/veta.php?revisionId=2147483647');
  const hidden = await f.get(publicDetail(pending));
  assert.equal(missing.status,404); assert.equal(hidden.status,404); assert.equal(missing.html,hidden.html);
  assert.ok(!(await f.get('/vety.php')).html.includes(`data-revision-id="${pending.revisionId}"`));
});

test('direct HTTP pronoun completeness cannot bypass FE; active release registered unchanged history', async () => {
  const draft = validDraft();
  draft.tokens.push({id:'t2',surface:'qazi',lemma:f.tag+'directpronoun',pos:'pronoun',model:'',lexicalStatus:'real',role:'object',relations:{head:'t1'},identity:{},form:{pronoun:{case:'4',number:'singular',gender:'notApplicable',person:'3'}},evidence:{morphology:'Explicit signature'}});
  for (const field of ['case','number','gender','person']) for (const value of [undefined,'',null]) {
    const bad = structuredClone(draft); bad.tokens[1].form.pronoun[field] = value;
    await assertStatus(post('/api/submit.php',f.sessions.user,{draft:bad}),422);
  }
  const complete = await f.submit(draft);
  assert.equal(db(`SELECT rules_version || '|' || validator_version FROM kvazi.validation_result WHERE id=${complete.validationResultId}`),'public-1.3|1.3.0');
});
