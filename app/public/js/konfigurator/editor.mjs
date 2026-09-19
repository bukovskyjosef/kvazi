import { createDraft, mutateDraft, nfc } from './state.mjs';
import { deriveValidationState, previewDraft, validateTokenSequence } from './validation.mjs';
import { esc, renderSentence, renderTokens, renderEditor, renderValidation } from './view.mjs';
import { toggleMode, buttonLabel } from './terms.mjs';
import { catalogCandidate, catalogFingerprint } from './catalog.mjs';
import { createSurfaceRewardTracker } from './reward.mjs';

let draft = window.__resubmit?.draft ?? createDraft(), selectedId = null;
const resubmitSentenceId = window.__resubmit?.sentenceId ?? null;
let composing = false;
const catalogResults = new Map();
const surfaceReward = createSurfaceRewardTracker();
const element = id => document.getElementById(id);
function updateInputPlaceholder() {
  const input = element('newSurface');
  if (draft.tokens.length === 0 && input.value === '') input.setAttribute('placeholder', 'Kvazivětu zadejte zde…');
  else input.removeAttribute('placeholder');
}
function render() {
  const focused = document.activeElement;
  const focusId = focused?.id;
  const selection = (focused?.tagName === 'TEXTAREA' || (focused?.tagName === 'INPUT' && focused.type === 'text')) ? [focused.selectionStart, focused.selectionEnd] : null;
  const state = deriveValidationState(draft);
  const reward = surfaceReward(draft, state);
  const feedback = element('surfaceReward');
  feedback.hidden = !reward.passed;
  if (!reward.passed) {
    feedback.textContent = '';
    feedback.classList.remove('celebrate');
  } else if (reward.fire) {
    feedback.textContent = 'Výborně, věta vypadá na první pohled správně, pojďme na obhajobu!';
    feedback.classList.add('celebrate');
  }
  renderSentence(draft, state);
  renderTokens(draft, state, selectedId);
  for (const [id, result] of catalogResults) {
    if (catalogFingerprint(draft.tokens.find(w => w.id === id)) !== result.fingerprint) catalogResults.delete(id);
  }
  const selected = draft.tokens.find(w => w.id === selectedId);
  renderEditor(draft, state, selectedId, undefined, catalogCandidate(selected) ? (catalogResults.get(selectedId) ?? {}) : null);
  renderValidation(draft, state);
  if (focusId && element(focusId)) {
    element(focusId).focus({ preventScroll: true });
    if (selection) element(focusId).setSelectionRange(...selection);
  }
  const termBtn = element('termToggle');
  if (termBtn) termBtn.textContent = buttonLabel();
  element('newSurface').hidden = !!draft.closingPunct;
  updateInputPlaceholder();
  const submitBtn = element('submitButton');
  if (submitBtn) submitBtn.disabled = !state.submitReady;
  const deepNotEvaluated = !state.sequence.ok && draft.tokens.length > 0;
  const structSummary = deepNotEvaluated ? 'nevyhodnocena (povrchová chyba)' : (state.syntax.ok && state.sentenceOk && state.structureOk ? 'úplná' : 'k doplnění');
  const morphSummary = deepNotEvaluated ? 'nevyhodnocena (povrchová chyba)' : (state.morphologyOk ? 'ověřena' : 'neověřena');
  const summary = `${state.wordCount} slov, skóre ${state.charScore}. Znaková kontrola ${state.sequence.ok ? 'splněna' : 'nesplněna'}. Struktura ${structSummary}. Morfologická shoda ${morphSummary}. ${state.submitReady ? 'Připraveno k odeslání.' : 'Zatím není připraveno k odeslání.'}`;
  if (element('liveStatus').textContent !== summary) element('liveStatus').textContent = summary;
}
function dispatch(action) {
  const next = mutateDraft(draft, action);
  if (next !== draft && action.type === 'field' && action.path === 'surface') catalogResults.delete(action.id);
  draft = next;
  const payload = element('payload');
  if (payload) payload.replaceChildren();
  render();
}
function updateField(target) {
  if (target.dataset.path) {
    const value = target.type === 'checkbox' ? target.checked : target.value;
    dispatch({ type: target.dataset.scope === 'sentence' ? 'sentence' : 'field', id: selectedId, path: target.dataset.path, value });
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
function insertWord(surface, index = null) {
  if (!surface) return;
  const targetIndex = typeof index === 'number' ? index : selectedId ? draft.tokens.findIndex(w => w.id === selectedId) : draft.tokens.length;
  selectedId = `t${draft.nextId}`;
  dispatch({ type: 'insert', surface: nfc(surface), index: targetIndex >= 0 ? targetIndex : draft.tokens.length });
}
function consumeInput(commitLast = false) {
  const input = element('newSurface');
  if (draft.closingPunct) { input.value = ''; updateInputPlaceholder(); return; }
  const raw = nfc(input.value);
  // Detect closing punctuation anywhere in the current input value.
  const punctIdx = raw.search(/[.?!]/);
  if (punctIdx >= 0) {
    const before = raw.slice(0, punctIdx);
    for (const surface of before.split(/\s+/u).filter(Boolean)) insertWord(surface);
    dispatch({ type: 'close', punct: raw[punctIdx] });
    input.value = '';
    updateInputPlaceholder();
    element('inputStatus').textContent = '';
    return;
  }
  const parts = raw.split(/\s+/u);
  const remainder = commitLast ? '' : parts.pop();
  for (const surface of parts.filter(Boolean)) insertWord(surface);
  input.value = remainder;
  updateInputPlaceholder();
  const result = validateTokenSequence([{ id: 'input', surface: remainder }]);
  element('inputStatus').textContent = remainder ? result.issues.map(i => i.message).join(' ') : '';
}
function deleteWord(id) {
  const index = draft.tokens.findIndex(w => w.id === id);
  if (selectedId === id) selectedId = draft.tokens[index + 1]?.id || draft.tokens[index - 1]?.id || null;
  dispatch({ type: 'delete', id });
}
element('newSurface').addEventListener('input', () => {
  updateInputPlaceholder();
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
  if (action === 'select') { selectedId = button.dataset.id; render(); element(`token-${selectedId}`).focus(); }
  else if (action === 'delete-punct') {
    dispatch({ type: 'open' });
    element('newSurface').focus();
  } else if (action === 'delete' || action === 'delete-chip') {
    deleteWord(button.dataset.id || selectedId);
    element('newSurface').focus();
  } else {
    dispatch({ type: action, id: selectedId });
    element('editor').querySelector(`[data-action="${action}"]`)?.focus();
  }
});
document.addEventListener('click', e => {
  if (e.target.id === 'termToggle') { toggleMode(); render(); }
});
document.addEventListener('click', async e => {
  if (e.target.id !== 'catalogCheck') return;
  const tokenId = selectedId;
  const token = draft.tokens.find(w => w.id === tokenId);
  const candidate = catalogCandidate(token);
  if (!candidate || catalogResults.get(tokenId)?.pending) return;
  const result = { fingerprint: catalogFingerprint(token), pending: true, message: 'Ověřuji…' };
  catalogResults.set(tokenId, result);
  render();
  try {
    const response = await fetch('/api/real-word-catalog.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csrf: document.querySelector('meta[name="csrf"]')?.content ?? '', token: candidate }),
    });
    const data = await response.json();
    result.message = response.status === 401 ? 'Pro ověření v katalogu se přihlaste.'
      : data.ok && typeof data.exactMatch === 'boolean'
        ? data.exactMatch ? 'Tato přesná deklarace je v katalogu potvrzena jako skutečné slovo.'
          : 'Tato přesná deklarace zatím v katalogu potvrzena není. Můžete ji přesto odeslat k posouzení.'
        : 'Katalogové ověření se nyní nepodařilo provést.';
  } catch {
    result.message = 'Katalogové ověření se nyní nepodařilo provést.';
  } finally {
    result.pending = false;
    // Ignore a delayed response after any key change, even if the user changes back.
    if (catalogResults.get(tokenId) === result && catalogFingerprint(draft.tokens.find(w => w.id === tokenId)) === result.fingerprint) render();
  }
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
    btn.textContent = 'Odeslat kvazivětu';
    render();
  }
});
render();
