import assert from 'node:assert/strict';
import { BASE } from './review-fixtures.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });

  const banner = page.locator('#analyticsConsentBanner');
  await banner.waitFor();
  assert.ok(await banner.isVisible(), 'Banner should be visible before a decision is stored.');

  const initialConsent = await page.evaluate(() => ({
    localStorage: localStorage.getItem('kvazi_analytics_consent'),
    cookie: document.cookie.includes('kvazi_analytics_consent='),
    gaScript: !!document.querySelector('#kvazi-ga4-script'),
    cfScript: !!document.querySelector('#kvazi-cf-beacon')
  }));

  assert.equal(initialConsent.localStorage, null, 'Default state should not have an analytics consent value.');
  assert.equal(initialConsent.gaScript, false, 'GA4 should remain blocked before consent.');
  assert.equal(initialConsent.cfScript, false, 'Cloudflare analytics should remain blocked before consent.');

  await page.locator('[data-analytics-consent="granted"]').click();
  await page.waitForTimeout(200);

  const grantedState = await page.evaluate(() => ({
    localStorage: localStorage.getItem('kvazi_analytics_consent'),
    cookie: document.cookie,
    gaScript: !!document.querySelector('#kvazi-ga4-script'),
    cfScript: !!document.querySelector('#kvazi-cf-beacon')
  }));

  assert.equal(grantedState.localStorage ? JSON.parse(grantedState.localStorage).value : null, 'granted', 'Grant action should persist granted consent.');
  assert.ok(grantedState.gaScript, 'GA4 script should load after explicit consent.');

  await page.locator('.footer-analytics-settings').click();
  await page.waitForTimeout(100);
  await page.locator('#analyticsConsentBanner [data-analytics-consent="denied"]').click();
  await page.waitForTimeout(200);

  const deniedState = await page.evaluate(() => ({
    localStorage: localStorage.getItem('kvazi_analytics_consent'),
    gaScript: !!document.querySelector('#kvazi-ga4-script'),
    cfScript: !!document.querySelector('#kvazi-cf-beacon')
  }));

  assert.equal(deniedState.localStorage ? JSON.parse(deniedState.localStorage).value : null, 'denied', 'Deny action should persist a denied state.');
  assert.equal(deniedState.gaScript, false, 'GA4 script should be removed after denying analytics.');
  assert.equal(deniedState.cfScript, false, 'Cloudflare beacon should be removed after denying analytics.');

  console.log('Analytics consent browser checks passed: default deny, grant persists, deny removes analytics loaders.');
} finally {
  await browser.close();
}
