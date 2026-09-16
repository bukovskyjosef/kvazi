import { getPath, getModel, wordFields, isFunctional, publicSchema } from './schema.mjs';
import { nfc, folded, inferKvaziPrefix } from './state.mjs';
import { validateForm } from './morpho.mjs';
import {
  fieldEnums, validPos, motifTransitions, nominalPos, syntaxRoleSets, implicitSubjectRule,
  singleTokens, singlePrepositions, singleConjunctions,
  punctuation as ndPunctuation,
  relationShapes as ndRelationShapes,
  surfaceCharset, tokenMinChars, tokenMaxChars, prefixLen,
  prepositionGovt, nounModels as ndNounModels,
} from './rules-data.mjs';

// DFA for valid token character sequences: each token must form one complete
// KVAZ{I/Í/Y/Ý} motif (or be a single-char exception). The automaton is the
// structural implementation of the motif boundary rule.
function transition(state, c) {
  return motifTransitions()[state]?.[c] ?? -1;
}

// Cached charset regex — built once from normative release data.
let _charsetRe = null;
function getCharsetRe() {
  return _charsetRe ??= new RegExp(surfaceCharset(), 'iu');
}

export function validateTokenSequence(tokens) {
  const issues = [];
  const add = (id, message) => issues.push({ id, message });
  if (!tokens.length) add(null, 'Věta zatím neobsahuje slova.');
  const singles = singleTokens();
  const minChars = tokenMinChars();
  const maxChars = tokenMaxChars();
  const pfxLen   = prefixLen();
  const used = new Map();
  for (const w of tokens) {
    const s = nfc(w.surface), length = [...s].length;
    if (!getCharsetRe().test(s)) add(w.id, 'Použijte pouze znaky K V Q A Á Z I Í Y Ý, bez mezer a znamének.');
    const hasPrefix = inferKvaziPrefix(s);
    if (!singles.includes(folded(s))) {
      if (hasPrefix) {
        const baseLen = length - pfxLen;
        if (baseLen < minChars || baseLen > maxChars) add(w.id, `Základ za prefixem kvazi- musí mít ${minChars}–${maxChars} znaků.`);
      } else if (length < minChars || length > maxChars) {
        add(w.id, `Běžné slovo musí mít ${minChars}–${maxChars} znaků; výjimky jsou pouze ${singles.join('/')}.`);
      }
    }
    if (singles.includes(folded(s))) {
      if (used.has(folded(s))) { add(w.id, 'Jednopísmennou výjimku lze použít jen jednou.'); add(used.get(folded(s)), 'Jednopísmenná výjimka je ve větě opakovaná.'); }
      used.set(folded(s), w.id);
    }
  }
  // For the DFA, a prefixed token is split into the KVAZI motif and its base,
  // so each part independently satisfies the word-boundary constraint.
  const segments = [];
  for (const w of tokens) {
    const upper = nfc(w.surface).toUpperCase();
    if (inferKvaziPrefix(w.surface)) {
      segments.push([...upper.slice(0, pfxLen)]);
      segments.push([...upper.slice(pfxLen)]);
    } else {
      segments.push([...upper]);
    }
  }
  const fits = tokens.length > 0 && motifTransitions().map((_, i) => i).some(start => {
    let state = start;
    for (const seg of segments) {
      for (let i = 0; i < seg.length; i++) {
        state = transition(state, seg[i]);
        if (state < 0 || (state === 0 && i < seg.length - 1)) return false;
      }
    }
    return true;
  });
  if (tokens.length && !fits) add(null, 'Slova netvoří souvislou posloupnost motivů, v níž každé slovo leží uvnitř jediného motivu.');
  return { ok: issues.length === 0, issues };
}

