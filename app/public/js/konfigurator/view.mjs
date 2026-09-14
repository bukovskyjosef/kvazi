import { sentenceTypes, relationShapes, getModel, wordFields, getPath, isFunctional, CONFIRMATION, publicSchema, genders, cases, numbers } from './schema.mjs';
import { partsOfSpeechLabels, functionsLabels, gendersLabels, casesLabels, numbersLabels, translateOptions } from './terms.mjs';
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const options = (values, selected) => '<option value="">— vyberte —</option>' + Object.entries(values).map(([key, value]) => `<option value="${esc(key)}"${key === selected ? ' selected' : ''}>${esc(value)}</option>`).join('');
function field(path, label, value, values, scope = 'word', disabled = false) {
  const id = `${scope}-${path.replaceAll('.', '-')}`;
  const attrs = `id="${id}" data-scope="${scope}" data-path="${esc(path)}"${disabled ? ' disabled' : ''}`;
  return `<div class="fld"><label for="${id}">${esc(label)}</label>${values ? `<select ${attrs}>${options(values, value)}</select>` : `<input type="text" ${attrs} value="${esc(value)}">`}</div>`;
}
function check(path, label, value, scope = 'word') {
  const id = `${scope}-${path.replaceAll('.', '-')}`;
  return `<div class="fld"><input type="checkbox" id="${id}" data-scope="${scope}" data-path="${esc(path)}"${value ? ' checked' : ''}> <label for="${id}">${esc(label)}</label></div>`;
}
const list = items => `<ul class="status-list">${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
function renderMorphoCells(w, model) {
  if (!model?.cells.length) return '<p class="notice">Úplné paradigma této větve zatím není specifikováno. Editor buněk bude dostupný po doplnění veřejného schematu.</p>';
  const notice = `<p class="notice">${model.complete ? 'Vyplňte všechny buňky schematu.' : 'Pracovní tabulka základních kategorií. Přesný rozsah povolených realizací ještě není uzavřen; potvrzení této tabulky neodstraňuje blokaci formuláře.'}</p>`;
  const isPre = id => w.morphology.prefilled.includes(id);
  const cellInput = (cellId, idx) => `<input type="text" id="cell-${idx}" data-cell="${esc(cellId)}" value="${esc(w.morphology.cells[cellId] || '')}" class="${isPre(cellId) ? 'mf-pre' : ''}">`;
  if (w.pos === 'adjective') {
    const gdLabels = gendersLabels();
    const cLabels = casesLabels();
    const nLabels = numbersLabels();
    const genList = Object.keys(genders).map(k => [k, gdLabels[k]]);
    const caseList = Object.keys(cases).map(k => [k, cLabels[k]]);
    const renderTable = (numKey) => {
      const thead = `<tr><th></th>${genList.map(([, gl]) => `<th scope="col">${esc(gl)}</th>`).join('')}</tr>`;
      const tbody = caseList.map(([cNum, cLabel]) =>
        `<tr><th scope="row">${esc(cLabel)}</th>${genList.map(([gKey]) => {
          const cellId = `${gKey}-${numKey}-${cNum}`;
          const idx = model.cells.findIndex(c => c.id === cellId);
          return idx < 0 ? '<td>—</td>' : `<td>${cellInput(cellId, idx)}</td>`;
        }).join('')}</tr>`
      ).join('');
      return `<p class="mt-section-title">${esc(nLabels[numKey])}</p><div class="morfo-wrap"><table class="mt adj-grid"><caption>Oranžové buňky jsou předvyplněné — zkontrolujte a opravte každý tvar.</caption><thead>${thead}</thead><tbody>${tbody}</tbody></table></div>`;
    };
    return notice + Object.keys(numbers).map(numKey => renderTable(numKey)).join('');
  }
  const nLabels = numbersLabels();
  const cLabels = casesLabels();
  // Cell id format: "{numKey}-{caseNum}" — reconstruct a dynamic label.
  const cellLabel = (c) => {
    const parts = c.id.split('-');
    const caseKey = parts[parts.length - 1];
    const numKey = parts.slice(0, -1).join('-');
    return `${nLabels[numKey] || numKey}, ${cLabels[caseKey] || caseKey}`;
  };
  const rows = model.cells.map((c, i) =>
    `<tr><th scope="row"><label for="cell-${i}">${esc(cellLabel(c))}</label></th><td>${cellInput(c.id, i)}</td></tr>`
  ).join('');
  return `${notice}<div class="morfo-wrap"><table class="mt"><caption>Oranžové buňky jsou předvyplněné — zkontrolujte a opravte každý tvar.</caption><thead><tr><th scope="col">Kategorie</th><th scope="col">Váš tvar</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
