// Public structural data only; this is not a released normative rules package.
export const CONFIRMATION = 'Potvrzuji, že toto je můj morfologický návrh.';
export const sentenceTypes = { declarative: 'Oznamovací', interrogative: 'Tázací', imperative: 'Rozkazovací' };
export const punctuation = { declarative: '.', interrogative: '?', imperative: '!' };
export const partsOfSpeech = { noun: 'Podstatné jméno', adjective: 'Přídavné jméno', verb: 'Sloveso', pronoun: 'Zájmeno', preposition: 'Předložka', conjunction: 'Spojka' };
export const functions = { subject: 'Podmět', predicate: 'Přísudek', object: 'Předmět', agreeingAttribute: 'Přívlastek shodný', attribute: 'Přívlastek neshodný', adverbial: 'Příslovečné určení', supplement: 'Doplněk', coordination: 'Spojení souřadných částí' };
export const relationShapes = { predicate: [], subject: ['head'], object: ['head'], adverbial: ['head'], agreeingAttribute: ['head'], attribute: ['head'], supplement: ['predicate', 'nominal'], coordination: ['left', 'right'], preposition: ['nominal'] };
export const genders = { masculineAnimate: 'Mužský životný', masculineInanimate: 'Mužský neživotný', feminine: 'Ženský', neuter: 'Střední' };
export const cases = Object.fromEntries(Array.from({ length: 7 }, (_, i) => [String(i + 1), `${i + 1}. pád`]));
export const numbers = { singular: 'Jednotné', plural: 'Množné' };
const field = (path, label, options) => ({ path, label, options });
const nominalFields = [field('form.case', 'Pád použitého tvaru', cases), field('form.number', 'Číslo použitého tvaru', numbers)];
// Editable base grids, without endings or variant claims. Completeness of the
// final normative paradigm remains gated, even after the user confirms this grid.
const cells = (groups) => groups.flatMap(([prefix, label]) => Object.entries(cases).map(([c, name]) => ({ id: `${prefix}-${c}`, label: `${label}, ${name}` })));
const nounCells = cells(Object.entries(numbers));
const adjectiveCells = cells(Object.entries(genders).flatMap(([g, label]) => Object.entries(numbers).map(([n, number]) => [`${g}-${n}`, `${label}, ${number}`])));
const nounModels = [
  ['pán', 'masculine', 'animate'], ['muž', 'masculine', 'animate'], ['předseda', 'masculine', 'animate'], ['soudce', 'masculine', 'animate'],
  ['hrad', 'masculine', 'inanimate'], ['stroj', 'masculine', 'inanimate'],
  ...['žena', 'růže', 'píseň', 'kost'].map(x => [x, 'feminine', '']),
  ...['město', 'moře', 'kuře', 'stavení'].map(x => [x, 'neuter', '']),
];
export const publicSchema = {
  id: 'configurator-structural-prototype-1',
  fields: {
    noun: nominalFields,
    adjective: [field('form.gender', 'Rod použitého tvaru', genders), ...nominalFields],
    verb: [field('form.aspect', 'Vid', { imperfective: 'Nedokonavý', perfective: 'Dokonavý', biaspectual: 'Obouvidový' }), field('valency.modelVerb', 'České sloveso se stejnou valencí')],
    pronoun: [],
  },
  models: {
    noun: Object.fromEntries(nounModels.map(([name, gender, animacy]) => [name, { label: name, identity: { gender, animacy }, cells: nounCells, fields: [], complete: false, gate: 'Přesné paradigma čeká na dokončení tabulek (#1).' }])),
    adjective: Object.fromEntries(['mladý', 'jarní', 'otcův', 'matčin'].map(name => [name, { label: name, cells: adjectiveCells, fields: [], complete: false, gate: 'Přesné paradigma a hraniční tvary čekají na dokončení tabulek (#1/#4).' }])),
    verb: {}, pronoun: {},
  },
  // Deliberately absent: a final frame/slot data structure (#5). A future
  // adapter owns its fields, validation and slot-reference checks together.
  valency: null,
  allowsImplicitSubject: null,
};
export const getModel = (w, schema = publicSchema) => Object.hasOwn(schema.models, w.pos) && Object.hasOwn(schema.models[w.pos], w.model) ? schema.models[w.pos][w.model] : undefined;
export const wordFields = (w, schema = publicSchema) => [...(schema.fields[w.pos] || []), ...(getModel(w, schema)?.fields || [])];
export const isFunctional = w => ['preposition', 'conjunction'].includes(w.pos);
export const getPath = (obj, path) => path.split('.').reduce((value, key) => value?.[key], obj);
export function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((value, key) => value[key] ??= {}, obj)[last] = value;
}
