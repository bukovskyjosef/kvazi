// Presentation layer: expert ↔ Czech terminology toggle.
// All label consumers (view.mjs) call the *Labels() functions each render,
// so a single toggleMode() + re-render is enough to switch everything.

export let czechMode = false;
export function toggleMode() { czechMode = !czechMode; }
export function buttonLabel() { return czechMode ? 'Přepnout na odborné' : 'Přepnout do češtiny'; }

// Each entry: [expert, czech]
const TERMS = {
  // Parts of speech
  noun:               ['Substantivum',      'Podstatné jméno'],
  adjective:          ['Adjektivum',        'Přídavné jméno'],
  verb:               ['Verbum',            'Sloveso'],
  pronoun:            ['Pronomen',          'Zájmeno'],
  preposition:        ['Prepozice',         'Předložka'],
  conjunction:        ['Konjunkce',         'Spojka'],
  // Grammatical functions
  subject:            ['Subjekt',           'Podmět'],
  predicate:          ['Predikát',          'Přísudek'],
  auxiliary:          ['Auxiliár',          'Pomocné být'],
  object:             ['Objekt',            'Předmět'],
  agreeingAttribute:  ['Atribut shodný',    'Přívlastek shodný'],
  attribute:          ['Atribut neshodný',  'Přívlastek neshodný'],
  adverbial:          ['Adverbiale',        'Příslovečné určení'],
  supplement:         ['Predikativum',      'Doplněk'],
  coordination:       ['Koordinace',        'Spojení souřadných částí'],
  // Cases (keys match schema.mjs cases keys)
  '1': ['Nominativ',    '1. pád'],
  '2': ['Genitiv',      '2. pád'],
  '3': ['Dativ',        '3. pád'],
  '4': ['Akuzativ',     '4. pád'],
  '5': ['Vokativ',      '5. pád'],
  '6': ['Lokál',        '6. pád'],
  '7': ['Instrumentál', '7. pád'],
  // Numbers
  singular:           ['Singulár',          'Jednotné'],
  plural:             ['Plurál',            'Množné'],
  // Genders
  masculineAnimate:   ['Maskulinum životné',   'Mužský životný'],
  masculineInanimate: ['Maskulinum neživotné', 'Mužský neživotný'],
  feminine:           ['Femininum',            'Ženský'],
  neuter:             ['Neutrum',              'Střední'],
  // Verb aspect
  imperfective:       ['Imperfektivum',     'Nedokonavý'],
  perfective:         ['Perfektivum',       'Dokonavý'],
  biaspectual:        ['Biaspektuální',     'Obouvidový'],
};

const idx = () => czechMode ? 1 : 0;
export const T = key => (TERMS[key] ?? [key, key])[idx()];

export const partsOfSpeechLabels = () => Object.fromEntries(
  ['noun', 'adjective', 'verb', 'pronoun', 'preposition', 'conjunction'].map(k => [k, T(k)])
);
export const functionsLabels = () => Object.fromEntries(
  ['subject', 'predicate', 'auxiliary', 'object', 'agreeingAttribute', 'attribute', 'adverbial', 'supplement', 'coordination'].map(k => [k, T(k)])
);
export const gendersLabels = () => Object.fromEntries(
  ['masculineAnimate', 'masculineInanimate', 'feminine', 'neuter'].map(k => [k, T(k)])
);
export const casesLabels = () => Object.fromEntries(
  Array.from({ length: 7 }, (_, n) => [String(n + 1), T(String(n + 1))])
);
export const numbersLabels = () => Object.fromEntries(
  ['singular', 'plural'].map(k => [k, T(k)])
);

// Translate an options object {key: czechLabel} through TERMS (for schema-embedded options).
export const translateOptions = opts => Object.fromEntries(
  Object.entries(opts).map(([k, v]) => [k, (TERMS[k] ?? [v, v])[idx()]])
);
