import { validPos, relationShapes, fieldEnums } from './rules-data.mjs';
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

const PATH_OVERRIDES = {
  'form.verbPerson': {
    '1': ['1. osoba', '1. osoba'],
    '2': ['2. osoba', '2. osoba'],
    '3': ['3. osoba', '3. osoba'],
    '2sg': ['2. sg', '2. sg'],
    '1pl': ['1. pl', '1. pl'],
    '2pl': ['2. pl', '2. pl'],
  },
  'form.degree': {
    '1': ['1. stupeň (pozitiv)', '1. stupeň (pozitiv)'],
    '2': ['2. stupeň (komparativ)', '2. stupeň (komparativ)'],
    '3': ['3. stupeň (superlativ)', '3. stupeň (superlativ)'],
  },
};

export const partsOfSpeechLabels = () => Object.fromEntries(
  validPos().map(k => [k, T(k)])
);
export const functionsLabels = () => Object.fromEntries(
  Object.keys(relationShapes()).filter(k => k !== 'preposition').map(k => [k, T(k)])
);
export const gendersLabels = () => Object.fromEntries(
  fieldEnums().gender.map(k => [k, T(k)])
);
export const casesLabels = () => Object.fromEntries(
  fieldEnums().case.map(k => [k, T(k)])
);
export const numbersLabels = () => Object.fromEntries(
  fieldEnums().number.map(k => [k, T(k)])
);

// Translate an options object {key: label} using the field context when the same raw key
// is reused across different grammatical dimensions (e.g. person vs case vs degree).
export const translateOptions = (opts, path = '') => {
  const override = PATH_OVERRIDES[path] ?? null;
  return Object.fromEntries(Object.entries(opts).map(([k, v]) => {
    const value = override && Object.hasOwn(override, k) ? override[k] : (TERMS[k] ?? [v, v]);
    return [k, value[idx()]];
  }));
};
