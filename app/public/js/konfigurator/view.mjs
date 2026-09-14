import { sentenceTypes, partsOfSpeech, functions, relationShapes, getModel, wordFields, getPath, isFunctional, CONFIRMATION, publicSchema } from './schema.mjs';
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
export function renderSentence(draft, state) {
  document.getElementById('sentencePreview').textContent = draft.tokens.length ? state.text : 'Věta se zobrazí zde…';
  document.getElementById('sentenceFields').innerHTML = field('sentenceType', 'Typ věty', draft.sentenceType, sentenceTypes, 'sentence')
    + (draft.sentenceType === 'imperative' ? check('implicitSubject', 'Podmět není vyjádřen (pouze pro dovolený imperativ)', draft.implicitSubject, 'sentence') : '')
    + field('meaning', 'Fiktivní význam celé věty (volitelné)', draft.meaning, null, 'sentence')
    + field('defense', 'Další obhajoba celé věty (volitelné)', draft.defense, null, 'sentence');
}
export function renderTokens(draft, state, selectedId) {
  document.getElementById('tokens').innerHTML = draft.tokens.map((w, i) => `<button type="button" id="token-${esc(w.id)}" class="chip ${state.tokens[w.id].complete ? 'ok' : 'err'} ${selectedId === w.id ? 'active' : ''}" data-action="select" data-id="${esc(w.id)}" aria-pressed="${selectedId === w.id}">${i + 1}. ${esc(w.surface)} · ${state.tokens[w.id].complete ? 'úplné' : 'k doplnění'}</button>`).join('');
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
  const relationLabels = { head: 'Řídící slovo', predicate: 'Přísudek', nominal: w.role === 'preposition' ? 'Řízené jmenné slovo' : 'Podmět nebo předmět', left: 'První spojovaná část', right: 'Druhá spojovaná část' };
  const others = Object.fromEntries(draft.tokens.filter(t => t.id !== w.id).map(t => [t.id, `${draft.tokens.indexOf(t) + 1}. ${t.surface}`]));
  const functional = isFunctional(w);
  container.innerHTML = `<h2 class="card-header">Deklarace slova ${esc(w.surface)}</h2><div class="card-body">
    ${field('surface', 'Text slova', w.surface)}
    <div class="actions"><button type="button" data-action="before">Vložit před toto slovo</button><button type="button" data-action="after">Vložit za toto slovo</button><button type="button" data-action="delete">Smazat toto slovo</button></div>
    <fieldset><legend>Identita a použitý tvar</legend><div class="config-grid">
      ${field('pos', 'Slovní druh', w.pos, functional ? partsOfSpeech : Object.fromEntries(Object.entries(partsOfSpeech).filter(([k]) => !['preposition', 'conjunction'].includes(k))), 'word', functional)}
      ${!functional ? field('lemma', w.pos === 'verb' ? 'Neurčitek / základní tvar' : 'Základní tvar', w.lemma) + field('lexicalStatus', 'Deklarovaná identita', w.lexicalStatus, w.pos === 'pronoun' ? { real: 'Skutečné slovo' } : { real: 'Skutečné slovo', quasi: 'Kvazislovo' }) + field('model', w.pos === 'verb' ? 'Soutěžní časovací typ' : 'Soutěžní vzor', w.model, models, 'word', !Object.keys(models).length) : '<p>Slovní druh a role jsou určeny pravidlem jednopísmenné výjimky.</p>'}
      ${wordFields(w, schema).map(f => field(f.path, f.label, getPath(w, f.path), f.options)).join('')}
    </div>${w.pos === 'noun' && model ? `<p>Rod: ${esc({ masculine: 'mužský', feminine: 'ženský', neuter: 'střední' }[w.identity.gender])}${w.identity.animacy ? `, ${w.identity.animacy === 'animate' ? 'životný' : 'neživotný'}` : ''} (určeno zvoleným vzorem).</p>` : ''}
    ${status.gates.length ? `<div class="notice">${list(status.gates)}</div>` : ''}
    ${w.pos === 'verb' ? '<p>Valenční rámec a odkazy obligatorních členů zde zatím nelze úplně zaznamenat. Modelové sloveso samo strukturovaný rámec nenahrazuje.</p>' : ''}
    </fieldset>
    <fieldset><legend>Větná funkce a vazby</legend>
      ${field('role', functional ? 'Technická role' : 'Větná funkce', w.role, functional ? { [w.role]: w.role === 'preposition' ? 'Předložka – bez hlavní větné funkce' : 'Spojení souřadných částí' } : Object.fromEntries(Object.entries(functions).filter(([key]) => key !== 'coordination')), 'word', functional)}
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
      ${model?.cells.length ? `<p class="notice">${model.complete ? 'Vyplňte všechny buňky schematu.' : 'Pracovní tabulka základních kategorií. Přesný rozsah povolených realizací ještě není uzavřen; potvrzení této tabulky neodstraňuje blokaci formuláře.'}</p>
        <button type="button" data-action="prefill">Zkopírovat text slova do prázdných buněk</button>
        <div class="morfo-wrap"><table class="mt"><caption>Všechny buňky vybraného modelu; oranžově jsou nezkontrolované kopie textu.</caption><thead><tr><th scope="col">Kategorie</th><th scope="col">Váš tvar</th></tr></thead><tbody>
        ${model.cells.map((c, i) => `<tr><th scope="row"><label for="cell-${i}">${esc(c.label)}</label></th><td><input type="text" id="cell-${i}" data-cell="${esc(c.id)}" value="${esc(w.morphology.cells[c.id] || '')}" class="${w.morphology.prefilled.includes(c.id) ? 'mf-pre' : ''}"></td></tr>`).join('')}</tbody></table></div>` : '<p class="notice">Úplné paradigma této větve zatím není specifikováno. Editor buněk bude dostupný po doplnění veřejného schematu.</p>'}
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
