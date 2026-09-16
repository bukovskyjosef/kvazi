// morpho.mjs — Deterministický morfologický validátor
// Všechna normativní data jsou čtena přes rules-data.mjs (lazy accessory).
// Jediný normativní zdroj: app/data/rules/<verze>/normative.json.
import {
  nounModels, adjModels, adjTables,
  verbModels, verbPresent, verbImperative, verbLParticiple,
  adjectiveDegrees, auxBytForms, prefixString, prefixLen, fieldEnums, functionalPos, vowels,
} from './rules-data.mjs';

const isVowel = c => vowels().includes(c.toLowerCase());
const endsConsonant = l => l.length > 0 && !isVowel(l.slice(-1));

// Převod textových podmínek z normative.json na funkce.
function nounCond(condName, lemma) {
  switch (condName) {
    case 'ends_consonant': return endsConsonant(lemma);
    case 'ends_a':         return /a$/i.test(lemma);
    case 'ends_e':         return /e$/i.test(lemma);
    case 'ends_o':         return /o$/i.test(lemma);
    case 'ends_í':         return /í$/i.test(lemma);
    default:               return false;
  }
}

function doNounStem(stemName, lemma) {
  switch (stemName) {
    case 'identity': return lemma;
    case 'drop_1':   return lemma.slice(0, -1);
    default:         return lemma;
  }
}

// ─────────────────────────────────────────────────────────────
// NOUN STEM HELPER (used by possessive adj validator and tests)
// ─────────────────────────────────────────────────────────────

export function nounStem(lemma, modelName) {
  const model = nounModels()[modelName];
  if (!model) return null;
  if (!nounCond(model.cond, lemma)) return null;
  return doNounStem(model.stem, lemma);
}

// ─────────────────────────────────────────────────────────────
// VALIDATE NOUN
// ─────────────────────────────────────────────────────────────

function validateNoun(w) {
  const modelName = w.model;
  const m = nounModels()[modelName];
  if (!m) return { ok: true, expected: null, message: null };

  let lemma = String(w.lemma || '').normalize('NFC').toLowerCase();
  const surface = String(w.surface || '').normalize('NFC').toLowerCase();
  // Derive prefix from surface, never from client-provided w.kvaziPrefix (mirrors PHP inferKvaziPrefix).
  const hasPrefix = surface.startsWith(prefixString()) && [...surface].length > prefixLen();

  if (hasPrefix) {
    if (!lemma.startsWith(prefixString())) return { ok: false, expected: null, message: 'Lemma s prefixem kvazi- musí začínat na kvazi.' };
    lemma = lemma.slice(prefixLen());
  }

  if (!lemma) return { ok: false, expected: null, message: 'Chybí základní tvar.' };
  if (!nounCond(m.cond, lemma)) return { ok: false, expected: null, message: `Lemma „${lemma}" nesplňuje podmínku modelu ${modelName}: ${m.cond_hint}.` };

  const { number, case: caseNum } = (w.form || {});
  if (!number || !caseNum) return { ok: false, expected: null, message: 'Chybí číslo nebo pád použitého tvaru.' };

  const key = `${number}-${caseNum}`;
  const ending = m.endings[key];
  if (ending === undefined) return { ok: false, expected: null, message: `Kombinace číslo/pád „${key}" není v tabulce modelu ${modelName}.` };

  const stem = doNounStem(m.stem, lemma);
  const expectedBase = stem + ending;
  const expected = hasPrefix ? prefixString() + expectedBase : expectedBase;

  return expected === surface
    ? { ok: true, expected, message: null }
    : { ok: false, expected, message: `Použitý tvar „${surface}" neodpovídá modelu ${modelName} a deklarovaným morfologickým hodnotám (očekáváno „${expected}").` };
}

// ─────────────────────────────────────────────────────────────
// VALIDATE ADJECTIVE
// ─────────────────────────────────────────────────────────────

