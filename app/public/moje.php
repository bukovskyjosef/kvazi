<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
auth_session_start();

$user = auth_user();
if ($user === null) {
    header('Location: /login.php?return=/moje.php');
    exit;
}

$activePage = '';
?>
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Moje administrace — Nejdelší kvazivěta</title>
  <link rel="stylesheet" href="/css/site.css">
</head>
<body>

<?php include __DIR__ . '/includes/nav.php'; ?>

<main class="container page-body" style="padding-top:48px;padding-bottom:80px">
  <div class="admin-layout">

    <!-- Sidebar -->
    <aside class="admin-sidebar">
      <div class="admin-profile">
        <div class="admin-avatar"><?= htmlspecialchars(mb_strtoupper(mb_substr($user['username'], 0, 1))) ?></div>
        <div>
          <div class="admin-username"><?= htmlspecialchars($user['username']) ?></div>
          <?php if ($user['role'] === 'ADMIN'): ?>
            <span class="nav-badge-admin">admin</span>
          <?php endif; ?>
        </div>
      </div>

      <nav class="admin-nav" aria-label="Administrace">
        <a href="/konfigurator.php" class="admin-nav-link">
          <span class="admin-nav-icon">＋</span>
          Přidat kvazivětu
        </a>
        <a href="/moje-vety.php" class="admin-nav-link">
          <span class="admin-nav-icon">☰</span>
          Seznam mých vět
        </a>
      </nav>
    </aside>

    <!-- Content -->
    <section class="admin-content">
      <div class="page-header" style="margin-bottom:32px">
        <span class="section-tag">Administrace</span>
        <h1>Vítej, <em><?= htmlspecialchars($user['username']) ?></em></h1>
        <p>Zde najdeš přehled svých soutěžních přihlášek a přístup ke konfigurátoru.</p>
      </div>

      <div class="admin-cards">
        <a href="/konfigurator.php" class="admin-action-card">
          <div class="admin-action-icon">＋</div>
          <h3>Přidat kvazivětu</h3>
          <p>Sestav a odešli novou soutěžní větu přes konfigurátor.</p>
        </a>
        <a href="/moje-vety.php" class="admin-action-card">
          <div class="admin-action-icon">☰</div>
          <h3>Moje věty</h3>
          <p>Přehled vět, které jsi odeslal, včetně jejich stavu posouzení.</p>
        </a>
      </div>
    </section>

  </div>
</main>

<?php include __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
