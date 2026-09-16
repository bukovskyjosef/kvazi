<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/includes/workflow-view.php';
auth_session_start();
auth_require('/admin/vety.php');
auth_require_admin();
header('Cache-Control: no-store');
try {
    $db = kvazi_db();
    $db->beginTransaction();
    $db->exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
    $ids = $db->query('SELECT r.id FROM kvazi.sentence_revision r
        WHERE NOT EXISTS (SELECT 1 FROM kvazi.sentence_revision n WHERE n.sentence_id=r.sentence_id AND n.revision_no>r.revision_no)
        AND NOT EXISTS (SELECT 1 FROM kvazi.administrative_decision a WHERE a.revision_id=r.id)
        AND EXISTS (SELECT 1 FROM kvazi.validation_result v WHERE v.revision_id=r.id AND v.rules_version=r.rules_version)
        ORDER BY r.created_at ASC, r.id ASC')->fetchAll(PDO::FETCH_COLUMN);
    $rows = [];
    foreach ($ids as $id) {
        $row = kvazi_submission($db, (int)$id);
        $row['review'] = kvazi_review_peek($db, dirname(__DIR__, 2), $row);
        $rows[] = $row;
    }
    $db->commit();
} catch (Throwable $e) { if (isset($db) && $db->inTransaction()) $db->rollBack(); kvazi_page_failure($e); }
kvazi_page_start('Ke schválení', 'admin');
if (!$rows) echo '<p>Žádné revize nečekají na posouzení.</p>';
foreach ($rows as $row) {
    echo '<article class="card-site" data-revision-id="' . (int)$row['revision_id'] . '"><div class="card-site-body">';
    kvazi_submission_summary($row);
    echo '<p>Deterministická validace: ' . ($row['is_valid'] ? 'PASS' : 'INVALID') . '</p><p>' . (int)$row['review']['morphologyBlocked'] . ' nevyřešených morfologických případů; ' . (int)$row['review']['lexicalBlocked'] . ' nevyřešených katalogových případů.</p>';
    echo '<a href="/admin/veta.php?revisionId=' . (int)$row['revision_id'] . '">Otevřít přesnou revizi →</a></div></article>';
}
kvazi_page_end();