function validateAdjective(w) {
  const modelName = w.model;
  const adjDef = adjModels()[modelName];
  if (!adjDef) return { ok: true, expected: null, message: null };

  const form = w.form || {};
  const identity = w.identity || {};
  const surface = String(w.surface || '').normalize('NFC').toLowerCase();
  const lemma = String(w.lemma || '').normalize('NFC').toLowerCase();
  const degree = form.degree || '1';
  if (!adjDef.degrees.includes(degree)) return {ok:false,expected:null,message:'Neplatný stupeň modelu.'};

  const { case: caseNum, number, gender } = form;
  if (!caseNum || !number || !gender) return { ok: false, expected: null, message: 'Chybí rod, číslo nebo pád použitého tvaru.' };

  const tableKey = `${gender}-${number}-${caseNum}`;
  const tables = adjTables();

  // Přivlastňovací adjektiva
  if (adjDef.source_gender) {
    const srcLemma = String(identity.sourceNounLemma || '').toLowerCase();
    const srcModelName = identity.sourceNounModel;
    if (!srcLemma || !srcModelName) return { ok: false, expected: null, message: 'Chybí lemma nebo vzor zdrojového substantiva.' };

    const srcM = nounModels()[srcModelName];
    if (!srcM) return { ok: false, expected: null, message: `Zdrojový substantivní model „${srcModelName}" není v normativní sadě.` };
    if (!nounCond(srcM.cond, srcLemma)) return { ok: false, expected: null, message: `Lemma zdrojového substantiva „${srcLemma}" nesplňuje podmínku vzoru ${srcModelName}.` };

    const srcStem = doNounStem(srcM.stem, srcLemma);

    if (srcM.gender !== adjDef.source_gender) return { ok: false, expected: null, message: 'Rod zdrojového substantiva neodpovídá přivlastňovacímu modelu.' };
    const expectedLemma = srcStem + adjDef.lemma_suffix;
    if (lemma !== expectedLemma) return { ok: false, expected: null, message: `Lemma adjektiva musí být „${expectedLemma}".` };
    const ending = tables[adjDef.table][tableKey];
    if (ending === undefined) return { ok: false, expected: null, message: 'Neplatná kombinace rodu, čísla a pádu.' };
    const expected = srcStem + ending;
    return expected === surface ? { ok: true, expected, message: null }
      : { ok: false, expected, message: `Použitý tvar neodpovídá modelu ${modelName}.` };
  }

  // Produktivní modely (mladý, jarní) + stupňování
  if (!lemma.endsWith(adjDef.lemma_suffix)) return {ok:false,expected:null,message:'Lemma neodpovídá základnímu modelu.'};
  const d = adjectiveDegrees()[degree];
  const adjStem = d.prefix + lemma.slice(0, -adjDef.lemma_suffix.length) + d.stem_suffix;
  const tableName = d.table ?? adjDef.table;

  const ending = tables[tableName]?.[tableKey];
  if (ending === undefined) return { ok: false, expected: null, message: `Kombinace rod/číslo/pád „${tableKey}" není v tabulce modelu ${modelName}.` };
  const expected = adjStem + ending;
  return expected === surface ? { ok: true, expected, message: null }
    : { ok: false, expected, message: `Použitý tvar „${surface}" neodpovídá modelu ${modelName} stupeň ${degree} (očekáváno „${expected}").` };
}

// ─────────────────────────────────────────────────────────────
// VALIDATE VERB
// ─────────────────────────────────────────────────────────────

