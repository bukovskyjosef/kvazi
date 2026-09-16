import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {deriveValidationState} from '../public/js/konfigurator/validation.mjs';
import {createDraft, createToken} from '../public/js/konfigurator/state.mjs';
import {catalogCandidate} from '../public/js/konfigurator/catalog.mjs';
const active = JSON.parse(readFileSync(new URL('../data/active-release.json', import.meta.url))).version;
globalThis.__normative = JSON.parse(readFileSync(new URL(`../data/rules/${active}/normative.json`, import.meta.url)));
export function pronounDraft() {
  const draft = createDraft();
  draft.sentenceType = 'imperative'; draft.implicitSubject = true;
  const verb = createToken('t1', 'kvazi');
  Object.assign(verb, {pos:'verb', lemma:'kvaziit', model:'V-IT', lexicalStatus:'quasi', role:'predicate',
    form:{verbFormType:'imperative', verbPerson:'2sg', aspect:'biaspectual'}, valency:{declaration:'Bez obligatorního doplnění.'}, evidence:{...verb.evidence, morphology:'Imperativ V-IT.'}});
  const pronoun = createToken('t2', 'qazi');
  Object.assign(pronoun, {pos:'pronoun', lemma:'qa', lexicalStatus:'real', role:'object', relations:{head:'t1'},
    form:{pronoun:{case:'4', number:'singular', gender:'notApplicable', person:'3'}}, evidence:{...pronoun.evidence, morphology:'Vlastní konkrétní deklarace k posouzení.'}});
  draft.tokens = [verb, pronoun];
  return draft;
}
function both(draft) {
  const js = deriveValidationState(draft);
  const php = JSON.parse(execFileSync('php', [new URL('./run-php-validator.php', import.meta.url).pathname], {input:JSON.stringify(draft), encoding:'utf8'}));
  assert.deepEqual(php, js, 'full FE/PHP parity');
  return js;
}
test('complete pronoun declaration is structurally complete and submit-ready; M2 projection compatible', () => {
  const draft = pronounDraft();
  assert.equal(both(draft).submitReady, true);
  assert.ok(catalogCandidate(draft.tokens[1]));
});
for (const field of ['case', 'number', 'gender', 'person']) {
  for (const invalid of ['missing', '', null, 'invalid', {}, 1]) test(`pronoun ${field}: ${JSON.stringify(invalid)} is not notApplicable`, () => {
    const draft = pronounDraft();
    if (invalid === 'missing') delete draft.tokens[1].form.pronoun[field];
    else draft.tokens[1].form.pronoun[field] = invalid;
    const state = both(draft);
    assert.equal(state.structureOk, false); assert.equal(state.submitReady, false);
    assert.ok(state.tokens.t2.missing.length); assert.equal(catalogCandidate(draft.tokens[1]), null);
  });
  test(`pronoun ${field}: explicit notApplicable accepted`, () => {
    const draft = pronounDraft(); draft.tokens[1].form.pronoun[field] = 'notApplicable';
    assert.equal(both(draft).submitReady, true);
  });
}
for (const signature of [undefined, null, '', 'invalid', []]) test(`pronoun signature container ${JSON.stringify(signature)} rejected`, () => {
  const draft = pronounDraft(); draft.tokens[1].form.pronoun = signature;
  assert.equal(both(draft).submitReady, false);
});
test('quasi pronoun rejected', () => {
  const draft = pronounDraft(); draft.tokens[1].lexicalStatus = 'quasi';
  assert.equal(both(draft).submitReady, false);
});
test('productive pronoun model rejected', () => {
  const draft = pronounDraft(); draft.tokens[1].model = 'pán';
  assert.equal(both(draft).structureOk, false);
});
