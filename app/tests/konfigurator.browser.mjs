// Optional integration check: PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs
// node app/tests/konfigurator.browser.mjs. Uses a temporary browser profile.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = new URL('../public/', import.meta.url);
const server = createServer(async (req, res) => {
  const url = new URL(`.${new URL(req.url, 'http://localhost').pathname}`, root);
  if (!url.href.startsWith(root.href)) { res.writeHead(403).end(); return; }
  try {
    const data = await readFile(url);
    res.setHeader('Content-Type', url.pathname.endsWith('.mjs') ? 'text/javascript' : url.pathname.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/konfigurator.html`);
  await page.getByLabel('Typ věty', { exact: true }).selectOption('interrogative');
  await page.getByLabel('Nové slovo (bez mezer)').fill('vazi');
  await page.getByRole('button', { name: 'Vložit slovo', exact: true }).click();
  await page.getByLabel('Slovní druh', { exact: true }).selectOption('noun');
  await page.getByLabel('Základní tvar', { exact: true }).pressSequentially('testnoun');
  assert.equal(await page.getByLabel('Základní tvar', { exact: true }).inputValue(), 'testnoun');
  await page.getByLabel('Deklarovaná identita').selectOption('quasi');
  await page.getByLabel('Soutěžní vzor').selectOption('hrad');
  await page.getByLabel('Pád použitého tvaru').selectOption('1');
  await page.getByLabel('Číslo použitého tvaru').selectOption('singular');
  await page.getByLabel('Větná funkce', { exact: true }).selectOption('subject');
  await page.getByLabel('Morfologická obhajoba a odkaz na model').fill('Test evidence');
  await page.getByRole('button', { name: 'Zkopírovat text slova do prázdných buněk' }).click();
  assert.equal(await page.locator('[data-cell]').count(), 14);
  const confirm = page.getByRole('button', { name: 'Potvrzuji, že toto je můj morfologický návrh.', exact: true });
  assert.equal(await confirm.isEnabled(), true);
  await confirm.click();
  assert.equal(await page.getByText('Aktuální návrh je potvrzen uživatelem.', { exact: true }).count(), 1);
  await page.locator('[data-cell]').first().fill('other');
  assert.equal(await page.getByText('Aktuální návrh není potvrzen.', { exact: true }).count(), 1);
  await confirm.click();
  await page.getByRole('button', { name: 'Vložit za toto slovo', exact: true }).click();
  await page.getByLabel('Nové slovo (bez mezer)').fill('kvazi');
  await page.getByRole('button', { name: 'Vložit slovo', exact: true }).click();
  await page.getByLabel('Slovní druh', { exact: true }).selectOption('verb');
  await page.getByLabel('Vid', { exact: true }).selectOption('biaspectual');
  assert.equal(await page.locator('[data-cell]').count(), 0);
  assert.equal(await page.getByLabel('Soutěžní časovací typ').isDisabled(), true);
  await page.getByLabel('Větná funkce', { exact: true }).selectOption('predicate');
  await page.locator('#token-t1').click();
  await page.getByLabel('Řídící slovo', { exact: true }).selectOption('t2');
  await page.getByRole('button', { name: 'Vložit před toto slovo', exact: true }).click();
  await page.getByLabel('Nové slovo (bez mezer)').fill('k');
  await page.getByRole('button', { name: 'Vložit slovo', exact: true }).click();
  assert.equal(await page.getByLabel('Slovní druh', { exact: true }).inputValue(), 'preposition');
  assert.equal(await page.getByLabel('Slovní druh', { exact: true }).isDisabled(), true);
  await page.getByLabel('Řízené jmenné slovo').selectOption('t1');
  await page.locator('#token-t1').click();
  assert.equal(await page.getByLabel('Řídící slovo', { exact: true }).inputValue(), 't2');
  await page.getByLabel('Text slova', { exact: true }).fill('va\u0301zi');
  assert.equal(await page.getByLabel('Text slova', { exact: true }).inputValue(), 'vázi');
  assert.equal(await page.getByLabel('Základní tvar', { exact: true }).inputValue(), '');
  assert.equal(await page.getByLabel('Řídící slovo', { exact: true }).inputValue(), 't2');
  await page.getByRole('button', { name: 'Zobrazit místní náhled draftu (neodesílá)' }).click();
  const payload = JSON.parse(await page.locator('#payload pre').textContent());
  assert.deepEqual(payload.draft.tokens.map(w => w.id), ['t3', 't1', 't2']);
  assert.equal(payload.validation.submitReady, false);
  assert.equal(payload.submitted, false);
  assert.equal(payload.validation.text, 'k vázi kvazi?');
  // Every enabled form input has an explicit, associated label.
  assert.deepEqual(await page.locator('input, select, textarea').evaluateAll(nodes => nodes.filter(n => !n.labels?.length).map(n => n.id)), []);
  await page.getByLabel('Text slova', { exact: true }).fill('<img src=x onerror=alert(1)>');
  assert.equal(await page.locator('#payload pre').count(), 0);
  assert.equal(await page.locator('#editor img, #tokens img').count(), 0);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: '/private/tmp/kvazi-configurator-mobile.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('Browser checks passed: editing, insertion, stable links, NFC, confirmation, gates, preview, labels, mobile overflow and escaped input.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