export function validateSyntax(draft, schema = publicSchema) {
  const issues = [];
  const words = draft.tokens;
  const byId = id => words.find(w => w.id === id);
  const nominal = w => w && nominalPos().includes(w.pos);
  const predicate = w => w?.role === 'predicate' && w.pos === 'verb';
  const relShapes = ndRelationShapes();
  for (const w of words) {
    const add = message => issues.push({ id: w.id, message });
    const expected = Object.hasOwn(relShapes, w.role) ? relShapes[w.role] : undefined;
    if (!expected) { add('Chybí povolená větná funkce nebo technická role.'); continue; }
    const actual = Object.keys(w.relations).filter(key => w.relations[key] != null && w.relations[key] !== '');
    if (actual.length !== expected.length || actual.some(key => !expected.includes(key))) add('Počet nebo druh vazeb neodpovídá zvolené funkci.');
    for (const key of expected) if (!byId(w.relations[key]) || w.relations[key] === w.id) add('Každá vazba musí mířit na jiné existující slovo této věty.');
    const head = byId(w.relations.head);
    if (w.role === 'predicate' && !predicate(w)) add('Přísudek musí být plnovýznamové sloveso.');
    if (w.role === 'auxiliary') {
      if (w.pos !== 'verb' || folded(w.lemma) !== 'být') add('Pomocné být musí mít slovní druh sloveso a lemma „být".');
      if (!predicate(byId(w.relations.predicate))) add('Pomocné být musí odkazovat na přísudek — plnovýznamové sloveso.');
    }
    if (syntaxRoleSets().predicate_head.includes(w.role) && !predicate(head)) add('Řídícím slovem musí být přísudek.');
    if (syntaxRoleSets().nominal_head.includes(w.role) && !nominal(head)) add('Přívlastek musí odkazovat na jmenný člen.');
    if (w.role === 'preposition' && (!nominal(byId(w.relations.nominal)) || w.pos !== 'preposition')) add('Předložka vyžaduje právě jednu vazbu na řízené jmenné slovo.');
    if (w.role === 'preposition' && w.pos === 'preposition') {
      const nomTarget = byId(w.relations.nominal);
      if (nomTarget) {
        const prep = folded(w.surface);
        const govRules = prepositionGovt();
        const governed = govRules[prep];
        if (governed) {
          const nomCase = nomTarget.form?.case;
          if (nomCase && !governed.includes(nomCase)) add(`Předložka „${prep}" vyžaduje ${governed.join(' nebo ')}. pád řízeného jmenného slova; použitý tvar je v ${nomCase}. pádu.`);
        }
      }
    }
    if (w.role === 'supplement') {
      const target = byId(w.relations.nominal);
      if (!predicate(byId(w.relations.predicate)) || !nominal(target) || !syntaxRoleSets().supplement_target.includes(target?.role)) add('Doplněk vyžaduje přísudek a jmenný podmět nebo předmět.');
    }
    if (w.role === 'coordination') {
      const a = byId(w.relations.left), b = byId(w.relations.right);
      if (w.pos !== 'conjunction' || !a || !b || a.id === b.id || a.role !== b.role || !syntaxRoleSets().coordination.includes(a.role)) add('Spojka musí spojovat dvě různé části se stejnou dovolenou hlavní funkcí, nikoli podměty či přísudky.');
    }
  }
  // All dependency branches must lead to the single predicate; cycles cannot
  // form a second, disconnected sentence. Iterative traversal avoids stack limits.
  const done = new Set();
  for (const root of words) {
    const active = new Set(), stack = [[root, false]];
    while (stack.length) {
      const [w, leaving] = stack.pop();
      if (leaving) { active.delete(w.id); done.add(w.id); continue; }
      if (active.has(w.id)) { issues.push({ id: w.id, message: 'Syntaktické vazby obsahují kruh.' }); break; }
      if (done.has(w.id)) continue;
      active.add(w.id); stack.push([w, true]);
      for (const id of Object.values(w.relations)) { const target = byId(id); if (target) stack.push([target, false]); }
    }
  }
  return { ok: words.length > 0 && issues.length === 0, issues };
}

