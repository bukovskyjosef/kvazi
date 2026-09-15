/**
 * Parity test: same deterministic fixture corpus run through both JS (Node) and PHP engines.
 * Verifies that submitReady, charScore, wordCount, sequence.ok, and syntax.ok agree.
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

// ── Fixture corpus ────────────────────────────────────────────────────────────

// Minimal token factory — only the fields both engines need.
function tok(id, surface, overrides = {}) {
  return {
    id, surface,
    kvaziPrefix: surface.toLowerCase().startsWith('kvazi') && [...surface].length > 5 ? 'kvazi' : '',
    pos: '', lemma: '', model: '', lexicalStatus: '',
    identity: { gender: '', animacy: '' },
    form: {}, relations: {}, role: '',
    valency: { modelVerb: '', declaration: '' },
    evidence: { morphology: '', needsAnalogy: false, explanation: '', analogy: '' },
    ...overrides,
  };
}

const FIXTURES = {

  // 1. Empty draft — no tokens
  'empty-draft': {
    tokens: [],
    sentenceType: 'declarative',
    implicitSubject: false,
  },

  // 2. Single valid DFA token 'vazi' (VAZI = 4 chars, charScore 4)
  'single-vazi': {
    tokens: [tok('t1', 'vazi', { pos: 'noun', role: 'subject', relations: { head: 't1' } })],
    sentenceType: 'declarative',
    implicitSubject: false,
  },

  // 3. Two tokens: 'kvazi' (5 chars, no prefix) + 'kvaziqazi' (9 chars, prefix → 4 scoring chars)
  //    DFA: KVAZI + KVAZI+QAZI = two full motifs. charScore = 5 + 4 = 9.
  'kvazi-prefix-scoring': {
    tokens: [
      tok('t1', 'kvazi', { pos: 'noun', role: 'subject', relations: { head: 't2' } }),
      tok('t2', 'kvaziqazi', {
        pos: 'noun', role: 'subject',
        kvaziPrefix: 'kvazi',
        relations: { head: 't1' },
      }),
    ],
    sentenceType: 'declarative',
    implicitSubject: false,
  },

  // 4. Preposition government violation: 'k' requires dative (case 3), but nominal is in nominative (case 1).
  //    Expected: syntax.ok=false on both engines, with a government-error message about 'k' and case 3.
  'prep-govt-violation': {
    tokens: [
      tok('t1', 'k', { pos: 'preposition', role: 'preposition', lexicalStatus: 'real', lemma: 'k', relations: { nominal: 't2' } }),
      tok('t2', 'vazi', { pos: 'noun', role: 'adverbial', lemma: 'vazi', model: 'hrad', lexicalStatus: 'quasi',
        identity: { gender: 'masculine', animacy: 'inanimate' },
        form: { case: '1', number: 'singular' },   // nominative — wrong for 'k'
        relations: { head: 't1' },
        evidence: { morphology: 'test', needsAnalogy: false, explanation: '', analogy: '' },
      }),
    ],
    sentenceType: 'declarative',
    implicitSubject: false,
  },

};

// ── Parity assertions ─────────────────────────────────────────────────────────

for (const [name, draft] of Object.entries(FIXTURES)) {
  test(`parity: ${name}`, () => {
    const js  = deriveValidationState(draft);
    const php = phpValidate(draft);

    // Core boolean and score fields must match exactly.
    assert.equal(js.submitReady,  php.submitReady,  `${name}: submitReady`);
    assert.equal(js.charScore,    php.charScore,    `${name}: charScore`);
    assert.equal(js.wordCount,    php.wordCount,    `${name}: wordCount`);
    assert.equal(js.sequence.ok,  php.sequence.ok,  `${name}: sequence.ok`);
    assert.equal(js.syntax.ok,    php.syntax.ok,    `${name}: syntax.ok`);
  });
}

// ── Additional: government violation contains expected message in both engines ─

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