function validateVerb(w) {
  const modelName = w.model;
  const verbDef = verbModels()[modelName];
  if (!verbDef) return { ok: true, expected: null, message: null };

  const lemma = String(w.lemma || '').normalize('NFC').toLowerCase();
  const surface = String(w.surface || '').normalize('NFC').toLowerCase();
  const form = w.form || {};
  const suffix = verbDef.suffix;

  if (!lemma.endsWith(suffix)) return { ok: false, expected: null, message: `Neurčitek modelu ${modelName} musí zakončit na -${suffix}.` };
  const stem = lemma.slice(0, -suffix.length);

  const vft = form.verbFormType;
  if (!vft) return { ok: false, expected: null, message: 'Chybí druh slovesného tvaru (přítomný/budoucí, rozkazovací, l-příčestí).' };

  if (vft === 'present') {
    const person = form.verbPerson, number = form.number;
    if (!fieldEnums().verbPerson.includes(person) || !fieldEnums().number.includes(number)) return { ok: false, expected: null, message: 'Chybí osoba nebo číslo přítomného/budoucího tvaru.' };
    const p = parseInt(person) - 1;
    const n = number === 'plural' ? 3 : 0;
    const idx = p + n;
    if (idx < 0 || idx > 5) return { ok: false, expected: null, message: 'Neplatná kombinace osoby a čísla.' };
    const ending = verbPresent()[modelName]?.[idx];
    if (ending === undefined) return { ok: false, expected: null, message: `Přítomné tvary modelu ${modelName} nejsou v normativních datech.` };
    const expected = stem + ending;
    return expected === surface ? { ok: true, expected, message: null }
      : { ok: false, expected, message: `Použitý tvar „${surface}" neodpovídá modelu ${modelName} přítomný/budoucí (očekáváno „${expected}").` };
  }

  if (vft === 'imperative') {
    const vp = form.verbPerson;
    if (!vp) return { ok: false, expected: null, message: 'Chybí osoba/číslo rozkazovacího způsobu.' };
    const idx = fieldEnums().imperativePerson.indexOf(vp);
    if (idx < 0) return { ok: false, expected: null, message: 'Rozkazovací způsob dovoluje jen 2.sg, 1.pl, 2.pl.' };
    const ending = verbImperative()[modelName]?.[idx];
    if (ending === undefined) return { ok: false, expected: null, message: `Imperativní tvary modelu ${modelName} nejsou v normativních datech.` };
    const expected = stem + ending;
    return expected === surface ? { ok: true, expected, message: null }
      : { ok: false, expected, message: `Použitý tvar „${surface}" neodpovídá modelu ${modelName} imperativ (očekáváno „${expected}").` };
  }

  if (vft === 'lParticiple') {
    const gender = form.verbGender, number = form.number, animacy = form.verbAnimacy;
    if (!fieldEnums().verbGender.includes(gender) || !fieldEnums().number.includes(number)) return { ok: false, expected: null, message: 'Chybí rod nebo číslo l-příčestí.' };
    let idx;
    if (number === 'singular') {
      if (gender === 'masculine') idx = 0;
      else if (gender === 'feminine') idx = 1;
      else if (gender === 'neuter') idx = 2;
      else return { ok: false, expected: null, message: 'Neznámý rod.' };
    } else {
      if (gender === 'masculine') {
        if (!fieldEnums().verbAnimacy.includes(animacy)) return { ok: false, expected: null, message: 'Chybí životnost l-příčestí pro mužský rod množného čísla.' };
        idx = animacy === 'animate' ? 3 : 4;
      } else if (gender === 'feminine') {
        idx = 4;
      } else if (gender === 'neuter') {
        idx = 5;
      } else return { ok: false, expected: null, message: 'Neznámý rod.' };
    }
    const ending = verbLParticiple()[modelName]?.[idx];
    if (ending === undefined) return { ok: false, expected: null, message: `L-příčestí modelu ${modelName} nejsou v normativních datech.` };
    const expected = stem + ending;
    return expected === surface ? { ok: true, expected, message: null }
      : { ok: false, expected, message: `Použitý tvar „${surface}" neodpovídá modelu ${modelName} l-příčestí (očekáváno „${expected}").` };
  }

  return { ok: false, expected: null, message: `Neznámý druh slovesného tvaru „${vft}".` };
}

// ─────────────────────────────────────────────────────────────
// VALIDATE AUXILIARY BÝT
// ─────────────────────────────────────────────────────────────

function validateAuxiliary(w) {
  const surface = String(w.surface || '').normalize('NFC').toLowerCase();
  const allowed = auxBytForms();
  if (!allowed.includes(surface)) {
    return { ok: false, expected: null, message: `„${surface}" není v normativní uzavřené sadě pomocných tvarů být.` };
  }
  return { ok: true, expected: surface, message: null };
}

// ─────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────

/**
 * Deterministicky ověří, zda `w.surface` odpovídá normativnímu modelu a
 * deklarovaným morfologickým hodnotám. Vrátí { ok, expected, message }.
 * Pro funkční slova (předložka, spojka) vrátí ok:true.
 */
export function validateForm(w) {
  if (!w || functionalPos().includes(w.pos)) return { ok: true, expected: null, message: null };
  if (w.role === 'auxiliary') return validateAuxiliary(w);
  if (w.pos === 'noun') return validateNoun(w);
  if (w.pos === 'adjective') return validateAdjective(w);
  if (w.pos === 'verb') return validateVerb(w);
  return { ok: true, expected: null, message: null };
}

// Re-export seznamů modelů pro testy (lazy — čtou z normativních dat za běhu).
export const getNounModels = () => Object.keys(nounModels());
export const getAdjModels  = () => Object.keys(adjModels());
export const getVerbModels = () => Object.keys(verbModels());
// Aliasy pro zpětnou kompatibilitu s morpho.test.mjs (vrací pole stejně jako dříve).
export const _NOUN_MODELS = { [Symbol.iterator]() { return getNounModels()[Symbol.iterator](); }, get length() { return getNounModels().length; }, sort() { return getNounModels().sort(); } };
export const _ADJ_MODELS  = { [Symbol.iterator]() { return getAdjModels()[Symbol.iterator](); },  get length() { return getAdjModels().length; },  sort() { return getAdjModels().sort(); } };
export const _VERB_MODELS = { [Symbol.iterator]() { return getVerbModels()[Symbol.iterator](); }, get length() { return getVerbModels().length; }, sort() { return getVerbModels().sort(); } };
