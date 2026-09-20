/**
 * Regression test: player-facing pages must not leak internal authority
 * terminology (Issue #151).
 *
 * Loads actual rendered pages in a headless browser and scans visible text
 * content for forbidden internal governance/docs terms. This catches both
 * PHP-rendered and JS-generated player-facing text.
 */
import assert from 'node:assert/strict';
import { BASE } from './review-fixtures.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });

// Forbidden patterns in rendered player-facing text.
// Each entry: [regex, human-readable description]
const FORBIDDEN = [
  [/github\.com\/bukovskyjosef\/kvazi/gi, 'GitHub repo URL'],
  [/(?:^|\s|["'>\/])docs\//gi, 'docs/ reference'],
  [/kanonick[ýáé]/gi, 'kanonický/á/é'],
  [/source\s+of\s+truth/gi, 'source of truth'],
  [/(?:veřejn[áé]|interní)\s+projekce/gi, 'interní/veřejná projekce'],
  [/veřejn[áé]\s+shrnutí/gi, 'veřejné shrnutí'],
  [/normativní\s+(balík|modul)/gi, 'normativní balík/modul'],
  [/governance\s+defect/gi, 'governance defect'],
];

// Player-facing pages to check. Auth-gated pages (moje-vety, admin) are excluded.
const PAGES = [
  '/',
  '/prirucka.php',
  '/tahak.php',
  '/tahak.php?sekce=prehled',
  '/tahak.php?sekce=syntax',
  '/tahak.php?sekce=substantiva',
  '/tahak.php?sekce=adjektiva',
  '/tahak.php?sekce=slovesa',
  '/tahak.php?sekce=valence',
  '/tahak.php?sekce=hranicni',
  '/tahak.php?sekce=kvazi',
  '/konfigurator.php',
  '/manifest.php',
  '/vety.php',
];

const violations = [];

try {
  for (const path of PAGES) {
    const page = await browser.newPage();
    await page.goto(BASE + path, { waitUntil: 'networkidle' });

    // Get all visible text content from the rendered page body.
    const bodyText = await page.evaluate(() => document.body.innerText);
    // Also check href attributes for forbidden URLs.
    const hrefs = await page.evaluate(() =>
      [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'))
    );
    const checkTarget = bodyText + '\n' + hrefs.join('\n');

    for (const [re, label] of FORBIDDEN) {
      re.lastIndex = 0;
      const m = re.exec(checkTarget);
      if (m) {
        violations.push(`${path}: found "${m[0]}" (${label})`);
      }
    }

    await page.close();
  }

  assert.deepStrictEqual(violations, [],
    'Player-facing rendered pages must not contain internal authority terms:\n' +
    violations.join('\n'));

  console.log(`Player-facing browser check passed: ${PAGES.length} pages, ${FORBIDDEN.length} forbidden patterns.`);
} finally {
  await browser?.close();
}
