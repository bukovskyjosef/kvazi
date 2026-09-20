import assert from 'node:assert/strict';
import { BASE } from './review-fixtures.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const viewports = [
  { width: 390, height: 844, label: 'mobile' },
  { width: 768, height: 1024, label: 'tablet' },
  { width: 1440, height: 900, label: 'desktop' }
];
const paths = [{ path: '/login.php', label: 'short-page' }, { path: '/', label: 'long-page' }];

const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
try {
  for (const viewport of viewports) {
    for (const { path, label } of paths) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      await page.locator('.site-footer').waitFor();

      for (const themeId of ['2', '1']) {
        const themeButton = page.locator(themeId === '2' ? '#footerThemeBtn2' : '#footerThemeBtn1');
        await themeButton.click();
        await page.waitForTimeout(50);
        assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), themeId);

        await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
        await page.waitForTimeout(80);

        const metrics = await page.evaluate(() => {
          const footer = document.querySelector('.site-footer');
          if (!footer) return null;
          const footerRect = footer.getBoundingClientRect();
          const candidates = [...document.querySelectorAll('body *')]
            .filter(el => el !== footer && !el.closest('.site-footer') && el.getClientRects().length);
          const last = candidates.at(-1);
          const lastRect = last ? last.getBoundingClientRect() : null;
          return {
            viewportHeight: window.innerHeight,
            footerTop: footerRect.top,
            footerBottom: footerRect.bottom,
            footerHeight: footerRect.height,
            lastBottom: lastRect ? lastRect.bottom : null,
            theme: document.documentElement.dataset.theme || '2'
          };
        });

        assert.ok(metrics, `Footer missing on ${label} @ ${viewport.label}-${themeId}`);
        assert.ok(Math.abs(metrics.footerBottom - metrics.viewportHeight) <= 4,
          `Footer did not stay pinned to viewport bottom on ${label} @ ${viewport.label} theme ${themeId}: footerBottom=${metrics.footerBottom}, viewportHeight=${metrics.viewportHeight}`);
        if (metrics.lastBottom !== null) {
          assert.ok(metrics.lastBottom <= metrics.footerTop + 2,
            `Last content overlapped the footer on ${label} @ ${viewport.label} theme ${themeId}: lastBottom=${metrics.lastBottom}, footerTop=${metrics.footerTop}`);
        }
      }

      await page.close();
    }
  }

  console.log('Footer browser checks passed: short and long pages, 390/768/1440 viewport widths, both themes; sticky footer remains at viewport bottom without covering trailing content.');
} finally {
  await browser.close();
}