export function renderSentence(draft, state) {
  const detailsOpen = document.getElementById('sentenceFields')?.querySelector('details')?.open ?? false;
  document.getElementById('sentencePreview').textContent = draft.tokens.length ? state.text : 'Věta se zobrazí zde…';
  const typeRadios = Object.entries(sentenceTypes).map(([key, label]) =>
    `<label class="radio-label"><input type="radio" name="sentenceType" data-scope="sentence" data-path="sentenceType" value="${esc(key)}"${draft.sentenceType === key ? ' checked' : ''}> ${esc(label)}</label>`
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
  document.getElementById('tokens').innerHTML = draft.tokens.map((w) => `<span class="token-chip"><button type="button" id="token-${esc(w.id)}" class="chip ${state.tokens[w.id].complete ? 'ok' : 'err'} ${selectedId === w.id ? 'active' : ''}${w.pos ? ' pos-' + w.pos : ''}" data-action="select" data-id="${esc(w.id)}" aria-pressed="${selectedId === w.id}"><span class="chip-text">${esc(w.surface)}</span></button><button type="button" class="chip-remove" data-action="delete-chip" data-id="${esc(w.id)}" aria-label="Smazat ${esc(w.surface)}">×</button></span>`).join('');
  const place = document.getElementById('insertPlace'), previous = place.value;
  place.innerHTML = '<option value="end">Na konec věty</option>' + draft.tokens.flatMap((w, i) => ['before', 'after'].map(side => `<option value="${side}:${esc(w.id)}">${side === 'before' ? 'Před' : 'Za'} ${i + 1}. ${esc(w.surface)}</option>`)).join('');
  if ([...place.options].some(o => o.value === previous)) place.value = previous;
}
export function renderEditor(draft, state, selectedId, schema = publicSchema) {
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
  container.innerHTML = `<h2 class="card-header">Deklarace slova ${esc(w.surface)}</h2><div class="card-body">
    <fieldset><legend>Identita a použitý tvar</legend><div class="config-grid">
      ${field('pos', 'Slovní druh', w.pos, functional ? posLabels : Object.fromEntries(Object.entries(posLabels).filter(([k]) => !['preposition', 'conjunction'].includes(k))), 'word', functional)}
      ${!functional ? field('lemma', w.pos === 'verb' ? 'Neurčitek / základní tvar' : 'Základní tvar', w.lemma) + field('lexicalStatus', 'Deklarovaná identita', w.lexicalStatus, w.pos === 'pronoun' ? { real: 'Skutečné slovo' } : { real: 'Skutečné slovo', quasi: 'Kvazislovo' }) + field('model', w.pos === 'verb' ? 'Soutěžní časovací typ' : 'Soutěžní vzor', w.model, models, 'word', !Object.keys(models).length) : '<p>Slovní druh a role jsou určeny pravidlem jednopísmenné výjimky.</p>'}
      ${wordFields(w, schema).map(f => field(f.path, f.label, getPath(w, f.path), f.options ? translateOptions(f.options) : null)).join('')}
    </div>${w.pos === 'noun' && model ? `<p>Rod: ${esc({ masculine: 'mužský', feminine: 'ženský', neuter: 'střední' }[w.identity.gender])}${w.identity.animacy ? `, ${w.identity.animacy === 'animate' ? 'životný' : 'neživotný'}` : ''} (určeno zvoleným vzorem).</p>` : ''}
    ${status.gates.length ? `<div class="notice">${list(status.gates)}</div>` : ''}
    ${w.pos === 'verb' ? '<p>Valenční rámec a odkazy obligatorních členů zde zatím nelze úplně zaznamenat. Modelové sloveso samo strukturovaný rámec nenahrazuje.</p>' : ''}
    </fieldset>
    <fieldset><legend>Větná funkce a vazby</legend>
      ${field('role', functional ? 'Technická role' : 'Větná funkce', w.role, functional ? { [w.role]: w.role === 'preposition' ? 'Předložka – bez hlavní větné funkce' : 'Spojení souřadných částí' } : Object.fromEntries(Object.entries(funcLabels).filter(([key]) => key !== 'coordination')), 'word', functional)}
      ${w.role === 'predicate' ? '<p>Kořen věty – bez řídícího slova.</p>' : ''}
      ${(relationShapes[w.role] || []).map(key => field(`relations.${key}`, relationLabels[key], w.relations[key], others)).join('')}
      ${w.role === 'object' ? '<p class="notice">Vazba na konkrétní valenční slot čeká na dokončení struktury rámce (#5).</p>' : ''}
      ${check('evidence.needsAnalogy', 'Vztah je významově nejasný nebo závisí na fiktivním významu', w.evidence.needsAnalogy)}
      ${w.evidence.needsAnalogy ? field('evidence.explanation', 'Krátká obhajoba vztahu', w.evidence.explanation) + field('evidence.analogy', 'Běžná česká analogie stejné konstrukce', w.evidence.analogy) : ''}
    </fieldset>
    ${!functional ? `<fieldset><legend>Podklady pro posouzení</legend>
      ${field('evidence.morphology', 'Morfologická obhajoba a odkaz na model', w.evidence.morphology)}
      ${w.lexicalStatus === 'real' ? field('evidence.source', 'Zdroj dokládající existenci', w.evidence.source, { IJP: 'Slovníková část IJP', 'ASSČ': 'Zveřejněné heslo ASSČ' }) + field('evidence.reference', 'Konkrétní heslo / odkaz a doklad použitého tvaru', w.evidence.reference) : ''}
    </fieldset>
    <fieldset><legend>Celý morfologický návrh</legend>
      <p>Jde o váš návrh, nikoli jazykové schválení. Kopie povrchového tvaru je pouze pomůcka pro vyplňování.</p>
      ${renderMorphoCells(w, model)}
      <button type="button" data-action="confirm" ${!status.canConfirm ? 'disabled' : ''}>${CONFIRMATION}</button>
      <p>${status.confirmed ? 'Aktuální návrh je potvrzen uživatelem.' : 'Aktuální návrh není potvrzen.'}</p>
    </fieldset>` : ''}
    <h3>Co zbývá u tohoto slova</h3>${list([...status.issues, ...status.missing, ...status.gates, ...(!status.confirmed ? ['Potvrzení aktuálního morfologického návrhu.'] : [])])}
    </div>`;
}
export function renderValidation(draft, state) {
  const rows = [[state.sequence.ok, 'Znaková kontrola'], [state.syntax.ok && state.sentenceOk, 'Větná struktura a syntaktické vazby'], [state.structureOk, 'Strukturované údaje úplné'], [state.morphologyOk, 'Morfologický návrh potvrzen uživatelem'], [state.submitReady, 'Připraveno k odeslání']];
  document.getElementById('validation').innerHTML = rows.map(([ok, label]) => `<p class="${ok ? 'status-ok' : 'status-missing'}">${ok ? '✓' : 'Chybí:'} ${label}</p>`).join('')
    + `<p>Slov: ${state.wordCount} · Písmen bez mezer: ${state.charCount} (Q = 1, KV = 2)</p>`
    + list([...state.sentenceIssues, ...state.sequence.issues.map(i => i.message), ...state.syntax.issues.map(i => `${draft.tokens.find(w => w.id === i.id)?.surface || ''}: ${i.message}`)])
    + draft.tokens.map((w, i) => `<details><summary>${i + 1}. ${esc(w.surface)} – ${state.tokens[w.id].complete ? 'úplné' : 'chybějící údaje'}</summary>${list([...state.tokens[w.id].missing, ...state.tokens[w.id].gates, ...(!state.tokens[w.id].confirmed ? ['Aktuální morfologické potvrzení.'] : [])])}</details>`).join('');
}
