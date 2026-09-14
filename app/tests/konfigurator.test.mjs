import test from 'node:test';
import assert from 'node:assert/strict';
import { publicSchema, CONFIRMATION, getModel } from '../public/js/konfigurator/schema.mjs';
import { createDraft, createToken, mutateDraft, morphologySnapshot, isConfirmed, canConfirm } from '../public/js/konfigurator/state.mjs';
import { validateTokenSequence, validateSyntax, deriveValidationState, previewDraft } from '../public/js/konfigurator/validation.mjs';

// Synthetic schema exercises the future completion path; it is not shipped to
// the browser and is not a proposed Czech model or valency frame representation.
const schema = structuredClone(publicSchema);
schema.id = 'TEST-ONLY';
schema.models.noun['hrad'].complete = true;
schema.models.verb.TEST = { label: 'TEST ONLY', complete: true, cells: [{ id: 'test-cell', label: 'Test cell' }], fields: [] };
schema.valency = { validate: w => w.valency.declaration === 'test' ? [] : ['Test frame missing'], objectSlotValid: w => w.testSlot === 'test' };
schema.allowsImplicitSubject = w => w?.form.testImperative === true;
const sequence = surfaces => validateTokenSequence(surfaces.map((surface, i) => ({ id: `t${i}`, surface })));
function fixture() {
  const draft = createDraft();
  draft.sentenceType = 'declarative';
  draft.nextId = 3;
  const a = createToken('t1', 'vazi'), b = createToken('t2', 'kvazi');
  Object.assign(a, { pos: 'noun', lemma: 'testnoun', model: 'hrad', identity: { gender: 'masculine', animacy: 'inanimate' }, form: { case: '1', number: 'singular' }, lexicalStatus: 'quasi', role: 'subject', relations: { head: 't2' } });
  Object.assign(b, { pos: 'verb', lemma: 'testverb', model: 'TEST', form: { aspect: 'biaspectual' }, lexicalStatus: 'quasi', role: 'predicate', valency: { modelVerb: 'test', declaration: 'test' } });
  for (const w of [a, b]) {
    w.evidence.morphology = 'Test evidence';
    w.morphology.cells = Object.fromEntries(getModel(w, schema).cells.map(c => [c.id, 'test']));
    w.morphology.confirmation = morphologySnapshot(w, schema);
  }
  draft.tokens = [a, b];
  return draft;
}