// Explicit deep-validation status when surface gate already decided INVALID.
// The deep morpho/syntax engine (morpho.mjs) remains intact as dormant/reusable
// implementation for future rules versions — only the call site is gated.
const NOT_EVALUATED = Object.freeze({ status: 'notEvaluated', reason: 'surfaceInvalid', ok: null, expected: null, message: null });

export function deriveValidationState(draft, schema = publicSchema) {
  // ── Phase 1: surface gate ──────────────────────────────────
  const sequence = validateTokenSequence(draft.tokens);
  const surfaceOk = sequence.ok;

  // Preview text and basic scoring are always computed (surface-level info).
  const punct = ndPunctuation();
  const previewSurfaces = draft.tokens.map((w, i) => {
    const s = nfc(w.surface);
    return i === 0 && s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
  });
  const termPunct = draft.closingPunct ?? (Object.hasOwn(punct, draft.sentenceType) ? punct[draft.sentenceType] : '');
  const pfxLen = prefixLen();
  const tokenIssueIds = new Set(sequence.issues.filter(i => i.id !== null).map(i => i.id));
  const charScore = draft.tokens.reduce((sum, w) => {
    const len = [...nfc(w.surface)].length;
    if (sequence.ok && inferKvaziPrefix(w.surface) && w.pos === 'noun' && !tokenIssueIds.has(w.id)) return sum + (len - pfxLen);
    return sum + len;
  }, 0);

  // ── Surface gate FAILED: short-circuit all Phase 2/3 ───────
  // No declaration integrity, syntax, agreement or deep morphology.
  // The deep engine (morpho.mjs, validateSyntax, etc.) remains intact
  // as dormant/reusable code — only the call site is gated.
  if (!surfaceOk) {
    const tokens = {};
    for (const w of draft.tokens) {
      tokens[w.id] = {
        missing: [], formCheck: NOT_EVALUATED,
        issues: sequence.issues.filter(i => i.id === null || i.id === w.id).map(i => i.message),
        complete: false,
      };
    }
    return { sequence, syntax: { ok: false, issues: [] }, sentenceIssues: [], tokens,
      structureOk: false, morphologyOk: false, sentenceOk: false, fullVerbOk: false,
      submitReady: false, text: previewSurfaces.join(' ') + termPunct,
      wordCount: draft.tokens.length, charScore };
  }

  // ── Phase 2: declaration integrity (surface-valid only) ────
  const syntax = validateSyntax(draft, schema);
  const sentenceIssues = [];
  const predicates = draft.tokens.filter(w => w.role === 'predicate');
  const subjects = draft.tokens.filter(w => w.role === 'subject');
  const verbs = draft.tokens.filter(w => w.pos === 'verb');
  const fullContentVerbs = verbs.filter(w => w.role !== 'auxiliary');
  if (draft.closingPunct != null && draft.closingPunct !== punct[draft.sentenceType]) sentenceIssues.push('Závěrečná interpunkce neodpovídá typu věty.');
  if (!Object.hasOwn(punct, draft.sentenceType)) sentenceIssues.push('Vyberte typ věty.');
  const fullVerbOk = fullContentVerbs.length === 1;
  if (!fullVerbOk) sentenceIssues.push('Věta musí obsahovat právě jeden plnovýznamový slovesný token.');
  if (predicates.length !== 1) sentenceIssues.push('Věta musí mít právě jeden přísudek.');
  if (draft.implicitSubject) {
    if (predicates[0]?.form?.verbFormType !== implicitSubjectRule().verb_form_type) sentenceIssues.push('Nevyjádřený podmět vyžaduje skutečný imperativní tvar přísudku.');
    if (draft.sentenceType !== implicitSubjectRule().sentence_type || subjects.length !== 0) sentenceIssues.push('Nevyjádřený podmět je možný jen u rozkazovací věty bez explicitního podmětu.');
    if (!schema.allowsImplicitSubject?.(predicates[0], draft)) sentenceIssues.push('Dovolený imperativ pro nevyjádřený podmět musí určit dokončený slovesný model (#2/#4).');
  } else if (subjects.length !== 1) sentenceIssues.push('Věta musí mít právě jeden výslovný podmět.');

  // ── Phase 3: agreement + deep morphology (surface-valid only) ──
  const subjectWord = subjects[0];
  const predicateWord = predicates[0];
  if (subjectWord && predicateWord && predicateWord.pos === 'verb') {
    const vft = predicateWord.form?.verbFormType;
    const nounModelData = ndNounModels();
    if (subjectWord.pos === 'noun') {
      const subjModel = nounModelData[subjectWord.model];
      if (vft === 'present') {
        const vPerson = predicateWord.form?.verbPerson;
        const sn = subjectWord.form?.number, vn = predicateWord.form?.number;
        if (sn && vn && sn !== vn) sentenceIssues.push('Číslo slovesa neodpovídá číslu podmětu.');
        if (vPerson && vPerson !== '3') sentenceIssues.push('Podmět je podstatné jméno; přítomný/budoucí slovesný tvar musí být ve 3. osobě.');
      }
      if (vft === 'lParticiple' && subjModel) {
        const subjGender = subjModel.gender;
        const subjNumber = subjectWord.form?.number;
        const verbGender = predicateWord.form?.verbGender;
        const verbNumber = predicateWord.form?.number;
        if (verbGender && subjGender && verbGender !== subjGender) sentenceIssues.push(`Rod l-příčestí (${verbGender}) neodpovídá rodu podmětu (${subjGender}).`);
        if (verbNumber && subjNumber && verbNumber !== subjNumber) sentenceIssues.push(`Číslo l-příčestí (${verbNumber}) neodpovídá číslu podmětu (${subjNumber}).`);
        if (verbGender === 'masculine' && subjGender === 'masculine' &&
            verbNumber === 'plural' && subjNumber === 'plural') {
          const subjAnimacy = subjModel.animacy;
          const verbAnimacy = predicateWord.form?.verbAnimacy;
          if (subjAnimacy && verbAnimacy && subjAnimacy !== verbAnimacy) {
            sentenceIssues.push(`Životnost l-příčestí (${verbAnimacy}) neodpovídá životnosti podmětu (${subjAnimacy}).`);
          }
        }
      }
    }
  }

  const tokens = {};
  const identities = new Map();
  const singles = singleTokens();
  const preps = singlePrepositions();
  const conjs = singleConjunctions();
  for (const w of draft.tokens) {
    const missing = [];
    const s = folded(w.surface);
    if (inferKvaziPrefix(s) && w.pos !== 'noun') missing.push('Prefix kvazi- je povolen pouze pro podstatná jména.');
    for (const [key, value] of Object.entries(w.form ?? {})) {
      const enumKey = key === 'verbPerson' && w.form.verbFormType === 'imperative' ? 'imperativePerson' : key;
      if (value !== '' && fieldEnums()[enumKey] && !fieldEnums()[enumKey].includes(value)) missing.push(`Neplatná hodnota ${key}.`);
    }
    if (!validPos().includes(w.pos)) missing.push('Slovní druh.');
    if ((preps.includes(s) !== (w.pos === 'preposition')) || (conjs.includes(s) !== (w.pos === 'conjunction'))) missing.push('Jednopísmenná výjimka a slovní druh si odporují.');
    if (w.pos === 'preposition' && w.role !== 'preposition') missing.push('Předložka má technickou roli bez hlavní větné funkce.');
    if (w.pos === 'conjunction' && w.role !== 'coordination') missing.push('Spojka má roli koordinace.');
    if (isFunctional(w) && (w.lexicalStatus !== 'real' || folded(w.lemma) !== s)) missing.push('Identita funkčního slova musí odpovídat jednopísmenné výjimce.');
    if (!isFunctional(w)) {
      if (w.role === 'auxiliary') {
        if (folded(w.lemma) !== 'být') missing.push('Pomocné sloveso musí mít lemma „být".');
        if (w.lexicalStatus !== 'real') missing.push('Pomocné „být" má lexikální status skutečného slova.');
      } else {
        if (!w.lemma.trim()) missing.push('Základní tvar / neurčitek.');
        if (!fieldEnums().lexicalStatus.includes(w.lexicalStatus)) missing.push('Skutečné slovo nebo kvazislovo podle celé identity.');
        if (w.pos === 'pronoun' && w.lexicalStatus !== 'real') missing.push('Nová zájmena nelze vytvářet.');
        if (w.pos === 'pronoun' && (w.model ?? '') !== '') missing.push('Zájmeno nemá produktivní soutěžní model.');
        const model = getModel(w, schema);
        if (!model && w.pos !== 'pronoun') missing.push('Povolený soutěžní model.');
        if (model?.identity && Object.entries(model.identity).some(([key, value]) => w.identity[key] !== value)) missing.push('Rod nebo životnost neodpovídá zvolenému modelu.');
        for (const f of wordFields(w, schema)) {
          const value = getPath(w, f.path);
          if (f.options ? typeof value !== 'string' || !Object.hasOwn(f.options, value) : typeof value !== 'string' || !value.trim()) missing.push(f.label + '.');
        }
        if (!w.evidence.morphology.trim()) missing.push('Morfologická obhajoba a odkaz na použitý model.');
        if (['noun', 'adjective'].includes(w.pos) && w.lemma.trim() && model) {
          const identity = JSON.stringify([w.pos, folded(w.lemma), w.model, ...(w.pos === 'noun' ? [w.identity.gender, w.identity.animacy] : [])]);
          if (identities.has(identity)) { missing.push('Soutěžní identita už je ve větě použita.'); tokens[identities.get(identity)].missing.push('Soutěžní identita už je ve větě použita.'); }
          identities.set(identity, w.id);
        }
      }
    }
    if (w.evidence.needsAnalogy && (!w.evidence.explanation.trim() || !w.evidence.analogy.trim())) missing.push('Obhajoba nejasného/fiktivního vztahu a běžná česká analogie.');
    const formCheck = validateForm(w);
    tokens[w.id] = { missing, formCheck };
  }
  const idsOk = new Set(draft.tokens.map(w => w.id)).size === draft.tokens.length && draft.tokens.every(w => typeof w.id === 'string' && !!w.id);
  if (!idsOk) sentenceIssues.push('Interní ID slov musejí být neprázdná a jedinečná.');
  const structureOk = draft.tokens.length > 0 && Object.values(tokens).every(t => !t.missing.length);
  const morphologyOk = draft.tokens.length > 0 && Object.values(tokens).every(t => t.formCheck.ok === true);
  const sentenceOk = !sentenceIssues.length;
  for (const w of draft.tokens) {
    const t = tokens[w.id];
    t.issues = [...sequence.issues.filter(i => i.id === null || i.id === w.id), ...syntax.issues.filter(i => i.id === w.id)].map(i => i.message);
    t.complete = !t.missing.length && !t.issues.length && t.formCheck.ok === true;
  }
  return { sequence, syntax, sentenceIssues, tokens, structureOk, morphologyOk, sentenceOk, fullVerbOk,
    submitReady: syntax.ok && sentenceOk && structureOk && morphologyOk,
    text: previewSurfaces.join(' ') + termPunct,
    wordCount: draft.tokens.length, charScore };
}

// Preview is always explicit and always recomputed. No backend submission here.
export function previewDraft(draft, schema = publicSchema) {
  const validation = deriveValidationState(draft, schema);
  return { kind: 'local-prototype-preview', submitted: false, schema: schema.id, draft: structuredClone(draft), validation };
}
