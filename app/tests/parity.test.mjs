/**
 * Parity test: same deterministic fixture corpus run through both JS (Node) and PHP engines.
 * Verifies that submitReady, charScore, wordCount, morphologyOk, sentenceOk, sequence.ok and
 * syntax.ok agree across engines for all fixture types:
 *   - noun models (pán, hrad, žena, město, stavení, předseda)
 *   - adjective models (mladý, jarní)
 *   - verb models (V-AT, V-IT) × form types (present, lParticiple)
 *   - auxiliary být
 *   - subject/predicate agreement: person, l-participle gender/number, animacy (new)
 *   - prefix/sequence/government rules
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

test('parity: noun form-check correct fixtures both engines morphologyOk=true', () => {
  const correctForms = [
    'noun-pán-pl1-correct',
    'noun-hrad-sg1-correct',
    'noun-žena-sg1-correct',
    'noun-žena-sg2-correct',
    'noun-město-sg1-correct',
    'noun-stavení-sg1-correct',
    'noun-předseda-sg1-correct',
  ];
  for (const name of correctForms) {
    const draft = FIXTURES[name];
    const js  = deriveValidationState(draft);
    const php = phpValidate(draft);
    assert.ok(js.morphologyOk,  `JS ${name}: morphologyOk should be true`);
    assert.ok(php.morphologyOk, `PHP ${name}: morphologyOk should be true`);
  }
});

test('parity: noun-pán-sg2-wrong-form both engines morphologyOk=false', () => {
  const draft = FIXTURES['noun-pán-sg2-wrong-form'];
  const js  = deriveValidationState(draft);
  const php = phpValidate(draft);
  assert.equal(js.morphologyOk,  false, 'JS: pán sg-2 wrong surface → morphologyOk should be false');
  assert.equal(php.morphologyOk, false, 'PHP: pán sg-2 wrong surface → morphologyOk should be false');
});

test('parity: verb form-check correct fixtures both engines morphologyOk=true', () => {
  const correctVerbs = [
    'verb-V-AT-present-3sg-correct',
    'verb-V-IT-present-3sg-correct',
    'verb-V-AT-lpart-masc-sg-correct',
    'verb-V-AT-lpart-masc-anim-pl-correct',
    'verb-V-AT-lpart-masc-inanim-pl-correct',
  ];
  for (const name of correctVerbs) {
    const draft = FIXTURES[name];
    const js  = deriveValidationState(draft);
    const php = phpValidate(draft);
    assert.ok(js.morphologyOk,  `JS ${name}: morphologyOk should be true`);
    assert.ok(php.morphologyOk, `PHP ${name}: morphologyOk should be true`);
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
