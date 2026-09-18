<?php
/** @var array|null $db  Passed from pages that check DB status: ['ok' => bool, 'tables' => int] */
$db ??= null;
$_ftUser = function_exists('auth_user') ? auth_user() : null;
$_ftCsrf = function_exists('auth_csrf_token') ? auth_csrf_token() : '';
$_ftGaMeasurementId = getenv('GA_MEASUREMENT_ID') ?: 'G-EF0PV78J5E';
$_ftCfBeaconToken = getenv('CLOUDFLARE_WEB_ANALYTICS_TOKEN') ?: '';
?>
<footer class="site-footer" role="contentinfo">
  <div id="analyticsConsentBanner" class="analytics-consent-banner is-hidden" role="dialog" aria-live="polite" aria-labelledby="analyticsConsentTitle" aria-describedby="analyticsConsentText">
    <div class="analytics-consent-copy">
      <strong id="analyticsConsentTitle">Používáme základní analytiku</strong>
      <p id="analyticsConsentText">Abychom mohli měřit návštěvnost a zdroje provozu, potřebujeme váš souhlas se sběrem anonymních analytických dat. Žádné e-maily, loginy ani obsah kvazivět se neposílají.</p>
    </div>
    <div class="analytics-consent-actions">
      <button type="button" class="analytics-consent-btn analytics-consent-btn-primary" data-analytics-consent="granted">Povolit analytiku</button>
      <button type="button" class="analytics-consent-btn" data-analytics-consent="denied">Nepovolit</button>
      <button type="button" class="analytics-consent-link" data-analytics-settings="open">Upravit nastavení</button>
    </div>
  </div>

  <div class="footer-inner">
    <span>Nejdelší kvazivěta &mdash; prototyp</span>

    <div class="footer-theme" aria-label="Přepínání motivu">
      <span class="footer-theme-label">Motiv</span>
      <button class="footer-theme-btn" id="footerThemeBtn2" type="button" aria-label="Motiv 2 — tmavý">Tmavý</button>
      <button class="footer-theme-btn" id="footerThemeBtn1" type="button" aria-label="Motiv 1 — světlý">Světlý</button>
    </div>

    <a href="#" class="footer-analytics-settings" data-analytics-settings="open">Analytika</a>

    <?php if ($_ftUser): ?>
      <div class="footer-user">
        <span class="footer-user-name">
          <?= htmlspecialchars($_ftUser['username']) ?>
          <?php if ($_ftUser['role'] === 'ADMIN'): ?>
            <span class="nav-badge-admin">admin</span>
          <?php endif; ?>
        </span>
        <span class="footer-sep">&middot;</span>
        <a href="/moje-vety.php">Moje věty</a>
        <span class="footer-sep">&middot;</span>
        <form method="post" action="/logout.php" style="display:inline">
          <input type="hidden" name="csrf" value="<?= htmlspecialchars($_ftCsrf) ?>">
          <button type="submit" style="font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer">Odhlásit se</button>
        </form>
      </div>
    <?php else: ?>
      <div class="footer-user">
        <a href="/login.php">Přihlásit se</a>
        <span class="footer-sep">&middot;</span>
        <a href="/register.php">Zaregistrovat se</a>
      </div>
    <?php endif; ?>

    <?php if ($db !== null): ?>
      <span>
        <span class="db-dot <?= $db['ok'] ? 'ok' : 'err' ?>"></span>
        <?php if ($db['ok']): ?>
          PostgreSQL &middot; schéma kvazi &middot; <?= $db['tables'] ?> tabulek
        <?php else: ?>
          PostgreSQL &middot; nepřipojeno
        <?php endif; ?>
      </span>
    <?php endif; ?>
  </div>