test('Unicode NFC before storing, validating and scoring; no alphabet limits on lemma/paradigm', () => {
  let d = mutateDraft(createDraft(), { type: 'insert', surface: 'KVA\u0301ZI\u0301' });
  assert.equal(d.tokens[0].surface, 'KVÁZÍ');
  assert.deepEqual(sequence(['KVA\u0301ZI\u0301']), sequence(['KVÁZÍ']));
  assert.equal(deriveValidationState(d).charCount, 5);
  d = mutateDraft(d, { type: 'field', id: 't1', path: 'lemma', value: 'ře\u0301šení' });
  assert.equal(d.tokens[0].lemma, 'řéšení');
  d = mutateDraft(d, { type: 'cell', id: 't1', key: 'x', value: 'a\u0301 ž' });
  assert.equal(d.tokens[0].morphology.cells.x, 'á ž');
});
test('alphabet, token lengths, empty draft and no implicit prefix exception', () => {
  for (const s of ['kv', 'á', 'q', 'y', 'kvaziqazi', 'kvazivázy', 'kva zi', 'kvazi.', 'xaz', '😀']) assert.equal(sequence([s]).ok, false, s);
  for (const s of ['k', 'v', 'z', 'a', 'i', 'azi', 'qázi', 'kvázý']) assert.equal(sequence([s]).ok, true, s);
  assert.equal(sequence([]).ok, false);
  assert.equal(deriveValidationState(createDraft()).submitReady, false);
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
test('cycles, dangling links, extra links and valency gate cannot pass syntax', () => {
  const d = fixture();
  d.tokens[0].role = 'object';
  assert.equal(validateSyntax(d).ok, false);
  d.tokens[0].testSlot = 'test'; assert.equal(validateSyntax(d, schema).ok, true);
  d.tokens[0].role = 'attribute'; d.tokens[1].pos = 'noun'; d.tokens[1].role = 'attribute'; d.tokens[1].relations = { head: 't1' };
  assert.ok(validateSyntax(d, schema).issues.some(x => x.message.includes('kruh')));
});
test('confirmation requires every cell, does not assess Czech truth, and uses exact text', () => {
  const d = fixture(), w = d.tokens[0];
  assert.equal(CONFIRMATION, 'Potvrzuji, že toto je můj morfologický návrh.');
  assert.equal(canConfirm(w, schema), true);
  w.morphology.cells['singular-1'] = '   ';
  assert.equal(canConfirm(w, schema), false);
  assert.equal(isConfirmed(w, schema), false);
  const changed = mutateDraft(d, { type: 'confirm', id: w.id }, schema);
  assert.equal(changed.tokens[0].morphology.confirmation, null);
});
test('every confirmed datum invalidates the snapshot, including direct mutation and schema changes', () => {
  for (const [path, value] of [['lemma', 'other'], ['pos', 'adjective'], ['model', 'stroj'], ['identity.gender', 'other'], ['form.case', '2'], ['lexicalStatus', 'real'], ['evidence.morphology', 'other'], ['valency.modelVerb', 'other']]) {
    const d = mutateDraft(fixture(), { type: 'field', id: 't1', path, value }, schema);
    assert.equal(d.tokens[0].morphology.confirmation, null, path);
    assert.equal(deriveValidationState(d, schema).submitReady, false, path);
  }
  const d = mutateDraft(fixture(), { type: 'cell', id: 't1', key: 'singular-1', value: 'other' }, schema);
  assert.equal(isConfirmed(d.tokens[0], schema), false);
  const raw = fixture(); raw.tokens[0].lemma = 'tampered'; assert.equal(isConfirmed(raw.tokens[0], schema), false);
  assert.equal(isConfirmed(fixture().tokens[0], { ...schema, id: 'changed' }), false);
});
test('false-green regression has a true baseline, and preview synchronously revalidates', () => {
  assert.equal(deriveValidationState(fixture(), schema).submitReady, true);
  for (const mutate of [d => { d.tokens[0].relations = {}; }, d => { d.tokens[0].lemma = ''; }, d => { d.tokens[0].morphology.cells['singular-1'] = 'stale'; }, d => { d.sentenceType = ''; }, d => { d.tokens[0].surface = 'bad'; }, d => { d.tokens[1].form.aspect = 'invalid'; }]) {
    const d = fixture(); const old = deriveValidationState(d, schema); assert.equal(old.submitReady, true);
    mutate(d);
    const preview = previewDraft(d, schema);
    assert.equal(preview.validation.submitReady, false);
    assert.equal(preview.submitted, false);
  }
});
test('edit, insert and delete preserve stable IDs and independent references', () => {
  const original = fixture();
  let d = mutateDraft(original, { type: 'insert', anchor: 't1', side: 'after', surface: 'qazi' }, schema);
  assert.deepEqual(d.tokens.map(w => w.id), ['t1', 't3', 't2']);
  assert.equal(d.tokens[0].relations.head, 't2');
  assert.equal(isConfirmed(d.tokens[0], schema), true);
  d = mutateDraft(d, { type: 'surface', id: 't1', value: 'vázi' }, schema);
  assert.equal(d.tokens[0].id, 't1'); assert.equal(d.tokens[0].relations.head, 't2');
  assert.equal(d.tokens[0].lemma, ''); assert.deepEqual(d.tokens[0].morphology.cells, {});
  assert.equal(isConfirmed(d.tokens[2], schema), true);
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
test('production open schema stays gated even if base tables are confirmed', () => {
  const d = fixture();
  d.tokens[0].morphology.confirmation = morphologySnapshot(d.tokens[0]);
  assert.equal(isConfirmed(d.tokens[0]), true);
  const result = deriveValidationState(d);
  assert.equal(result.submitReady, false);
  assert.ok(result.tokens.t1.gates.length);
  assert.ok(result.tokens.t2.gates.length);
  assert.deepEqual(publicSchema.models.verb, {});
  assert.equal(publicSchema.valency, null);
});
test('duplicate identities ignore case, declared real/quasi status, case and number', () => {
  const d = fixture(), duplicate = structuredClone(d.tokens[0]);
  duplicate.id = 't3'; duplicate.lemma = 'TESTNOUN'; duplicate.form.case = '2'; duplicate.lexicalStatus = 'real'; d.tokens.push(duplicate);
  assert.ok(deriveValidationState(d, schema).tokens.t3.missing.some(x => x.includes('identita')));
});
