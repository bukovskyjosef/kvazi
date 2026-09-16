<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/workflow-view.php';
auth_session_start();
auth_require('/moje-vety.php');
header('Cache-Control: no-store');
try {
    $db = kvazi_db();
    $q = $db->prepare('SELECT r.id FROM kvazi.sentence_revision r JOIN kvazi.sentence s ON s.id=r.sentence_id
        WHERE s.user_id=:owner ORDER BY s.id DESC, r.revision_no DESC');
    $q->execute([':owner' => auth_user()['id']]);
    $rows = array_map(fn($id) => kvazi_submission($db, (int)$id, (int)auth_user()['id']), $q->fetchAll(PDO::FETCH_COLUMN));
} catch (Throwable $e) { kvazi_page_failure($e); }
kvazi_page_start('Moje věty', 'moje');
if (!$rows) echo '<p>Zatím žádné přihlášky. Začni v konfigurátoru.</p>';
$seen = [];
foreach ($rows as $row) {
    $latest = !isset($seen[$row['sentence_id']]);
    $seen[$row['sentence_id']] = true;
    echo '<article class="card-site" data-revision-id="' . (int)$row['revision_id'] . '"><div class="card-site-body">';
    if ($latest) echo '<h2>Nejnovější revize věty #' . (int)$row['sentence_id'] . '</h2>';
    kvazi_submission_summary($row);
    echo '<a href="/moje-veta.php?revisionId=' . (int)$row['revision_id'] . '">Detail revize →</a>';
    if ($latest && $row['action'] === 'return') echo '<p><a class="btn btn-accent" href="/konfigurator.php?sentenceId=' . (int)$row['sentence_id'] . '">Upravit a znovu odeslat</a></p>';
    echo '</div></article>';
}
echo '<p><a href="/konfigurator.php" class="btn btn-accent">Přidat kvazivětu</a></p>';
kvazi_page_end();
