// Browser integration test targeting the real PHP runtime.
// Requires a running Docker stack and playwright.
// Usage: PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node app/tests/konfigurator.browser.mjs
// Default base URL: http://127.0.0.1:8080 (matches `docker compose up`)
//
// Words are inserted by typing in the surface input and pressing Space or Enter.
// No paradigm-copy or morfoConfirmed workflow exists in the current UI.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseUrl = (process.env.KVAZI_BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');

// ── DB helpers (needed for Scene 14: authenticated submit) ────────────────────

const DB_CONTAINER = process.env.KVAZI_DB_CONTAINER || 'kvazi_db';

function pgStr(v) {
  return "'" + String(v).replace(/'/g, "''") + "'";
}

function dbExec(sql, params = {}) {
  const resolved = sql.replace(/:([a-z_]+)/g, (_, k) => {
    const v = params[k];
    if (v === undefined) throw new Error(`Missing DB param :${k}`);
    return /^\d+$/.test(String(v)) ? String(v) : pgStr(v);
  });
  return execFileSync('docker', ['exec', DB_CONTAINER, 'psql', '-U', 'kvazi', '-d', 'kvazi', '-v', 'ON_ERROR_STOP=1', '-q', '-t', '-A', '-c', resolved], { timeout: 10000 }).toString().trim();
}

function dbCount(table, where = '', params = {}) {
  return parseInt(dbExec(`SELECT COUNT(*) FROM ${table}${where ? ' WHERE ' + where : ''}`, params), 10);
}

function phpHash(password) {
  const code = `echo password_hash(${JSON.stringify(password)}, PASSWORD_BCRYPT, ['cost' => 10]);`;
  return execFileSync('php', ['-r', code], { timeout: 10000 }).toString().trim();
}

function createTestUser(username, email, password) {
  const hash = phpHash(password);
  dbExec(`INSERT INTO kvazi.user_account (username, email, password_hash, role, email_verified_at)
           VALUES (:u, :e, :h, 'USER', now())
           ON CONFLICT (username) DO NOTHING`, { u: username, e: email, h: hash });
}

function deleteTestUser(username) {
  // Disposable fixture cleanup only. Production never bypasses history triggers.
  dbExec(`BEGIN; SET LOCAL session_replication_role = replica;
    DELETE FROM kvazi.validation_result_review WHERE validation_result_id IN (
      SELECT v.id FROM kvazi.validation_result v JOIN kvazi.sentence s ON s.id=v.sentence_id
      WHERE s.user_id=(SELECT id FROM kvazi.user_account WHERE username=:u));
    DELETE FROM kvazi.administrative_decision WHERE sentence_id IN (SELECT id FROM kvazi.sentence WHERE user_id=(SELECT id FROM kvazi.user_account WHERE username=:u));
    DELETE FROM kvazi.validation_result WHERE sentence_id IN (SELECT id FROM kvazi.sentence WHERE user_id=(SELECT id FROM kvazi.user_account WHERE username=:u));
    DELETE FROM kvazi.sentence_revision WHERE submitted_by=(SELECT id FROM kvazi.user_account WHERE username=:u);
    DELETE FROM kvazi.sentence WHERE user_id=(SELECT id FROM kvazi.user_account WHERE username=:u);
    DELETE FROM kvazi.real_word_catalog WHERE admin_id=(SELECT id FROM kvazi.user_account WHERE username=:u);
    DELETE FROM kvazi.morphology_review_decision WHERE admin_id=(SELECT id FROM kvazi.user_account WHERE username=:u);
    DELETE FROM kvazi.user_account WHERE username=:u; COMMIT;`, {u:username});
}

function dbReachable() {
  try {
    execFileSync('docker', ['exec', DB_CONTAINER, 'psql', '-U', 'kvazi', '-d', 'kvazi', '-c', 'SELECT 1'], { timeout: 5000 });
    return true;
  } catch { return false; }
}

const BRW_RUN_ID = Date.now().toString(36);
const BRW_USR    = `brw_${BRW_RUN_ID}`;
const BRW_PASS   = 'BrowserTest1!';
const dbUp = dbReachable();
if (dbUp) createTestUser(BRW_USR, `${BRW_USR}@kvazi.int`, BRW_PASS);

let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  // ── Scene 1: Insert words, fill one word's declaration ───────────────────
  await page.goto(`${baseUrl}/konfigurator.php`);

  // Sentence type is radio buttons.
  await page.getByLabel('Tázací').check();
  assert.equal(await page.locator('input[name="sentenceType"][value="interrogative"]').isChecked(), true);

  // Insert two words by typing with a space between them.
  const entry = page.getByLabel('Nové slovo (bez mezer)');
  await entry.pressSequentially('vazi kvazi ');
  assert.equal(await page.locator('#tokens .token-chip').count(), 2);

  // Click first token chip to open its declaration editor.
  await page.locator('#token-t1').click();
  assert.equal(await page.getByLabel('Slovní druh', { exact: true }).isVisible(), true);

  // Fill in t1 (vazi) as a noun.
  await page.getByLabel('Slovní druh', { exact: true }).selectOption('noun');
  await page.getByLabel('Základní tvar', { exact: true }).pressSequentially('vazi');
  assert.equal(await page.getByLabel('Základní tvar', { exact: true }).inputValue(), 'vazi');
  await page.getByLabel('Deklarovaná identita').selectOption('quasi');
  await page.getByLabel('Soutěžní vzor').selectOption('hrad');
  await page.getByLabel('Pád použitého tvaru').selectOption('1');
  await page.getByLabel('Číslo použitého tvaru').selectOption('singular');
  await page.getByLabel('Větná funkce', { exact: true }).selectOption('subject');
  // Head link — t2 must exist first; set it now (t2 = second token).
  await page.getByLabel('Řídící slovo', { exact: true }).selectOption('t2');
  await page.getByLabel('Morfologická obhajoba a odkaz na model').fill('Test evidence');

  // ── Scene 2: Fill second word (kvazi) as a verb ──────────────────────────
  await page.locator('#token-t2').click();
  await page.getByLabel('Slovní druh', { exact: true }).selectOption('verb');
  await page.getByLabel('Druh slovesného tvaru').selectOption('present');
  await page.getByLabel('Větná funkce', { exact: true }).selectOption('predicate');

  // ── Scene 3: Default append ignores the current selection; explicit before/after is opt-in. ──────────────────
  await page.locator('#token-t1').click();
  await page.locator('#newSurface').fill('k');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#tokens .token-chip').count(), 3);
  assert.deepEqual(await page.locator('#tokens .chip-text').allTextContents(), ['Vazi', 'kvazi', 'k']);
  assert.equal(await page.locator('#insertPlace').count(), 0);
  assert.equal(await page.getByRole('button', {name:/Vložit slovo (před|za)/}).count(), 2);

  await page.locator('#token-t2').click();
  await page.getByRole('button', {name:'Vložit slovo před'}).click();
  await page.locator('#newSurface').fill('q');
  await page.keyboard.press('Enter');
  assert.deepEqual(await page.locator('#tokens .chip-text').allTextContents(), ['Vazi', 'q', 'kvazi', 'k']);

  await page.locator('#token-t3').click();
  await page.getByRole('button', {name:'Vložit slovo za'}).click();
  await page.locator('#newSurface').fill('m');
  await page.keyboard.press('Enter');
  assert.deepEqual(await page.locator('#tokens .chip-text').allTextContents(), ['Vazi', 'q', 'kvazi', 'k', 'm']);

  // Click the new preposition token ('k') — its id is t3 (nextId increments).
  await page.locator('#token-t3').click();
  assert.equal(await page.getByLabel('Slovní druh', { exact: true }).inputValue(), 'preposition');
  assert.equal(await page.getByLabel('Slovní druh', { exact: true }).isDisabled(), true);
  await page.getByLabel('Řízené jmenné slovo').selectOption('t1');

  // Go back to t1 and verify its head link survived the render cycle.
  await page.locator('#token-t1').click();
  assert.equal(await page.getByLabel('Řídící slovo', { exact: true }).inputValue(), 't2');

  // ── Scene 4: NFC normalisation — surface should be stored as NFC ─────────
  await entry.fill('VA\u0301ZI');
  await entry.press('Enter');
  await page.locator('#token-t6').click();
  assert.equal(await page.getByLabel('Základní tvar', { exact: true }).inputValue(), '');
  assert.equal(await page.locator('#word-surface').inputValue(), 'vázi');
  assert.equal(await page.locator('#token-t6').evaluate(el => el === document.activeElement), true);

  // ── Scene 5: JSON preview action is intentionally removed in this hotfix ──
  assert.equal(await page.getByRole('button', { name: /Zobrazit náhled JSON/ }).count(), 0);
  assert.equal(await page.locator('#payload').count(), 0);

  // ── Scene 6: All visible form inputs must have an associated label ────────
  const unlabelled = await page.locator('input:not([type="hidden"]), select:not([hidden]), textarea')
    .evaluateAll(nodes => nodes
      .filter(n => !n.hidden && n.offsetParent !== null) // visible only
      .filter(n => !n.labels?.length && !n.getAttribute('aria-label') && !n.getAttribute('aria-labelledby'))
      .map(n => n.id || n.name || n.className));
  assert.deepEqual(unlabelled, [], `Unlabelled visible inputs: ${unlabelled.join(', ')}`);

  // ── Scene 7: XSS — injected markup must not render ───────────────────────
  await page.getByLabel('Základní tvar', { exact: true }).fill('<img src=x onerror=alert(1)>');
  await entry.fill('<img/src=x/onerror=alert(1)>'); await entry.press('Enter');
  assert.equal(await page.locator('#payload pre').count(), 0); // preview cleared on field change
  assert.equal(await page.locator('#editor img, #tokens img').count(), 0);

  // ── Scene 8: Mobile viewport does not overflow horizontally ──────────────
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, JSON.stringify(await page.locator('body *').evaluateAll(nodes => nodes.filter(n => n.getBoundingClientRect().right > innerWidth).map(n => ({tag:n.tagName,id:n.id,cls:n.className,width:n.getBoundingClientRect().width})))));
  await page.screenshot({ path: join(tmpdir(), 'kvazi-configurator-mobile.png'), fullPage: true });

  // ── Scene 9: Backspace in surface input deletes last token ────────────────
  await page.goto(`${baseUrl}/konfigurator.php`);
  const freshEntry = page.getByLabel('Nové slovo (bez mezer)');
  await freshEntry.pressSequentially('vazi kvazi ');
  assert.equal(await page.locator('#tokens .token-chip').count(), 2);
  assert.equal(await freshEntry.inputValue(), '');
  assert.equal(await freshEntry.evaluate(el => el === document.activeElement), true);
  await freshEntry.press('Backspace');
  assert.equal(await page.locator('#tokens .token-chip').count(), 1);

  // ── Scene 10: Partial input (no space) stays in input field ──────────────
  await freshEntry.pressSequentially('qazi');
  await freshEntry.press('Backspace');
  assert.equal(await freshEntry.inputValue(), 'qaz'); // one char deleted from input
  assert.equal(await page.locator('#tokens .token-chip').count(), 1); // no new token

  await freshEntry.press('Enter'); // commit 'qaz' — too short, won't pass sequence check
  assert.equal(await page.locator('#tokens .token-chip').count(), 2); // still inserted (validation is non-blocking)

  // ── Scene 11: Prefix inference — surface >5 chars starting with kvazi ────────
  await page.goto(`${baseUrl}/konfigurator.php`);
  const e11 = page.locator('#newSurface');
  await e11.fill('kvazipan');
  await e11.press('Enter');
  assert.equal(await page.locator('#tokens .token-chip').count(), 1);
  await page.locator('#token-t1').click();
  assert.equal(await page.getByLabel('Slovní druh', { exact: true }).inputValue(), 'noun', 'kvazi-prefix token: pos auto-set to noun');
  assert.equal(await page.getByLabel('Slovní druh', { exact: true }).isDisabled(), true, 'kvazi-prefix token: pos locked');

  // ── Scene 12: Surface-invalid auxiliary — staged validation produces notEvaluated ──
  // "jsme" fails the surface gate (characters J,S,M,E outside kvazi charset).
  // Deep form-check must NOT run; the UI must show notEvaluated, not a false positive.
  await page.goto(`${baseUrl}/konfigurator.php`);
  const e12 = page.locator('#newSurface');
  await e12.fill('jsme');
  await e12.press('Enter');
  assert.equal(await page.locator('#tokens .token-chip').count(), 1);
  await page.locator('#token-t1').click();
  await page.getByLabel('Slovní druh', { exact: true }).selectOption('verb');
  await page.getByLabel('Větná funkce', { exact: true }).selectOption('auxiliary');
  await page.getByLabel('Neurčitek / základní tvar', { exact: true }).fill('být');
  await page.getByLabel('Deklarovaná identita').selectOption('real');
  const status12 = await page.locator('#liveStatus').textContent();
  assert.match(status12, /nevyhodnocena|povrchová chyba/i, 'surface-invalid token must leave validation un-evaluated');

  // ── Scene 13: Positive submitReady — completely declared valid 2-token draft ─
  await page.goto(`${baseUrl}/konfigurator.php`);
  const e13 = page.locator('#newSurface');
  await e13.fill('kvazi'); await e13.press('Enter');
  await e13.fill('kvazí'); await e13.press('Enter');
  assert.equal(await page.locator('#tokens .token-chip').count(), 2);

  // Declare t1 (kvazi) as noun pán nominative plural subject
  await page.locator('#token-t1').click();
  await page.getByLabel('Slovní druh', { exact: true }).selectOption('noun');
  await page.getByLabel('Základní tvar', { exact: true }).fill('kvaz');
  await page.getByLabel('Deklarovaná identita').selectOption('quasi');
  await page.getByLabel('Soutěžní vzor').selectOption('pán');
  await page.getByLabel('Pád použitého tvaru').selectOption('1');
  await page.getByLabel('Číslo použitého tvaru').selectOption('plural');
  await page.getByLabel('Větná funkce', { exact: true }).selectOption('subject');
  await page.getByLabel('Řídící slovo', { exact: true }).selectOption('t2');

  // Declare t2 (kvazí) as verb V-IT present 3pl imperfective predicate
  await page.locator('#token-t2').click();
  await page.getByLabel('Slovní druh', { exact: true }).selectOption('verb');
  await page.getByLabel('Neurčitek / základní tvar', { exact: true }).fill('kvazit');
  await page.getByLabel('Deklarovaná identita').selectOption('quasi');
  await page.getByLabel('Soutěžní časovací typ').selectOption('V-IT');
  await page.getByLabel('Druh slovesného tvaru').selectOption('present');
  await page.getByLabel('Osoba').selectOption('3');
  await page.getByLabel('Číslo', { exact: true }).selectOption('plural');
  await page.getByLabel('Vid').selectOption('imperfective');
  await page.getByLabel('Větná funkce', { exact: true }).selectOption('predicate');
  await page.getByLabel('Valenční obhajoba').fill('Vzor V-IT (prosit). Nevyžaduje doplnění.');

  // Submit button must be enabled when draft is ready
  assert.equal(await page.locator('#submitButton').isDisabled(), false, 'Submit button enabled when submitReady=true');

  await page.locator('#token-t1').click();
  const surfaceEditor = page.getByLabel('Použitý tvar slova (bez mezer)');
  for (const surface of ['qazi', 'xyz']) {
    await surfaceEditor.fill(surface);
    assert.equal(await page.locator('#submitButton').isDisabled(), true, 'edited surface cannot reuse an old valid morphology verdict');
    assert.equal(await surfaceEditor.evaluate(el => el === document.activeElement), true);
    await surfaceEditor.fill('kvazi');
    assert.equal(await page.locator('#submitButton').isDisabled(), false, 'compatible declaration survives edit back');
  }
  await page.locator('#token-t2').click();

  assert.equal(await page.locator('#submitButton').isDisabled(), false, 'submitReady should be true for fully declared valid draft');
  assert.ok((await page.locator('#liveStatus').textContent()).includes('skóre 10') || (await page.locator('#liveStatus').textContent()).includes('charScore'), 'live status should reflect scoring');

  const valencyInput = page.getByLabel('Valenční obhajoba');
  await valencyInput.fill('');
  assert.equal(await page.locator('#submitButton').isDisabled(), true);
  await valencyInput.fill('Vzor V-IT (prosit). Nevyžaduje doplnění.');
  await page.locator('#word-evidence-needsAnalogy').check();
  await page.getByLabel('Krátká obhajoba vztahu').fill('Obhajoba.');
  assert.equal(await page.locator('#submitButton').isDisabled(), true, 'missing analogy');
  await page.getByLabel('Běžná česká analogie stejné konstrukce').fill('Děti spí.');
  assert.equal(await page.locator('#submitButton').isDisabled(), false, 'filled explanation + analogy completes the declaration');
  await page.getByLabel('Krátká obhajoba vztahu').fill('');
  assert.equal(await page.locator('#submitButton').isDisabled(), true, 'missing explanation');
  await page.locator('#word-evidence-needsAnalogy').uncheck();
  assert.equal(await page.locator('#submitButton').isDisabled(), false);

  // ── Scene 14: Authenticated submit + DB verification ─────────────────────────
  if (dbUp) {
    await page.goto(`${baseUrl}/login.php`);
    await page.getByLabel('E-mail nebo uživatelské jméno').fill(BRW_USR);
    await page.getByLabel('Heslo').fill(BRW_PASS);
    await page.getByRole('button', { name: 'Přihlásit se' }).click();
    await page.waitForURL(/moje\.php/, { timeout: 5000 });
    await page.goto(`${baseUrl}/konfigurator.php`);

    const e14 = page.locator('#newSurface');
    await e14.fill('kvazi'); await e14.press('Enter');
    await e14.fill('kvazí'); await e14.press('Enter');

    await page.locator('#token-t1').click();
    await page.getByLabel('Slovní druh', { exact: true }).selectOption('noun');
    await page.getByLabel('Základní tvar', { exact: true }).fill('kvaz');
    await page.getByLabel('Deklarovaná identita').selectOption('quasi');
    await page.getByLabel('Soutěžní vzor').selectOption('pán');
    await page.getByLabel('Pád použitého tvaru').selectOption('1');
    await page.getByLabel('Číslo použitého tvaru').selectOption('plural');
    await page.getByLabel('Větná funkce', { exact: true }).selectOption('subject');
    await page.getByLabel('Řídící slovo', { exact: true }).selectOption('t2');

    await page.locator('#token-t2').click();
    await page.getByLabel('Slovní druh', { exact: true }).selectOption('verb');
    await page.getByLabel('Neurčitek / základní tvar', { exact: true }).fill('kvazit');
    await page.getByLabel('Deklarovaná identita').selectOption('quasi');
    await page.getByLabel('Soutěžní časovací typ').selectOption('V-IT');
    await page.getByLabel('Druh slovesného tvaru').selectOption('present');
    await page.getByLabel('Osoba').selectOption('3');
    await page.getByLabel('Číslo', { exact: true }).selectOption('plural');
    await page.getByLabel('Vid').selectOption('imperfective');
    await page.getByLabel('Větná funkce', { exact: true }).selectOption('predicate');
    await page.getByLabel('Valenční obhajoba').fill('Vzor V-IT (prosit). Nevyžaduje doplnění.');

    await page.locator('#submitButton').click();
    await page.locator('#submitResult .alert-ok').waitFor({ timeout: 10000 });
    const msg14 = await page.locator('#submitResult .alert-ok').textContent();
    assert.ok(msg14.includes('Přihláška'), `Submit success message expected, got: ${msg14}`);

    // Verify DB row created
    const sentCount = dbCount('kvazi.sentence', 'user_id = (SELECT id FROM kvazi.user_account WHERE username = :u)', { u: BRW_USR });
    assert.equal(sentCount, 1, 'One sentence row created in DB after submit');
  } else {
    if (process.env.KVAZI_INTEGRATION_REQUIRED === '1') throw new Error('Mandatory Scene 14: DB unavailable');
    console.log('Scene 14 (authenticated submit) skipped: Docker DB not reachable.');
  }

  // ── Scene 15: Model offering completeness — dormant models visible in UI ────
  // Verify that reachability does NOT filter the model selector. All normative
  // models must appear as <option>, including dormant ones.
  await page.goto(`${baseUrl}/konfigurator.php`);
  const e15 = page.locator('#newSurface');
  await e15.fill('kvazi'); await e15.press('Enter');
  await page.locator('#token-t1').click();

  // Noun models: check kuře (dormant) is present
  await page.getByLabel('Slovní druh', { exact: true }).selectOption('noun');
  const nounModelOptions = await page.locator('#word-model option').evaluateAll(opts => opts.map(o => o.value));
  for (const model of ['kuře']) {
    assert.ok(nounModelOptions.includes(model), `noun model selector must include dormant model "${model}"`);
  }

  // Adjective models: check otcův and matčin (dormant) are present
  await page.getByLabel('Slovní druh', { exact: true }).selectOption('adjective');
  const adjModelOptions = await page.locator('#word-model option').evaluateAll(opts => opts.map(o => o.value));
  for (const model of ['otcův', 'matčin']) {
    assert.ok(adjModelOptions.includes(model), `adjective model selector must include dormant model "${model}"`);
  }

  // Verb models: all 5 must be present, including dormant V-NOUT, V-ÝT, V-OVAT
  await page.getByLabel('Slovní druh', { exact: true }).selectOption('verb');
  const verbModelOptions = await page.locator('#word-model option').evaluateAll(opts => opts.map(o => o.value));
  for (const model of ['V-AT', 'V-IT', 'V-NOUT', 'V-ÝT', 'V-OVAT']) {
    assert.ok(verbModelOptions.includes(model), `verb model selector must include "${model}"`);
  }

  // ── Scene 16: Surface-invalid UX — deep layers shown as neutral, not FAIL ─────
  // Insert a surface-invalid token and verify the validation panel does not show
  // deep layers as failure — they must be neutral ("nevyhodnoceno").
  await page.goto(`${baseUrl}/konfigurator.php`);
  const e16 = page.locator('#newSurface');
  await e16.fill('jsme'); await e16.press('Enter');
  assert.equal(await page.locator('#tokens .token-chip').count(), 1);

  // Validation panel must show surface error
  const valPanel = page.locator('#validation');
  const valHtml = await valPanel.innerHTML();
  assert.ok(valHtml.includes('status-missing'), 'surface error should be displayed');

  // Deep layers must be neutral (status-neutral), NOT fail (status-missing for deep rows)
  const neutralRows = await valPanel.locator('.status-neutral').count();
  assert.ok(neutralRows >= 3, `expected ≥3 neutral deep rows (syntax, structure, morphology), got ${neutralRows}`);

  // No deep layer should show as checked-ok either (they were not evaluated)
  // The only status-ok that could appear would be if deep ran — verify deep rows say "nevyhodnoceno"
  const neutralTexts = await valPanel.locator('.status-neutral').allTextContents();
  assert.ok(neutralTexts.some(t => t.includes('nevyhodnoceno')), 'neutral rows must indicate "nevyhodnoceno"');

  // Submit must stay disabled
  assert.equal(await page.locator('#submitButton').isDisabled(), true, 'submit must be disabled for surface-invalid draft');

  // Live status should reflect the not-evaluated state
  const liveStatus = await page.locator('#liveStatus').textContent();
  assert.ok(liveStatus.includes('nesplněna'), 'live status should report surface check not met');

  // ── Scene 17: Actual imperative, rejected indicative and escaped API errors ──
  await page.goto(`${baseUrl}/konfigurator.php`);
  await page.getByLabel('Rozkazovací', {exact:true}).check();
  await page.getByLabel('Podmět není vyjádřen', {exact:true}).check();
  await page.locator('#newSurface').fill('kvazi'); await page.locator('#newSurface').press('Enter');
  await page.locator('#token-t1').click();
  await page.getByLabel('Slovní druh', {exact:true}).selectOption('verb');
  await page.getByLabel('Neurčitek / základní tvar', {exact:true}).fill('kvaziit');
  await page.getByLabel('Deklarovaná identita').selectOption('quasi');
  await page.getByLabel('Soutěžní časovací typ').selectOption('V-IT');
  await page.getByLabel('Druh slovesného tvaru').selectOption('imperative');
  await page.locator('#word-form-verbPerson').selectOption('2sg');
  await page.getByLabel('Vid').selectOption('imperfective');
  await page.getByLabel('Větná funkce', {exact:true}).selectOption('predicate');
  await page.getByLabel('Valenční obhajoba').fill('Imperativ podle V-IT; bez obligatorního doplnění.');
  await page.getByLabel('Morfologická obhajoba a odkaz na model').fill('2. sg soutěžního imperativu.');
  assert.equal(await page.locator('#submitButton').isEnabled(),true);
  const attack='<img src=x onerror="window.apiXss=1">';
  await page.route('**/api/submit.php',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({ok:false,error:attack})}));
  await page.locator('#submitButton').click();
  await page.locator('#submitResult .alert-warning').waitFor();
  assert.ok((await page.locator('#submitResult').textContent()).includes(attack));
  assert.equal(await page.locator('#submitResult img').count(),0);
  assert.equal(await page.evaluate(()=>window.apiXss),undefined);
  await page.unroute('**/api/submit.php');
  if(dbUp) {
    await page.locator('#submitButton').click();
    await page.locator('#submitResult .alert-ok').waitFor({timeout:10000});
    assert.equal(dbCount('kvazi.sentence','user_id = (SELECT id FROM kvazi.user_account WHERE username=:u)',{u:BRW_USR}),2);
  }
  // Build a correctly formed indicative through delete and fresh append.
  await page.getByRole('button',{name:'Smazat kvazi',exact:true}).click();
  await page.locator('#newSurface').fill('kvazí'); await page.locator('#newSurface').press('Enter');
  await page.locator('#token-t2').click();
  await page.getByLabel('Slovní druh', {exact:true}).selectOption('verb');
  await page.getByLabel('Neurčitek / základní tvar', {exact:true}).fill('kvazit');
  await page.getByLabel('Deklarovaná identita').selectOption('quasi');
  await page.getByLabel('Soutěžní časovací typ').selectOption('V-IT');
  await page.getByLabel('Druh slovesného tvaru').selectOption('present');
  await page.locator('#word-form-verbPerson').selectOption('3');
  await page.getByLabel('Číslo', {exact:true}).selectOption('plural');
  await page.getByLabel('Vid').selectOption('imperfective');
  await page.getByLabel('Větná funkce', {exact:true}).selectOption('predicate');
  await page.getByLabel('Valenční obhajoba').fill('Indikativ bez obligatorního doplnění.');
  await page.getByLabel('Morfologická obhajoba a odkaz na model').fill('3. pl V-IT.');
  assert.equal(await page.getByRole('button', { name: /Zobrazit náhled JSON/ }).count(), 0);
  assert.equal(await page.locator('#submitButton').isDisabled(), true);
  assert.ok((await page.locator('#validation').textContent()).includes('skutečný imperativní'));

  // ── Scene 18: Browser logout uses CSRF-protected POST ─────────────────────
  if(dbUp) {
    await page.locator('footer').getByRole('button',{name:'Odhlásit se',exact:true}).click();
    await page.waitForURL(baseUrl+'/');
    assert.equal(await page.getByRole('navigation',{name:'Hlavní navigace'}).getByRole('link',{name:'Přihlásit se',exact:true}).count(),0);
    assert.equal(await page.locator('footer').getByRole('link',{name:'Přihlásit se',exact:true}).count(),1);
    assert.equal(await page.getByRole('button',{name:'Odhlásit se',exact:true}).count(),0);
  }

  // ── Scene 19: Placeholder lifecycle and linear append/delete order ──────
  await page.goto(`${baseUrl}/konfigurator.php`);
  const linearEntry = page.locator('#newSurface');
  const placeholder = 'Kvazivětu zadejte zde…';
  assert.equal(await linearEntry.inputValue(), '');
  assert.equal(await linearEntry.getAttribute('placeholder'), placeholder);
  assert.equal(await linearEntry.evaluate(el => el.matches(':placeholder-shown')), true);
  await linearEntry.fill('A');
  assert.equal(await linearEntry.inputValue(), 'A');
  assert.equal(await linearEntry.getAttribute('placeholder'), null);
  assert.equal(await linearEntry.evaluate(el => el.matches(':placeholder-shown')), false);
  await linearEntry.fill('');
  assert.equal(await linearEntry.getAttribute('placeholder'), placeholder);
  for (const surface of ['A', 'B', 'C']) { await linearEntry.fill(surface); await linearEntry.press('Enter'); }
  assert.deepEqual(await page.locator('#tokens .chip-text').allTextContents(), ['A', 'b', 'c']);
  assert.equal(await linearEntry.getAttribute('placeholder'), null);
  assert.equal(await linearEntry.evaluate(el => el.matches(':placeholder-shown')), false);
  await page.locator('#token-t1').click();
  assert.equal(await page.locator('#insertPlace').count(), 0);
  assert.equal(await page.getByLabel('Text slova', {exact:true}).count(), 0);
  assert.equal(await page.getByRole('button', {name:/Vložit (před|za) slovo/}).count(), 0);
  await page.getByRole('button', {name:'Smazat b',exact:true}).click();
  assert.equal(await linearEntry.evaluate(el => el === document.activeElement), true);
  await linearEntry.fill('D'); await linearEntry.press('Enter');
  assert.deepEqual(await page.locator('#tokens .chip-text').allTextContents(), ['A', 'c', 'd']);
  for (const surface of ['a', 'c', 'd']) await page.getByRole('button', {name:`Smazat ${surface}`,exact:true}).click();
  assert.equal(await linearEntry.inputValue(), '');
  assert.equal(await linearEntry.getAttribute('placeholder'), placeholder);
  assert.equal(await linearEntry.evaluate(el => el.matches(':placeholder-shown')), true);
  assert.equal(await linearEntry.evaluate(el => el === document.activeElement), true);

  // Direct surface editing keeps first/middle/last IDs and order; inference is fresh.
  await page.goto(`${baseUrl}/konfigurator.php`);
  await page.locator('#newSurface').fill('kvazi qazi kvazí ');
  for (const [id, surface] of [['t1','KVÁZI\u0301'], ['t2','kvaziqazi'], ['t3','i']]) {
    await page.locator(`#token-${id}`).click();
    await page.getByLabel('Použitý tvar slova (bez mezer)').fill(surface);
    assert.deepEqual(await page.locator('#tokens .chip[data-id]').evaluateAll(nodes => nodes.map(n => n.dataset.id)), ['t1','t2','t3']);
  }
  assert.deepEqual(await page.locator('#tokens .chip-text').allTextContents(), ['Kvází','kvaziqazi','i']);
  assert.equal(await page.locator('#word-pos').inputValue(), 'conjunction');
  await page.getByLabel('Použitý tvar slova (bez mezer)').fill('qazi');
  assert.equal(await page.locator('#word-pos').inputValue(), '');
  await page.locator('#token-t2').click();
  assert.equal(await page.locator('#word-pos').isDisabled(), true);
  await page.getByLabel('Použitý tvar slova (bez mezer)').fill('qazi');
  assert.equal(await page.locator('#word-pos').isDisabled(), false);
  await page.getByLabel('Použitý tvar slova (bez mezer)').fill('xyz');
  const editedStatus = await page.locator('#liveStatus').textContent();
  assert.match(editedStatus, /nesplněna|nevyhodnocena|povrchová chyba/i, 'invalid edited surface should not offer an empty success state');
  assert.equal(await page.locator('#submitButton').isDisabled(), true);
  await page.getByLabel('Použitý tvar slova (bez mezer)').fill('qazi');
  assert.equal(await page.locator('#payload').count(), 0);
  assert.equal(await page.locator('#submitButton').isDisabled(), true, 'valid surface restored but sentence declarations are still incomplete');

  // Pronoun person and case labels are independent of terminology mode.
  await page.locator('#word-pos').selectOption('pronoun');
  for (let mode = 0; mode < 2; mode++) {
    const optionLabels = name => page.getByLabel(name).locator('option[value]:not([value=""])').allTextContents();
    assert.deepEqual(await optionLabels('Osoba zájmena'), ['1. osoba','2. osoba','3. osoba','Nevztahuje se']);
    assert.deepEqual(await optionLabels('Pád zájmena'), ['1. pád','2. pád','3. pád','4. pád','5. pád','6. pád','7. pád','Nevztahuje se']);
    await page.getByLabel('Osoba zájmena').selectOption('notApplicable');
    assert.equal(await page.getByLabel('Osoba zájmena').inputValue(), 'notApplicable');
    assert.equal(await page.getByLabel('Morfologická obhajoba a odkaz na model (nepovinné)', {exact:true}).isVisible(), true);
    await page.locator('#termToggle').click();
  }

  // Reward uses Phase 1 only, single-fires on transitions and respects reduced motion.
  for (const reducedMotion of ['no-preference', 'reduce']) {
    await page.emulateMedia({reducedMotion});
    await page.goto(`${baseUrl}/konfigurator.php`);
    await page.evaluate(() => {
      window.rewardCount = 0;
      const el = document.getElementById('surfaceReward');
      new MutationObserver(records => {
        if (records.some(r => r.type === 'childList') && el.textContent) window.rewardCount++;
      }).observe(el, {childList:true});
    });
    const reward = page.locator('#surfaceReward'), input = page.locator('#newSurface');
    await input.fill('xyz.');
    assert.equal(await reward.isVisible(), false);
    assert.equal(await page.evaluate(() => window.rewardCount), 0);
    await page.getByRole('button', {name:'Odebrat závěrečnou interpunkci'}).click();
    await page.getByLabel('Použitý tvar slova (bez mezer)').fill('kvazi');
    assert.equal(await reward.isVisible(), false, 'unclosed surface PASS has no reward');
    for (const [index, punct] of ['.', '?', '!'].entries()) {
      await input.fill(punct);
      assert.equal(await reward.isVisible(), true);
      assert.equal(await reward.textContent(), 'Výborně, věta vypadá na první pohled správně, pojďme na obhajobu!');
      assert.equal(await page.evaluate(() => window.rewardCount), index + 1);
      const animation = await reward.evaluate(el => getComputedStyle(el).animationName);
      assert.equal(animation, reducedMotion === 'reduce' ? 'none' : 'surface-celebration');
      await page.locator('#token-t1').click();
      assert.equal(await page.evaluate(() => window.rewardCount), index + 1, 'selection does not refire reward');
      assert.equal(await page.locator('#submitButton').isDisabled(), true);
      await page.getByRole('button', {name:'Odebrat závěrečnou interpunkci'}).click();
      assert.equal(await reward.isVisible(), false);
    }
  }
  await page.emulateMedia({reducedMotion:'no-preference'});

  // ── Scene 20: Native select readability in both app and OS themes ────────
  const luminance = color => {
    const rgb = color.match(/\d+/g).slice(0, 3).map(v => {
      const s = Number(v) / 255;
      return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
    });
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  let posOptions;
  for (const theme of ['1', '2']) for (const osTheme of ['light', 'dark']) {
    await page.emulateMedia({colorScheme: osTheme});
    await page.evaluate(t => localStorage.setItem('kvazi-theme', t), theme);
    await page.goto(`${baseUrl}/konfigurator.php`);
    await page.locator('#newSurface').fill('vazi');
    await page.locator('#newSurface').press('Enter');
    const pos = page.getByLabel('Slovní druh', {exact:true});
    assert.equal(await pos.inputValue(), '');
    assert.equal(await page.locator('#word-model').isDisabled(), true);
    const options = await pos.locator('option').evaluateAll(opts => opts.map(o => [o.value, o.textContent]));
    posOptions ??= options;
    assert.deepEqual(options, posOptions, 'Theme changes preserve option labels, values and order');
    for (const value of ['', 'noun']) {
      await pos.selectOption(value);
      assert.equal(await pos.inputValue(), value);
      const fields = await page.locator('.fld select').evaluateAll(selects => selects.map(s => ({
        scheme: getComputedStyle(s).colorScheme,
        color: getComputedStyle(s).color,
        options: [...s.options].map(o => ({color: getComputedStyle(o).color, background: getComputedStyle(o).backgroundColor})),
      })));
      for (const field of fields) {
        assert.equal(field.scheme, theme === '1' ? 'light' : 'dark');
        for (const option of field.options) {
          assert.match(option.background, /^rgb\(/, 'Popup background is opaque');
          assert.equal(option.color, field.color, 'Closed select and popup use the same foreground');
          const a = luminance(option.color), b = luminance(option.background);
          assert.ok((Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 4.5,
            `Readable placeholder/normal/selected/disabled-select options: theme${theme}, OS ${osTheme}`);
        }
      }
    }
  }

  // Insert buttons are disabled when closing punctuation is present.
  await page.goto(`${baseUrl}/konfigurator.php`);
  const punctEntry = page.getByLabel('Nové slovo (bez mezer)');
  await punctEntry.pressSequentially('vazi kvazi.');
  await page.locator('#token-t2').click();
  assert.equal(await page.getByRole('button', { name: 'Vložit slovo před' }).isDisabled(), true, 'insert-before disabled with closing punct');
  assert.equal(await page.getByRole('button', { name: 'Vložit slovo za' }).isDisabled(), true, 'insert-after disabled with closing punct');
  // Removing punctuation re-enables the buttons.
  await page.getByRole('button', { name: 'Odebrat závěrečnou interpunkci' }).click();
  await page.locator('#token-t2').click();
  assert.equal(await page.getByRole('button', { name: 'Vložit slovo před' }).isDisabled(), false, 'insert-before enabled after punct removal');

  // Explicit insertion supports the first token and both sides of an interior token.
  await page.goto(`${baseUrl}/konfigurator.php`);
  await page.locator('#newSurface').pressSequentially('kvazi kvazí ');
  await page.locator('#token-t1').click();
  await page.getByRole('button', { name: 'Vložit slovo před' }).click();
  await page.locator('#newSurface').fill('qazi');
  await page.keyboard.press('Enter');
  assert.deepEqual(await page.locator('#tokens .chip-text').allTextContents(), ['Qazi', 'kvazi', 'kvazí']);
  assert.equal(await page.locator('#newSurface').getAttribute('aria-label'), 'Nové slovo (bez mezer)');
  await page.locator('#token-t2').click();
  await page.getByRole('button', { name: 'Vložit slovo před' }).click();
  await page.locator('#newSurface').fill('qázi');
  await page.keyboard.press('Enter');
  assert.deepEqual(await page.locator('#tokens .chip-text').allTextContents(), ['Qazi', 'kvazi', 'qázi', 'kvazí']);
  await page.locator('#token-t1').click();
  await page.getByRole('button', { name: 'Vložit slovo za' }).click();
  await page.locator('#newSurface').fill('qazí');
  await page.keyboard.press('Enter');
  assert.deepEqual(await page.locator('#tokens .chip-text').allTextContents(), ['Qazi', 'kvazi', 'qazí', 'qázi', 'kvazí']);

  for (const punct of ['.', '?', '!']) {
    await page.goto(`${baseUrl}/konfigurator.php`);
    await page.locator('#newSurface').pressSequentially(`kvazi kvazí${punct}`);
    assert.equal(await page.locator('#newSurface').isHidden(), true);
    await page.locator('#token-t2').click();
    assert.equal(await page.getByRole('button', { name: 'Vložit slovo za' }).isDisabled(), true, `insert-after disabled with ${punct}`);
  }

  assert.deepEqual(errors, []);
  console.log('Browser checks passed: 23 scenarios; surface-edit-stable-IDs, pronoun-person-case-labels, surface-reward-single-fire-reduced-motion, optional-evidence-required-valency-analogy; native-select-contrast (both app/OS themes, placeholder/selected/disabled-select), placeholder-lifecycle, append-delete-order, actual-imperative, indicative-rejection, API-error-XSS, POST-logout, insertion, declaration, NFC, links, preview, labels, XSS, mobile, backspace, prefix-inference, staged-notEvaluated, submitReady, auth-submit, model-offering, surface-invalid-UX.');
} finally {
  if (dbUp) {
    deleteTestUser(BRW_USR);
  }
  await browser?.close();
}
