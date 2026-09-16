/**
 * Parity test: same deterministic fixture corpus run through both JS (Node) and PHP engines.
 * Compares verdicts, score and per-token morphology against independent expected
 * surfaces for all 14 noun models, 4 adjective models, 5 verb models and branches.
 * Unreachable surfaces remain positive morphology cases, with separate surface verdicts.
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

// Independent expected surfaces from the normative tables (including unreachable
// surfaces): morphology must pass even when the separate character layer fails.
const nounExamples = [
  ['pán','kvaz','kvazi','plural','1'], ['muž','kvaz','kvaze','singular','2'],
  ['předseda','kvaza','kvazové','plural','1'], ['soudce','kvaze','kvazi','singular','3'],
  ['hrad','kvaz','kvazu','singular','2'], ['stroj','kvaz','kvazem','singular','7'],
  ['žena','kvaza','kvazy','singular','2'], ['růže','kvaze','kvazí','plural','2'],
  ['píseň','kvaz','kvaze','plural','1'], ['kost','kvaz','kvazmi','plural','7'],
  ['město','kvazo','kvaza','plural','1'], ['moře','kvaze','kvazím','plural','3'],
  ['kuře','kvaze','kvazete','singular','2'], ['stavení','kvazí','kvazími','plural','7'],
];
function both(draft) {
  const js = deriveValidationState(draft), php = phpValidate(draft);
  for (const key of ['submitReady','charScore','wordCount','structureOk','morphologyOk','sentenceOk'])
    assert.equal(js[key], php[key], key);
  for (const key of ['syntax','sequence']) assert.equal(js[key].ok, php[key].ok, key);
  for (const w of draft.tokens) {
    assert.equal(js.tokens[w.id].formCheck.ok, php.tokens[w.id].formCheck.ok, `${w.id}: formCheck`);
    assert.equal(js.tokens[w.id].formCheck.expected, php.tokens[w.id].formCheck.expected, `${w.id}: expected surface`);
  }
  return js;
}
function isolated(w) { return {sentenceType:'declarative', implicitSubject:false, tokens:[w]}; }
for (const [model,lemma,surface,number,caseNum] of nounExamples) {
  test(`model parity noun ${model}`, () => {
    const {gender,animacy=''} = global.__normative.noun_models[model];
    const w = nounTok('t1',surface,{lemma,model,gender,animacy,number,caseNum});
    assert.equal(both(isolated(w)).morphologyOk,true);
    w.surface += 'x';
    assert.equal(both(isolated(w)).morphologyOk,false);
  });
}
test('model parity kuře extended plural stem', () => {
  const w = nounTok('t1','kvazatům',{lemma:'kvaze',model:'kuře',gender:'neuter',animacy:'',number:'plural',caseNum:'3'});
  assert.equal(both(isolated(w)).morphologyOk,true);
  w.surface='kvazetům'; assert.equal(both(isolated(w)).morphologyOk,false);
});
const verbExamples = [
  ['V-AT','kvazat','kvazá','kvazej','kvazal'],
  ['V-IT','kvazit','kvazí','kvaz','kvazil'],
  ['V-NOUT','kvaznout','kvazne','kvazni','kvaznul'],
  ['V-ÝT','kvazýt','kvazyje','kvazyj','kvazyl'],
  ['V-OVAT','kvazovat','kvazuje','kvazuj','kvazoval'],
];
for (const [model,lemma,present,imperative,lParticiple] of verbExamples) {
  for (const [verbFormType,surface] of Object.entries({present,imperative,lParticiple})) {
    test(`model parity verb ${model} ${verbFormType}`, () => {
      const form = verbFormType === 'present' ? {verbPerson:'3',number:'singular'}
        : verbFormType === 'imperative' ? {verbPerson:'2sg'} : {verbGender:'masculine',number:'singular'};
      const w = verbTok('t1',surface,{lemma,model,verbFormType,...form});
      assert.equal(both(isolated(w)).morphologyOk,true);
      w.surface+='x'; assert.equal(both(isolated(w)).morphologyOk,false);
    });
  }
}
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
for (const [model,lemma,surface,identity] of [
  ['mladý','kvazý','kvazý',{}], ['jarní','kvazí','kvazí',{}],
  ['otcův','kvazův','kvazův',{sourceNounLemma:'kvaz',sourceNounModel:'pán'}],
  ['matčin','kvazin','kvazin',{sourceNounLemma:'kvaza',sourceNounModel:'žena'}],
]) test(`model parity adjective ${model}`,()=> {
  const w=tok('t1',surface,{pos:'adjective',lemma,model,identity,lexicalStatus:'quasi',role:'agreeingAttribute',
    form:{gender:'masculineAnimate',number:'singular',case:'1',degree:'1'},evidence:{morphology:'test',needsAnalogy:false}});
  assert.equal(both(isolated(w)).morphologyOk,true);
  w.surface+='x'; assert.equal(both(isolated(w)).morphologyOk,false);
  if (identity.sourceNounModel) {
    w.surface=surface;w.identity.sourceNounModel='kuře';
    assert.equal(both(isolated(w)).morphologyOk,false);
  }
});
for (const model of ['mladý','jarní']) for (const degree of ['2','3']) {
  test(`adjective degree ${model} ${degree}`,()=> {
    const prefix=degree==='3'?'nej':'';
    const w=tok('t1',prefix+'kvazější',{pos:'adjective',lemma:model==='mladý'?'kvazý':'kvazí',model,lexicalStatus:'quasi',role:'agreeingAttribute',
      form:{gender:'neuter',case:'1',number:'singular',degree},evidence:{morphology:'test',needsAnalogy:false}});
    assert.equal(both(isolated(w)).morphologyOk,true);
  });
}
test('NFC form parity',()=> {
  const w=nounTok('t1','kvazi\u0301',{lemma:'kvazi\u0301',model:'stavení',gender:'neuter',animacy:'',number:'singular',caseNum:'1'});
  assert.equal(both(isolated(w)).morphologyOk,true);
});
test('pronoun declaration parity',()=> {
  const w=tok('t1','já',{pos:'pronoun',lemma:'já',lexicalStatus:'real',role:'subject',evidence:{morphology:'test',needsAnalogy:false}});
  assert.equal(both(isolated(w)).structureOk,true);
});
for (const [prep,caseNum,ok] of [['k','3',true],['k','2',false],['v','4',true],['v','6',true],['v','3',false],['z','2',true],['z','1',false]]) {
  test(`government ${prep}/${caseNum}`,()=> {
    const d=structuredClone(FIXTURES['prep-govt-violation']);
    d.tokens[0].surface=prep;d.tokens[0].lemma=prep;d.tokens[1].form.case=caseNum;
    const result=both(d);
    assert.equal(result.syntax.issues.some(i=>i.message.includes('vyžaduje') && i.message.includes('pád')), !ok);
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
test('model coverage is complete against active release',()=> {
  assert.deepEqual(nounExamples.map(x=>x[0]).sort(),Object.keys(global.__normative.noun_models).sort());
  assert.deepEqual(verbExamples.map(x=>x[0]).sort(),Object.keys(global.__normative.verb_models).sort());
  assert.deepEqual(['jarní','matčin','mladý','otcův'].sort(),Object.keys(global.__normative.adj_models).sort());
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
