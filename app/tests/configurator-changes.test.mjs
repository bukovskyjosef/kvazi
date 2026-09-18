import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createDraft, createToken, mutateDraft } from '../public/js/konfigurator/state.mjs';
import { deriveValidationState } from '../public/js/konfigurator/validation.mjs';
import { catalogFingerprint, pronounFields } from '../public/js/konfigurator/catalog.mjs';
import { createSurfaceRewardTracker } from '../public/js/konfigurator/reward.mjs';

const active = JSON.parse(readFileSync(new URL('../data/active-release.json', import.meta.url))).version;
globalThis.__normative = JSON.parse(readFileSync(new URL(`../data/rules/${active}/normative.json`, import.meta.url)));
const edit = (draft, id, value) => mutateDraft(draft, { type: 'field', id, path: 'surface', value });
function both(draft) {
  const js = deriveValidationState(draft);
  const php = JSON.parse(execFileSync('php', [new URL('./run-php-validator.php', import.meta.url).pathname], {input:JSON.stringify(draft), encoding:'utf8'}));
  assert.deepEqual(php, js);
  return js;
}
function sentence(category = 'noun') {
  const draft = createDraft();
  const verb = createToken('t1', 'kvazí');
  Object.assign(verb, {pos:'verb', lemma:'kvazit', model:'V-IT', lexicalStatus:'quasi', role:'predicate',
    form:{verbFormType:'present', verbPerson:'3', number:'singular', aspect:'imperfective'}, valency:{declaration:'Jako spát, bez dalšího obligatorního doplnění.'}});
  const word = createToken('t2', 'qazí');
  Object.assign(word, {pos:'noun', lemma:'qazí', model:'stavení', lexicalStatus:'quasi', role:'subject',
    identity:{gender:'neuter', animacy:''}, form:{case:'1', number:'singular'}, relations:{head:'t1'}});
  if (category === 'pronoun') Object.assign(word, {pos:'pronoun', lemma:'qa', model:'', lexicalStatus:'real', identity:{},
    form:{pronoun:{case:'1', number:'singular', gender:'notApplicable', person:'3'}}});
  draft.tokens = [verb, word]; draft.nextId = 3;
  if (category === 'adjective') {
    const adjective = createToken('t3', 'kvází');
    Object.assign(adjective, {pos:'adjective', lemma:'kvází', model:'jarní', lexicalStatus:'quasi', role:'agreeingAttribute',
      form:{case:'1', number:'singular', gender:'neuter', degree:'1'}, relations:{head:'t2'}});
    draft.tokens.push(adjective); draft.nextId = 4;
  }
  return draft;
}
for (const category of ['noun', 'adjective', 'pronoun']) test(`optional morphology evidence: ${category} full FE/PHP parity`, () => {
  const draft = sentence(category);
  for (const word of draft.tokens) delete word.evidence.morphology;
  assert.equal(both(draft).submitReady, true);
});
test('valency remains mandatory without general morphology evidence', () => {
  const draft = sentence(); draft.tokens[0].valency.declaration = ' ';
  assert.equal(both(draft).submitReady, false);
  assert.ok(both(draft).tokens.t1.missing.some(v => v.includes('Valenční')));
});
for (const field of ['explanation', 'analogy']) test(`needsAnalogy still requires ${field}`, () => {
  const draft = sentence();
  Object.assign(draft.tokens[1].evidence, {needsAnalogy:true, explanation:'Obhajoba vztahu.', analogy:'Dítě spí.'});
  assert.equal(both(draft).submitReady, true);
  draft.tokens[1].evidence[field] = '';
  assert.equal(both(draft).structureOk, false);
  assert.equal(both(draft).submitReady, false);
});
test('structured morphology is still mandatory', () => {
  const draft = sentence(); delete draft.tokens[1].form.case;
  assert.equal(both(draft).submitReady, false);
});
test('a compatible surface edit can remain fully submit-ready, with a new catalog fingerprint', () => {
  const original = sentence('pronoun');
  assert.equal(both(original).submitReady, true);
  const draft = edit(original, 't2', 'qázi');
  assert.equal(both(draft).submitReady, true);
  assert.deepEqual(draft.tokens.map(w => w.id), original.tokens.map(w => w.id));
  assert.deepEqual(draft.tokens[1].form, original.tokens[1].form);
  assert.notEqual(catalogFingerprint(draft.tokens[1]), catalogFingerprint(original.tokens[1]));
});
test('surface edits preserve IDs/order and compatible metadata; validation and fingerprint are fresh', () => {
  const original = sentence('adjective');
  let draft = original;
  for (const [id, surface] of [['t1', 'KVÁZI\u0301'], ['t2', 'qází'], ['t3', 'qazí']]) {
    const word = draft.tokens.find(w => w.id === id), fingerprint = catalogFingerprint(word);
    draft = edit(draft, id, surface);
    assert.deepEqual(draft.tokens.map(w => w.id), ['t1','t2','t3']);
    assert.equal(draft.nextId, 4);
    assert.notEqual(catalogFingerprint(draft.tokens.find(w => w.id === id)), fingerprint);
    assert.equal(both(draft).sequence.ok, true);
    assert.equal(both(draft).submitReady, false, 'old morphology cannot approve new surface');
  }
  assert.equal(draft.tokens[0].surface, 'kvází');
  assert.deepEqual(draft.tokens[2].relations, {head:'t2'});
  assert.equal(original.tokens[0].surface, 'kvazí', 'immutable mutation');
  draft = edit(original, 't2', 'xyz');
  assert.equal(both(draft).sequence.ok, false);
  assert.equal(both(draft).tokens.t2.formCheck.status, 'notEvaluated');
  assert.equal(both(draft).submitReady, false);
});
test('functional POS transitions reset incompatible fields and references', () => {
  let draft = edit(sentence('adjective'), 't2', 'K');
  assert.deepEqual(draft.tokens[1], createToken('t2','k'));
  assert.deepEqual(draft.tokens[2].relations, {});
  draft.tokens[1].relations.nominal = 't3';
  draft = edit(draft, 't2', 'v');
  assert.equal(draft.tokens[1].lemma, 'v');
  assert.deepEqual(draft.tokens[1].relations, {nominal:'t3'});
  draft = edit(draft, 't2', 'i');
  assert.deepEqual(draft.tokens[1], createToken('t2','i'));
  draft = edit(draft, 't2', 'qazi');
  assert.deepEqual(draft.tokens[1], createToken('t2','qazi'));
  assert.equal(both(draft).submitReady, false);
});
test('prefix inference changes clear stale identity but retain compatible noun form/model/syntax', () => {
  const original = sentence();
  let draft = edit(original, 't2', 'kvaziqazí');
  const word = draft.tokens[1];
  assert.equal(word.pos, 'noun'); assert.equal(word.kvaziPrefix, 'kvazi'); assert.equal(word.lemma, '');
  assert.deepEqual(word.form, original.tokens[1].form);
  assert.deepEqual(word.relations, original.tokens[1].relations);
  assert.equal(both(draft).submitReady, false);
  draft = mutateDraft(draft, {type:'field', id:'t2', path:'lemma', value:'kvaziqazí'});
  assert.equal(both(draft).submitReady, true);
  draft = edit(draft, 't2', 'qazí');
  assert.equal(draft.tokens[1].kvaziPrefix, ''); assert.equal(draft.tokens[1].lemma, '');
  assert.equal(both(draft).submitReady, false);
  draft = edit(sentence('pronoun'), 't2', 'kvaziqazi');
  assert.deepEqual(draft.tokens[1], createToken('t2','kvaziqazi'));
});
test('pronoun labels and allowed values distinguish person from case', () => {
  const fields = pronounFields();
  for (const field of fields) assert.deepEqual(Object.keys(field.options), globalThis.__normative.pronoun_form_signature[field.path.split('.').at(-1)]);
  assert.deepEqual(fields.find(f => f.path.endsWith('.person')).options, {'1':'1. osoba','2':'2. osoba','3':'3. osoba',notApplicable:'Nevztahuje se'});
  assert.deepEqual(Object.values(fields.find(f => f.path.endsWith('.case')).options), ['1. pád','2. pád','3. pád','4. pád','5. pád','6. pád','7. pád','Nevztahuje se']);
});
test('reward is a single surface PASS edge, independent of submit eligibility', () => {
  const reward = createSurfaceRewardTracker();
  let draft = createDraft(); draft = mutateDraft(draft, {type:'insert', surface:'kvazi'});
  const sample = () => reward(draft, deriveValidationState(draft));
  assert.deepEqual(sample(), {passed:false, fire:false});
  draft = mutateDraft(draft, {type:'close', punct:'.'});
  assert.deepEqual(sample(), {passed:true, fire:true});
  assert.equal(deriveValidationState(draft).submitReady, false);
  assert.deepEqual(sample(), {passed:true, fire:false});
  draft = mutateDraft(draft, {type:'field', id:'t1', path:'lemma', value:'kvaz'});
  assert.equal(sample().fire, false);
  draft = edit(draft, 't1', 'xyz'); assert.deepEqual(sample(), {passed:false, fire:false});
  draft = edit(draft, 't1', 'kvazi'); assert.equal(sample().fire, true);
  for (const punct of ['?', '!']) {
    draft = mutateDraft(draft, {type:'open'}); assert.equal(sample().fire, false);
    draft = mutateDraft(draft, {type:'close', punct}); assert.equal(sample().fire, true);
    assert.equal(sample().fire, false);
  }
  draft = mutateDraft(draft, {type:'open'}); draft = edit(draft, 't1', 'xyz');
  sample(); draft = mutateDraft(draft, {type:'close', punct:'.'});
  assert.deepEqual(sample(), {passed:false, fire:false});
});
