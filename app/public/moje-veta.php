<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/workflow-view.php';
auth_session_start();
auth_require('/moje-veta.php?' . http_build_query($_GET));
header('Cache-Control: no-store');
try {
    $db = kvazi_db();
    $row = kvazi_submission($db, kvazi_revision_id(), (int)auth_user()['id']);
    $history = kvazi_revision_history($db, (int)$row['sentence_id']);
} catch (Throwable $e) { kvazi_page_failure($e); }
kvazi_page_start('Detail mého podání', 'moje');
kvazi_submission_summary($row);
if (in_array($row['action'], ['return', 'reject'], true)) {
    echo '<section><h2>Důvod administrátora</h2><p class="plain-text admin-reason">' . kvazi_html($row['reason']) . '</p></section>';
}
echo '<section><h2>Moje odevzdaná deklarace — pouze ke čtení</h2>';
kvazi_declaration(array_diff_key($row['draft'], ['tokens' => true]));
foreach ($row['draft']['tokens'] as $token) {
    echo '<article class="card-site"><div class="card-site-body"><h3>' . kvazi_html($token['surface']) . '</h3>';
    kvazi_declaration($token);
    echo '</div></article>';
}
echo '</section>';
if ($row['action'] === 'return' && (int)$history[0]['revision_id'] === (int)$row['revision_id']) {
    echo '<a class="btn btn-accent" href="/konfigurator.php?sentenceId=' . (int)$row['sentence_id'] . '">Upravit a znovu odeslat</a>';
}
kvazi_history_links($history, '/moje-veta.php');
echo '<p><a href="/moje-vety.php">Moje věty →</a></p>';
kvazi_page_end();
