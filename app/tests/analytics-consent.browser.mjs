import assert from 'node:assert/strict';
import { BASE } from './review-fixtures.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Stub external analytics scripts so onload fires deterministically without network.
  await page.route('**://www.googletagmanager.com/**', route =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* stub */' }));
  await page.route('**://static.cloudflareinsights.com/**', route =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* stub */' }));

  await page.goto(BASE + '/', { waitUntil: 'networkidle' });

  const banner = page.locator('#analyticsConsentBanner');
  await banner.waitFor();
  assert.ok(await banner.isVisible(), 'Banner should be visible before a decision is stored.');

  const bannerText = await banner.textContent();
  assert.equal(bannerText.includes('Upravit nastavení'), false, 'Initial consent banner should not include the redundant settings action.');
  assert.equal(bannerText.includes('anonymní'), false, 'Consent banner must not claim analytics data are anonymous.');

  const btnClasses = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('#analyticsConsentBanner .analytics-consent-btn'));
    return btns.map(b => Array.from(b.classList).sort().join(' '));
  });
  assert.ok(btnClasses.length >= 2, 'Banner should have at least two consent buttons.');
  assert.equal(btnClasses[0], btnClasses[1], 'Accept and reject buttons must have identical CSS classes for visual parity.');

  const themeStyles = () => page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.cssText = 'background:var(--glass);border:1px solid var(--border-hi);box-shadow:var(--shadow);color:var(--text)';
    document.body.append(probe);
    const actual = getComputedStyle(document.getElementById('analyticsConsentBanner'));
    const expected = getComputedStyle(probe);
    const expectedHeading = expected.color;
    probe.style.color = 'var(--text-muted)';
    const result = {
      theme: document.documentElement.dataset.theme,
      background: actual.backgroundColor, expectedBackground: expected.backgroundColor,
      border: actual.borderTopColor, expectedBorder: expected.borderTopColor,
      shadow: actual.boxShadow, expectedShadow: expected.boxShadow,
      heading: getComputedStyle(document.getElementById('analyticsConsentTitle')).color,
      expectedHeading,
      button: getComputedStyle(document.querySelector('.analytics-consent-btn')).color,
      expectedButton: getComputedStyle(probe).color,
    };
    probe.remove();
    return result;
  });
  const checkTheme = styles => {
    assert.equal(styles.background, styles.expectedBackground);
    assert.equal(styles.border, styles.expectedBorder);
    assert.equal(styles.shadow, styles.expectedShadow);
    assert.equal(styles.heading, styles.expectedHeading);
    assert.equal(styles.button, styles.expectedButton);
  };
  const dark = await themeStyles();
  assert.equal(dark.theme, '2');
  checkTheme(dark);
  await page.locator('#footerThemeBtn1').evaluate(button => button.click());
  await page.waitForTimeout(250); // wait for CSS color transitions (150ms) to settle
  const light = await themeStyles();
  assert.equal(light.theme, '1');
  checkTheme(light);
  assert.notEqual(light.background, dark.background, 'Visible consent banner must adopt light theme');
  assert.notEqual(light.heading, dark.heading, 'Banner text must adopt light theme');
  await page.locator('#footerThemeBtn2').evaluate(button => button.click());
  await page.waitForTimeout(250);
  const darkAgain = await themeStyles();
  assert.equal(darkAgain.theme, '2');
  checkTheme(darkAgain);
  assert.equal(darkAgain.background, dark.background);

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

  // Wait for GA4 script element to appear and its onload to populate dataLayer.
  // With the stubbed googletagmanager response, onload fires deterministically.
  await page.waitForFunction(() => {
    const dl = window.dataLayer || [];
    return dl.some(e => e[0] === 'config' && e.length >= 3);
  }, { timeout: 5000 });

  const grantedState = await page.evaluate(() => ({
    localStorage: localStorage.getItem('kvazi_analytics_consent'),
    cookie: document.cookie,
    gaScript: !!document.querySelector('#kvazi-ga4-script'),
    cfScript: !!document.querySelector('#kvazi-cf-beacon')
  }));

  assert.equal(grantedState.localStorage ? JSON.parse(grantedState.localStorage).value : null, 'granted', 'Grant action should persist granted consent.');
  assert.ok(grantedState.gaScript, 'GA4 script should load after explicit consent.');

  const ga4Config = await page.evaluate(() => {
    const dl = window.dataLayer || [];
    const cfg = dl.find(e => e[0] === 'config' && e.length >= 3);
    return cfg ? cfg[2] : null;
  });
  assert.ok(ga4Config, 'GA4 config call must be present in dataLayer after consent.');
  assert.equal(ga4Config.cookie_expires, 31536000, 'GA4 cookie_expires must be 31536000 (12 months).');
  assert.equal(ga4Config.cookie_update, false, 'GA4 cookie_update must be false (non-rolling).');

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
