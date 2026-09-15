import { getModel, getPath, setPath, isFunctional, publicSchema, wordFields } from './schema.mjs';

export const nfc = value => String(value).normalize('NFC');
export const folded = value => nfc(value).toLowerCase();
export function createDraft() {
  return { sentenceType: 'declarative', implicitSubject: false, meaning: '', defense: '', closingPunct: null, tokens: [], nextId: 1 };
}
export function createToken(id, surface) {
  const w = { id, surface: nfc(surface).toLowerCase(), lemma: '', pos: '', model: '', identity: {}, form: {}, lexicalStatus: '', role: '', relations: {}, valency: { modelVerb: '', declaration: '' }, evidence: { source: '', reference: '', morphology: '', needsAnalogy: false, explanation: '', analogy: '' }, morphology: { cells: {}, prefilled: [], confirmation: null } };
  const s = folded(surface);
  if (['k', 'v', 'z', 'a', 'i'].includes(s)) {
    w.pos = ['k', 'v', 'z'].includes(s) ? 'preposition' : 'conjunction';
    w.role = w.pos === 'preposition' ? 'preposition' : 'coordination';
    w.lemma = s;
    w.lexicalStatus = 'real';
  }
  return w;
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
export function morphologySnapshot(w, schema = publicSchema) {
  return JSON.stringify(canonical({ schema: schema.id, modelSchema: getModel(w, schema), fields: wordFields(w, schema), surface: w.surface, lemma: w.lemma, pos: w.pos, model: w.model, identity: w.identity, form: w.form, lexicalStatus: w.lexicalStatus, valency: w.valency, evidence: w.evidence, cells: w.morphology.cells }));
}
export function canConfirm(w, schema = publicSchema) {
  const model = getModel(w, schema);
  return !isFunctional(w) && !!w.lemma.trim() && ['real', 'quasi'].includes(w.lexicalStatus) && !!model?.cells.length
    && wordFields(w, schema).every(f => { const value = getPath(w, f.path); return f.options ? Object.hasOwn(f.options, value) : typeof value === 'string' && !!value.trim(); })
    && model.cells.every(c => typeof w.morphology.cells[c.id] === 'string' && !!w.morphology.cells[c.id].trim());
}
export const isConfirmed = (w, schema = publicSchema) => isFunctional(w) || (canConfirm(w, schema) && w.morphology.confirmation === morphologySnapshot(w, schema));

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
    if (action.path === 'pos' && isFunctional(createToken(w.id, w.surface))) return current;
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
      w.morphology = { cells: {}, prefilled: [], confirmation: null };
      if (action.value) {
        for (const cell of getModel(w, schema)?.cells || []) {
          w.morphology.cells[cell.id] = w.surface;
          w.morphology.prefilled.push(cell.id);
        }
      }
    }
  } else if (action.type === 'cell') {
    w.morphology.cells[action.key] = nfc(action.value);
    w.morphology.prefilled = w.morphology.prefilled.filter(k => k !== action.key);
  } else if (action.type === 'prefill') {
    for (const cell of getModel(w, schema)?.cells || []) {
      if (!w.morphology.cells[cell.id]?.trim()) {
        w.morphology.cells[cell.id] = w.surface;
        w.morphology.prefilled.push(cell.id);
      }
    }
  } else if (action.type === 'confirm') {
    w.morphology.confirmation = canConfirm(w, schema) ? morphologySnapshot(w, schema) : null;
    if (w.morphology.confirmation) w.morphology.prefilled = [];
  }
  for (const t of draft.tokens) {
    if (t.morphology.confirmation !== morphologySnapshot(t, schema)) t.morphology.confirmation = null;
  }
  return draft;
}
