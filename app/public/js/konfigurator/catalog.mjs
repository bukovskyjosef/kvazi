// Exact-request eligibility and local result snapshots. The server constructs the key.
import { fieldEnums, nounModels, adjModels, verbModels, singleTokens, auxBytForms, pronounSignature } from './rules-data.mjs';
const text = value => typeof value === 'string' ? value.normalize('NFC').toLowerCase().normalize('NFC') : '';

export function catalogCandidate(w) {
  if (!w || !['noun', 'adjective', 'verb', 'pronoun'].includes(w.pos) || w.role === 'auxiliary'
      || singleTokens().includes(text(w.surface)) || auxBytForms().includes(text(w.surface)) && text(w.lemma) === 'být') return null;
  if (w.pos === 'pronoun') {
    if (!text(w.surface) || !text(w.lemma) || w.lexicalStatus !== 'real' || w.model) return null;
    const signature = {};
    for (const field of ['case', 'number', 'gender', 'person']) {
      const value = w.form?.pronoun?.[field];
      if (!pronounSignature()[field].includes(value)) return null;
      signature[field] = value;
    }
    return { surface: text(w.surface), lemma: text(w.lemma), pos: 'pronoun', lexicalStatus: 'real', form: { pronoun: signature } };
  }
  const models = { noun: nounModels(), adjective: adjModels(), verb: verbModels() }[w.pos];
  const model = models[w.model];
  if (!model || !text(w.surface) || !text(w.lemma) || !fieldEnums().lexicalStatus.includes(w.lexicalStatus)) return null;
  const identity = {}, form = {};
  let fields;
  if (w.pos === 'noun') {
    if (w.identity?.gender !== model.gender || (w.identity?.animacy ?? '') !== (model.animacy ?? '')) return null;
    identity.gender = model.gender;
    if (model.animacy) identity.animacy = model.animacy;
    fields = ['case', 'number'];
  } else if (w.pos === 'adjective') {
    fields = ['gender', 'case', 'number'];
    if (model.source_gender) {
      if (!text(w.identity?.sourceNounLemma) || !nounModels()[w.identity?.sourceNounModel]) return null;
      identity.sourceNounLemma = text(w.identity.sourceNounLemma);
      identity.sourceNounModel = w.identity.sourceNounModel;
    } else fields.push('degree');
  } else {
    fields = ['verbFormType', 'aspect'];
    if (w.form?.verbFormType === 'present') fields.push('verbPerson', 'number');
    else if (w.form?.verbFormType === 'imperative') fields.push('verbPerson');
    else if (w.form?.verbFormType === 'lParticiple') {
      fields.push('verbGender', 'number');
      if (w.form.verbGender === 'masculine' && w.form.number === 'plural') fields.push('verbAnimacy');
    } else return null;
  }
  for (const field of fields) {
    const enumName = field === 'verbPerson' && w.form.verbFormType === 'imperative' ? 'imperativePerson' : field;
    if (!fieldEnums()[enumName].includes(w.form?.[field])) return null;
    form[field] = w.form[field];
  }
  return { surface: text(w.surface), lemma: text(w.lemma), pos: w.pos, model: w.model,
    lexicalStatus: w.lexicalStatus, identity, form };
}

export const catalogFingerprint = w => {
  const candidate = catalogCandidate(w);
  return candidate ? JSON.stringify(candidate) : null;
};

// Explicit POS-specific declaration metadata; not a productive morphology model.
export function pronounFields() {
  const labels = { case: 'Pád zájmena', number: 'Číslo zájmena', gender: 'Rod zájmena', person: 'Osoba zájmena' };
  const values = { number: { singular: 'Jednotné', plural: 'Množné' }, gender: {
    masculineAnimate: 'Mužský životný', masculineInanimate: 'Mužský neživotný', feminine: 'Ženský', neuter: 'Střední' } };
  return Object.entries(labels).map(([name, label]) => ({ path: `form.pronoun.${name}`, label,
    options: Object.fromEntries(pronounSignature()[name].map(v => [v, v === 'notApplicable' ? 'Nevztahuje se' : values[name]?.[v] ?? `${v}.`])) }));
}
