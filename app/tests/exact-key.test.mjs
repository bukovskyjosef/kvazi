import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { catalogCandidate, catalogFingerprint } from '../public/js/konfigurator/catalog.mjs';
const active = JSON.parse(readFileSync(new URL('../data/active-release.json', import.meta.url))).version;
const dataPath = new URL(`../data/rules/${active}/normative.json`, import.meta.url).pathname;
globalThis.__normative = JSON.parse(readFileSync(dataPath));
const helper = new URL('../public/includes/exact-key.php', import.meta.url).pathname;
const noun = { pos: 'noun', surface: 'kvazi', lemma: 'kvaz', model: 'pán', lexicalStatus: 'quasi',
  identity: { gender: 'masculine', animacy: 'animate' }, form: { case: '1', number: 'plural' } };
const verb = { pos: 'verb', surface: 'kvazí', lemma: 'kvazit', model: 'V-IT', lexicalStatus: 'quasi',
  identity: {}, form: { verbFormType: 'present', aspect: 'imperfective', verbPerson: '3', number: 'plural' } };
const adjective = { pos: 'adjective', surface: 'kvazý', lemma: 'kvazý', model: 'mladý', lexicalStatus: 'quasi',
  identity: {}, form: { gender: 'masculineAnimate', case: '1', number: 'singular', degree: '1' } };
