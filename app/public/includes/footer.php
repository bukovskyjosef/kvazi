<?php
/** @var array|null $db  Passed from pages that check DB status: ['ok' => bool, 'tables' => int] */
$db ??= null;
$_ftUser = function_exists('auth_user') ? auth_user() : null;
$_ftCsrf = function_exists('auth_csrf_token') ? auth_csrf_token() : '';
?>
<footer class="site-footer" role="contentinfo">
  <div class="footer-inner">
    <span>Nejdelší kvazivěta &mdash; prototyp</span>

    <div class="footer-theme" aria-label="Přepínání motivu">
      <span class="footer-theme-label">Motiv</span>
      <button class="footer-theme-btn" id="footerThemeBtn2" type="button" aria-label="Motiv 2 — tmavý">Tmavý</button>
      <button class="footer-theme-btn" id="footerThemeBtn1" type="button" aria-label="Motiv 1 — světlý">Světlý</button>
    </div>

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

  var saved = localStorage.getItem('kvazi-theme') || '2';
  applyTheme(saved, false);
  syncFooterInset();

  var b1 = document.getElementById('footerThemeBtn1');
  var b2 = document.getElementById('footerThemeBtn2');
  if (b1) b1.addEventListener('click', function () { applyTheme('1', true); syncFooterInset(); });
  if (b2) b2.addEventListener('click', function () { applyTheme('2', true); syncFooterInset(); });

  var observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncFooterInset) : null;
  if (observer) observer.observe(document.querySelector('.site-footer'));
  window.addEventListener('resize', syncFooterInset, { passive: true });
  window.addEventListener('load', syncFooterInset, { once: true });
})();
</script>
