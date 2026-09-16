import { createDraft, mutateDraft, nfc } from './state.mjs';
import { deriveValidationState, previewDraft, validateTokenSequence } from './validation.mjs';
import { esc, renderSentence, renderTokens, renderEditor, renderValidation } from './view.mjs';
import { toggleMode, buttonLabel } from './terms.mjs';

let draft = window.__resubmit?.draft ?? createDraft(), selectedId = null;
const resubmitSentenceId = window.__resubmit?.sentenceId ?? null;
let composing = false;
const element = id => document.getElementById(id);
function render() {
  const focused = document.activeElement;
  const focusId = focused?.id;
  const selection = (focused?.tagName === 'TEXTAREA' || (focused?.tagName === 'INPUT' && focused.type === 'text')) ? [focused.selectionStart, focused.selectionEnd] : null;
  const state = deriveValidationState(draft);
  renderSentence(draft, state);
  renderTokens(draft, state, selectedId);
  renderEditor(draft, state, selectedId);
  renderValidation(draft, state);
  if (focusId && element(focusId)) {
    element(focusId).focus({ preventScroll: true });
    if (selection) element(focusId).setSelectionRange(...selection);
  }
  const termBtn = element('termToggle');
  if (termBtn) termBtn.textContent = buttonLabel();
  element('newSurface').hidden = !!draft.closingPunct;
  const submitBtn = element('submitButton');
  if (submitBtn) submitBtn.disabled = !state.submitReady;
  const deepNotEvaluated = !state.sequence.ok && draft.tokens.length > 0;
  const structSummary = deepNotEvaluated ? 'nevyhodnocena (povrchová chyba)' : (state.syntax.ok && state.sentenceOk && state.structureOk ? 'úplná' : 'k doplnění');
  const morphSummary = deepNotEvaluated ? 'nevyhodnocena (povrchová chyba)' : (state.morphologyOk ? 'ověřena' : 'neověřena');
  const summary = `${state.wordCount} slov, skóre ${state.charScore}. Znaková kontrola ${state.sequence.ok ? 'splněna' : 'nesplněna'}. Struktura ${structSummary}. Morfologická shoda ${morphSummary}. ${state.submitReady ? 'Připraveno k odeslání.' : 'Zatím není připraveno k odeslání.'}`;
  if (element('liveStatus').textContent !== summary) element('liveStatus').textContent = summary;
}
function dispatch(action) {
  draft = mutateDraft(draft, action);
  // A displayed preview must never silently outlive its draft snapshot.
  element('payload').replaceChildren();
  render();
}
function updateField(target) {
  if (target.dataset.path) {
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
  if (e.target.type === 'checkbox' || e.target.type === 'radio' || e.target.tagName === 'SELECT') updateField(e.target);
});
function insertWord(surface) {
  if (!surface) return;
  const [side, anchor] = element('insertPlace').value.split(':');
  selectedId = `t${draft.nextId}`;
  dispatch({ type: 'insert', surface: nfc(surface), side, anchor });
  // Continue typing in order at the chosen insertion point.
  if (anchor) element('insertPlace').value = `after:${selectedId}`;
}
function consumeInput(commitLast = false) {
  const input = element('newSurface');
  if (draft.closingPunct) { input.value = ''; return; }
  const raw = nfc(input.value);
  // Detect closing punctuation anywhere in the current input value.
  const punctIdx = raw.search(/[.?!]/);
  if (punctIdx >= 0) {
    const before = raw.slice(0, punctIdx);
    for (const surface of before.split(/\s+/u).filter(Boolean)) insertWord(surface);
    dispatch({ type: 'close', punct: raw[punctIdx] });
    input.value = '';
    element('inputStatus').textContent = '';
    return;
  }
  const parts = raw.split(/\s+/u);
  const remainder = commitLast ? '' : parts.pop();
  for (const surface of parts.filter(Boolean)) insertWord(surface);
  input.value = remainder;
  const result = validateTokenSequence([{ id: 'input', surface: remainder }]);
  element('inputStatus').textContent = remainder ? result.issues.map(i => i.message).join(' ') : '';
}
function deleteWord(id) {
  const index = draft.tokens.findIndex(w => w.id === id);
  if (selectedId === id) selectedId = draft.tokens[index + 1]?.id || draft.tokens[index - 1]?.id || null;
  dispatch({ type: 'delete', id });
}
element('newSurface').addEventListener('input', () => {
  if (!composing) consumeInput();
});
element('newSurface').addEventListener('compositionend', () => consumeInput());
element('newSurface').addEventListener('keydown', e => {
  if (composing || e.isComposing) return;
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    consumeInput(true);
  } else if (e.key === 'Backspace' && !e.currentTarget.value && draft.tokens.length) {
    e.preventDefault();
    if (!e.repeat) deleteWord(draft.tokens.at(-1).id);
  }
});
element('insertForm').addEventListener('submit', e => {
  e.preventDefault();
  consumeInput(true);
  element('newSurface').focus();
});
document.addEventListener('click', e => {
  const button = e.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'select') { selectedId = button.dataset.id; render(); element('word-surface').focus(); }
  else if (action === 'before' || action === 'after') {
    element('insertPlace').value = `${action}:${selectedId}`;
    element('newSurface').focus();
  } else if (action === 'delete-punct') {
    dispatch({ type: 'open' });
    element('newSurface').focus();
  } else if (action === 'delete' || action === 'delete-chip') {
    deleteWord(button.dataset.id || selectedId);
    (action === 'delete-chip' ? element('newSurface') : element('word-surface') || element('newSurface')).focus();
  } else {
    dispatch({ type: action, id: selectedId });
    element('editor').querySelector(`[data-action="${action}"]`)?.focus();
  }
});
document.addEventListener('click', e => {
  if (e.target.id === 'termToggle') { toggleMode(); render(); }
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
element('submitButton').addEventListener('click', async () => {
  const preview = previewDraft(draft);
  if (!preview.validation.submitReady) return;
  const csrf = document.querySelector('meta[name="csrf"]')?.content ?? '';
  const btn = element('submitButton');
  const resultEl = element('submitResult');
  btn.disabled = true;
  btn.textContent = 'Odesílám…';
  try {
    const res = await fetch('/api/submit.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csrf, schema: preview.schema, draft: preview.draft, ...(resubmitSentenceId ? { sentenceId: resubmitSentenceId } : {}) }),
    });
    const data = await res.json();
    if (data.ok) {
      const msg = resubmitSentenceId
        ? `Přihláška #${data.id} aktualizována (revize ${data.revisionNo}).`
        : `Přihláška #${data.id} byla odeslána.`;
      resultEl.innerHTML = `<div class="alert alert-ok" style="margin-top:0">${esc(msg)} <a href="/moje-vety.php">Zobrazit moje věty →</a></div>`;
      element('liveStatus').textContent = msg;
    } else {
      resultEl.innerHTML = `<div class="alert alert-warning" style="margin-top:0">Chyba: ${esc(data.error)}</div>`;
    }
  } catch {
    resultEl.innerHTML = '<div class="alert alert-warning" style="margin-top:0">Síťová chyba, zkuste znovu.</div>';
  } finally {
    btn.textContent = 'Odeslat přihlášku';
    render();
  }
});
render();
