<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
auth_session_start();
$activePage = 'vety';

// Placeholder data — nahradit skutečnými daty z DB
$sentences = [
    [
        'id'     => 1,
        'text'   => 'Kvazi kvazí kvazí kvazíků.',
        'author' => 'Josef B.',
        'words'  => 4,
        'chars'  => 26,
        'status' => 'schváleno',
        'date'   => '2025-11-03',
    ],
    [
        'id'     => 2,
        'text'   => 'Kvaz i kvaz kvazíků kvazí.',
        'author' => 'Anonymní',
        'words'  => 5,
        'chars'  => 24,
        'status' => 'schváleno',
        'date'   => '2025-11-07',
    ],
    [
        'id'     => 3,
        'text'   => 'Kvazi kvazí kvazíků kvaz.',
        'author' => 'Anonymní',
        'words'  => 4,
        'chars'  => 23,
        'status' => 'čeká na posouzení',
        'date'   => '2025-11-10',
    ],
];
?>
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Schválené věty — Nejdelší kvazivěta</title>
  <link rel="stylesheet" href="/css/site.css">
</head>
<body>

<?php include __DIR__ . '/includes/nav.php'; ?>

<main class="container page-body">

  <div class="page-header">
    <span class="section-tag">Soutěžní přehled</span>
    <h1>Schválené <em>věty</em></h1>
    <p>Přehled všech odevzdaných a posouzených přihlášek, seřazených podle délky.</p>
  </div>

  <!-- Filters placeholder -->
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:28px;align-items:center">
    <button class="btn btn-ghost btn-sm" style="opacity:.5;cursor:not-allowed" disabled>Všechny</button>
    <button class="btn btn-ghost btn-sm" style="opacity:.5;cursor:not-allowed" disabled>Schválené</button>
    <button class="btn btn-ghost btn-sm" style="opacity:.5;cursor:not-allowed" disabled>Čekající</button>
    <span style="font-size:12px;color:var(--text-dim);margin-left:4px">Filtrování bude dostupné po spuštění backendu.</span>
  </div>

  <?php if (empty($sentences)): ?>
    <div class="empty-state">
      <div class="empty-state-icon">&#128203;</div>
      <h3>Zatím žádné věty</h3>
      <p>Po schválení prvních přihlášek se zobrazí zde.</p>
    </div>
  <?php else: ?>
    <div class="sentence-list">
      <?php foreach ($sentences as $i => $s): ?>
        <a class="sentence-row" href="/veta.php?id=<?= $s['id'] ?>">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap">
            <div>
              <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);margin-bottom:6px">#<?= $i + 1 ?></div>
              <div class="sentence-row-text"><?= htmlspecialchars($s['text']) ?></div>
            </div>
            <div style="flex-shrink:0;text-align:right">
              <div style="font-size:28px;font-weight:800;letter-spacing:-.04em;line-height:1;background:linear-gradient(125deg,#ffd36a 0%,#ff9a4d 55%,#ff6a3d 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text"><?= $s['words'] ?></div>
              <div style="font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.06em">slov</div>
            </div>
          </div>
          <div class="sentence-row-meta" style="margin-top:10px">
            <span><?= htmlspecialchars($s['author']) ?></span>
            <span><?= $s['chars'] ?> znaků</span>
            <span><?= $s['date'] ?></span>
            <span class="badge <?= $s['status'] === 'schváleno' ? 'badge-green' : 'badge-amber' ?>">
              <?= htmlspecialchars($s['status']) ?>
            </span>
          </div>
        </a>
      <?php endforeach; ?>
    </div>

    <p style="margin-top:28px;font-size:13px;color:var(--text-dim)">
      Data jsou zatím ukázková (placeholder). Skutečné záznamy se zobrazí po propojení s databází.
    </p>
  <?php endif; ?>

</main>

<?php include __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
