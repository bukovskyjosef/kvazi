<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
auth_session_start();
$activePage = 'vety';

// Placeholder — v produkci načíst z DB podle $_GET['id']
$id = (int)($_GET['id'] ?? 1);

$sentence = [
    'id'      => $id,
    'text'    => 'Kvazi kvazí kvazíků kvaz.',
    'author'  => 'Anonymní',
    'words'   => 4,
    'chars'   => 23,
    'status'  => 'schváleno',
    'date'    => '2025-11-07',
    'tokens'  => [
        ['surface' => 'Kvazi',    'pos' => 'noun',        'role' => 'subject',    'case' => '1', 'number' => 'sg'],
        ['surface' => 'kvazí',    'pos' => 'verb',        'role' => 'predicate',  'case' => null, 'number' => 'sg'],
        ['surface' => 'kvazíků',  'pos' => 'noun',        'role' => 'object',     'case' => '2', 'number' => 'pl'],
        ['surface' => 'kvaz',     'pos' => 'adjective',   'role' => 'attribute',  'case' => '2', 'number' => 'pl'],
    ],
];

$posLabels  = ['noun' => 'Substantivum', 'verb' => 'Verbum', 'adjective' => 'Adjektivum', 'pronoun' => 'Pronomen', 'preposition' => 'Prepozice', 'conjunction' => 'Konjunkce'];
$roleLabels = ['subject' => 'Podmět', 'predicate' => 'Přísudek', 'object' => 'Předmět', 'attribute' => 'Přívlastek', 'adverbial' => 'Příslovečné určení'];
$caseLabels = ['1' => 'Nominativ', '2' => 'Genitiv', '3' => 'Dativ', '4' => 'Akuzativ', '5' => 'Vokativ', '6' => 'Lokál', '7' => 'Instrumentál'];
?>
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Detail věty #<?= $sentence['id'] ?> — Nejdelší kvazivěta</title>
  <link rel="stylesheet" href="/css/site.css">
</head>
<body>

<?php include __DIR__ . '/includes/nav.php'; ?>

<main class="container page-body">

  <div style="margin-bottom:20px">
    <a href="/vety.php" style="font-size:13px;color:var(--text-muted);text-decoration:none;display:inline-flex;align-items:center;gap:5px">
      ← Zpět na přehled
    </a>
  </div>

  <div class="page-header" style="padding-top:20px">
    <span class="section-tag">Věta #<?= $sentence['id'] ?></span>
    <h1 style="font-size:clamp(1.4rem,3vw,2rem)">Detail přihlášky</h1>
  </div>

  <!-- Věta -->
  <div class="sentence-display">
    <?= htmlspecialchars($sentence['text']) ?>
  </div>

  <!-- Meta stats -->
  <div class="meta-grid">
    <div class="meta-item">
      <div class="meta-item-label">Počet slov</div>
      <div class="meta-item-value"><?= $sentence['words'] ?></div>
    </div>
    <div class="meta-item">
      <div class="meta-item-label">Počet znaků</div>
      <div class="meta-item-value"><?= $sentence['chars'] ?></div>
    </div>
    <div class="meta-item">
      <div class="meta-item-label">Autor</div>
      <div class="meta-item-value" style="font-size:15px"><?= htmlspecialchars($sentence['author']) ?></div>
    </div>
    <div class="meta-item">
      <div class="meta-item-label">Stav</div>
      <div class="meta-item-value" style="font-size:14px">
        <span class="badge <?= $sentence['status'] === 'schváleno' ? 'badge-green' : 'badge-amber' ?>" style="font-size:13px;padding:4px 14px">
          <?= htmlspecialchars($sentence['status']) ?>
        </span>
      </div>
    </div>
    <div class="meta-item">
      <div class="meta-item-label">Datum podání</div>
      <div class="meta-item-value" style="font-size:15px"><?= $sentence['date'] ?></div>
    </div>
  </div>

  <!-- Morfologická tabulka -->
  <div class="card-site" style="margin-bottom:28px">
    <div class="card-site-header">Morfologická deklarace</div>
    <div class="card-site-body" style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr>
            <?php foreach (['Slovo', 'Slovní druh', 'Větná funkce', 'Pád', 'Číslo'] as $h): ?>
              <th style="padding:8px 14px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--accent);border-bottom:1px solid rgba(255,255,255,.08);white-space:nowrap"><?= $h ?></th>
            <?php endforeach; ?>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($sentence['tokens'] as $t): ?>
            <tr style="border-bottom:1px solid rgba(255,255,255,.05)">
              <td style="padding:10px 14px;font-family:'Georgia',serif;font-size:15px;font-weight:600;color:var(--text)"><?= htmlspecialchars($t['surface']) ?></td>
              <td style="padding:10px 14px;color:var(--text-muted)"><?= $posLabels[$t['pos']] ?? $t['pos'] ?></td>
              <td style="padding:10px 14px;color:var(--text-muted)"><?= $roleLabels[$t['role']] ?? $t['role'] ?></td>
              <td style="padding:10px 14px;color:var(--text-muted)"><?= $t['case'] ? ($caseLabels[$t['case']] ?? $t['case']) : '—' ?></td>
              <td style="padding:10px 14px;color:var(--text-muted)"><?= $t['number'] === 'sg' ? 'Singulár' : ($t['number'] === 'pl' ? 'Plurál' : '—') ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>

  <p class="alert alert-warning">
    Tato stránka zobrazuje ukázková data (placeholder). Skutečné záznamy budou načítány z databáze po propojení backendu.
  </p>

</main>

<?php include __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
