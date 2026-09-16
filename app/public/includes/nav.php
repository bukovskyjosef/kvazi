<?php
/**
 * Shared site navigation.
 * Requires auth.php to be included and auth_session_start() called BEFORE this file.
 *
 * Variables expected from page (all optional):
 * @var string $activePage  'home'|'manifest'|'vety'|'tahak'|'prirucka'|'konfigurator'|'login'
 */
$activePage ??= '';
$_navUser    = function_exists('auth_user') ? auth_user() : null;
$_navAdmin   = $_navUser && auth_is_admin();
?>
<script>document.documentElement.dataset.theme=localStorage.getItem('kvazi-theme')||'2'</script>
<header class="site-nav" id="siteNav" role="banner">
  <div class="nav-inner">

    <a class="nav-brand" href="/" aria-label="Nejdelší kvazivěta — úvod">
      <span class="nav-brand-title">Nejdelší kvazivěta</span>
      <span class="nav-brand-sub">kvazilingvistická soutěž</span>
    </a>

    <nav class="nav-links" aria-label="Hlavní navigace">
      <a href="/manifest.php"
         class="nav-link<?= $activePage === 'manifest' ? ' active' : '' ?>">Manifest</a>
      <a href="/vety.php"
         class="nav-link<?= $activePage === 'vety'     ? ' active' : '' ?>">Věty</a>
      <a href="/tahak.php"
         class="nav-link<?= $activePage === 'tahak'    ? ' active' : '' ?>">Tahák</a>
      <a href="/prirucka.php"
         class="nav-link<?= $activePage === 'prirucka' ? ' active' : '' ?>">Příručka</a>

      <span class="nav-divider" aria-hidden="true"></span>

      <?php if ($_navAdmin): ?><a href="/admin/vety.php" class="nav-link<?= $activePage === 'admin' ? ' active' : '' ?>">Ke schválení</a><?php endif; ?>
      <a href="<?= $_navUser ? '/konfigurator.php' : '/login.php?return=%2Fkonfigurator.php' ?>"
         class="nav-btn nav-btn-accent<?= $activePage === 'konfigurator' ? ' active' : '' ?>">Přidat kvazivětu</a>
    </nav>

  </div>
</header>
<script>
  (function () {
    var nav = document.getElementById('siteNav');
    function tick() { nav.classList.toggle('scrolled', window.scrollY > 36); }
    window.addEventListener('scroll', tick, { passive: true });
    tick();
  })();
</script>
