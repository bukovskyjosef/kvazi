import { relationShapes, punctuation, partsOfSpeech, getPath, getModel, wordFields, isFunctional, publicSchema } from './schema.mjs';
import { nfc, folded } from './state.mjs';
import { validateForm } from './morpho.mjs';

const singles = ['k', 'v', 'z', 'a', 'i'];
function transition(state, c) {
  return [() => c === 'K' ? 1 : c === 'Q' ? 2 : -1, () => c === 'V' ? 2 : -1,
    () => 'AÁ'.includes(c) ? 3 : -1, () => c === 'Z' ? 4 : -1, () => 'IÍYÝ'.includes(c) ? 0 : -1][state]();
}
export function validateTokenSequence(tokens) {
  const issues = [];
  const add = (id, message) => issues.push({ id, message });
  if (!tokens.length) add(null, 'Věta zatím neobsahuje slova.');
  const used = new Map();
  for (const w of tokens) {
    const s = nfc(w.surface), length = [...s].length;
    if (!/^[KVQAÁZIÍYÝ]+$/iu.test(s)) add(w.id, 'Použijte pouze znaky K V Q A Á Z I Í Y Ý, bez mezer a znamének.');
    if (!singles.includes(folded(s)) && (length < 3 || length > 5)) add(w.id, 'Běžné slovo musí mít 3–5 znaků; výjimky jsou pouze k/v/z/a/i.');
    if (singles.includes(folded(s))) {
      if (used.has(folded(s))) { add(w.id, 'Jednopísmennou výjimku lze použít jen jednou.'); add(used.get(folded(s)), 'Jednopísmenná výjimka je ve větě opakovaná.'); }
      used.set(folded(s), w.id);
    }
  }
  const fits = tokens.length > 0 && [0, 1, 2, 3, 4].some(start => {
    let state = start;
    for (const w of tokens) {
      const chars = [...nfc(w.surface).toUpperCase()];
      for (let i = 0; i < chars.length; i++) {
        state = transition(state, chars[i]);
        if (state < 0 || (state === 0 && i < chars.length - 1)) return false;
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
  const nominal = w => w && ['noun', 'adjective', 'pronoun'].includes(w.pos);
  const predicate = w => w?.role === 'predicate' && w.pos === 'verb';
  for (const w of words) {
    const add = message => issues.push({ id: w.id, message });
    const expected = Object.hasOwn(relationShapes, w.role) ? relationShapes[w.role] : undefined;
    if (!expected) { add('Chybí povolená větná funkce nebo technická role.'); continue; }
    const actual = Object.keys(w.relations).filter(key => w.relations[key] != null && w.relations[key] !== '');
    if (actual.length !== expected.length || actual.some(key => !expected.includes(key))) add('Počet nebo druh vazeb neodpovídá zvolené funkci.');
    for (const key of expected) if (!byId(w.relations[key]) || w.relations[key] === w.id) add('Každá vazba musí mířit na jiné existující slovo této věty.');
    const head = byId(w.relations.head);
    if (w.role === 'predicate' && !predicate(w)) add('Přísudek musí být plnovýznamové sloveso.');
    if (['subject', 'object', 'adverbial'].includes(w.role) && !predicate(head)) add('Řídícím slovem musí být přísudek.');
    if (['agreeingAttribute', 'attribute'].includes(w.role) && !nominal(head)) add('Přívlastek musí odkazovat na jmenný člen.');
    if (w.role === 'preposition' && (!nominal(byId(w.relations.nominal)) || w.pos !== 'preposition')) add('Předložka vyžaduje právě jednu vazbu na řízené jmenné slovo.');
    if (w.role === 'supplement') {
      const target = byId(w.relations.nominal);
      if (!predicate(byId(w.relations.predicate)) || !nominal(target) || !['subject', 'object'].includes(target?.role)) add('Doplněk vyžaduje přísudek a jmenný podmět nebo předmět.');
    }
    if (w.role === 'coordination') {
      const a = byId(w.relations.left), b = byId(w.relations.right);
      if (w.pos !== 'conjunction' || !a || !b || a.id === b.id || a.role !== b.role || !['object', 'agreeingAttribute', 'attribute', 'adverbial', 'supplement'].includes(a.role)) add('Spojka musí spojovat dvě různé části se stejnou dovolenou hlavní funkcí, nikoli podměty či přísudky.');
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

export function deriveValidationState(draft, schema = publicSchema) {
  const sequence = validateTokenSequence(draft.tokens);
  const syntax = validateSyntax(draft, schema);
  const sentenceIssues = [];
  const predicates = draft.tokens.filter(w => w.role === 'predicate');
  const subjects = draft.tokens.filter(w => w.role === 'subject');
  const verbs = draft.tokens.filter(w => w.pos === 'verb');
  if (!Object.hasOwn(punctuation, draft.sentenceType)) sentenceIssues.push('Vyberte typ věty.');
  const fullVerbOk = verbs.length === 1;
  if (!fullVerbOk) sentenceIssues.push('Věta musí obsahovat právě jeden plnovýznamový slovesný token.');
  if (predicates.length !== 1) sentenceIssues.push('Věta musí mít právě jeden přísudek.');
  if (draft.implicitSubject) {
    if (draft.sentenceType !== 'imperative' || subjects.length !== 0) sentenceIssues.push('Nevyjádřený podmět je možný jen u rozkazovací věty bez explicitního podmětu.');
    if (!schema.allowsImplicitSubject?.(verbs[0], draft)) sentenceIssues.push('Dovolený imperativ pro nevyjádřený podmět musí určit dokončený slovesný model (#2/#4).');
  } else if (subjects.length !== 1) sentenceIssues.push('Věta musí mít právě jeden výslovný podmět.');
  const tokens = {};
  const identities = new Map();
  for (const w of draft.tokens) {
    const missing = [];
    const s = folded(w.surface);
    if (!Object.hasOwn(partsOfSpeech, w.pos)) missing.push('Slovní druh.');
    if ((['k', 'v', 'z'].includes(s) !== (w.pos === 'preposition')) || (['a', 'i'].includes(s) !== (w.pos === 'conjunction'))) missing.push('Jednopísmenná výjimka a slovní druh si odporují.');
    if (w.pos === 'preposition' && w.role !== 'preposition') missing.push('Předložka má technickou roli bez hlavní větné funkce.');
    if (w.pos === 'conjunction' && w.role !== 'coordination') missing.push('Spojka má roli koordinace.');
    if (isFunctional(w) && (w.lexicalStatus !== 'real' || folded(w.lemma) !== s)) missing.push('Identita funkčního slova musí odpovídat jednopísmenné výjimce.');
    if (!isFunctional(w)) {
      if (!w.lemma.trim()) missing.push('Základní tvar / neurčitek.');
      if (!['real', 'quasi'].includes(w.lexicalStatus)) missing.push('Skutečné slovo nebo kvazislovo podle celé identity.');
      if (w.pos === 'pronoun' && w.lexicalStatus !== 'real') missing.push('Nová zájmena nelze vytvářet.');
      const model = getModel(w, schema);
      if (!model) missing.push('Povolený soutěžní model.');
      if (model?.identity && Object.entries(model.identity).some(([key, value]) => w.identity[key] !== value)) missing.push('Rod nebo životnost neodpovídá zvolenému modelu.');
      for (const f of wordFields(w, schema)) {
        const value = getPath(w, f.path);
        if (f.options ? !Object.hasOwn(f.options, value) : typeof value !== 'string' || !value.trim()) missing.push(f.label + '.');
      }
      if (!w.evidence.morphology.trim()) missing.push('Morfologická obhajoba a odkaz na použitý model.');
      if (w.lexicalStatus === 'real' && (!['IJP', 'ASSČ'].includes(w.evidence.source) || !w.evidence.reference.trim())) missing.push('Doklad existence: IJP nebo ASSČ a konkrétní heslo/odkaz.');
      if (['noun', 'adjective'].includes(w.pos) && w.lemma.trim() && model) {
        const identity = JSON.stringify([w.pos, folded(w.lemma), w.model, ...(w.pos === 'noun' ? [w.identity.gender, w.identity.animacy] : [])]);
        if (identities.has(identity)) { missing.push('Soutěžní identita už je ve větě použita.'); tokens[identities.get(identity)].missing.push('Soutěžní identita už je ve větě použita.'); }
        identities.set(identity, w.id);
      }
    }
    if (w.evidence.needsAnalogy && (!w.evidence.explanation.trim() || !w.evidence.analogy.trim())) missing.push('Obhajoba nejasného/fiktivního vztahu a běžná česká analogie.');
    const formCheck = validateForm(w);
    tokens[w.id] = { missing, formCheck };
  }
  const idsOk = new Set(draft.tokens.map(w => w.id)).size === draft.tokens.length && draft.tokens.every(w => typeof w.id === 'string' && !!w.id);
  if (!idsOk) sentenceIssues.push('Interní ID slov musejí být neprázdná a jedinečná.');
  const structureOk = draft.tokens.length > 0 && Object.values(tokens).every(t => !t.missing.length);
  const morphologyOk = draft.tokens.length > 0 && Object.values(tokens).every(t => t.formCheck.ok);
  const sentenceOk = !sentenceIssues.length;
  for (const w of draft.tokens) {
    const t = tokens[w.id];
    t.issues = [...sequence.issues.filter(i => i.id === null || i.id === w.id), ...syntax.issues.filter(i => i.id === w.id)].map(i => i.message);
    t.complete = !t.missing.length && !t.issues.length && t.formCheck.ok;
  }
  const previewSurfaces = draft.tokens.map((w, i) => {
    const s = nfc(w.surface);
    return i === 0 && s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
  });
  const termPunct = draft.closingPunct ?? (Object.hasOwn(punctuation, draft.sentenceType) ? punctuation[draft.sentenceType] : '');
  return { sequence, syntax, sentenceIssues, tokens, structureOk, morphologyOk, sentenceOk, fullVerbOk,
    submitReady: sequence.ok && syntax.ok && sentenceOk && structureOk && morphologyOk,
    text: previewSurfaces.join(' ') + termPunct,
    wordCount: draft.tokens.length, charCount: draft.tokens.reduce((sum, w) => sum + [...nfc(w.surface)].length, 0) };
}

// Preview is always explicit and always recomputed. No backend submission here.
export function previewDraft(draft, schema = publicSchema) {
  const validation = deriveValidationState(draft, schema);
  return { kind: 'local-prototype-preview', submitted: false, schema: schema.id, draft: structuredClone(draft), validation };
}
