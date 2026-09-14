import { createDraft, mutateDraft, nfc } from './state.mjs';
import { deriveValidationState, previewDraft, validateTokenSequence } from './validation.mjs';
import { renderSentence, renderTokens, renderEditor, renderValidation } from './view.mjs';

let draft = createDraft(), selectedId = null;
let composing = false;
const element = id => document.getElementById(id);
function render() {
  const focused = document.activeElement;
  const focusId = focused?.id;
  const selection = focused?.tagName === 'INPUT' && focused.type === 'text' ? [focused.selectionStart, focused.selectionEnd] : null;
  const state = deriveValidationState(draft);
  renderSentence(draft, state);
  renderTokens(draft, state, selectedId);
  renderEditor(draft, state, selectedId);
  renderValidation(draft, state);
  if (focusId && element(focusId)) {
    element(focusId).focus({ preventScroll: true });
    if (selection) element(focusId).setSelectionRange(...selection);
  }
  const summary = `${state.wordCount} slov. Znaková kontrola ${state.sequence.ok ? 'splněna' : 'nesplněna'}. Struktura ${state.syntax.ok && state.sentenceOk && state.structureOk ? 'úplná' : 'k doplnění'}. Morfologické návrhy ${state.morphologyOk ? 'potvrzeny' : 'nepotvrzeny'}. ${state.submitReady ? 'Připraveno k odeslání; backend není zapojen.' : 'Zatím není připraveno k odeslání.'}`;
  if (element('liveStatus').textContent !== summary) element('liveStatus').textContent = summary;
}
function dispatch(action) {
  draft = mutateDraft(draft, action);
  // A displayed preview must never silently outlive its draft snapshot.
  element('payload').replaceChildren();
  render();
}
function updateField(target) {
  if (target.dataset.cell) dispatch({ type: 'cell', id: selectedId, key: target.dataset.cell, value: target.value });
  else if (target.dataset.path) {
    const value = target.type === 'checkbox' ? target.checked : target.value;
    dispatch({ type: target.dataset.scope === 'sentence' ? 'sentence' : target.dataset.path === 'surface' ? 'surface' : 'field', id: selectedId, path: target.dataset.path, value });
  }
}
document.addEventListener('compositionstart', () => { composing = true; });
document.addEventListener('compositionend', e => { composing = false; updateField(e.target); });
document.addEventListener('input', e => {
  if (!composing && e.target.type !== 'checkbox' && e.target.tagName !== 'SELECT') updateField(e.target);
});
document.addEventListener('change', e => {
  if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') updateField(e.target);
});
element('newSurface').addEventListener('input', e => {
  const result = validateTokenSequence([{ id: 'input', surface: nfc(e.target.value) }]);
  element('inputStatus').textContent = e.target.value ? result.issues.map(i => i.message).join(' ') : '';
});
element('insertForm').addEventListener('submit', e => {
  e.preventDefault();
  const surface = nfc(element('newSurface').value);
  if (!surface) return;
  const [side, anchor] = element('insertPlace').value.split(':');
  selectedId = `t${draft.nextId}`;
  dispatch({ type: 'insert', surface, side, anchor });
  element('newSurface').value = '';
  element('inputStatus').textContent = '';
  element('word-surface').focus();
});
document.addEventListener('click', e => {
  const button = e.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'select') { selectedId = button.dataset.id; render(); element('word-surface').focus(); }
  else if (action === 'before' || action === 'after') {
    element('insertPlace').value = `${action}:${selectedId}`;
    element('newSurface').focus();
  } else if (action === 'delete') {
    const id = selectedId, index = draft.tokens.findIndex(w => w.id === id);
    selectedId = draft.tokens[index + 1]?.id || draft.tokens[index - 1]?.id || null;
    dispatch({ type: 'delete', id });
    (element('word-surface') || element('newSurface')).focus();
  } else {
    dispatch({ type: action, id: selectedId });
    element('editor').querySelector(`[data-action="${action}"]`)?.focus();
  }
});
element('previewButton').addEventListener('click', () => {
  // Synchronous fresh derivation, even if a caller bypassed the normal render.
  const preview = previewDraft(draft);
  render();
  const heading = document.createElement('h3');
  heading.textContent = 'Místní náhled – nic nebylo odesláno';
  const pre = document.createElement('pre');
  pre.textContent = JSON.stringify(preview, null, 2);
  element('payload').replaceChildren(heading, pre);
  element('liveStatus').textContent = 'Zobrazen aktuální místní náhled draftu. Nic nebylo odesláno.';
});
render();
