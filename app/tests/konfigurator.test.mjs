import test from 'node:test';
import assert from 'node:assert/strict';
import { publicSchema, getModel } from '../public/js/konfigurator/schema.mjs';
import { createDraft, createToken, mutateDraft, inferKvaziPrefix } from '../public/js/konfigurator/state.mjs';
import { validateTokenSequence, validateSyntax, deriveValidationState, previewDraft } from '../public/js/konfigurator/validation.mjs';
import { validateForm } from '../public/js/konfigurator/morpho.mjs';

// Synthetic schema for tests that require a verb model and controlled valency.
// structuredClone cannot clone functions, so we clone only the plain-data parts.
const schema = {
  ...structuredClone({ id: publicSchema.id, fields: publicSchema.fields, models: publicSchema.models, valency: null }),
  id: 'TEST-ONLY',
  valency: { validate: w => w.valency.declaration === 'test' ? [] : ['Test frame missing'], objectSlotValid: w => w.testSlot === 'test' },
  allowsImplicitSubject: w => w?.form.testImperative === true,
};
schema.models.verb.TEST = { label: 'TEST ONLY', fields: [] };
const sequence = surfaces => validateTokenSequence(surfaces.map((surface, i) => ({ id: `t${i}`, surface })));
function fixture() {
  const draft = createDraft();
  draft.sentenceType = 'declarative';
  draft.nextId = 3;
  const a = createToken('t1', 'vazi'), b = createToken('t2', 'kvazi');
  Object.assign(a, { pos: 'noun', lemma: 'testnoun', model: 'hrad', identity: { gender: 'masculine', animacy: 'inanimate' }, form: { case: '1', number: 'singular' }, lexicalStatus: 'quasi', role: 'subject', relations: { head: 't2' } });
  Object.assign(b, { pos: 'verb', lemma: 'testverb', model: 'TEST', form: { aspect: 'biaspectual' }, lexicalStatus: 'quasi', role: 'predicate', valency: { modelVerb: 'test', declaration: 'test' } });
  for (const w of [a, b]) w.evidence.morphology = 'Test evidence';
  draft.tokens = [a, b];
  return draft;
}

