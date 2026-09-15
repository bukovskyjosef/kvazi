// Browser integration test targeting the real PHP runtime.
// Requires a running Docker stack and playwright.
// Usage: PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node app/tests/konfigurator.browser.mjs
// Default base URL: http://127.0.0.1:8080 (matches `docker compose up`)
//
// Words are inserted by typing in the surface input and pressing Space or Enter.
// No paradigm-copy or morfoConfirmed workflow exists in the current UI.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseUrl = (process.env.KVAZI_BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');

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
  // Use #insertPlace select to position insertion before t1, then type 'k'.
  await page.locator('#insertPlace').selectOption('before:t1');
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
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
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

  assert.deepEqual(errors, []);
  console.log('Browser checks passed: insertion, declaration, NFC, links, preview, labels, XSS, mobile, backspace.');
} finally {
  await browser?.close();
}
