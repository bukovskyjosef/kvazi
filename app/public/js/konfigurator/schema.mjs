// schema.mjs — Structural form metadata and schema for the konfigurátor UI.
//
// Normative closed sets (model lists, relation shapes, punctuation, prefix rule, etc.)
// are derived lazily from the versioned normative release dataset via rules-data.mjs.
// This file contains only structural form descriptors, UI labels and layout metadata,
// and helpers for navigating the schema.
//
// UI labels (partsOfSpeech, functions, genders, cases, numbers, sentenceTypes) are
// not verdict-relevant and may stay as static strings.
import {
  enumOptions, optionMap, punctuation, validPos, functionalPos, implicitSubjectRule,
  nounModels as ndNounModels,
  adjModels  as ndAdjModels,
  verbModels as ndVerbModels,
  relationShapes as ndRelationShapes,
} from './rules-data.mjs';

// Re-export for view.mjs which imports relationShapes from schema.mjs.
export const relationShapes = ndRelationShapes;

export const sentenceTypes = optionMap(() => Object.keys(punctuation()), { declarative: 'Oznamovací', interrogative: 'Tázací', imperative: 'Rozkazovací' });
export const partsOfSpeech = optionMap(validPos, { noun: 'Podstatné jméno', adjective: 'Přídavné jméno', verb: 'Sloveso', pronoun: 'Zájmeno', preposition: 'Předložka', conjunction: 'Spojka' });
export const functions = optionMap(() => Object.keys(ndRelationShapes()), { subject: 'Podmět', predicate: 'Přísudek', auxiliary: 'Pomocné být', object: 'Předmět', agreeingAttribute: 'Přívlastek shodný', attribute: 'Přívlastek neshodný', adverbial: 'Příslovečné určení', supplement: 'Doplněk', coordination: 'Spojení souřadných částí' });
export const genders = enumOptions('gender', { masculineAnimate: 'Mužský životný', masculineInanimate: 'Mužský neživotný', feminine: 'Ženský', neuter: 'Střední' });
export const cases = enumOptions('case', Object.fromEntries(Array.from({ length: 7 }, (_, i) => [String(i + 1), `${i + 1}. pád`])));
export const numbers = enumOptions('number', { singular: 'Jednotné', plural: 'Množné' });
const field = (path, label, options, multiline = false) => ({ path, label, options, multiline });

// ── Static field descriptors (structural, not normative) ─────────────────────

const _nominalFields = [field('form.case', 'Pád použitého tvaru', cases), field('form.number', 'Číslo použitého tvaru', numbers)];
const _verbBaseFields = [
  field('form.verbFormType', 'Druh slovesného tvaru', enumOptions('verbFormType', { present: 'Přítomný/budoucí', imperative: 'Rozkazovací způsob', lParticiple: 'L-příčestí' })),
  field('form.aspect', 'Vid', enumOptions('aspect', { imperfective: 'Nedokonavý', perfective: 'Dokonavý', biaspectual: 'Obouvidový' })),
  field('valency.declaration', 'Valenční obhajoba — jaká doplnění použití vyžaduje, která slova je realizují a o jaké české sloveso se opírá', null, true),
];
const _verbLabelMap = { 'V-AT': 'typ V-AT (dělat)', 'V-IT': 'typ V-IT (prosit)', 'V-NOUT': 'typ V-NOUT (tisknout)', 'V-ÝT': 'typ V-ÝT (krýt)', 'V-OVAT': 'typ V-OVAT (kupovat)' };

// ── Lazy schema builder ───────────────────────────────────────────────────────
// Schema is built on first access. This ensures normative data (globalThis.__normative)
// is available before any model list or relation shape is read.

let _schemaModels = null;

