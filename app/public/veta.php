<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/workflow-view.php';
auth_session_start();
try { $row = kvazi_submission(kvazi_db(), kvazi_revision_id(), null, true); }
catch (Throwable $e) { kvazi_page_failure($e); }
kvazi_page_start('Schválená věta', 'vety');
kvazi_submission_summary($row);
echo '<p>Schváleno: ' . kvazi_html($row['decided_at']) . '</p><section><h2>Jazykový rozbor</h2>';
foreach ($row['draft']['tokens'] as $token) {
    echo '<article class="card-site"><div class="card-site-body"><h3>' . kvazi_html($token['surface']) . '</h3>';
    kvazi_declaration(kvazi_public_token($token, $row['draft']['tokens']));
    echo '</div></article>';
}
echo '</section><p><a href="/vety.php">Schválené věty →</a></p>';
kvazi_page_end();
