import { getModel, getPath, setPath, isFunctional, publicSchema } from './schema.mjs';

export const nfc = value => String(value).normalize('NFC');
export const folded = value => nfc(value).toLowerCase();
// Returns true when surface triggers the normative kvazi- prefix rule:
// more than 5 soutěžní chars and starts exactly with 'kvazi' (case-insensitive, NFC).
export const inferKvaziPrefix = surface => {
  const s = folded(nfc(surface));
  return s.startsWith('kvazi') && [...s].length > 5;
};
export function createDraft() {
  return { sentenceType: 'declarative', implicitSubject: false, meaning: '', defense: '', closingPunct: null, tokens: [], nextId: 1 };
}
export function createToken(id, surface) {
  const w = { id, surface: nfc(surface).toLowerCase(), lemma: '', pos: '', model: '', kvaziPrefix: '', identity: {}, form: {}, lexicalStatus: '', role: '', relations: {}, valency: { modelVerb: '', declaration: '' }, evidence: { source: '', reference: '', morphology: '', needsAnalogy: false, explanation: '', analogy: '' } };
  const s = folded(surface);
  if (['k', 'v', 'z', 'a', 'i'].includes(s)) {
    w.pos = ['k', 'v', 'z'].includes(s) ? 'preposition' : 'conjunction';
    w.role = w.pos === 'preposition' ? 'preposition' : 'coordination';
    w.lemma = s;
    w.lexicalStatus = 'real';
  } else if (inferKvaziPrefix(surface)) {
    w.pos = 'noun';
    w.kvaziPrefix = 'kvazi';
  }
  return w;
}

// Single immutable mutation boundary. References use IDs, never array positions.
export function mutateDraft(current, action, schema = publicSchema) {
  const draft = structuredClone(current);
  const w = draft.tokens.find(t => t.id === action.id);
  if (action.type === 'insert') {
    if (draft.closingPunct) return current;
    const index = action.anchor == null ? draft.tokens.length : draft.tokens.findIndex(t => t.id === action.anchor);
    if (index < 0) throw new Error('Neexistující místo vložení.');
    draft.tokens.splice(index + (action.anchor != null && action.side === 'after' ? 1 : 0), 0, createToken(`t${draft.nextId++}`, action.surface));
  } else if (action.type === 'sentence') {
    if (!['sentenceType', 'implicitSubject', 'meaning', 'defense'].includes(action.path)) throw new Error('Neznámé pole věty.');
    draft[action.path] = typeof action.value === 'string' ? nfc(action.value) : action.value;
    if (action.path === 'sentenceType' && action.value !== 'imperative') draft.implicitSubject = false;
  } else if (action.type === 'close') {
    draft.closingPunct = action.punct;
    const typeMap = { '.': 'declarative', '?': 'interrogative', '!': 'imperative' };
    if (typeMap[action.punct]) draft.sentenceType = typeMap[action.punct];
    if (draft.sentenceType !== 'imperative') draft.implicitSubject = false;
  } else if (action.type === 'open') {
    draft.closingPunct = null;
  } else if (!w) {
    throw new Error('Neexistující slovo.');
  } else if (action.type === 'delete') {
    draft.tokens = draft.tokens.filter(t => t.id !== w.id);
    for (const t of draft.tokens) {
      for (const key of Object.keys(t.relations)) if (t.relations[key] === w.id) delete t.relations[key];
    }
  } else if (action.type === 'surface' && w.surface !== nfc(action.value)) {
    // Text-dependent declarations are reset; unrelated syntactic links survive.
    const replacement = createToken(w.id, action.value);
    if (!isFunctional(w) && !isFunctional(replacement)) {
      replacement.pos = w.pos;
      replacement.role = w.role;
      replacement.relations = w.relations;
    } else if (w.pos === replacement.pos) replacement.relations = w.relations;
    Object.assign(w, replacement);
  } else if (action.type === 'field') {
    if (action.path === 'pos' && (isFunctional(createToken(w.id, w.surface)) || inferKvaziPrefix(w.surface))) return current;
    const previous = getPath(w, action.path);
    const normalized = typeof action.value === 'string' ? nfc(action.value) : action.value;
    setPath(w, action.path, action.path === 'lemma' && typeof normalized === 'string' ? normalized.toLowerCase() : normalized);
    if (previous !== action.value && action.path === 'pos') {
      const fresh = createToken(w.id, w.surface);
      Object.assign(w, fresh, { pos: action.value });
    }
    if (previous !== action.value && action.path === 'role') w.relations = {};
    if (previous !== action.value && action.path === 'model') {
      w.identity = structuredClone(getModel(w, schema)?.identity || {});
      w.form = {};
    }
  }
  return draft;
}