function buildModels() {
  if (_schemaModels) return _schemaModels;
  const nm = ndNounModels();
  const vm = ndVerbModels();

  const nounSchemaModels = Object.fromEntries(
    Object.entries(nm).map(([name, m]) => [name, {
      label: name,
      identity: { gender: m.gender, animacy: m.animacy || '' },
      fields: [],
    }])
  );

  const nounModelOptions = Object.fromEntries(Object.keys(nm).map(n => [n, n]));

  // Adjective models: names from normative; UI fields contain noun model option lists.
  const adjSchemaModels = {
    'mladý': { label: 'mladý', fields: [field('form.degree', 'Stupeň', enumOptions('degree', { '1': '1. stupeň', '2': '2. stupeň (S+ější)', '3': '3. stupeň (nejS+ější)' }))] },
    'jarní': { label: 'jarní', fields: [field('form.degree', 'Stupeň', enumOptions('degree', { '1': '1. stupeň', '2': '2. stupeň (S+ější)', '3': '3. stupeň (nejS+ější)' }))] },
    'otcův': { label: 'otcův', fields: [
      field('identity.sourceNounLemma', 'Lemma zdrojového substantiva'),
      field('identity.sourceNounModel', 'Vzor zdrojového substantiva', nounModelOptions),
    ]},
    'matčin': { label: 'matčin', fields: [
      field('identity.sourceNounLemma', 'Lemma zdrojového substantiva'),
      field('identity.sourceNounModel', 'Vzor zdrojového substantiva', nounModelOptions),
    ]},
  };
  // Ensure every normative adj model has an entry (forward-compatibility).
  for (const adjName of Object.keys(ndAdjModels())) {
    if (!Object.hasOwn(adjSchemaModels, adjName)) {
      adjSchemaModels[adjName] = { label: adjName, fields: [] };
    }
  }

  const verbSchemaModels = Object.fromEntries(
    Object.keys(vm).map(k => [k, { label: _verbLabelMap[k] || k, fields: [] }])
  );

  return (_schemaModels = { noun: nounSchemaModels, adjective: Object.fromEntries(Object.keys(ndAdjModels()).map(k => [k, adjSchemaModels[k]])), verb: verbSchemaModels, pronoun: {} });
}

// ── publicSchema ──────────────────────────────────────────────────────────────
// Exported as a live proxy so callsites can continue to use `publicSchema.models.*`
// without calling a function, while still deferring normative data access until
// the first actual field read.

export const publicSchema = {
  id: 'configurator-v2',
  get models() { return buildModels(); },
  fields: {
    noun: [..._nominalFields],
    adjective: [field('form.gender', 'Rod použitého tvaru', genders), ..._nominalFields],
    verb: _verbBaseFields,
    pronoun: [],
  },
  valency: null,
  allowsImplicitSubject: (verb, draft) =>
    draft.sentenceType === implicitSubjectRule().sentence_type && verb?.form?.verbFormType === implicitSubjectRule().verb_form_type && Object.hasOwn(buildModels().verb, verb?.model ?? ''),
};

export const getModel = (w, schema = publicSchema) =>
  Object.hasOwn(schema.models, w.pos) && Object.hasOwn(schema.models[w.pos], w.model)
    ? schema.models[w.pos][w.model] : undefined;

// Returns field descriptors relevant for the given token state.
// For verbs, includes context fields based on form.verbFormType.
export function wordFields(w, schema = publicSchema) {
  const base = [...(schema.fields[w.pos] || [])];
  const modelFields = [...(getModel(w, schema)?.fields || [])];

  if (w.pos === 'verb') {
    const vft = w.form?.verbFormType;
    const personOpts = enumOptions('verbPerson', { '1': '1.', '2': '2.', '3': '3.' });
    if (vft === 'present') {
      return [...base,
        field('form.verbPerson', 'Osoba', personOpts),
        field('form.number', 'Číslo', numbers),
        ...modelFields];
    }
    if (vft === 'imperative') {
      return [...base,
        field('form.verbPerson', 'Osoba (2.sg / 1.pl / 2.pl)', enumOptions('imperativePerson', { '2sg': '2. sg', '1pl': '1. pl', '2pl': '2. pl' })),
        ...modelFields];
    }
    if (vft === 'lParticiple') {
      const extra = [
        field('form.verbGender', 'Rod l-příčestí', enumOptions('verbGender', { masculine: 'Mužský', feminine: 'Ženský', neuter: 'Střední' })),
        field('form.number', 'Číslo l-příčestí', numbers),
      ];
      if (w.form?.verbGender === 'masculine' && w.form?.number === 'plural') {
        extra.push(field('form.verbAnimacy', 'Životnost l-příčestí', enumOptions('verbAnimacy', { animate: 'Životný', inanimate: 'Neživotný' })));
      }
      return [...base, ...extra, ...modelFields];
    }
    return [...base, ...modelFields];
  }

  return [...base, ...modelFields];
}

export const isFunctional = w => functionalPos().includes(w.pos);
export const getPath = (obj, path) => path.split('.').reduce((value, key) => value?.[key], obj);
export function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((value, key) => value[key] ??= {}, obj)[last] = value;
}