</footer>
<script>
(function () {
  var KONFIG = { '1': '/css/konfigurator-theme1.css', '2': '/css/konfigurator-theme2.css' };
  var GA_MEASUREMENT_ID = <?= json_encode($_ftGaMeasurementId, JSON_THROW_ON_ERROR) ?>;
  var CF_BEACON_TOKEN = <?= json_encode($_ftCfBeaconToken, JSON_THROW_ON_ERROR) ?>;
  var STORAGE_KEY = 'kvazi_analytics_consent';
  var COOKIE_NAME = 'kvazi_analytics_consent';
  var SILENT_DEFAULT = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };

  function readCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function saveCookie(name, value) {
    var expires = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000));
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires.toUTCString() + '; path=/; SameSite=Lax';
  }

  function readStoredState() {
    try {
      var storageValue = localStorage.getItem(STORAGE_KEY);
      if (storageValue) {
        var parsed = JSON.parse(storageValue);
        if (parsed && parsed.value && (parsed.value === 'granted' || parsed.value === 'denied')) {
          if (!parsed.expiresAt || Number(parsed.expiresAt) > Date.now()) {
            return parsed.value;
          }
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (err) {
      // ignore localStorage access failures by falling back to cookie state
    }

    var cookieValue = readCookie(COOKIE_NAME);
    if (cookieValue === 'granted' || cookieValue === 'denied') {
      return cookieValue;
    }

    return null;
  }

  function writeStoredState(value) {
    try {
      var payload = { value: value, expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      // ignore localStorage failures and keep the consent in the cookie only
    }

    saveCookie(COOKIE_NAME, value);
  }

  function applyTheme(id, persist) {
    document.documentElement.dataset.theme = id;
    var link = document.getElementById('themeLink');
    if (link) link.href = KONFIG[id] || KONFIG['2'];
    var b1 = document.getElementById('footerThemeBtn1');
    var b2 = document.getElementById('footerThemeBtn2');
    if (b1) b1.classList.toggle('active', id === '1');
    if (b2) b2.classList.toggle('active', id === '2');
    if (persist) localStorage.setItem('kvazi-theme', id);
  }

  function syncFooterInset() {
    var footer = document.querySelector('.site-footer');
    if (!footer) return;
    var height = Math.max(0, Math.ceil(footer.getBoundingClientRect().height || 0));
    document.documentElement.style.setProperty('--site-footer-height', height + 'px');
  }

  function ensureGtag() {
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
    }
  }

  function applyGtagConsent(value) {
    ensureGtag();
    window.gtag('consent', 'default', {
      analytics_storage: value === 'granted' ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }

  function removeScriptById(id) {
    var script = document.getElementById(id);
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
  }

  function loadGa4() {
    if (!GA_MEASUREMENT_ID || document.getElementById('kvazi-ga4-script')) {
      return;
    }

    ensureGtag();
    applyGtagConsent('denied');

    var script = document.createElement('script');
    script.id = 'kvazi-ga4-script';
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    script.setAttribute('data-kvazi-analytics', 'ga4');
    script.onload = function () {
      window.gtag('consent', 'default', SILENT_DEFAULT);
      window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true, send_page_view: false });
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    };
    document.head.appendChild(script);
  }

  function loadCloudflare() {
    if (!CF_BEACON_TOKEN || document.getElementById('kvazi-cf-beacon')) {
      return;
    }

    var script = document.createElement('script');
    script.id = 'kvazi-cf-beacon';
    script.defer = true;
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.setAttribute('data-kvazi-analytics', 'cloudflare');
    script.setAttribute('data-cf-beacon', JSON.stringify({ token: CF_BEACON_TOKEN }));
    document.head.appendChild(script);
  }

  function setConsent(value) {
    var normalized = value === 'granted' ? 'granted' : 'denied';
    writeStoredState(normalized);
    applyGtagConsent(normalized);

    if (normalized === 'granted') {
      loadGa4();
      loadCloudflare();
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    } else {
      removeScriptById('kvazi-ga4-script');
      removeScriptById('kvazi-cf-beacon');
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    }

    updateConsentBanner(normalized);
  }

  function updateConsentBanner(value) {
    var banner = document.getElementById('analyticsConsentBanner');
    if (!banner) return;

    banner.classList.toggle('is-hidden', value === 'granted' || value === 'denied');
  }

  function handleConsentToggle(event) {
    var target = event.target.closest('[data-analytics-consent]');
    if (!target) return;
    setConsent(target.getAttribute('data-analytics-consent'));
  }

  function handleSettingsToggle(event) {
    var target = event.target.closest('[data-analytics-settings]');
    if (!target) return;
    var banner = document.getElementById('analyticsConsentBanner');
    if (!banner) return;
    banner.classList.toggle('is-hidden');
    if (!banner.classList.contains('is-hidden')) {
      banner.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  var saved = readStoredState();
  var themeSaved = localStorage.getItem('kvazi-theme') || '2';
  applyTheme(themeSaved, false);
  syncFooterInset();

  var b1 = document.getElementById('footerThemeBtn1');
  var b2 = document.getElementById('footerThemeBtn2');
  if (b1) b1.addEventListener('click', function () { applyTheme('1', true); syncFooterInset(); });
  if (b2) b2.addEventListener('click', function () { applyTheme('2', true); syncFooterInset(); });

  var observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncFooterInset) : null;
  if (observer) observer.observe(document.querySelector('.site-footer'));
  window.addEventListener('resize', syncFooterInset, { passive: true });
  window.addEventListener('load', syncFooterInset, { once: true });

  if (saved === 'granted') {
    applyGtagConsent('granted');
    loadGa4();
    loadCloudflare();
    updateConsentBanner('granted');
  } else {
    applyGtagConsent('denied');
    updateConsentBanner(saved || 'unset');
    if (!saved) {
      var banner = document.getElementById('analyticsConsentBanner');
      if (banner) banner.classList.remove('is-hidden');
    }
  }

  document.addEventListener('click', function (event) {
    var consentTarget = event.target.closest('[data-analytics-consent]');
    if (consentTarget) {
      setConsent(consentTarget.getAttribute('data-analytics-consent'));
      return;
    }

    var settingsTarget = event.target.closest('[data-analytics-settings]');
    if (settingsTarget) {
      var banner = document.getElementById('analyticsConsentBanner');
      if (!banner) return;
      banner.classList.toggle('is-hidden');
      if (!banner.classList.contains('is-hidden')) {
        banner.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  });
})();
</script>
