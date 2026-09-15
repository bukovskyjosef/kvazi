<?php
/** @var array|null $db  Passed from pages that check DB status: ['ok' => bool, 'tables' => int] */
$db ??= null;
$_ftUser = function_exists('auth_user') ? auth_user() : null;
$_ftCsrf = function_exists('auth_csrf_token') ? auth_csrf_token() : '';
?>
<footer class="site-footer" role="contentinfo">
  <div class="footer-inner">
    <span>Nejdelší kvazivěta &mdash; prototyp</span>

    <?php if ($_ftUser): ?>
      <div class="footer-user">
        <span class="footer-user-name">
          <?= htmlspecialchars($_ftUser['username']) ?>
          <?php if ($_ftUser['role'] === 'ADMIN'): ?>
            <span class="nav-badge-admin">admin</span>
          <?php endif; ?>
        </span>
        <span class="footer-sep">&middot;</span>
        <a href="/moje.php">Administrace</a>
        <span class="footer-sep">&middot;</span>
        <a href="/logout.php?token=<?= urlencode($_ftCsrf) ?>">Odhlásit se</a>
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
