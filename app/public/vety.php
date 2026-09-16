<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/workflow-view.php';
require_once __DIR__ . '/includes/validator.php';
auth_session_start();
try {
    $db = kvazi_db();
    $activeVersion = kvazi_load_validator(dirname(__DIR__))->getRulesVersion();
    $q = $db->prepare("SELECT r.id FROM kvazi.sentence_revision r
        JOIN kvazi.administrative_decision a ON a.revision_id=r.id AND a.action='approve'
        JOIN kvazi.validation_result v ON v.revision_id=r.id AND v.rules_version=r.rules_version
        ORDER BY CASE WHEN v.rules_version=:active THEN 0 ELSE 1 END, v.rules_version ASC,
        v.word_score DESC, v.char_score DESC, r.id ASC");
    $q->execute([':active' => $activeVersion]);
    $ids = $q->fetchAll(PDO::FETCH_COLUMN);
    $rows = array_map(fn($id) => kvazi_submission($db, (int)$id, null, true), $ids);
} catch (Throwable $e) { kvazi_page_failure($e); }
kvazi_page_start('Schválené věty', 'vety');
echo '<p>Pořadí uvnitř každé verze podle počtu slov a poté soutěžních znaků. Shodné skóre ve stejné verzi znamená společný rekord.</p>';
if (!$rows) echo '<p>Zatím nejsou žádné schválené věty.</p>';
$section = null;
foreach ($rows as $row) {
    if ($section !== $row['rules_version']) {
        if ($section !== null) echo '</section>';
        $section = $row['rules_version'];
        echo '<section data-rules-version="' . kvazi_html($section) . '"><h2>' . ($section === $activeVersion ? 'Aktuální žebříček' : 'Historická schválení') . ' — ' . kvazi_html($section) . '</h2>';
    }
    echo '<article class="card-site" data-revision-id="' . (int)$row['revision_id'] . '"><div class="card-site-body"><p class="sentence-text">' . kvazi_html($row['text']) . '</p><p>Autor: ' . kvazi_html($row['username']) . '</p><p>' . (int)$row['word_score'] . ' slov · ' . (int)$row['char_score'] . ' soutěžních znaků</p><p>Schváleno: ' . kvazi_html($row['decided_at']) . '</p><a href="/veta.php?revisionId=' . (int)$row['revision_id'] . '">Detail schválené revize →</a></div></article>';
}
if ($section !== null) echo '</section>';
kvazi_page_end();
