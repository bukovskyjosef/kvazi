import { inferKvaziPrefix } from './state.mjs';
import { enumOptions, functionalPos } from './rules-data.mjs';
import { sentenceTypes, relationShapes, getModel, wordFields, getPath, isFunctional, publicSchema } from './schema.mjs';
import { partsOfSpeechLabels, functionsLabels, translateOptions, buttonLabel } from './terms.mjs';
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const options = (values, selected) => '<option value="">— vyberte —</option>' + Object.entries(values).map(([key, value]) => `<option value="${esc(key)}"${key === selected ? ' selected' : ''}>${esc(value)}</option>`).join('');
function field(path, label, value, values, scope = 'word', disabled = false, multiline = false) {
  const id = `${scope}-${path.replaceAll('.', '-')}`;
  const attrs = `id="${id}" data-scope="${scope}" data-path="${esc(path)}"${disabled ? ' disabled' : ''}`;
  if (multiline) return `<div class="fld"><label for="${id}">${esc(label)}</label><textarea ${attrs}>${esc(value ?? '')}</textarea></div>`;
  return `<div class="fld"><label for="${id}">${esc(label)}</label>${values ? `<select ${attrs}>${options(values, value)}</select>` : `<input type="text" ${attrs} value="${esc(value)}">`}</div>`;
}
function check(path, label, value, scope = 'word') {
  const id = `${scope}-${path.replaceAll('.', '-')}`;
  return `<div class="fld"><label class="check-label"><input type="checkbox" id="${id}" data-scope="${scope}" data-path="${esc(path)}"${value ? ' checked' : ''}> ${esc(label)}</label></div>`;
}
const list = items => `<ul class="status-list">${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
export function renderSentence(draft, state) {
  const detailsOpen = document.getElementById('sentenceFields')?.querySelector('details')?.open ?? false;
  const preview = document.getElementById('sentencePreview');
  preview.textContent = draft.tokens.length ? state.text : 'Věta se zobrazí zde…';
  preview.classList.toggle('empty', !draft.tokens.length);
  const typeLocked = !!draft.closingPunct;
  const typeRadios = Object.entries(sentenceTypes).map(([key, label]) =>
    `<label class="radio-label"><input type="radio" name="sentenceType" data-scope="sentence" data-path="sentenceType" value="${esc(key)}"${draft.sentenceType === key ? ' checked' : ''}${typeLocked ? ' disabled' : ''}> ${esc(label)}</label>`
  ).join('');
  const implicitSubjectHtml = draft.sentenceType === 'imperative'
    ? `<label class="radio-label" for="sentence-implicitSubject"><input type="checkbox" id="sentence-implicitSubject" data-scope="sentence" data-path="implicitSubject"${draft.implicitSubject ? ' checked' : ''}> Podmět není vyjádřen</label>`
    : '';
  document.getElementById('sentenceFields').innerHTML =
    `<div class="radio-group">${typeRadios}${implicitSubjectHtml}</div>`
    + `<details class="optional-wrap"><summary>Volitelné: fiktivní význam a obhajoba věty</summary><div class="optional-fields">`
    + field('meaning', 'Fiktivní význam celé věty', draft.meaning, null, 'sentence')
    + field('defense', 'Další obhajoba celé věty', draft.defense, null, 'sentence')
    + `</div></details>`;
  if (detailsOpen) document.getElementById('sentenceFields').querySelector('details').open = true;
}
export function renderTokens(draft, state, selectedId) {
  document.querySelector('.sentence-entry').dataset.status = state.sentenceStatus;
  const wordChips = draft.tokens.map((w, i) => {
    const disp = i === 0 && w.surface.length > 0 ? w.surface[0].toUpperCase() + w.surface.slice(1) : w.surface;
    const tokenState = state.tokens[w.id];
    const chipClass = !tokenState.surfaceOk ? 'err' : tokenState.complete ? 'ok' : 'warn';
    return `<span class="token-chip"><button type="button" id="token-${esc(w.id)}" class="chip ${chipClass} ${selectedId === w.id ? 'active' : ''}${w.pos ? ' pos-' + w.pos : ''}" data-action="select" data-id="${esc(w.id)}" aria-pressed="${selectedId === w.id}"><span class="chip-text">${esc(disp)}</span></button><button type="button" class="chip-remove" data-action="delete-chip" data-id="${esc(w.id)}" aria-label="Smazat ${esc(w.surface)}">×</button></span>`;
  }).join('');
  const punctChip = draft.closingPunct
    ? `<span class="token-chip"><button type="button" class="chip closing-punct" disabled><span class="chip-text">${esc(draft.closingPunct)}</span></button><button type="button" class="chip-remove" data-action="delete-punct" aria-label="Odebrat závěrečnou interpunkci">×</button></span>`
    : '';
  document.getElementById('tokens').innerHTML = wordChips + punctChip;
}
export function renderEditor(draft, state, selectedId, schema = publicSchema, catalogState = null) {
  const container = document.getElementById('editor');
  const w = draft.tokens.find(t => t.id === selectedId);
  container.hidden = !w;
  if (!w) { container.innerHTML = ''; return; }
  const model = getModel(w, schema), status = state.tokens[w.id];
  const models = Object.fromEntries(Object.entries(schema.models[w.pos] || {}).map(([key, value]) => [key, value.label]));
  const posLabels = partsOfSpeechLabels();
  const funcLabels = functionsLabels();
  const relationLabels = { head: 'Řídící slovo', predicate: 'Přísudek', nominal: w.role === 'preposition' ? 'Řízené jmenné slovo' : 'Podmět nebo předmět', left: 'První spojovaná část', right: 'Druhá spojovaná část' };
  const others = Object.fromEntries(draft.tokens.filter(t => t.id !== w.id).map(t => [t.id, `${draft.tokens.indexOf(t) + 1}. ${t.surface}`]));
  const functional = isFunctional(w);
  const formCheckHtml = !functional ? (() => {
    const fc = status.formCheck;
    if (fc.status === 'notEvaluated') return `<p class="status-neutral">Morfologická kontrola nebyla provedena — nejprve opravte povrchovou/znakovou chybu.</p>`;
    if (fc.ok && fc.expected !== null) return `<p class="status-ok">✓ Morfologická shoda: použitý tvar odpovídá deklaraci (očekáváno „${esc(fc.expected)}").${fc.expected === w.surface ? '' : ' <em>Pozor: povrchový tvar se liší od očekávaného — zkontrolujte zápis.</em>'}</p>`;
    if (!fc.ok && fc.message) return `<p class="status-missing">Chybí: ${esc(fc.message)}</p>`;
    return '';
  })() : '';
  container.innerHTML = `<h2 class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><span>Deklarace slova ${esc(w.surface)}</span><span style="display:flex;flex-direction:column;align-items:flex-end;gap:3px"><small style="font-size:10px;font-weight:400;opacity:.55;letter-spacing:.02em">Odborné termíny se přeloží do hovorových</small><button id="termToggle" type="button" style="font-size:11px;font-weight:700;letter-spacing:.04em;cursor:pointer;padding:4px 12px;border-radius:6px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:inherit;font-family:inherit">${esc(buttonLabel())}</button></span></h2><div class="card-body">
    <fieldset><legend>Identita a použitý tvar</legend><div class="config-grid">
      ${field('surface', 'Použitý tvar slova (bez mezer)', w.surface)}
      ${field('pos', 'Slovní druh', w.pos, functional ? posLabels : Object.fromEntries(Object.entries(posLabels).filter(([k]) => !functionalPos().includes(k))), 'word', functional || inferKvaziPrefix(w.surface))}
      ${!functional ? field('lemma', w.pos === 'verb' ? 'Neurčitek / základní tvar' : 'Základní tvar', w.lemma) + field('lexicalStatus', 'Deklarovaná identita', w.lexicalStatus, w.pos === 'pronoun' ? { real: 'Skutečné slovo' } : enumOptions('lexicalStatus', { real: 'Skutečné slovo', quasi: 'Kvazislovo' })) + field('model', w.pos === 'verb' ? 'Soutěžní časovací typ' : 'Soutěžní vzor', w.model, models, 'word', !Object.keys(models).length) : '<p>Slovní druh a role jsou určeny pravidlem jednopísmenné výjimky.</p>'}
      ${wordFields(w, schema).map(f => field(f.path, f.label, getPath(w, f.path), f.options ? translateOptions(f.options, f.path) : null, 'word', false, f.multiline)).join('')}
    </div>
    <div class="insert-controls" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
      <button type="button" data-action="insert-before" class="chip-action">Vložit slovo před</button>
      <button type="button" data-action="insert-after" class="chip-action">Vložit slovo za</button>
    </div>
    ${w.pos === 'noun' && model ? `<p>Rod: ${esc({ masculine: 'mužský', feminine: 'ženský', neuter: 'střední' }[w.identity.gender])}${w.identity.animacy ? `, ${w.identity.animacy === 'animate' ? 'životný' : 'neživotný'}` : ''} (určeno zvoleným vzorem).</p>` : ''}
    ${formCheckHtml}
    ${catalogState ? `<div><button id="catalogCheck" type="button" ${catalogState.pending ? 'disabled' : ''}>Ověřit v katalogu</button><p id="catalogResult" role="status">${esc(catalogState.message ?? '')}</p></div>` : ''}
    </fieldset>
    <fieldset><legend>Větná funkce a vazby</legend>
      ${field('role', functional ? 'Technická role' : 'Větná funkce', w.role, functional ? { [w.role]: w.role === 'preposition' ? 'Předložka – bez hlavní větné funkce' : 'Spojení souřadných částí' } : Object.fromEntries(Object.entries(funcLabels).filter(([key]) => key !== 'coordination')), 'word', functional)}
      ${w.role === 'predicate' ? '<p>Kořen věty – bez řídícího slova.</p>' : ''}
      ${(relationShapes()[w.role] || []).map(key => field(`relations.${key}`, relationLabels[key], w.relations[key], others)).join('')}
      ${check('evidence.needsAnalogy', 'Vztah je významově nejasný nebo závisí na fiktivním významu', w.evidence.needsAnalogy)}
      ${w.evidence.needsAnalogy ? field('evidence.explanation', 'Krátká obhajoba vztahu', w.evidence.explanation) + field('evidence.analogy', 'Běžná česká analogie stejné konstrukce', w.evidence.analogy) : ''}
    </fieldset>
    ${!functional ? `<fieldset><legend>Podklady pro posouzení</legend>
      ${field('evidence.morphology', 'Morfologická obhajoba a odkaz na model (nepovinné)', w.evidence.morphology)}
      ${w.lexicalStatus === 'real' && w.role !== 'auxiliary' ? field('evidence.source', 'Zdroj dokládající existenci (nepovinné)', w.evidence.source, { '': '— nevybráno —', IJP: 'Slovníková část IJP', 'ASSČ': 'Zveřejněné heslo ASSČ' }) + field('evidence.reference', 'Konkrétní heslo / odkaz a doklad použitého tvaru', w.evidence.reference) : ''}
    </fieldset>` : ''}
    <h3>Co zbývá u tohoto slova</h3>${list([...status.surfaceIssues, ...status.issues, ...status.missing, ...(status.formCheck && !status.formCheck.ok && status.formCheck.message ? [status.formCheck.message] : [])])}
    </div>`;
}
export function renderValidation(draft, state) {
  // When surface gate failed, all Phase 2/3 layers are notEvaluated — show as neutral.
  const deepNotEvaluated = !state.sequence.ok && draft.tokens.length > 0;
  const neutralRow = (label) => `<p class="status-neutral">– ${label} nevyhodnoceno (povrchová chyba)</p>`;
  const deepRows = deepNotEvaluated
    ? [neutralRow('Větná struktura a syntaktické vazby'), neutralRow('Strukturované údaje'), neutralRow('Morfologická kontrola')]
    : [
        `<p class="${state.syntax.ok && state.sentenceOk ? 'status-ok' : 'status-missing'}">${state.syntax.ok && state.sentenceOk ? '✓' : 'Chybí:'} Větná struktura a syntaktické vazby</p>`,
        `<p class="${state.structureOk ? 'status-ok' : 'status-missing'}">${state.structureOk ? '✓' : 'Chybí:'} Strukturované údaje úplné</p>`,
        (() => {
          const morphClass = state.morphologyOk ? 'status-ok' : 'status-missing';
          return `<p class="${morphClass}">${state.morphologyOk ? '✓' : 'Chybí:'} Morfologická shoda ověřena</p>`;
        })(),
      ];
  document.getElementById('validation').innerHTML =
    `<p class="${state.sequence.ok ? 'status-ok' : 'status-missing'}">${state.sequence.ok ? '✓' : 'Chybí:'} Znaková kontrola</p>`
    + deepRows.join('')
    + `<p class="${state.submitReady ? 'status-ok' : 'status-missing'}">${state.submitReady ? '✓' : 'Chybí:'} Připraveno k odeslání</p>`
    + `<p>Slov: ${state.wordCount} · Skóre znaků: ${state.charScore} (Q = 1, KV = 2; prefix kvazi- = 0)</p>`
    + list([...state.sentenceIssues, ...state.sequence.issues.map(i => i.message), ...state.syntax.issues.map(i => `${draft.tokens.find(w => w.id === i.id)?.surface || ''}: ${i.message}`)])
    + draft.tokens.map((w, i) => {
      const t = state.tokens[w.id];
      const items = [...t.missing];
      if (t.formCheck && t.formCheck.ok === false && t.formCheck.message) items.push(t.formCheck.message);
      return `<details><summary>${i + 1}. ${esc(w.surface)} – ${t.complete ? 'úplné' : 'chybějící údaje'}</summary>${list(items)}</details>`;
    }).join('');
}
