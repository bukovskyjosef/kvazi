import assert from 'node:assert/strict';
import { BASE, fixtures, post, validDraft } from './review-fixtures.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const f = await fixtures();
let browser;
try {
  const token = { id: 't1', pos: 'pronoun', surface: 'kvazi', lemma: f.tag + 'pronounz', lexicalStatus: 'real',
    form: { pronoun: { case: '1', number: 'singular', gender: 'notApplicable', person: '1' } } };
  const ids = f.revision([token]);
  assert.equal((await post('/api/admin/real-word-catalog.php', f.sessions.admin, { ...ids, tokenId: 't1', isApproved: true })).status, 200);
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage();
  await page.context().addCookies(f.sessions.user.cookie.split('; ').map(cookie => {
    const [name, value] = cookie.split('='); return { name, value, url: BASE };
  }));
  const errors = [];
  const lookups = [];
  page.on('pageerror', error => { errors.push(error.message); console.error('Browser page error:', error.message); });
  page.on('request', request => { if (request.url().endsWith('/api/real-word-catalog.php')) lookups.push(request); });
  const check = page.locator('#catalogCheck');
  const result = page.locator('#catalogResult');
  async function lookup(positive) {
    const [r] = await Promise.all([page.waitForResponse(r => r.url().endsWith('/api/real-word-catalog.php'), { timeout: 10000 }), check.click()]);
    assert.equal(r.status(), 200);
    assert.deepEqual(await r.json(), { ok: true, exactMatch: positive });
    await result.filter({ hasText: positive ? 'Tato přesná deklarace je v katalogu potvrzena jako skutečné slovo.'
      : 'Tato přesná deklarace zatím v katalogu potvrzena není. Můžete ji přesto odeslat k posouzení.' }).waitFor();
  }

  // 1. Full explicit pronoun declaration, then a real FE -> API -> DB positive.
  await page.goto(BASE + '/konfigurator.php');
  await page.locator('#newSurface').fill(token.surface); await page.locator('#newSurface').press('Enter');
  await page.locator('#token-t1').click();
  await page.getByLabel('Slovní druh', { exact: true }).selectOption('pronoun');
  await page.getByLabel('Základní tvar', { exact: true }).fill(token.lemma);
  await page.getByLabel('Deklarovaná identita').selectOption('real');
  assert.equal(await check.count(), 0);
  for (const [field, value] of Object.entries(token.form.pronoun)) {
    await page.locator(`#word-form-pronoun-${field}`).selectOption(value);
    if (field !== 'person') assert.equal(await check.count(), 0);
  }
  assert.equal(lookups.length, 0);
  assert.equal(await check.isEnabled(), true);
  await lookup(true);
  assert.equal(await page.locator('#word-form-pronoun-gender').inputValue(), 'notApplicable');
  assert.equal(await page.getByLabel('Morfologická obhajoba a odkaz na model').isVisible(), true);

  // 2. Identity and form changes and token deletion invalidate; edits never trigger a lookup.
  for (const [selector, value, restore] of [
    ['#word-lemma', token.lemma + 'z', token.lemma],
    ['#word-form-pronoun-gender', 'feminine', 'notApplicable'],
  ]) {
    const before = lookups.length;
    const edit = page.locator(selector);
    if (selector.includes('pronoun')) await edit.selectOption(value); else await edit.fill(value);
    assert.equal(await result.textContent(), ''); assert.equal(lookups.length, before);
    if (selector.includes('pronoun')) await edit.selectOption(restore); else await edit.fill(restore);
    assert.equal(await result.textContent(), ''); assert.equal(lookups.length, before);
    await lookup(true);
  }
  const beforeReplacement = lookups.length;
  await page.getByRole('button', { name: 'Smazat kvazi', exact: true }).click();
  assert.equal(await result.count(), 0); assert.equal(lookups.length, beforeReplacement);
  await page.locator('#newSurface').fill(token.surface); await page.locator('#newSurface').press('Enter');
  await page.locator('#token-t2').click();
  await page.getByLabel('Slovní druh', { exact: true }).selectOption('pronoun');
  await page.getByLabel('Základní tvar', { exact: true }).fill(token.lemma);
  await page.getByLabel('Deklarovaná identita').selectOption('real');
  for (const [field, value] of Object.entries(token.form.pronoun)) await page.locator(`#word-form-pronoun-${field}`).selectOption(value);
  assert.equal(await result.textContent(), ''); assert.equal(lookups.length, beforeReplacement);
  await lookup(true);
  await page.getByLabel('Morfologická obhajoba a odkaz na model').fill('Vlastní obhajoba.');
  assert.ok((await result.textContent()).includes('je v katalogu potvrzena'));

  // 3. A delayed positive response cannot revive a result after a key change.
  let releaseResponse, started;
  const gate = new Promise(resolve => { releaseResponse = resolve; });
  const entered = new Promise(resolve => { started = resolve; });
  await page.route('**/api/real-word-catalog.php', async route => {
    const response = await route.fetch(); started(); await gate; await route.fulfill({ response });
  });
  await check.click();
  let timer;
  try { await Promise.race([entered, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Delayed lookup did not reach route')), 5000); })]); }
  finally { clearTimeout(timer); }
  await page.locator('#word-lemma').fill(token.lemma + 'stalez');
  const received = page.waitForResponse(r => r.url().endsWith('/api/real-word-catalog.php'));
  releaseResponse(); await received;
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await result.textContent(), '');
  await page.unroute('**/api/real-word-catalog.php');

  // 4. Not found leaves the complete payload and valid submit available.
  await page.goto(BASE + '/konfigurator.php');
  await page.getByLabel('Rozkazovací', { exact: true }).check();
  await page.getByLabel('Podmět není vyjádřen', { exact: true }).check();
  await page.locator('#newSurface').fill('kvazi'); await page.locator('#newSurface').press('Enter');
  await page.locator('#token-t1').click();
  await page.getByLabel('Slovní druh', { exact: true }).selectOption('verb');
  await page.getByLabel('Neurčitek / základní tvar', { exact: true }).fill('kvaziit');
  await page.getByLabel('Deklarovaná identita').selectOption('quasi');
  await page.getByLabel('Soutěžní časovací typ').selectOption('V-IT');
  await page.getByLabel('Druh slovesného tvaru').selectOption('imperative');
  await page.locator('#word-form-verbPerson').selectOption('2sg');
  await page.getByLabel('Vid').selectOption('biaspectual');
  await page.getByLabel('Větná funkce', { exact: true }).selectOption('predicate');
  await page.getByLabel('Valenční obhajoba').fill(validDraft().tokens[0].valency.declaration);
  await page.getByLabel('Morfologická obhajoba a odkaz na model').fill(validDraft().tokens[0].evidence.morphology);
  assert.equal(await page.locator('#submitButton').isEnabled(), true);
  await lookup(false);
  assert.equal(await page.locator('#submitButton').isEnabled(), true);
  await page.locator('#previewButton').click();
  const preview = JSON.parse(await page.locator('#payload pre').textContent());
  assert.equal(preview.draft.tokens[0].form.aspect, 'biaspectual');
  assert.ok(preview.draft.tokens[0].evidence.morphology);
  const submitted = page.waitForResponse(r => r.url().endsWith('/api/submit.php'));
  await page.locator('#submitButton').click(); assert.equal((await submitted).status(), 200);
  await page.locator('#submitResult .alert-ok').waitFor();

  // 5. Changing the model invalidates the previous result without a new request.
  const beforeModel = lookups.length;
  await page.getByLabel('Soutěžní časovací typ').selectOption('V-AT');
  assert.equal(await result.count(), 0); assert.equal(lookups.length, beforeModel);

  // 6. A normative functional token offers no redundant catalog action.
  await page.goto(BASE + '/konfigurator.php');
  await page.locator('#newSurface').fill('k'); await page.locator('#newSurface').press('Enter');
  await page.locator('#token-t1').click(); assert.equal(await check.count(), 0);
  assert.equal(lookups.length, beforeModel);
  assert.deepEqual(errors, []);
  console.log('Catalog browser checks passed: 6 scenarios; complete-pronoun-positive, exact-field-invalidation, stale-response, not-found-submit, model-invalidation, normative-exception; no automatic lookup or metadata leak.');
} finally {
  await browser?.close(); f.cleanup();
}
