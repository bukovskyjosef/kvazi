<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
auth_session_start();

$user = auth_user();
if ($user === null) {
    header('Location: /login.php?return=/moje-vety.php');
    exit;
}

// Load user's sentences: latest revision per sentence, with authoritative scores
// from validation_result and latest admin decision from administrative_decision.
$submissions = [];
try {
    $db   = kvazi_db();
    $stmt = $db->prepare(
        'SELECT s.id,
                sr.id           AS revision_id,
                sr.revision_no,
                sr.rules_version,
                sr.draft_json,
                sr.created_at   AS submitted_at,
                vr.word_score,
                vr.char_score,
                (SELECT action
                   FROM kvazi.administrative_decision
                  WHERE sentence_id = s.id
                  ORDER BY decided_at DESC
                  LIMIT 1
                ) AS latest_action
           FROM kvazi.sentence s
           JOIN kvazi.sentence_revision sr
             ON sr.sentence_id = s.id
            AND sr.revision_no = (
                    SELECT MAX(r2.revision_no)
                      FROM kvazi.sentence_revision r2
                     WHERE r2.sentence_id = s.id
                )
           LEFT JOIN kvazi.validation_result vr
             ON vr.revision_id = sr.id
            AND vr.sentence_id = s.id
          WHERE s.user_id = :uid
          ORDER BY sr.created_at DESC'
    );
    $stmt->execute([':uid' => $user['id']]);
    $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Throwable) {
    $submissions = [];
}

// Map administrative_decision.action → display label and badge class.
// NULL action = no decision yet = pending.
$statusLabel = [
    null       => ['label' => 'Čeká na posouzení', 'class' => 'badge-amber'],
    'approve'  => ['label' => 'Schváleno',          'class' => 'badge-green'],
    'reject'   => ['label' => 'Zamítnuto',          'class' => 'badge-red'],
    'return'   => ['label' => 'Vráceno k úpravě',   'class' => 'badge-amber'],
    'archive'  => ['label' => 'Archivováno',         'class' => 'badge-muted'],
];

function sentenceSurface(array $draft): string {
    $tokens = $draft['tokens'] ?? [];
    $words  = array_map(fn($t) => $t['surface'] ?? '', $tokens);
    if (empty($words)) return '—';
    $text = implode(' ', $words);
    $punct = ['declarative' => '.', 'interrogative' => '?', 'imperative' => '!'];
    $type  = $draft['closingPunct'] ?? ($punct[$draft['sentenceType'] ?? ''] ?? '');
    return mb_strtoupper(mb_substr($text, 0, 1)) . mb_substr($text, 1) . $type;
}

$activePage = '';
?>
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Moje věty — Nejdelší kvazivěta</title>
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
          <span class="admin-nav-icon">＋</span>Přidat kvazivětu
        </a>
        <a href="/moje-vety.php" class="admin-nav-link active">
          <span class="admin-nav-icon">☰</span>Seznam mých vět
        </a>
      </nav>
    </aside>

    <!-- Content -->
    <section class="admin-content">
      <div class="page-header" style="margin-bottom:32px">
        <span class="section-tag">Moje přihlášky</span>
        <h1>Moje <em>věty</em></h1>
        <p>Přehled všech tvých odeslaných soutěžních přihlášek.</p>
      </div>

      <?php if (empty($submissions)): ?>
        <div class="card-site">
          <div class="card-site-header">Zatím žádné přihlášky</div>
          <div class="card-site-body" style="color:var(--text-muted);font-size:13px">
            <p>Ještě jsi neodeslal žádnou kvazivětu. Začni v konfigurátoru.</p>
            <p style="margin-top:12px"><a href="/konfigurator.php" class="btn btn-accent">Přidat kvazivětu →</a></p>
          </div>
        </div>
      <?php else: ?>
        <div class="submission-list">
          <?php foreach ($submissions as $sub):
            $draft   = json_decode($sub['draft_json'], true) ?? [];
            $surface = sentenceSurface($draft);
            $words   = (int)($sub['word_score'] ?? count($draft['tokens'] ?? []));
            $chars   = (int)($sub['char_score'] ?? 0);
            $action  = $sub['latest_action'] ?? null;
            $st      = $statusLabel[$action] ?? ['label' => (string)$action, 'class' => 'badge-muted'];
            $date    = (new DateTimeImmutable($sub['submitted_at']))->format('j. n. Y H:i');
            $revNo   = (int)$sub['revision_no'];
          ?>
            <div class="submission-card">
              <div class="submission-head">
                <span class="submission-id">#<?= (int)$sub['id'] ?></span>
                <?php if ($revNo > 1): ?>
                  <span class="badge badge-muted" title="Revize <?= $revNo ?>">rev.<?= $revNo ?></span>
                <?php endif; ?>
                <span class="badge <?= $st['class'] ?>"><?= htmlspecialchars($st['label']) ?></span>
                <span class="submission-date"><?= $date ?></span>
              </div>
              <div class="submission-surface"><?= htmlspecialchars($surface) ?></div>
              <div class="submission-meta">
                <?= $words ?> slov &middot; <?= $chars ?> znaků &middot; schéma <?= htmlspecialchars($sub['rules_version']) ?>
              </div>
              <?php if ($action === 'return'): ?>
                <div style="margin-top:8px">
                  <a href="/konfigurator.php?sentenceId=<?= (int)$sub['id'] ?>"
                     class="btn btn-accent" style="font-size:13px">
                    Upravit a znovu odeslat
                  </a>
                </div>
              <?php endif; ?>
            </div>
          <?php endforeach; ?>
        </div>
        <p style="margin-top:20px;text-align:right">
          <a href="/konfigurator.php" class="btn btn-accent">+ Přidat další větu</a>
        </p>
      <?php endif; ?>
    </section>

  </div>
</main>

<?php include __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
