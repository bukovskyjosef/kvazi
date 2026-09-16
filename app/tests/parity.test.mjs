/**
 * Parity test suite — JS (Node) ↔ PHP engine agreement on the same fixture corpus.
 *
 * Strategy (per #90/#93):
 *   1. Surface parity: DFA motif validation, charScore, sequence.ok — both engines agree.
 *   2. Representative active deep: surface-valid fixtures for reachable noun/adj/verb models
 *      verify formCheck.ok/expected parity. Deep-negative fixtures use *different* surface-valid
 *      motifs (not appended chars) so sequence.ok=true and formCheck.ok=false is genuine.
 *   3. Staged notEvaluated: surface-invalid fixtures confirm both engines return
 *      formCheck.status='notEvaluated', formCheck.ok=null — never a false positive/negative.
 *   4. Dormant deep validators (kuře, otcův, matčin, V-NOUT, V-ÝT, V-OVAT) are exercised
 *      in unit tests (morpho.test.mjs) where validateForm is called directly without the
 *      surface gate. The parity suite does not cover them because their motif surfaces are
 *      currently unreachable, but the implementation is preserved.
 *   5. Structural, agreement, government, closed-enum and tampering parity round out the suite.
 *
 * Requires:
 *   - global.__normative set before morpho calls (done below)
 *   - PHP ≥ 8.1 with intl extension on PATH
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

import { deriveValidationState } from '../public/js/konfigurator/validation.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot    = join(__dirname, '..');

// Initialise normative data for JS engine.
const { version: _ndVersion } = JSON.parse(readFileSync(join(appRoot, 'data/active-release.json'), 'utf8'));
global.__normative = JSON.parse(readFileSync(join(appRoot, `data/rules/${_ndVersion}/normative.json`), 'utf8'));

// ── PHP runner helper ─────────────────────────────────────────────────────────

function phpValidate(draft) {
  const runner = join(__dirname, 'run-php-validator.php');
  const input  = JSON.stringify(draft);
  const out    = execSync(`php ${runner}`, { input, timeout: 10000 });
  return JSON.parse(out.toString('utf8'));
}

// ── Token factory ─────────────────────────────────────────────────────────────

// Minimal token factory — only the fields both engines need.
function tok(id, surface, overrides = {}) {
  return {
    id, surface,
    kvaziPrefix: surface.toLowerCase().startsWith('kvazi') && [...surface].length > 5 ? 'kvazi' : '',
    pos: '', lemma: '', model: '', lexicalStatus: '',
    identity: { gender: '', animacy: '' },
    form: {}, relations: {}, role: '',
    valency: { modelVerb: '', declaration: '' },
    evidence: { source: '', reference: '', morphology: '', needsAnalogy: false, explanation: '', analogy: '' },
    ...overrides,
  };
}

// Complete noun token with all required fields for structureOk=true.
function nounTok(id, surface, { lemma, model, gender, animacy, caseNum, number, role = 'subject', relations = {} } = {}) {
  return tok(id, surface, {
    pos: 'noun', role, lexicalStatus: 'quasi',
    lemma, model,
    identity: { gender, animacy },
    form: { case: caseNum, number },
    relations,
    evidence: { source: '', reference: '', morphology: 'parity-test', needsAnalogy: false, explanation: '', analogy: '' },
  });
}

// Complete verb token with all required fields for structureOk=true.
function verbTok(id, surface, { lemma, model, verbFormType, aspect = 'perfective', verbPerson, verbGender, number, verbAnimacy, role = 'predicate', relations = {} } = {}) {
  const form = { verbFormType, aspect };
  if (verbPerson !== undefined) form.verbPerson = verbPerson;
  if (verbGender !== undefined) form.verbGender = verbGender;
  if (number !== undefined) form.number = number;
  if (verbAnimacy !== undefined) form.verbAnimacy = verbAnimacy;
  return tok(id, surface, {
    pos: 'verb', role, lexicalStatus: 'quasi',
    lemma, model,
    form,
    relations,
    valency: { modelVerb: '', declaration: 'parity-test' },
    evidence: { source: '', reference: '', morphology: 'parity-test', needsAnalogy: false, explanation: '', analogy: '' },
  });
}

// Two-token declarative sentence with noun subject + verb predicate.
// Uses surfaces 'kvazi' (K→1→2→3→4→0) and 'kvázi' (K→1→2→3→4→0) — both valid DFA motifs.
function subjectPredicateDraft(subjectOverrides, predicateOverrides) {
  return {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [
      nounTok('t1', 'kvazi', { ...subjectOverrides, relations: { head: 't2' } }),
      verbTok('t2', 'kvázi', { ...predicateOverrides, relations: {} }),
    ],
  };
}

// ── Fixture corpus ────────────────────────────────────────────────────────────

const FIXTURES = {

  // ── Original sequence/scoring fixtures ──────────────────────────────────────

  // 1. Empty draft — no tokens
  'empty-draft': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [],
  },

  // 2. Single valid DFA token 'vazi' (VAZI = 4 chars, charScore 4)
  'single-vazi': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [tok('t1', 'vazi', { pos: 'noun', role: 'subject', relations: { head: 't1' } })],
  },

  // 3. Two tokens: 'kvazi' (5 chars, no prefix) + 'kvaziqazi' (prefix → 4 scoring chars)
  'kvazi-prefix-scoring': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [
      tok('t1', 'kvazi', { pos: 'noun', role: 'subject', relations: { head: 't2' } }),
      tok('t2', 'kvaziqazi', {
        pos: 'noun', role: 'subject',
        kvaziPrefix: 'kvazi',
        relations: { head: 't1' },
      }),
    ],
  },

  // 4. Preposition 'k' with nominal in nominative case (should be dative)
  'prep-govt-violation': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [
      tok('t1', 'k', { pos: 'preposition', role: 'preposition', lexicalStatus: 'real', lemma: 'k', relations: { nominal: 't2' } }),
      tok('t2', 'vazi', { pos: 'noun', role: 'adverbial', lemma: 'vazi', model: 'hrad', lexicalStatus: 'quasi',
        identity: { gender: 'masculine', animacy: 'inanimate' },
        form: { case: '1', number: 'singular' },
        relations: { head: 't1' },
        evidence: { morphology: 'test', needsAnalogy: false, explanation: '', analogy: '' },
      }),
    ],
  },

  // ── Noun form-check fixtures (one token, sentences intentionally incomplete) ─

  // pán (animate masculine, ends_consonant, stem=identity): pl-1 = lemma+'i' = 'kvazi'
  'noun-pán-pl1-correct': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [nounTok('t1', 'kvazi', { lemma: 'kvaz', model: 'pán', gender: 'masculine', animacy: 'animate', caseNum: '1', number: 'plural' })],
  },

  // hrad (inanimate masculine, ends_consonant, stem=identity): sg-1 = lemma+'' = 'kvaz'
  'noun-hrad-sg1-correct': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [nounTok('t1', 'kvaz', { lemma: 'kvaz', model: 'hrad', gender: 'masculine', animacy: 'inanimate', caseNum: '1', number: 'singular' })],
  },

  // žena (feminine, ends_a, drop_1): sg-1 stem=lemma-'a'+'a'=lemma = 'kvaza'
  'noun-žena-sg1-correct': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [nounTok('t1', 'kvaza', { lemma: 'kvaza', model: 'žena', gender: 'feminine', animacy: '', caseNum: '1', number: 'singular' })],
  },

  // žena sg-2 = stem+'y' = 'kvaz'+'y' = 'kvazy'
  'noun-žena-sg2-correct': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [nounTok('t1', 'kvazy', { lemma: 'kvaza', model: 'žena', gender: 'feminine', animacy: '', caseNum: '2', number: 'singular' })],
  },

  // město (neuter, ends_o, drop_1): sg-1 = stem+'o' = 'kvaz'+'o' = 'kvazo'
  'noun-město-sg1-correct': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [nounTok('t1', 'kvazo', { lemma: 'kvazo', model: 'město', gender: 'neuter', animacy: '', caseNum: '1', number: 'singular' })],
  },

  // stavení (neuter, ends_í, drop_1): sg-1 = stem+'í' = 'kvaz'+'í' = 'kvazí'
  'noun-stavení-sg1-correct': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [nounTok('t1', 'kvazí', { lemma: 'kvazí', model: 'stavení', gender: 'neuter', animacy: '', caseNum: '1', number: 'singular' })],
  },

  // předseda (animate masculine, ends_a, drop_1): sg-1 = stem+'a' = 'kvaza'
  'noun-předseda-sg1-correct': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [nounTok('t1', 'kvaza', { lemma: 'kvaza', model: 'předseda', gender: 'masculine', animacy: 'animate', caseNum: '1', number: 'singular' })],
  },

  // Wrong form: pán, sg-2 should be 'kvaza', surface 'kvazi' is wrong
  'noun-pán-sg2-wrong-form': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [nounTok('t1', 'kvazi', { lemma: 'kvaz', model: 'pán', gender: 'masculine', animacy: 'animate', caseNum: '2', number: 'singular' })],
  },

  // ── Adjective form-check fixtures ─────────────────────────────────────────────

  // mladý degree 1, masculineAnimate sg-1: stem=lemma-'ý'+'ý' = 'kvazý'
  'adj-mladý-mascanim-sg1-correct': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [tok('t1', 'kvazý', {
      pos: 'adjective', role: 'agreeingAttribute', lexicalStatus: 'quasi',
      lemma: 'kvazý', model: 'mladý',
      form: { degree: '1', gender: 'masculineAnimate', case: '1', number: 'singular' },
      relations: {},
      evidence: { morphology: 'parity-test', needsAnalogy: false, explanation: '', analogy: '' },
    })],
  },

  // jarní degree 1, neuter sg-1: stem=lemma-'í'+'í' = 'kvazí'
  'adj-jarní-neut-sg1-correct': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [tok('t1', 'kvazí', {
      pos: 'adjective', role: 'agreeingAttribute', lexicalStatus: 'quasi',
      lemma: 'kvazí', model: 'jarní',
      form: { degree: '1', gender: 'neuter', case: '1', number: 'singular' },
      relations: {},
      evidence: { morphology: 'parity-test', needsAnalogy: false, explanation: '', analogy: '' },
    })],
  },

  // ── Verb form-check fixtures ──────────────────────────────────────────────────

  // V-AT present 3rd singular: stem='kvaz', ending='á' → 'kvazá'
  'verb-V-AT-present-3sg-correct': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [verbTok('t1', 'kvazá', { lemma: 'kvazat', model: 'V-AT', verbFormType: 'present', aspect: 'imperfective', verbPerson: '3', number: 'singular' })],
  },

  // V-IT present 3rd singular: stem='kvaz', ending='í' → 'kvazí'
  'verb-V-IT-present-3sg-correct': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [verbTok('t1', 'kvazí', { lemma: 'kvazit', model: 'V-IT', verbFormType: 'present', aspect: 'imperfective', verbPerson: '3', number: 'singular' })],
  },

  // V-AT l-participle masculine singular: stem='kvaz', ending='al' → 'kvazal'
  'verb-V-AT-lpart-masc-sg-correct': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [verbTok('t1', 'kvazal', { lemma: 'kvazat', model: 'V-AT', verbFormType: 'lParticiple', aspect: 'perfective', verbGender: 'masculine', number: 'singular' })],
  },

  // V-AT l-participle masculine plural animate: stem='kvaz', ending='ali' → 'kvazali'
  'verb-V-AT-lpart-masc-anim-pl-correct': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [verbTok('t1', 'kvazali', { lemma: 'kvazat', model: 'V-AT', verbFormType: 'lParticiple', aspect: 'perfective', verbGender: 'masculine', number: 'plural', verbAnimacy: 'animate' })],
  },

  // V-AT l-participle masculine plural inanimate: stem='kvaz', ending='aly' → 'kvazaly'
  'verb-V-AT-lpart-masc-inanim-pl-correct': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [verbTok('t1', 'kvazaly', { lemma: 'kvazat', model: 'V-AT', verbFormType: 'lParticiple', aspect: 'perfective', verbGender: 'masculine', number: 'plural', verbAnimacy: 'inanimate' })],
  },

  // ── Auxiliary být form-check ──────────────────────────────────────────────────

  // 'jsme' is in the normative aux_byt_forms closed set
  'aux-byt-jsme-valid': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [tok('t1', 'jsme', {
      pos: 'verb', role: 'auxiliary', lexicalStatus: 'real',
      lemma: 'být',
      model: '',
      form: {},
      relations: { predicate: 't1' }, // self-loop to satisfy shape; syntax will fail but both agree
      evidence: { morphology: 'parity-test', needsAnalogy: false, explanation: '', analogy: '' },
    })],
  },

  // ── Subject/predicate agreement fixtures (two valid DFA tokens) ───────────────

  // Present tense, 3rd person with noun subject → no agreement error
  'agreement-present-3sg-ok': subjectPredicateDraft(
    { lemma: 'kvaz', model: 'pán', gender: 'masculine', animacy: 'animate', caseNum: '1', number: 'singular' },
    { lemma: 'kvazat', model: 'V-AT', verbFormType: 'present', verbPerson: '3', number: 'singular' }
  ),

  // Present tense, 1st person with noun subject → person mismatch
  'agreement-present-1sg-person-mismatch': subjectPredicateDraft(
    { lemma: 'kvaz', model: 'pán', gender: 'masculine', animacy: 'animate', caseNum: '1', number: 'singular' },
    { lemma: 'kvazat', model: 'V-AT', verbFormType: 'present', verbPerson: '1', number: 'singular' }
  ),

  // L-participle: animate noun subject + animate plural l-participle → animacy matches
  'agreement-lpart-animacy-match': subjectPredicateDraft(
    { lemma: 'kvaz', model: 'pán', gender: 'masculine', animacy: 'animate', caseNum: '1', number: 'plural' },
    { lemma: 'kvazat', model: 'V-AT', verbFormType: 'lParticiple', verbGender: 'masculine', number: 'plural', verbAnimacy: 'animate' }
  ),

  // L-participle: animate noun subject + inanimate plural l-participle → animacy mismatch
  'agreement-lpart-animate-inanimate-mismatch': subjectPredicateDraft(
    { lemma: 'kvaz', model: 'pán', gender: 'masculine', animacy: 'animate', caseNum: '1', number: 'plural' },
    { lemma: 'kvazat', model: 'V-AT', verbFormType: 'lParticiple', verbGender: 'masculine', number: 'plural', verbAnimacy: 'inanimate' }
  ),

  // L-participle: inanimate noun subject + animate plural l-participle → animacy mismatch
  'agreement-lpart-inanimate-animate-mismatch': subjectPredicateDraft(
    { lemma: 'kvaz', model: 'hrad', gender: 'masculine', animacy: 'inanimate', caseNum: '1', number: 'plural' },
    { lemma: 'kvazat', model: 'V-AT', verbFormType: 'lParticiple', verbGender: 'masculine', number: 'plural', verbAnimacy: 'animate' }
  ),

  // ── Prefix sequence fixtures ──────────────────────────────────────────────────

  // 'kvaziaz' = kvazi(5) + az(2) → base 2 chars < tokenMinChars(3) → sequence error
  'prefix-base-too-short': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [tok('t1', 'kvaziaz', {
      kvaziPrefix: 'kvazi',
      pos: 'noun', role: 'subject',
    })],
  },

  // 'kvazikvazikvaz' = kvazi(5) + kvazikvaz(9) → base 9 chars > tokenMaxChars(5) → sequence error
  'prefix-base-too-long': {
    sentenceType: 'declarative',
    implicitSubject: false,
    tokens: [tok('t1', 'kvazikvazikvaz', {
      kvaziPrefix: 'kvazi',
      pos: 'noun', role: 'subject',
    })],
  },

};

// ── Parity assertions ─────────────────────────────────────────────────────────

for (const [name, draft] of Object.entries(FIXTURES)) {
  test(`parity: ${name}`, () => {
    const js  = deriveValidationState(draft);
    const php = phpValidate(draft);

    // Core boolean and score fields must match exactly.
    assert.equal(js.submitReady,   php.submitReady,   `${name}: submitReady`);
    assert.equal(js.charScore,     php.charScore,     `${name}: charScore`);
    assert.equal(js.wordCount,     php.wordCount,     `${name}: wordCount`);
    assert.equal(js.sequence.ok,   php.sequence.ok,   `${name}: sequence.ok`);
    assert.equal(js.syntax.ok,     php.syntax.ok,     `${name}: syntax.ok`);
    assert.equal(js.morphologyOk,  php.morphologyOk,  `${name}: morphologyOk`);
    assert.equal(js.sentenceOk,    php.sentenceOk,    `${name}: sentenceOk`);
  });
}

// ── Specific assertions ───────────────────────────────────────────────────────

test('parity: prep-govt-violation both engines flag government error', () => {
  const draft = FIXTURES['prep-govt-violation'];
  const js    = deriveValidationState(draft);
  const php   = phpValidate(draft);

  const jsMsg  = js.syntax.issues.map(i => i.message).join(' | ');
  const phpMsg = (php.syntax.issues ?? []).map(i => i.message).join(' | ');

  assert.ok(jsMsg.includes('k') && jsMsg.includes('3'),
    `JS should mention 'k' and case '3'. Got: ${jsMsg}`);
  assert.ok(phpMsg.includes('k') && phpMsg.includes('3'),
    `PHP should mention 'k' and case '3'. Got: ${phpMsg}`);
});

test('parity: surface-valid noun form-check correct fixtures both engines morphologyOk=true', () => {
  // Only surface-valid fixtures are tested for active deep morphology parity.
  // Surface-invalid fixtures (žena-sg1, město, předseda) get notEvaluated — tested separately.
  const surfaceValidCorrectForms = [
    'noun-pán-pl1-correct',     // kvazi — surface-valid
    'noun-hrad-sg1-correct',    // kvaz — surface-valid
    'noun-žena-sg2-correct',    // kvazy — surface-valid
    'noun-stavení-sg1-correct', // kvazí — surface-valid
  ];
  for (const name of surfaceValidCorrectForms) {
    const draft = FIXTURES[name];
    const js  = deriveValidationState(draft);
    const php = phpValidate(draft);
    assert.ok(js.morphologyOk,  `JS ${name}: morphologyOk should be true`);
    assert.ok(php.morphologyOk, `PHP ${name}: morphologyOk should be true`);
  }
});

test('parity: surface-invalid noun correct fixtures get notEvaluated in both engines', () => {
  const surfaceInvalidCorrectForms = [
    'noun-žena-sg1-correct',    // kvaza — surface-invalid
    'noun-město-sg1-correct',   // kvazo — surface-invalid
    'noun-předseda-sg1-correct',// kvaza — surface-invalid
  ];
  for (const name of surfaceInvalidCorrectForms) {
    const draft = FIXTURES[name];
    const js  = deriveValidationState(draft);
    const php = phpValidate(draft);
    assert.equal(js.sequence.ok, false, `JS ${name}: surface should fail`);
    assert.equal(php.sequence.ok, false, `PHP ${name}: surface should fail`);
    assert.equal(js.tokens.t1.formCheck.status, 'notEvaluated', `JS ${name}: deep should be notEvaluated`);
    assert.equal(php.tokens.t1.formCheck.status, 'notEvaluated', `PHP ${name}: deep should be notEvaluated`);
    assert.equal(js.morphologyOk, false, `JS ${name}: morphologyOk false`);
    assert.equal(php.morphologyOk, false, `PHP ${name}: morphologyOk false`);
  }
});

test('parity: noun-pán-sg2-wrong-form both engines morphologyOk=false', () => {
  const draft = FIXTURES['noun-pán-sg2-wrong-form'];
  const js  = deriveValidationState(draft);
  const php = phpValidate(draft);
  assert.equal(js.morphologyOk,  false, 'JS: pán sg-2 wrong surface → morphologyOk should be false');
  assert.equal(php.morphologyOk, false, 'PHP: pán sg-2 wrong surface → morphologyOk should be false');
});

test('parity: verb V-IT form-check correct (surface-valid kvazí)', () => {
  // Only V-IT present 3sg (kvazí) is surface-valid and reaches deep morpho.
  // V-AT fixtures (kvazá, kvazal, kvazali) are surface-invalid → tested as notEvaluated below.
  const draft = FIXTURES['verb-V-IT-present-3sg-correct'];
  const js  = deriveValidationState(draft);
  const php = phpValidate(draft);
  assert.ok(js.morphologyOk,  'JS verb-V-IT: morphologyOk should be true');
  assert.ok(php.morphologyOk, 'PHP verb-V-IT: morphologyOk should be true');
});

test('parity: V-AT verb fixtures are surface-invalid → notEvaluated', () => {
  for (const name of ['verb-V-AT-present-3sg-correct', 'verb-V-AT-lpart-masc-sg-correct',
                       'verb-V-AT-lpart-masc-anim-pl-correct', 'verb-V-AT-lpart-masc-inanim-pl-correct']) {
    const draft = FIXTURES[name];
    const js  = deriveValidationState(draft);
    const php = phpValidate(draft);
    assert.equal(js.tokens.t1.formCheck.status,  'notEvaluated', `JS ${name}: staged notEvaluated`);
    assert.equal(php.tokens.t1.formCheck.status, 'notEvaluated', `PHP ${name}: staged notEvaluated`);
  }
});

test('parity: agreement-present-3sg-ok both engines sentenceOk=true', () => {
  const draft = FIXTURES['agreement-present-3sg-ok'];
  const js  = deriveValidationState(draft);
  const php = phpValidate(draft);
  assert.ok(js.sentenceOk,  'JS: 3rd person noun subject agreement should pass');
  assert.ok(php.sentenceOk, 'PHP: 3rd person noun subject agreement should pass');
});

test('parity: agreement-present-1sg-person-mismatch both engines sentenceOk=false', () => {
  const draft = FIXTURES['agreement-present-1sg-person-mismatch'];
  const js  = deriveValidationState(draft);
  const php = phpValidate(draft);
  assert.equal(js.sentenceOk,  false, 'JS: 1st person with noun subject should fail');
  assert.equal(php.sentenceOk, false, 'PHP: 1st person with noun subject should fail');
});

test('parity: agreement-lpart-animacy-match both engines sentenceOk=true', () => {
  const draft = FIXTURES['agreement-lpart-animacy-match'];
  const js  = deriveValidationState(draft);
  const php = phpValidate(draft);
  assert.ok(js.sentenceOk,  'JS: matching animacy should pass');
  assert.ok(php.sentenceOk, 'PHP: matching animacy should pass');
});

test('parity: agreement-lpart-animate-inanimate-mismatch both engines sentenceOk=false with animacy message', () => {
  const draft = FIXTURES['agreement-lpart-animate-inanimate-mismatch'];
  const js  = deriveValidationState(draft);
  const php = phpValidate(draft);
  assert.equal(js.sentenceOk,  false, 'JS: animate/inanimate mismatch should fail');
  assert.equal(php.sentenceOk, false, 'PHP: animate/inanimate mismatch should fail');
  const jsMsg  = js.sentenceIssues.join(' | ');
  const phpMsg = (php.sentenceIssues ?? []).join(' | ');
  assert.ok(jsMsg.includes('inanimate'),  `JS sentenceIssues should mention 'inanimate'. Got: ${jsMsg}`);
  assert.ok(phpMsg.includes('inanimate'), `PHP sentenceIssues should mention 'inanimate'. Got: ${phpMsg}`);
});

test('parity: agreement-lpart-inanimate-animate-mismatch both engines sentenceOk=false', () => {
  const draft = FIXTURES['agreement-lpart-inanimate-animate-mismatch'];
  const js  = deriveValidationState(draft);
  const php = phpValidate(draft);
  assert.equal(js.sentenceOk,  false, 'JS: inanimate/animate mismatch should fail');
  assert.equal(php.sentenceOk, false, 'PHP: inanimate/animate mismatch should fail');
});

test('parity: prefix-base-too-short both engines sequence.ok=false', () => {
  const draft = FIXTURES['prefix-base-too-short'];
  const js  = deriveValidationState(draft);
  const php = phpValidate(draft);
  assert.equal(js.sequence.ok,  false, 'JS: too-short prefix base should fail sequence');
  assert.equal(php.sequence.ok, false, 'PHP: too-short prefix base should fail sequence');
});

test('parity: prefix-base-too-long both engines sequence.ok=false', () => {
  const draft = FIXTURES['prefix-base-too-long'];
  const js  = deriveValidationState(draft);
  const php = phpValidate(draft);
  assert.equal(js.sequence.ok,  false, 'JS: too-long prefix base should fail sequence');
  assert.equal(php.sequence.ok, false, 'PHP: too-long prefix base should fail sequence');
});

// ── Parity helper ────────────────────────────────────────────────────────────

function both(draft) {
  const js = deriveValidationState(draft), php = phpValidate(draft);
  for (const key of ['submitReady','charScore','wordCount','structureOk','morphologyOk','sentenceOk'])
    assert.equal(js[key], php[key], key);
  for (const key of ['syntax','sequence']) assert.equal(js[key].ok, php[key].ok, key);
  for (const w of draft.tokens) {
    const jsfc = js.tokens[w.id].formCheck, phpfc = php.tokens[w.id].formCheck;
    assert.equal(jsfc.ok, phpfc.ok, `${w.id}: formCheck.ok`);
    assert.equal(jsfc.expected ?? null, phpfc.expected ?? null, `${w.id}: expected surface`);
    // Staged semantics: notEvaluated status must match between engines.
    assert.equal(jsfc.status ?? undefined, phpfc.status ?? undefined, `${w.id}: formCheck.status`);
  }
  return js;
}
function isolated(w) { return {sentenceType:'declarative', implicitSubject:false, tokens:[w]}; }

// ── Representative active deep parity (surface-valid fixtures only) ──────────

// Surface-valid noun models: pán (kvazi), hrad (kvaz), žena-sg2 (kvazy), stavení (kvazí)
// Deep-negative: a *different* surface-valid motif that doesn't match the expected form.
const surfaceValidNouns = [
  ['pán','kvaz','kvazi','plural','1','kvaz'],      // expects kvazi, wrong = kvaz
  ['hrad','kvaz','kvaz','singular','1','kvazi'],    // expects kvaz, wrong = kvazi
  ['žena','kvaza','kvazy','singular','2','kvazi'],  // expects kvazy, wrong = kvazi
  ['stavení','kvazí','kvazí','singular','1','kvazi'],// expects kvazí, wrong = kvazi
];
for (const [model,lemma,surface,number,caseNum,wrongSurface] of surfaceValidNouns) {
  test(`active deep parity noun ${model}`, () => {
    const {gender,animacy=''} = global.__normative.noun_models[model];
    const w = nounTok('t1',surface,{lemma,model,gender,animacy,number,caseNum});
    const pos = both(isolated(w));
    assert.equal(pos.morphologyOk, true);
    assert.equal(pos.sequence.ok, true, 'positive fixture must be surface-valid');
    // Deep-negative: surface-valid wrong form triggers formCheck.ok=false, not surface gate.
    w.surface = wrongSurface;
    const neg = both(isolated(w));
    assert.equal(neg.sequence.ok, true, 'negative fixture must be surface-valid');
    assert.equal(neg.tokens.t1.formCheck.ok, false, 'deep morphology must reject wrong form');
    assert.equal(neg.morphologyOk, false);
  });
}

// Surface-valid verb: V-IT present 3sg (kvazí)
test('active deep parity verb V-IT present 3sg', () => {
  const w = verbTok('t1','kvazí',{lemma:'kvazit',model:'V-IT',verbFormType:'present',verbPerson:'3',number:'singular'});
  const pos = both(isolated(w));
  assert.equal(pos.morphologyOk, true);
  assert.equal(pos.sequence.ok, true, 'positive fixture must be surface-valid');
  // Deep-negative: kvazý is surface-valid but wrong for V-IT present 3sg (expects kvazí).
  w.surface='kvazý';
  const neg = both(isolated(w));
  assert.equal(neg.sequence.ok, true, 'negative fixture must be surface-valid');
  assert.equal(neg.tokens.t1.formCheck.ok, false, 'deep morphology must reject wrong form');
  assert.equal(neg.morphologyOk, false);
});

// Surface-valid adjectives: mladý (kvazý), jarní (kvazí)
// Deep-negative: swap surfaces (kvazý ↔ kvazí) — both surface-valid, wrong for the other model.
for (const [model,lemma,surface,wrongSurface] of [['mladý','kvazý','kvazý','kvazí'],['jarní','kvazí','kvazí','kvazý']]) {
  test(`active deep parity adjective ${model}`, () => {
    const w=tok('t1',surface,{pos:'adjective',lemma,model,identity:{},lexicalStatus:'quasi',role:'agreeingAttribute',
      form:{gender:'masculineAnimate',number:'singular',case:'1',degree:'1'},evidence:{morphology:'test',needsAnalogy:false}});
    const pos = both(isolated(w));
    assert.equal(pos.morphologyOk, true);
    assert.equal(pos.sequence.ok, true, 'positive fixture must be surface-valid');
    // Deep-negative: surface-valid wrong form.
    w.surface = wrongSurface;
    const neg = both(isolated(w));
    assert.equal(neg.sequence.ok, true, 'negative fixture must be surface-valid');
    assert.equal(neg.tokens.t1.formCheck.ok, false, 'deep morphology must reject wrong form');
    assert.equal(neg.morphologyOk, false);
  });
}

// NFC form parity (surface-valid: kvazí via NFC normalization)
test('NFC form parity',()=> {
  const w=nounTok('t1','kvazi\u0301',{lemma:'kvazi\u0301',model:'stavení',gender:'neuter',animacy:'',number:'singular',caseNum:'1'});
  assert.equal(both(isolated(w)).morphologyOk,true);
});

// ── Staged notEvaluated parity: surface-invalid fixtures ─────────────────────

test('staged parity: surface-invalid token gets notEvaluated formCheck in both engines', () => {
  // kvaze is surface-invalid (fails DFA motif check)
  const w = nounTok('t1','kvaze',{lemma:'kvaze',model:'růže',gender:'feminine',animacy:'',number:'singular',caseNum:'1'});
  const result = both(isolated(w));
  assert.equal(result.sequence.ok, false, 'surface should fail');
  assert.equal(result.morphologyOk, false, 'morphologyOk false when deep not evaluated');
  assert.equal(result.tokens.t1.formCheck.status, 'notEvaluated', 'formCheck should be notEvaluated');
  assert.equal(result.tokens.t1.formCheck.ok, null, 'formCheck.ok should be null');
});

test('staged parity: surface-invalid verb gets notEvaluated formCheck in both engines', () => {
  // kvazal is surface-invalid
  const w = verbTok('t1','kvazal',{lemma:'kvazat',model:'V-AT',verbFormType:'lParticiple',verbGender:'masculine',number:'singular'});
  const result = both(isolated(w));
  assert.equal(result.sequence.ok, false);
  assert.equal(result.tokens.t1.formCheck.status, 'notEvaluated');
  assert.equal(result.tokens.t1.formCheck.ok, null);
});

// ── Agreement parity (surface-valid two-token drafts: kvazí + kvazí) ─────────

for (const sn of ['singular','plural']) for (const vn of ['singular','plural']) {
  test(`agreement noun ${sn} verb 3.${vn}`, () => {
    const d=subjectPredicateDraft(
      {lemma:'kvazí',model:'stavení',gender:'neuter',animacy:'',caseNum:'1',number:sn},
      {lemma:'kvazit',model:'V-IT',verbFormType:'present',verbPerson:'3',number:vn});
    d.tokens[0].surface='kvazí';d.tokens[1].surface='kvazí';
    const result=both(d);
    assert.equal(result.sentenceOk,sn===vn);
    assert.equal(result.submitReady,sn===vn);
  });
}

// ── Closed enum / field integrity parity ─────────────────────────────────────

for (const aspect of ['imperfective','perfective','biaspectual','banana']) {
  test(`closed aspect ${aspect}`,()=> {
    const w=verbTok('t1','kvazí',{lemma:'kvazit',model:'V-IT',verbFormType:'present',verbPerson:'3',number:'singular',aspect});
    assert.equal(both(isolated(w)).structureOk,aspect!=='banana');
  });
}
for (const [field,value] of Object.entries({number:'banana',verbPerson:'4',verbGender:'banana',verbAnimacy:'banana',verbFormType:'banana',case:'8',degree:'4',gender:'banana'})) {
  test(`closed field ${field} rejects ${value}`,()=> {
    const w=verbTok('t1','kvazí',{lemma:'kvazit',model:'V-IT',verbFormType:'present',verbPerson:'3',number:'singular'});
    w.form[field]=value;
    assert.equal(both(isolated(w)).structureOk,false);
  });
}

// ── Remaining structural/surface parity ──────────────────────────────────────

test('pronoun declaration parity',()=> {
  // Pronoun with surface-valid motif so the surface gate passes and structure is evaluated.
  const w=tok('t1','kvazi',{pos:'pronoun',lemma:'kvazi',lexicalStatus:'real',role:'subject',evidence:{morphology:'test',needsAnalogy:false}});
  assert.equal(both(isolated(w)).structureOk,true);
});
// Government parity: each preposition needs a surface-valid motif pair.
// k+vazi=KVAZI ✓, v+azi=VAZI ✓. z+noun is inherently surface-invalid (Z at
// motif pos 4 needs I/Í/Y/Ý immediately → single char < minChars). z-government
// is tested via the original prep-govt-violation fixture (k surface, z case rules
// checked structurally by the engine) and in unit tests.
const govtNounSurfaces = { k: 'vazi', v: 'azi' };
for (const [prep,caseNum,ok] of [['k','3',true],['k','2',false],['v','4',true],['v','6',true],['v','3',false]]) {
  test(`government ${prep}/${caseNum}`,()=> {
    const d=structuredClone(FIXTURES['prep-govt-violation']);
    d.tokens[0].surface=prep;d.tokens[0].lemma=prep;
    d.tokens[1].surface=govtNounSurfaces[prep];d.tokens[1].lemma=govtNounSurfaces[prep];
    d.tokens[1].form.case=caseNum;
    const result=both(d);
    assert.equal(result.syntax.issues.some(i=>i.message.includes('vyžaduje') && i.message.includes('pád')), !ok);
  });
}
// z-government: z+noun is surface-invalid → syntax not evaluated (staged gate).
for (const [caseNum,ok] of [['2',true],['1',false]]) {
  test(`government z/${caseNum} (surface-invalid, staged)`,()=> {
    const d=structuredClone(FIXTURES['prep-govt-violation']);
    d.tokens[0].surface='z';d.tokens[0].lemma='z';d.tokens[1].form.case=caseNum;
    const result=both(d);
    assert.equal(result.sequence.ok, false, 'z+vazi is surface-invalid');
    assert.deepEqual(result.syntax.issues, [], 'syntax not run when surface-invalid');
  });
}
for (const [surface,score] of [['kvaziqazi',4],['qaziqazi',8],['kváziqazi',9],['kvaziaz',7],['kvazikvazikvaz',14],['kvazi😀azi',9]]) {
  test(`prefix score ${surface}`,()=> {assert.equal(both(isolated(tok('t1',surface,{pos:'noun'}))).charScore,score);});
}
test('duplicate noun identities rejected',()=> {
  const d=structuredClone(FIXTURES['noun-pán-pl1-correct']);
  d.tokens.push({...structuredClone(d.tokens[0]),id:'t2'});
  assert.equal(both(d).structureOk,false);
});
test('cycle rejected',()=> {assert.equal(both(FIXTURES['kvazi-prefix-scoring']).syntax.ok,false);});
for (const surfaces of [['k','v','azi'],['kvaz','i'],['kvazi','kvazi'],['kvazik'],['xazi'],['k','k']]) {
  test(`token boundary ${surfaces.join(' ')}`,()=> {
    const result=both({sentenceType:'declarative',tokens:surfaces.map((s,i)=>tok(`t${i}`,s))});
    assert.equal(result.sequence.ok, ['k v azi','kvaz i','kvazi kvazi'].includes(surfaces.join(' ')));
  });
}

for (const field of ['sentenceType','pos','role','lexicalStatus','model']) {
  test(`closed ${field}: direct client cannot bypass UI`,()=> {
    const d=structuredClone(FIXTURES['verb-V-IT-present-3sg-correct']);
    if(field==='sentenceType') d[field]='banana';else d.tokens[0][field]='banana';
    const result=both(d);
    assert.equal(result.submitReady,false);
    if(field==='sentenceType') assert.equal(result.sentenceOk,false);
    else if(field==='role') assert.equal(result.syntax.ok,false);
    else assert.equal(result.structureOk,false);
  });
}
for (const field of ['gender','animacy']) test(`noun identity ${field} rejects invalid enum`,()=> {
  const d=structuredClone(FIXTURES['noun-pán-pl1-correct']);d.tokens[0].identity[field]='banana';
  assert.equal(both(d).structureOk,false);
});
for (const [field,value] of [['verbGender','feminine'],['number','singular']]) test(`lParticiple agreement ${field} mismatch`,()=> {
  const d=structuredClone(FIXTURES['agreement-lpart-animacy-match']);d.tokens[1].form[field]=value;
  assert.equal(both(d).sentenceOk,false);
});
test('invalid prefix motif receives no score exemption',()=> {
  assert.equal(both(isolated(tok('t1','kvazivázy',{pos:'noun'}))).charScore,9);
});
test('closing punctuation must match declared type',()=> {
  const d=structuredClone(FIXTURES['agreement-present-3sg-ok']);d.closingPunct='!';
  assert.equal(both(d).sentenceOk,false);
});
for (const surface of ['k','v','z','a','i']) test(`single exception ${surface}`,()=> {
  assert.equal(both(isolated(tok('t1',surface))).sequence.ok,true);
});

// Normative expectations are explicit for each engine, rather than parity alone.
for (const [sentenceType, verbFormType, implicitSubject, expected] of [
  ['imperative', 'imperative', true, true],
  ['imperative', 'present', true, false],
  ['declarative', 'imperative', true, false],
  ['interrogative', 'imperative', true, false],
  ['declarative', 'present', false, true],
]) {
  test(`normative implicit subject: ${sentenceType}/${verbFormType}/${implicitSubject}`, () => {
    const verb = verbTok('t2', verbFormType === 'imperative' ? 'kvazi' : 'kvazí', {
      lemma: verbFormType === 'imperative' ? 'kvaziit' : 'kvazit', model: 'V-IT',
      verbFormType, aspect: 'imperfective', verbPerson: verbFormType === 'imperative' ? '2sg' : '3', number: 'plural',
    });
    const draft = {sentenceType, implicitSubject, tokens: [verb]};
    if (!implicitSubject) draft.tokens.unshift(nounTok('t1', 'kvazi', {
      lemma: 'kvaz', model: 'pán', gender: 'masculine', animacy: 'animate',
      caseNum: '1', number: 'plural', relations: {head: 't2'},
    }));
    for (const validate of [deriveValidationState, phpValidate]) {
      const result = validate(draft);
      assert.equal(result.sequence.ok, true);
      assert.equal(result.tokens.t2.formCheck.ok, true, 'verb itself is morphologically valid');
      assert.equal(result.sentenceOk, expected);
      assert.equal(result.submitReady, expected, JSON.stringify(result));
    }
  });
}