function key(token, catalog = false) {
  return JSON.parse(execFileSync('php', ['-r',
    'require $argv[1]; echo json_encode(kvazi_exact_key(json_decode($argv[3], true), json_decode(file_get_contents($argv[2]), true), $argv[4] === "catalog"), JSON_THROW_ON_ERROR);',
    helper, dataPath, JSON.stringify(token), catalog ? 'catalog' : 'review'], { encoding: 'utf8', stdio: 'pipe' }));
}
test('canonical server key: noun fields only; JSON order and client metadata do not affect match', () => {
  const expected = { identity_json: { animacy: 'animate', gender: 'masculine', lemma: 'kvaz', model: 'pán', pos: 'noun' },
    form_json: { case: '1', number: 'plural' }, surface_form: 'kvazi' };
  assert.deepEqual(key(noun), expected);
  assert.deepEqual(key({ ...noun, identity: { ignored: 'x', animacy: 'animate', gender: 'masculine' },
    form: { number: 'plural', ignored: { injected: true }, case: '1' }, id: 'other', lexicalStatus: 'real',
    role: 'object', evidence: { reason: 'ignored' }, kvaziPrefix: true, score: 999 }), expected);
});
test('canonical server key: NFC and lowercase; Q and KV and accent differences remain distinct', () => {
  assert.equal(key({ ...noun, surface: 'KVA\u0301ZI', lemma: 'KVA\u0301Z' }).surface_form, 'kvázi');
  assert.equal(key({ ...noun, lemma: 'KVA\u0301Z' }).identity_json.lemma, 'kváz');
  assert.notDeepEqual(key(noun), key({ ...noun, surface: 'qazi' }));
  assert.notDeepEqual(key(noun), key({ ...noun, surface: 'kvázi' }));
});
test('noun key: irrelevant animacy is omitted for feminine model', () => {
  const k = key({ ...noun, surface: 'kvaza', lemma: 'kvaza', model: 'žena', identity: { gender: 'feminine' } });
  assert.deepEqual(k.identity_json, { gender: 'feminine', lemma: 'kvaza', model: 'žena', pos: 'noun' });
});
test('prefix keys: review keeps derivative; catalog checks only its complete base', () => {
  const prefixed = { ...noun, surface: 'kvazikvazi', lemma: 'kvazikvaz', kvaziPrefix: false };
  assert.deepEqual(key(prefixed, true), key(noun, true));
  assert.equal(key(prefixed).identity_json.kvaziPrefix, true);
  assert.equal(key(prefixed).identity_json.lemma, 'kvazikvaz');
  assert.throws(() => key({ ...prefixed, surface: 'kvazikvazikvazi', lemma: 'kvazikvazikvaz' }));
});
test('adjective key: gender/case/number/degree belong to form, not identity', () => {
  const k = key(adjective);
  assert.deepEqual(k.identity_json, { lemma: 'kvazý', model: 'mladý', pos: 'adjective' });
  assert.deepEqual(k.form_json, adjective.form);
});
test('possessive adjective: complete consistent derivation required; no artificial degree field', () => {
  const token = { ...adjective, surface: 'kvazův', lemma: 'kvazův', model: 'otcův',
    identity: { sourceNounLemma: 'kvaz', sourceNounModel: 'pán' }, form: { gender: 'masculineAnimate', case: '1', number: 'singular' } };
  assert.deepEqual(key(token).identity_json, { lemma: 'kvazův', model: 'otcův', pos: 'adjective' });
  assert.equal(Object.hasOwn(key(token).form_json, 'degree'), false);
  assert.throws(() => key({ ...token, identity: {} }));
  assert.throws(() => key({ ...token, identity: { sourceNounLemma: 'kvaza', sourceNounModel: 'žena' } }));
});
test('verb key: aspect is a property of use, not a new competition identity', () => {
  assert.deepEqual(key(verb).identity_json, { lemma: 'kvazit', model: 'V-IT', pos: 'verb' });
  assert.equal(key(verb).form_json.aspect, 'imperfective');
  assert.deepEqual(key({ ...verb, form: { ...verb.form, aspect: 'perfective' } }).identity_json, key(verb).identity_json);
  assert.notDeepEqual(key({ ...verb, form: { ...verb.form, aspect: 'perfective' } }).form_json, key(verb).form_json);
});
test('imperative key: encoded person required; stale unused number/gender excluded', () => {
  const token = { ...verb, lemma: 'kvaziit', surface: 'kvazi', form: { verbFormType: 'imperative', aspect: 'imperfective', verbPerson: '2sg', number: 'plural', verbGender: 'feminine' } };
  assert.deepEqual(key(token).form_json, { aspect: 'imperfective', verbFormType: 'imperative', verbPerson: '2sg' });
  assert.throws(() => key({ ...token, form: { ...token.form, verbPerson: '3' } }));
});
test('l-participle key: animacy required only for masculine plural', () => {
  const token = { ...verb, form: { verbFormType: 'lParticiple', aspect: 'imperfective', verbGender: 'masculine', number: 'plural', verbAnimacy: 'animate' } };
  assert.equal(key(token).form_json.verbAnimacy, 'animate');
  assert.throws(() => key({ ...token, form: { ...token.form, verbAnimacy: '' } }));
  assert.equal(Object.hasOwn(key({ ...token, form: { ...token.form, number: 'singular' } }).form_json, 'verbAnimacy'), false);
});
for (const [name, mutate] of [
  ['missing lemma', t => delete t.lemma], ['partial surface only', t => { for (const k of Object.keys(t)) if (k !== 'surface') delete t[k]; }],
  ['unknown model', t => t.model = 'injected'], ['missing noun gender', t => delete t.identity.gender],
  ['mismatched noun animacy', t => t.identity.animacy = 'inanimate'], ['missing case', t => delete t.form.case],
  ['invalid number', t => t.form.number = ['plural']], ['invalid lemma/model', t => t.lemma = 'kvaza'],
  ['non-object form', t => t.form = 'injected'], ['surface contains whitespace', t => t.surface = 'kvazi kvazi'],
]) test(`server refuses incomplete/inconsistent key: ${name}`, () => {
  const token = structuredClone(noun); mutate(token); assert.throws(() => key(token));
});
test('normative functional and auxiliary tokens have no catalog/review key', () => {
  assert.equal(key({ pos: 'preposition', surface: 'K', lemma: 'k' }), null);
  assert.equal(key({ pos: 'verb', role: 'auxiliary', surface: 'JSME', lemma: 'BÝT' }), null);
});
test('pronoun key: explicit four-field signature with notApplicable, no productive model', () => {
  const token = { pos: 'pronoun', surface: 'já', lemma: 'já', lexicalStatus: 'real',
    form: { pronoun: { case: '1', number: 'singular', gender: 'notApplicable', person: '1' } } };
  assert.deepEqual(key(token), { identity_json: { lemma: 'já', pos: 'pronoun' }, form_json: token.form.pronoun, surface_form: 'já' });
  assert.ok(catalogCandidate(token));
  for (const field of ['case', 'number', 'gender', 'person']) {
    const partial = structuredClone(token); delete partial.form.pronoun[field];
    assert.throws(() => key(partial)); assert.equal(catalogCandidate(partial), null);
  }
  assert.throws(() => key({ ...token, lexicalStatus: 'quasi' }));
  assert.throws(() => key({ ...token, model: 'pán' }));
  const omitted = { ...token, form: {} };
  assert.throws(() => key(omitted));
});
test('FE exact request: full form required; evidence and syntax are not lookup requirements', () => {
  assert.ok(catalogCandidate(noun)); assert.ok(catalogCandidate(verb)); assert.ok(catalogCandidate(adjective));
  assert.equal(catalogCandidate({ ...noun, form: { number: 'plural' } }), null);
  assert.equal(catalogCandidate({ ...verb, form: { verbFormType: 'imperative', aspect: 'imperfective' } }), null);
  assert.equal(catalogCandidate({ ...verb, role: 'auxiliary', lemma: 'být', surface: 'jsme' }), null);
});
test('FE snapshot changes for every key field; evidence, role and JSON ordering do not invalidate it', () => {
  const snapshot = catalogFingerprint(noun);
  for (const change of [{ surface: 'qazi' }, { lemma: 'qaz' }, { model: 'muž' }, { form: { ...noun.form, case: '5' } }]) {
    assert.notEqual(catalogFingerprint({ ...noun, ...change }), snapshot);
  }
  assert.equal(catalogFingerprint({ ...noun, role: 'object', evidence: { morphology: 'changed' }, form: { number: 'plural', case: '1' } }), snapshot);
  assert.equal(catalogFingerprint({ ...noun, surface: 'KVazi', lemma: 'KVAZ' }), snapshot);
});
