// rules-data.mjs — Runtime accessor layer for versioned normative release data.
//
// Browser: globalThis.__normative is injected inline by konfigurator.php before module load.
// Tests: global.__normative = JSON.parse(readFileSync(...normative.json)) before first call.
//
// This module is the single JS path to verdict-relevant release data.
// No other JS module should reference globalThis.__normative directly.
// All verdict-relevant closed sets (single tokens, prefix rule, charset, models,
// relation shapes, punctuation, government rules) must come exclusively through
// these named accessors.
//
// UI labels, layout metadata, and field descriptors are NOT normative data;
// those live in schema.mjs.

function nd() {
  const n = globalThis.__normative;
  if (!n) throw new Error(
    'Normativní data nejsou inicializována. Nastavte globalThis.__normative před prvním voláním z rules-data.mjs.'
  );
  return n;
}

// ── Token / surface rules ─────────────────────────────────────────────────────

/** Array of single-char exception tokens: ['k','v','z','a','i'] */
export const singleTokens       = () => nd().single_tokens;

/** Single-char prepositions: ['k','v','z'] */
export const singlePrepositions = () => nd().single_prepositions;

/** Single-char conjunctions: ['a','i'] */
export const singleConjunctions = () => nd().single_conjunctions;

/** Kvazi- prefix string: 'kvazi' */
export const prefixString       = () => nd().kvazi_prefix;

/** Kvazi- prefix length: 5 */
export const prefixLen          = () => nd().kvazi_prefix_len;

/** Surface charset regex pattern string: '^[KVQAÁZIÍYÝ]+$' */
export const surfaceCharset     = () => nd().surface_charset;

/** Minimum non-prefix token char count: 3 */
export const tokenMinChars      = () => nd().token_min_chars;

/** Maximum non-prefix token char count: 5 */
export const tokenMaxChars      = () => nd().token_max_chars;

// ── Sentence structure ────────────────────────────────────────────────────────

/** Punctuation map by sentence type: { declarative: '.', interrogative: '?', imperative: '!' } */
export const punctuation        = () => nd().punctuation;

/** Relation shapes by role: { subject: ['head'], predicate: [], ... } */
export const relationShapes     = () => nd().relation_shapes;

/** Valid POS values: ['noun','adjective','verb','pronoun','preposition','conjunction'] */
export const validPos           = () => nd().valid_pos;

// ── Morphological models ──────────────────────────────────────────────────────

/** All noun models keyed by model name. */
export const nounModels         = () => nd().noun_models;

/** All adjective model definitions keyed by model name. */
export const adjModels          = () => nd().adj_models;

/** All adjective paradigm tables keyed by table name. */
export const adjTables          = () => nd().adj_tables;

/** Verb model definitions: { 'V-AT': { suffix: 'at' }, ... } */
export const verbModels         = () => nd().verb_models;

/** Present/future verb endings per model: { 'V-AT': ['ám','áš',...], ... } */
export const verbPresent        = () => nd().verb_present;

/** Imperative endings per model. */
export const verbImperative     = () => nd().verb_imperative;

/** L-participle endings per model (6 slots: m.sg, f.sg, n.sg, m.anim.pl, m.inanim/f.pl, n.pl). */
export const verbLParticiple    = () => nd().verb_lparticiple;

/** Auxiliary být closed set. */
export const auxBytForms        = () => nd().aux_byt_forms;

// ── Government rules ──────────────────────────────────────────────────────────

/** Preposition case government: { 'k': ['3'], 'v': ['4','6'], 'z': ['2'] } */
export const prepositionGovt    = () => nd().preposition_case_government;

export const fieldEnums = () => nd().field_enums;
export const motifTransitions = () => nd().motif_transitions;
export const functionalPos = () => nd().functional_pos;
export const nominalPos = () => nd().nominal_pos;
export const syntaxRoleSets = () => nd().syntax_role_sets;
export const vowels = () => nd().vowels;

// Lazy option maps preserve UI labels while deriving allowed keys from release data.
export function enumOptions(name, labels = {}) {
  return optionMap(() => fieldEnums()[name], labels);
}

export function optionMap(values, labels = {}) {
  return new Proxy({}, {
    ownKeys: () => values(),
    getOwnPropertyDescriptor: (_, key) => values().includes(key)
      ? { enumerable: true, configurable: true, value: labels[key] ?? key } : undefined,
    get: (_, key) => values().includes(key) ? (labels[key] ?? key) : undefined,
  });
}

export const adjectiveDegrees = () => nd().adjective_degrees;

export const implicitSubjectRule = () => nd().implicit_subject;
