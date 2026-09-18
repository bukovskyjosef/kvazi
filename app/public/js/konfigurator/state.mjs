import { getModel, getPath, setPath, isFunctional, publicSchema } from './schema.mjs';
import { singleTokens, singlePrepositions, prefixString, prefixLen, punctuation } from './rules-data.mjs';

export const nfc = value => String(value).normalize('NFC');
export const folded = value => nfc(value).toLowerCase();

// Returns true when surface triggers the normative kvazi- prefix rule:
// more than kvazi_prefix_len soutěžní chars and starts exactly with kvazi_prefix (NFC, lowercase).
// Prefix string and length are read from the active normative release via rules-data.mjs.
export const inferKvaziPrefix = surface => {
  const s = folded(nfc(surface));
  const p = prefixString();
  return s.startsWith(p) && [...s].length > prefixLen();
};

export function createDraft() {
  return { sentenceType: 'declarative', implicitSubject: false, meaning: '', defense: '', closingPunct: null, tokens: [], nextId: 1 };
}

export function createToken(id, surface) {
  const w = { id, surface: nfc(surface).toLowerCase(), lemma: '', pos: '', model: '', kvaziPrefix: '', identity: {}, form: {}, lexicalStatus: '', role: '', relations: {}, valency: { modelVerb: '', declaration: '' }, evidence: { source: '', reference: '', morphology: '', needsAnalogy: false, explanation: '', analogy: '' } };
  const s = folded(surface);
  // Single-char tokens and their POS/role come from the normative single_tokens list.
  if (singleTokens().includes(s)) {
    w.pos = singlePrepositions().includes(s) ? 'preposition' : 'conjunction';
    w.role = w.pos === 'preposition' ? 'preposition' : 'coordination';
    w.lemma = s;
    w.lexicalStatus = 'real';
  } else if (inferKvaziPrefix(surface)) {
    w.pos = 'noun';
    w.kvaziPrefix = prefixString();
  }
  return w;
}

// Single immutable mutation boundary. References use IDs, never array positions.
export function mutateDraft(current, action, schema = publicSchema) {
  const draft = structuredClone(current);
  const w = draft.tokens.find(t => t.id === action.id);
  if (action.type === 'insert') {
    if (draft.closingPunct) return current;
    draft.tokens.push(createToken(`t${draft.nextId++}`, action.surface));
  } else if (action.type === 'sentence') {
    if (!['sentenceType', 'implicitSubject', 'meaning', 'defense'].includes(action.path)) throw new Error('Neznámé pole věty.');
    draft[action.path] = typeof action.value === 'string' ? nfc(action.value) : action.value;
    if (action.path === 'sentenceType' && action.value !== 'imperative') draft.implicitSubject = false;
  } else if (action.type === 'close') {
    draft.closingPunct = action.punct;
    const typeMap = Object.fromEntries(Object.entries(punctuation()).map(([type, mark]) => [mark, type]));
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
  } else if (action.type === 'field') {
    if (action.path === 'surface') {
      const fresh = createToken(w.id, action.value);
      if (fresh.surface === w.surface) return current;
      // Same declaration category: retain player metadata, never old inference.
      // Leaving functional words or entering a different inferred POS starts afresh.
      const compatible = isFunctional(w) ? fresh.pos === w.pos : !fresh.pos || fresh.pos === w.pos;
      if (compatible) {
        for (const key of ['pos', 'lemma', 'model', 'identity', 'form', 'lexicalStatus', 'role', 'relations', 'valency', 'evidence']) fresh[key] = w[key];
        if (isFunctional(w)) fresh.lemma = fresh.surface;
        if (w.kvaziPrefix !== fresh.kvaziPrefix) {
          // Prefix changes the lemma identity; do not guess the player's new lemma.
          fresh.lemma = '';
          fresh.evidence = { ...fresh.evidence, source: '', reference: '', morphology: '' };
        }
      } else {
        // References to a changed declaration category need explicit confirmation.
        for (const token of draft.tokens) {
          for (const key of Object.keys(token.relations)) if (token.relations[key] === w.id) delete token.relations[key];
        }
      }
      draft.tokens[draft.tokens.indexOf(w)] = fresh;
      return draft;
    }
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