test('Unicode NFC before storing, validating and scoring; no alphabet limits on lemma/paradigm', () => {
  let d = mutateDraft(createDraft(), { type: 'insert', surface: 'KVA\u0301ZI\u0301' });
  assert.equal(d.tokens[0].surface, 'kvází');
  assert.deepEqual(sequence(['KVA\u0301ZI\u0301']), sequence(['KVÁZÍ']));
  assert.equal(deriveValidationState(d).charScore, 5);
  d = mutateDraft(d, { type: 'field', id: 't1', path: 'lemma', value: 'ře\u0301šení' });
  assert.equal(d.tokens[0].lemma, 'řéšení');
});
test('alphabet, token lengths and prefix exception', () => {
  for (const s of ['kv', 'á', 'q', 'y', 'kvazivázy', 'kva zi', 'kvazi.', 'xaz', '😀']) assert.equal(sequence([s]).ok, false, s);
  for (const s of ['k', 'v', 'z', 'a', 'i', 'azi', 'qázi', 'kvázý']) assert.equal(sequence([s]).ok, true, s);
  // kvazi- prefix exception: kvaziqazi = KVAZI (motif) + QAZI (valid base, 4 chars)
  assert.equal(sequence(['kvaziqazi']).ok, true, 'kvaziqazi: valid prefixed token');
  // invalid base: kvazivázy base=vázy fails DFA (V not a valid motif start)
  assert.equal(sequence(['kvazivázy']).ok, false, 'kvazivázy: base vázy invalid motif');
  // base too short (2 chars)
  assert.equal(sequence(['kvazika']).ok, false, 'kvazika: base ka too short');
  // base too long (6 chars)
  assert.equal(sequence(['kvaziqaziqaz']).ok, false, 'kvaziqaziqaz: base qaziqaz too long');
  assert.equal(sequence([]).ok, false);
  assert.equal(deriveValidationState(createDraft()).submitReady, false);
});
test('prefix inference: createToken auto-sets kvaziPrefix and pos for >5-char kvazi prefix', () => {
  const w = createToken('x', 'kvaziqazi');
  assert.equal(w.kvaziPrefix, 'kvazi');
  assert.equal(w.pos, 'noun');
  // surface must still be lowercased NFC
  assert.equal(w.surface, 'kvaziqazi');
  // non-prefix tokens: no kvaziPrefix
  assert.equal(createToken('y', 'kvazi').kvaziPrefix, '');   // exactly 5 chars — not prefixed
  assert.equal(createToken('z', 'qaziqazi').kvaziPrefix, ''); // doesn't start with kvazi
  assert.equal(createToken('a', 'kvázi').kvaziPrefix, '');    // kvázi not exact kvazi
  // POS change is blocked for prefixed tokens
  let d = mutateDraft(createDraft(), { type: 'insert', surface: 'kvaziqazi' });
  assert.equal(d.tokens[0].kvaziPrefix, 'kvazi');
  assert.equal(d.tokens[0].pos, 'noun');
  d = mutateDraft(d, { type: 'field', id: d.tokens[0].id, path: 'pos', value: 'verb' });
  assert.equal(d.tokens[0].pos, 'noun', 'POS locked for prefixed token');
});
test('charScore applies zero-scoring for valid kvazi- prefix chars', () => {
  // A valid prefixed token: kvaziqazi = KVAZI (0 points) + QAZI (4 chars × 1 = 4 points)
  let d = mutateDraft(createDraft(), { type: 'insert', surface: 'kvaziqazi' });
  // kvaziqazi has 9 chars, but prefix (5) = 0, base (4) = 4
  const state = deriveValidationState(d);
  assert.equal(state.charScore, 4, 'prefix chars score 0, base counts normally');
  // A non-prefixed token: kvazi = 5 chars = 5 score
  d = mutateDraft(createDraft(), { type: 'insert', surface: 'kvazi' });
  assert.equal(deriveValidationState(d).charScore, 5);
});
test('token boundaries matter even for the identical valid joined string', () => {
  assert.equal(sequence(['vazi', 'kvazi']).ok, true);
  assert.equal(sequence(['vazik', 'vazi']).ok, false);
  assert.equal(sequence(['qazi', 'kvázi']).ok, true);
  assert.equal(sequence(['qazik', 'vázi']).ok, false);
});
test('DFA agrees with independent motif placement over all 16×16 motif pairs and slices', () => {
  const motifs = ['KV', 'Q'].flatMap(p => ['A', 'Á'].flatMap(a => ['I', 'Í', 'Y', 'Ý'].map(i => p + a + 'Z' + i)));
  for (const a of motifs) for (const b of motifs) {
    const joined = a + b;
    for (let start = 0; start < a.length; start++) for (let end = a.length + 1; end <= joined.length; end++) {
      const slices = [joined.slice(start, a.length), joined.slice(a.length, end)];
      const lengthsOk = slices.every(s => (s.length >= 3 && s.length <= 5) || singlesForTest.includes(s));
      assert.equal(sequence(slices).ok, lengthsOk, JSON.stringify(slices));
    }
  }
});
const singlesForTest = ['K', 'V', 'Z', 'A', 'I'];
test('one-letter roles, POS cross checks and uniqueness are deterministic', () => {
  for (const surface of ['K', 'v', 'z', 'a', 'I']) {
    const w = createToken('s', surface);
    assert.equal(w.pos, ['a', 'i'].includes(surface.toLowerCase()) ? 'conjunction' : 'preposition');
    const d = fixture(); d.tokens.push(w);
    w.pos = 'noun';
    assert.ok(deriveValidationState(d, schema).tokens.s.missing.some(x => x.includes('odporují')));
  }
  for (const pos of ['preposition', 'conjunction']) {
    const d = fixture(); d.tokens[0].pos = pos;
    assert.ok(deriveValidationState(d, schema).tokens.t1.missing.some(x => x.includes('odporují')));
  }
  assert.equal(sequence(['k', 'vazi', 'k', 'vazi']).ok, false);
  assert.equal(sequence(['a', 'ziq', 'a']).ok, false);
});
test('exactly one full verb is independent of the predicate count', () => {
  const d = fixture();
  assert.equal(deriveValidationState(d, schema).fullVerbOk, true);
  d.tokens[0].pos = 'verb';
  assert.equal(deriveValidationState(d, schema).fullVerbOk, false);
  d.tokens[0].pos = d.tokens[1].pos = 'noun';
  assert.equal(deriveValidationState(d, schema).fullVerbOk, false);
});
test('sentence type determines punctuation and expressed/implicit subject constraints', () => {
  for (const [type, mark] of [['declarative', '.'], ['interrogative', '?'], ['imperative', '!']]) {
    const d = fixture(); d.sentenceType = type;
    assert.equal(deriveValidationState(d, schema).text.at(-1), mark);
    assert.equal(deriveValidationState(d, schema).sentenceOk, true);
    d.implicitSubject = true;
    assert.equal(deriveValidationState(d, schema).sentenceOk, false);
    d.tokens.shift(); d.tokens[0].form.testImperative = true;
    assert.equal(deriveValidationState(d, schema).sentenceOk, type === 'imperative');
  }
  const d = fixture(); d.sentenceType = '';
  assert.equal(deriveValidationState(d, schema).submitReady, false);
  d.sentenceType = 'imperative'; d.implicitSubject = true; d.tokens.shift();
  assert.equal(deriveValidationState(d, publicSchema).sentenceOk, false);
});
test('relation shapes and target types for every ordinary function', () => {
  for (const role of ['subject', 'object', 'adverbial', 'agreeingAttribute', 'attribute']) {
    const d = fixture();
    const target = createToken('n', 'azi'); Object.assign(target, { pos: 'noun', role: 'subject', relations: { head: 't2' } });
    d.tokens.push(target);
    const w = d.tokens[0]; w.role = role; w.testSlot = 'test';
    w.relations.head = ['agreeingAttribute', 'attribute'].includes(role) ? 'n' : 't2';
    assert.equal(validateSyntax(d, schema).ok, true, role);
    for (const bad of [{}, { head: 'missing' }, { head: w.id }, { ...w.relations, extra: 't2' }]) {
      const copy = structuredClone(d); copy.tokens[0].relations = bad;
      assert.equal(validateSyntax(copy, schema).ok, false, `${role} ${JSON.stringify(bad)}`);
    }
    w.relations.head = ['agreeingAttribute', 'attribute'].includes(role) ? 't2' : 'n';
    assert.equal(validateSyntax(d, schema).ok, false, role);
  }
});
test('predicate root, supplement, preposition and coordination specialized shapes', () => {
  let d = fixture(); d.tokens[1].relations.head = 't1';
  assert.equal(validateSyntax(d, schema).ok, false);
  d = fixture();
  const w = createToken('x', 'azi'); Object.assign(w, { pos: 'adjective', role: 'supplement', relations: { predicate: 't2', nominal: 't1' } }); d.tokens.push(w);
  assert.equal(validateSyntax(d, schema).ok, true);
  w.relations.nominal = 't2'; assert.equal(validateSyntax(d, schema).ok, false);
  w.relations = { nominal: 't1' }; w.pos = 'preposition'; w.role = 'preposition'; w.surface = 'k';
  assert.equal(validateSyntax(d, schema).ok, true);
  w.relations.nominal = 't2'; assert.equal(validateSyntax(d, schema).ok, false);
  d = fixture();
  for (const id of ['x', 'y']) { const t = createToken(id, 'azi'); Object.assign(t, { pos: 'noun', role: 'adverbial', relations: { head: 't2' } }); d.tokens.push(t); }
  const conj = createToken('c', 'a'); conj.relations = { left: 'x', right: 'y' }; d.tokens.push(conj);
  assert.equal(validateSyntax(d, schema).ok, true);
  conj.relations.right = 'x'; assert.equal(validateSyntax(d, schema).ok, false);
  conj.relations.right = 'y'; d.tokens[3].role = 'object'; d.tokens[3].testSlot = 'test'; assert.equal(validateSyntax(d, schema).ok, false);
  d.tokens[2].role = d.tokens[3].role = 'subject'; assert.equal(validateSyntax(d, schema).ok, false);
});
test('cycles, dangling links and extra links cannot pass syntax', () => {
  const d = fixture();
  d.tokens[0].role = 'attribute'; d.tokens[1].pos = 'noun'; d.tokens[1].role = 'attribute'; d.tokens[1].relations = { head: 't1' };
  assert.ok(validateSyntax(d, schema).issues.some(x => x.message.includes('kruh')));
});
test('formCheck ok for functional words and unknown models', () => {
  const d = fixture();
  // preposition 'k' is always formCheck ok
  const k = createToken('k1', 'k');
  d.tokens.push(k);
  const state = deriveValidationState(d, schema);
  assert.equal(state.tokens.k1.formCheck.ok, true);
  // TEST verb model is unknown to morpho.mjs — returns ok:true
  assert.equal(state.tokens.t2.formCheck.ok, true);
});
test('formCheck fails when surface does not match declared form', () => {
  const d = createDraft();
  const w = createToken('t1', 'kvazi');
  Object.assign(w, { pos: 'noun', lemma: 'kvaz', model: 'hrad', identity: { gender: 'masculine', animacy: 'inanimate' }, form: { case: '1', number: 'singular' }, lexicalStatus: 'quasi', role: 'subject', relations: { head: 't2' } });
  w.evidence.morphology = 'test';
  d.tokens = [w];
  const state = deriveValidationState(d);
  // hrad, case=1, number=singular, stem='kvaz', ending='' → expected='kvaz', but surface='kvazi' ≠ 'kvaz'
  assert.equal(state.tokens.t1.formCheck.ok, false);
  assert.ok(typeof state.tokens.t1.formCheck.message === 'string');
});
test('formCheck ok when surface matches declared form', () => {
  const d = createDraft();
  const w = createToken('t1', 'kvaz');
  Object.assign(w, { pos: 'noun', lemma: 'kvaz', model: 'hrad', identity: { gender: 'masculine', animacy: 'inanimate' }, form: { case: '1', number: 'singular' }, lexicalStatus: 'quasi', role: 'subject', relations: { head: 't2' } });
  w.evidence.morphology = 'test';
  d.tokens = [w];
  const state = deriveValidationState(d);
  assert.equal(state.tokens.t1.formCheck.ok, true);
  assert.equal(state.tokens.t1.formCheck.expected, 'kvaz');
});
test('morphologyOk uses formCheck across all tokens', () => {
  const d = createDraft();
  // noun with correct form
  const noun = createToken('t1', 'kvaz');
  Object.assign(noun, { pos: 'noun', lemma: 'kvaz', model: 'hrad', identity: { gender: 'masculine', animacy: 'inanimate' }, form: { case: '1', number: 'singular' }, lexicalStatus: 'quasi', role: 'subject', relations: { head: 't2' } });
  noun.evidence.morphology = 'ok';
  // verb with V-AT type — unknown surface doesn't matter for morphologyOk here since lemma check fails first
  const verb = createToken('t2', 'kvazi');
  Object.assign(verb, { pos: 'verb', lemma: 'kvazat', model: 'V-AT', form: { verbFormType: 'present', verbPerson: '3', number: 'singular', aspect: 'imperfective' }, lexicalStatus: 'quasi', role: 'predicate', valency: { declaration: 'x' } });
  verb.evidence.morphology = 'ok';
  d.tokens = [noun, verb];
  d.nextId = 3;
  const state = deriveValidationState(d);
  // noun formCheck ok, verb: stem='kvaz', ending='á', expected='kvazá' ≠ 'kvazi' — formCheck fails
  assert.equal(state.tokens.t1.formCheck.ok, true);
  assert.equal(state.tokens.t2.formCheck.ok, false);
  assert.equal(state.morphologyOk, false);
});
test('auxiliary být: formCheck validates against normative closed set', () => {
  // Normative forms must pass; anything else must fail.
  const normative = ['jsem', 'jsi', 'jsme', 'jste', 'budu', 'budeš', 'bude', 'budeme', 'budete', 'budou', 'bych', 'bys', 'by', 'bychom', 'byste'];
  for (const f of normative) {
    const w = createToken('x', f);
    Object.assign(w, { pos: 'verb', role: 'auxiliary', lemma: 'být', lexicalStatus: 'real' });
    assert.equal(validateForm(w).ok, true, `normative form ${f} should pass`);
  }
  const bad = createToken('y', 'bylo');
  Object.assign(bad, { pos: 'verb', role: 'auxiliary', lemma: 'být', lexicalStatus: 'real' });
  assert.equal(validateForm(bad).ok, false, 'bylo is not in normative auxiliary set for v1');
  // Case-insensitive match (token surfaces are stored lowercase by createToken)
  const jsiUpper = createToken('z', 'JSI');
  Object.assign(jsiUpper, { pos: 'verb', role: 'auxiliary', lemma: 'být', lexicalStatus: 'real' });
  assert.equal(validateForm(jsiUpper).ok, true, 'normative form matching is case-insensitive');
});
test('edit, insert and delete preserve stable IDs and independent references', () => {
  const original = fixture();
  let d = mutateDraft(original, { type: 'insert', anchor: 't1', side: 'after', surface: 'qazi' }, schema);
  assert.deepEqual(d.tokens.map(w => w.id), ['t1', 't3', 't2']);
  assert.equal(d.tokens[0].relations.head, 't2');
  d = mutateDraft(d, { type: 'surface', id: 't1', value: 'vázi' }, schema);
  assert.equal(d.tokens[0].id, 't1'); assert.equal(d.tokens[0].relations.head, 't2');
  assert.equal(d.tokens[0].lemma, '');
  d = mutateDraft(d, { type: 'delete', id: 't2' }, schema);
  assert.deepEqual(d.tokens[0].relations, {});
  assert.equal(original.tokens[0].lemma, 'testnoun');
  d = mutateDraft(d, { type: 'insert', anchor: 't1', side: 'before', surface: 'k' }, schema);
  assert.equal(d.tokens[0].id, 't4');
  assert.throws(() => mutateDraft(d, { type: 'insert', anchor: 'missing', surface: 'k' }));
});
test('functional surface edits derive the new role and remove incompatible relations', () => {
  let d = mutateDraft(createDraft(), { type: 'insert', surface: 'k' });
  d.tokens[0].relations.nominal = 'other';
  d = mutateDraft(d, { type: 'surface', id: 't1', value: 'a' });
  assert.equal(d.tokens[0].pos, 'conjunction'); assert.deepEqual(d.tokens[0].relations, {});
  d = mutateDraft(d, { type: 'surface', id: 't1', value: 'azi' });
  assert.equal(d.tokens[0].pos, '');
});
test('previewDraft synchronously revalidates', () => {
  const d = fixture();
  d.sentenceType = '';
  const preview = previewDraft(d, schema);
  assert.equal(preview.validation.submitReady, false);
  assert.equal(preview.submitted, false);
  assert.equal(preview.schema, 'TEST-ONLY');
});
test('duplicate identities ignore case, declared real/quasi status, case and number', () => {
  const d = fixture(), duplicate = structuredClone(d.tokens[0]);
  duplicate.id = 't3'; duplicate.lemma = 'TESTNOUN'; duplicate.form.case = '2'; duplicate.lexicalStatus = 'real'; d.tokens.push(duplicate);
  assert.ok(deriveValidationState(d, schema).tokens.t3.missing.some(x => x.includes('identita')));
});
