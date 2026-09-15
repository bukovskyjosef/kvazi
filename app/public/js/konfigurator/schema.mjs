// Public structural data only; this is not a released normative rules package.
// Normativní morfologická paradigmata jsou v morpho.mjs.
export const sentenceTypes = { declarative: 'Oznamovací', interrogative: 'Tázací', imperative: 'Rozkazovací' };
export const punctuation = { declarative: '.', interrogative: '?', imperative: '!' };
export const partsOfSpeech = { noun: 'Podstatné jméno', adjective: 'Přídavné jméno', verb: 'Sloveso', pronoun: 'Zájmeno', preposition: 'Předložka', conjunction: 'Spojka' };
export const functions = { subject: 'Podmět', predicate: 'Přísudek', object: 'Předmět', agreeingAttribute: 'Přívlastek shodný', attribute: 'Přívlastek neshodný', adverbial: 'Příslovečné určení', supplement: 'Doplněk', coordination: 'Spojení souřadných částí' };
export const relationShapes = { predicate: [], subject: ['head'], object: ['head'], adverbial: ['head'], agreeingAttribute: ['head'], attribute: ['head'], supplement: ['predicate', 'nominal'], coordination: ['left', 'right'], preposition: ['nominal'] };
export const genders = { masculineAnimate: 'Mužský životný', masculineInanimate: 'Mužský neživotný', feminine: 'Ženský', neuter: 'Střední' };
export const cases = Object.fromEntries(Array.from({ length: 7 }, (_, i) => [String(i + 1), `${i + 1}. pád`]));
export const numbers = { singular: 'Jednotné', plural: 'Množné' };
const field = (path, label, options, multiline = false) => ({ path, label, options, multiline });
const nominalFields = [field('form.case', 'Pád použitého tvaru', cases), field('form.number', 'Číslo použitého tvaru', numbers)];

const nounModelList = [
  ['pán', 'masculine', 'animate'], ['muž', 'masculine', 'animate'],
  ['předseda', 'masculine', 'animate'], ['soudce', 'masculine', 'animate'],
  ['hrad', 'masculine', 'inanimate'], ['stroj', 'masculine', 'inanimate'],
  ...['žena', 'růže', 'píseň', 'kost'].map(x => [x, 'feminine', '']),
  ...['město', 'moře', 'kuře', 'stavení'].map(x => [x, 'neuter', '']),
];
const nounModelOptions = Object.fromEntries(nounModelList.map(([name]) => [name, name]));

const verbModels = Object.fromEntries([
  ['V-AT', 'typ V-AT (dělat)'], ['V-IT', 'typ V-IT (prosit)'],
  ['V-NOUT', 'typ V-NOUT (tisknout)'], ['V-ÝT', 'typ V-ÝT (krýt)'],
  ['V-OVAT', 'typ V-OVAT (kupovat)'],
].map(([key, label]) => [key, { label, fields: [] }]));

export const publicSchema = {
  id: 'configurator-v2',
  fields: {
    noun: [
      ...nominalFields,
      field('kvaziPrefix', 'Prefix kvazi-', { '': 'Bez prefixu', 'true': 'Použit prefix kvazi- (podstatné jméno)' }),
    ],
    adjective: [
      field('form.gender', 'Rod použitého tvaru', genders),
      ...nominalFields,
    ],
    verb: [
      field('form.verbFormType', 'Druh slovesného tvaru', { present: 'Přítomný/budoucí', imperative: 'Rozkazovací způsob', lParticiple: 'L-příčestí' }),
      field('form.aspect', 'Vid', { imperfective: 'Nedokonavý', perfective: 'Dokonavý', biaspectual: 'Obouvidový' }),
      field('valency.declaration', 'Valenční obhajoba — jaká doplnění použití vyžaduje, která slova je realizují a o jaké české sloveso se opírá', null, true),
    ],
    pronoun: [],
  },
  models: {
    noun: Object.fromEntries(nounModelList.map(([name, gender, animacy]) => [name, { label: name, identity: { gender, animacy }, fields: [] }])),
    adjective: {
      'mladý': { label: 'mladý', fields: [field('form.degree', 'Stupeň', { '1': '1. stupeň', '2': '2. stupeň (S+ější)', '3': '3. stupeň (nejS+ější)' })] },
      'jarní':  { label: 'jarní', fields: [field('form.degree', 'Stupeň', { '1': '1. stupeň', '2': '2. stupeň (S+ější)', '3': '3. stupeň (nejS+ější)' })] },
      'otcův':  { label: 'otcův', fields: [
        field('identity.sourceNounLemma', 'Lemma zdrojového substantiva'),
        field('identity.sourceNounModel', 'Vzor zdrojového substantiva', nounModelOptions),
      ]},
      'matčin': { label: 'matčin', fields: [
        field('identity.sourceNounLemma', 'Lemma zdrojového substantiva'),
        field('identity.sourceNounModel', 'Vzor zdrojového substantiva', nounModelOptions),
      ]},
    },
    verb: verbModels,
    pronoun: {},
  },
  valency: null,
  allowsImplicitSubject: (verb, draft) =>
    draft.sentenceType === 'imperative' && Object.hasOwn(verbModels, verb?.model ?? ''),
};

export const getModel = (w, schema = publicSchema) =>
  Object.hasOwn(schema.models, w.pos) && Object.hasOwn(schema.models[w.pos], w.model)
    ? schema.models[w.pos][w.model] : undefined;

// Vrátí pole formulářových deskriptorů relevantních pro konkrétní stav tokenu.
// Pro slovesa zahrnuje kontextové pole dle form.verbFormType.
export function wordFields(w, schema = publicSchema) {
  const base = [...(schema.fields[w.pos] || [])];
  const modelFields = [...(getModel(w, schema)?.fields || [])];

  if (w.pos === 'verb') {
    const vft = w.form?.verbFormType;
    const personOpts = { '1': '1.', '2': '2.', '3': '3.' };
    if (vft === 'present') {
      return [...base,
        field('form.verbPerson', 'Osoba', personOpts),
        field('form.number', 'Číslo', numbers),
        ...modelFields];
    }
    if (vft === 'imperative') {
      return [...base,
        field('form.verbPerson', 'Osoba (2.sg / 1.pl / 2.pl)', { '2sg': '2. sg', '1pl': '1. pl', '2pl': '2. pl' }),
        ...modelFields];
    }
    if (vft === 'lParticiple') {
      const extra = [
        field('form.verbGender', 'Rod l-příčestí', { masculine: 'Mužský', feminine: 'Ženský', neuter: 'Střední' }),
        field('form.number', 'Číslo l-příčestí', numbers),
      ];
      if (w.form?.verbGender === 'masculine' && w.form?.number === 'plural') {
        extra.push(field('form.verbAnimacy', 'Životnost l-příčestí', { animate: 'Životný', inanimate: 'Neživotný' }));
      }
      return [...base, ...extra, ...modelFields];
    }
    // verbFormType not yet set — return only base fields so user can pick the form type
    return [...base, ...modelFields];
  }

  return [...base, ...modelFields];
}

export const isFunctional = w => ['preposition', 'conjunction'].includes(w.pos);
export const getPath = (obj, path) => path.split('.').reduce((value, key) => value?.[key], obj);
export function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((value, key) => value[key] ??= {}, obj)[last] = value;
}
