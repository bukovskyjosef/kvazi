// Focused local browser regression for Issue #151 token diagnostics.
// Runs the existing PHP page without a database and never submits a draft.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = process.env.KVAZI_BASE_URL || 'http://127.0.0.1:17877';
const localServer = process.env.KVAZI_BASE_URL ? null : spawn('php', ['-S', '127.0.0.1:17877', '-t', 'app/public'], {
  cwd: join(appRoot, '..'), stdio: 'ignore',
});

let browser;
try {
  if (localServer) {
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      if (localServer.exitCode !== null) throw new Error('Lokální PHP server se nepodařilo spustit.');
      try {
        const response = await fetch(`${baseUrl}/konfigurator.php`);
        if (!response.ok) throw new Error(`Konfigurátor vrátil HTTP ${response.status}.`);
        ready = true;
        break;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    if (!ready) throw new Error('Lokální konfigurátor není dostupný.');
  }

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/konfigurator.php`);
  await page.getByLabel('Nové slovo (bez mezer)').pressSequentially('kvazi kvazí ');

  await page.locator('#token-t1').click();
  await page.getByLabel('Slovní druh', { exact: true }).selectOption('noun');
  await page.getByLabel('Základní tvar', { exact: true }).fill('kvaz');
  await page.getByLabel('Deklarovaná identita').selectOption('quasi');
  await page.getByLabel('Soutěžní vzor').selectOption('pán');
  await page.getByLabel('Pád použitého tvaru').selectOption('1');
  await page.getByLabel('Číslo použitého tvaru').selectOption('plural');
  await page.getByLabel('Větná funkce', { exact: true }).selectOption('subject');
  await page.getByLabel('Řídící slovo', { exact: true }).selectOption('t2');

  assert.ok(await page.locator('#token-t1').evaluate(node => node.classList.contains('warn')));
  const firstDetail = page.locator('#validation details').first();
  await firstDetail.locator('summary').click();
  assert.ok(await firstDetail.locator('li').first().isVisible());
  assert.match(await firstDetail.textContent(), /Řídícím slovem musí být přísudek\./);
  assert.match(await page.locator('#editor').textContent(), /Řídícím slovem musí být přísudek\./);
  for (const detail of await page.locator('#validation details').all()) {
    if ((await detail.locator('summary').textContent()).includes('zbývá vyřešit')) {
      if (!(await detail.evaluate(node => node.open))) await detail.locator('summary').click();
      assert.ok(await detail.locator('li').first().isVisible(), 'incomplete detail must explain its status');
    }
  }

  await page.locator('#token-t2').click();
  await page.getByLabel('Slovní druh', { exact: true }).selectOption('verb');
  await page.getByLabel('Větná funkce', { exact: true }).selectOption('predicate');

  assert.ok(await page.locator('#token-t1').evaluate(node => node.classList.contains('ok')));
  assert.ok(await page.locator('#token-t2').evaluate(node => node.classList.contains('warn')));
  assert.equal(await page.locator('.sentence-entry').getAttribute('data-status'), 'warn');
  assert.match(await page.locator('#validation details').first().locator('summary').textContent(), /úplné/);
  for (const detail of await page.locator('#validation details').all()) {
    if ((await detail.locator('summary').textContent()).includes('zbývá vyřešit')) {
      await detail.locator('summary').click();
      assert.ok(await detail.locator('li').first().isVisible(), 'incomplete detail must explain its status');
    }
  }
  await page.close();
  console.log('Browser PASS: invalid head is visible; noun ORANGE → GREEN; predicate and sentence remain ORANGE.');
} finally {
  await browser?.close();
  localServer?.kill('SIGTERM');
}
