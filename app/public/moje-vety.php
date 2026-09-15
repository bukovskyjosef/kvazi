<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
auth_session_start();

$user = auth_user();
if ($user === null) {
    header('Location: /login.php?return=/moje-vety.php');
    exit;
}

// Load all revisions for the user's sentences, each with its per-revision admin decision.
// Ordered sentence DESC, revision DESC so the first row per sentence is the latest revision.
$rawRows = [];
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
                  WHERE revision_id = sr.id
                  ORDER BY decided_at DESC
                  LIMIT 1
                ) AS revision_action
           FROM kvazi.sentence s
           JOIN kvazi.sentence_revision sr ON sr.sentence_id = s.id
           LEFT JOIN kvazi.validation_result vr
             ON vr.revision_id = sr.id
            AND vr.sentence_id = s.id
          WHERE s.user_id = :uid
          ORDER BY s.id DESC, sr.revision_no DESC'
    );
    $stmt->execute([':uid' => $user['id']]);
    $rawRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Throwable) {
    $rawRows = [];
}

// Group revisions by sentence; first row per sentence is the latest.
$sentenceMap = [];
foreach ($rawRows as $row) {
    $sid = (int)$row['id'];
    if (!array_key_exists($sid, $sentenceMap)) $sentenceMap[$sid] = [];
    $sentenceMap[$sid][] = $row;
}
$sentences = array_values($sentenceMap);

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

      <?php if (empty($sentences)): ?>
        <div class="card-site">
          <div class="card-site-header">Zatím žádné přihlášky</div>
          <div class="card-site-body" style="color:var(--text-muted);font-size:13px">
            <p>Ještě jsi neodeslal žádnou kvazivětu. Začni v konfigurátoru.</p>
            <p style="margin-top:12px"><a href="/konfigurator.php" class="btn btn-accent">Přidat kvazivětu →</a></p>
          </div>
        </div>
      <?php else: ?>
        <div class="submission-list">
          <?php foreach ($sentences as $revisions):
            $latest  = $revisions[0]; // first row = highest revision_no (DESC order)
            $sentenceId = (int)$latest['id'];
            $latestDraft = json_decode($latest['draft_json'], true) ?? [];
            $surface = sentenceSurface($latestDraft);
            $latestAction = $latest['revision_action'] ?? null;
            $latestSt = $statusLabel[$latestAction] ?? ['label' => (string)$latestAction, 'class' => 'badge-muted'];
          ?>
            <div class="submission-card">
              <div class="submission-head">
                <span class="submission-id">#<?= $sentenceId ?></span>
                <?php if (count($revisions) > 1): ?>
                  <span class="badge badge-muted"><?= count($revisions) ?> revize</span>
                <?php endif; ?>
                <span class="badge <?= $latestSt['class'] ?>"><?= htmlspecialchars($latestSt['label']) ?></span>
              </div>
              <div class="submission-surface"><?= htmlspecialchars($surface) ?></div>

              <?php foreach ($revisions as $rev):
                $revAction = $rev['revision_action'] ?? null;
                $revSt = $statusLabel[$revAction] ?? ['label' => (string)$revAction, 'class' => 'badge-muted'];
                $words = (int)($rev['word_score'] ?? count((json_decode($rev['draft_json'], true)['tokens'] ?? [])));
                $chars = (int)($rev['char_score'] ?? 0);
                $date  = (new DateTimeImmutable($rev['submitted_at']))->format('j. n. Y H:i');
                $revNo = (int)$rev['revision_no'];
              ?>
                <div class="submission-revision" style="border-top:1px solid var(--border);margin-top:8px;padding-top:8px;font-size:12px;color:var(--text-muted)">
                  <span style="font-weight:600">Rev.<?= $revNo ?></span>
                  &middot; <?= $date ?>
                  &middot; <?= $words ?> slov &middot; <?= $chars ?> znaků
                  &middot; schéma <?= htmlspecialchars($rev['rules_version']) ?>
                  &middot; <span class="badge <?= $revSt['class'] ?>" style="font-size:11px"><?= htmlspecialchars($revSt['label']) ?></span>
                </div>
              <?php endforeach; ?>

              <?php if ($latestAction === 'return'): ?>
                <div style="margin-top:10px">
                  <a href="/konfigurator.php?sentenceId=<?= $sentenceId ?>"
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
