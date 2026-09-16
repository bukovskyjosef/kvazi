// Browser integration test targeting the real PHP runtime.
// Requires a running Docker stack and playwright.
// Usage: PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node app/tests/konfigurator.browser.mjs
// Default base URL: http://127.0.0.1:8080 (matches `docker compose up`)
//
// Words are inserted by typing in the surface input and pressing Space or Enter.
// No paradigm-copy or morfoConfirmed workflow exists in the current UI.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseUrl = (process.env.KVAZI_BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');

// ── DB helpers (needed for Scene 14: authenticated submit) ────────────────────

function pgStr(v) {
  return "'" + String(v).replace(/'/g, "''") + "'";
}

function dbExec(sql, params = {}) {
  const resolved = sql.replace(/:([a-z_]+)/g, (_, k) => {
    const v = params[k];
    if (v === undefined) throw new Error(`Missing DB param :${k}`);
    return /^\d+$/.test(String(v)) ? String(v) : pgStr(v);
  });
  return execFileSync('docker', ['exec', 'kvazi_db', 'psql', '-U', 'kvazi', '-d', 'kvazi', '-t', '-A', '-c', resolved], { timeout: 10000 }).toString().trim();
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
  dbExec(`INSERT INTO kvazi.user_account (username, email, password_hash, role)
           VALUES (:u, :e, :h, 'USER')
           ON CONFLICT (username) DO NOTHING`, { u: username, e: email, h: hash });
}

function deleteTestUser(username) {
  dbExec('DELETE FROM kvazi.sentence WHERE user_id = (SELECT id FROM kvazi.user_account WHERE username = :u)', { u: username });
  dbExec('DELETE FROM kvazi.user_account WHERE username = :u', { u: username });
}

function dbReachable() {
  try {
    execFileSync('docker', ['exec', 'kvazi_db', 'psql', '-U', 'kvazi', '-d', 'kvazi', '-c', 'SELECT 1'], { timeout: 5000 });
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

  // ── Scene 3: Insert a third word at a specific position ──────────────────
  // Use the visible insertion action, then type 'k'.
  await page.locator('#token-t1').click();
  await page.getByRole('button', {name:'Vložit před slovo',exact:true}).click();
  await page.locator('#newSurface').fill('k');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#tokens .token-chip').count(), 3);

  // Click the new preposition token ('k') — its id is t3 (nextId increments).
  await page.locator('#token-t3').click();
  assert.equal(await page.getByLabel('Slovní druh', { exact: true }).inputValue(), 'preposition');
  assert.equal(await page.getByLabel('Slovní druh', { exact: true }).isDisabled(), true);
  await page.getByLabel('Řízené jmenné slovo').selectOption('t1');

  // Go back to t1 and verify its head link survived the render cycle.
  await page.locator('#token-t1').click();
  assert.equal(await page.getByLabel('Řídící slovo', { exact: true }).inputValue(), 't2');

  // ── Scene 4: NFC normalisation — surface should be stored as NFC ─────────
  await page.locator('#token-t1').click();
  await page.getByLabel('Text slova', { exact: true }).fill('va\u0301zi'); // decomposed á
  assert.equal(await page.getByLabel('Text slova', { exact: true }).inputValue(), 'vázi'); // composed NFC
  // After surface change, declaration fields that depended on surface reset.
  assert.equal(await page.getByLabel('Základní tvar', { exact: true }).inputValue(), '');
  // Head link still pointing to t2 (surface change does not clear independent relations).
  assert.equal(await page.getByLabel('Řídící slovo', { exact: true }).inputValue(), 't2');

  // ── Scene 5: Preview JSON ─────────────────────────────────────────────────
  await page.getByRole('button', { name: 'Zobrazit náhled JSON (neodesílá)' }).click();
  const payload = JSON.parse(await page.locator('#payload pre').textContent());
  assert.deepEqual(payload.draft.tokens.map(w => w.id), ['t3', 't1', 't2']);
  assert.equal(payload.validation.submitReady, false); // incomplete declarations
  assert.equal(payload.submitted, false);
  assert.ok(payload.validation.text.includes('vázi'), `preview text should contain vázi`);

  // ── Scene 6: All visible form inputs must have an associated label ────────
  const unlabelled = await page.locator('input:not([type="hidden"]), select:not([hidden]), textarea')
    .evaluateAll(nodes => nodes
      .filter(n => !n.hidden && n.offsetParent !== null) // visible only
      .filter(n => !n.labels?.length && !n.getAttribute('aria-label') && !n.getAttribute('aria-labelledby'))
      .map(n => n.id || n.name || n.className));
  assert.deepEqual(unlabelled, [], `Unlabelled visible inputs: ${unlabelled.join(', ')}`);

  // ── Scene 7: XSS — injected markup must not render ───────────────────────
  await page.getByLabel('Text slova', { exact: true }).fill('<img src=x onerror=alert(1)>');
  assert.equal(await page.locator('#payload pre').count(), 0); // preview cleared on field change
  assert.equal(await page.locator('#editor img, #tokens img').count(), 0);

  // ── Scene 8: Mobile viewport does not overflow horizontally ──────────────
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, JSON.stringify(await page.locator('body *').evaluateAll(nodes => nodes.filter(n => n.getBoundingClientRect().right > innerWidth).map(n => ({tag:n.tagName,id:n.id,cls:n.className,width:n.getBoundingClientRect().width})))));
  await page.screenshot({ path: '/private/tmp/kvazi-configurator-mobile.png', fullPage: true });

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
  await page.getByRole('button', { name: 'Zobrazit náhled JSON (neodesílá)' }).click();
  const payload11 = JSON.parse(await page.locator('#payload pre').textContent());
  assert.equal(payload11.draft.tokens[0].kvaziPrefix, 'kvazi', 'kvaziPrefix should be kvazi for kvazipan');
  assert.equal(payload11.draft.tokens[0].pos, 'noun', 'pos should be noun for kvazipan (from JSON)');

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
  await page.getByRole('button', { name: 'Zobrazit náhled JSON (neodesílá)' }).click();
  const payload12 = JSON.parse(await page.locator('#payload pre').textContent());
  assert.equal(payload12.validation.tokens['t1'].formCheck.status, 'notEvaluated', 'jsme is surface-invalid: formCheck must be notEvaluated, not deep-checked');
  assert.equal(payload12.validation.tokens['t1'].formCheck.ok, null, 'notEvaluated formCheck.ok is null');
  assert.equal(payload12.validation.morphologyOk, false, 'morphologyOk false when formCheck is notEvaluated');
  assert.equal(payload12.validation.submitReady, false, 'submitReady false for surface-invalid token');

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
  await page.getByLabel('Morfologická obhajoba a odkaz na model').fill('Nominativ plurálu vzoru pán.');

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
  await page.getByLabel('Morfologická obhajoba a odkaz na model').fill('Přítomný čas 3. os. pl. vzoru V-IT.');

  // Submit button must be enabled when draft is ready
  assert.equal(await page.locator('#submitButton').isDisabled(), false, 'Submit button enabled when submitReady=true');

  await page.getByRole('button', { name: 'Zobrazit náhled JSON (neodesílá)' }).click();
  const payload13 = JSON.parse(await page.locator('#payload pre').textContent());
  assert.equal(payload13.validation.submitReady, true, 'submitReady should be true for fully declared valid draft');
  assert.equal(payload13.validation.charScore, 10, 'charScore should be 10');

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
    await page.getByLabel('Morfologická obhajoba a odkaz na model').fill('Nominativ plurálu vzoru pán.');

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
    await page.getByLabel('Morfologická obhajoba a odkaz na model').fill('Přítomný čas 3. os. pl. vzoru V-IT.');

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

  assert.deepEqual(errors, []);
  console.log('Browser checks passed: insertion, declaration, NFC, links, preview, labels, XSS, mobile, backspace, prefix-inference, staged-notEvaluated, submitReady, auth-submit.');
} finally {
  if (dbUp) {
    try { deleteTestUser(BRW_USR); } catch { /* non-fatal */ }
  }
  await browser?.close();
}
