<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/includes/workflow-view.php';
auth_session_start();
auth_require('/admin/veta.php?' . http_build_query($_GET));
auth_require_admin();
header('Cache-Control: no-store');
try {
    $db = kvazi_db();
    $db->beginTransaction();
    $db->exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
    $row = kvazi_submission($db, kvazi_revision_id());
    $review = kvazi_review_peek($db, dirname(__DIR__, 2), $row);
    $history = kvazi_revision_history($db, (int)$row['sentence_id']);
    $db->commit();
} catch (Throwable $e) { if (isset($db) && $db->inTransaction()) $db->rollBack(); kvazi_page_failure($e); }
kvazi_page_start('Posouzení revize', 'admin');
kvazi_submission_summary($row);
echo '<section><h2>Server autoritativně vyhodnotil</h2><p>Validátor: ' . kvazi_html($row['validator_version']) . '; validation result ID: ' . (int)$row['validation_result_id'] . '</p><p>Deterministická validace: ' . ($row['is_valid'] ? 'PASS' : 'INVALID') . '</p>';
kvazi_plain_json($row['validation']);
echo '</section><section><h2>Hráč deklaroval — immutable snapshot</h2>';
kvazi_declaration(array_diff_key($row['draft'], ['tokens' => true]));
foreach ($row['draft']['tokens'] as $token) {
    $state = $review['tokens'][$token['id']];
    echo '<article class="card-site token-review" data-token-id="' . kvazi_html($token['id']) . '"><div class="card-site-body"><h3>' . kvazi_html($token['surface']) . '</h3>';
    kvazi_declaration($token);
    if (isset($state['error'])) echo '<p class="notice">' . kvazi_html($state['error']) . '</p>';
    elseif ($state['exception']) echo '<p>Normativní výjimka — katalog a morfologické review nejsou vyžadovány.</p>';
    else {
        $m = $state['review'];
        echo '<h4>Interní morfologické review</h4><p class="morphology-status">' . kvazi_html($m['status']) . '</p>';
        kvazi_plain_json($m['key']);
        if ($m['decision']) kvazi_plain_json($m['decision']);
        echo '<p>Stabilní usedDecisionId: ' . kvazi_html($m['usedDecisionId'] ?? 'nenavázáno') . '; usedStatus: ' . kvazi_html($m['usedStatus']) . '</p>';
        if ($m['status'] === 'UNKNOWN' && $row['action'] === null) { ?>
          <form class="review-mutation" data-endpoint="/api/admin/morphology-review.php">
            <input type="hidden" name="tokenId" value="<?= kvazi_html($token['id']) ?>">
            <input type="hidden" name="expectedDecisionNo" value="<?= (int)$m['decisionNo'] ?>">
            <label>Důvod morfologického posouzení<textarea name="reason" maxlength="10000"></textarea></label>
            <button type="submit" name="verdict" value="APPROVED" class="btn btn-accent">Schválit morfologický případ</button>
            <button type="submit" name="verdict" value="REJECTED" class="btn btn-ghost">Zamítnout morfologický případ</button>
          </form>
        <?php }
        $c = $state['catalog'];
        echo '<h4>Lexikální katalog</h4><p class="catalog-status">' . ($c === null ? 'ABSENT' : ($c['is_approved'] ? 'is_approved=true' : 'is_approved=false')) . '</p>';
        echo '<p>Pro tuto deklaraci je potřeba is_approved=' . ($state['expectedReal'] ? 'true' : 'false') . '. ' . ($state['lexicallyResolved'] ? 'Lexikálně vyřešeno.' : 'Schválení je blokováno.') . '</p>';
        kvazi_plain_json($state['catalogKey']);
        if ($c) kvazi_plain_json($c);
        if ($row['action'] === null) { ?>
          <form class="review-mutation" data-endpoint="/api/admin/real-word-catalog.php">
            <input type="hidden" name="tokenId" value="<?= kvazi_html($token['id']) ?>">
            <label>Důvod katalogového posouzení<textarea name="reason" maxlength="10000"></textarea></label>
            <label>Zdroj / reference<input type="text" name="source" maxlength="10000"></label>
            <button type="submit" name="isApproved" value="true" class="btn btn-accent">Potvrdit skutečné slovo</button>
            <button type="submit" name="isApproved" value="false" class="btn btn-ghost">Potvrdit jako neskutečné slovo</button>
          </form>
        <?php }
    }
    echo '</div></article>';
}
echo '</section>';
kvazi_history_links($history, '/admin/veta.php');
if ($row['action'] !== null) {
    echo '<section><h2>Výsledné rozhodnutí</h2><p>' . kvazi_html(kvazi_status($row['action'])) . '</p><p class="plain-text">' . kvazi_html($row['reason']) . '</p></section>';
} else {
    echo '<section><h2>Rozhodnutí nad revizí</h2><p>' . (int)$review['morphologyBlocked'] . ' nevyřešených morfologických případů; ' . (int)$review['lexicalBlocked'] . ' nevyřešených katalogových případů.</p>';
    if (!$row['is_valid']) echo '<p>Deterministická validace neprošla.</p>'; ?>
    <form class="review-mutation" data-endpoint="/api/admin/sentence-decision.php">
      <label>Důvod pro autora (povinný pro vrácení a zamítnutí)<textarea name="reason" maxlength="10000"></textarea></label>
      <button type="submit" name="action" value="approve" class="btn btn-accent" <?= $review['canApprove'] ? '' : 'disabled' ?>>Schválit</button>
      <button type="submit" name="action" value="return" class="btn btn-ghost">Vrátit k přepracování</button>
      <button type="submit" name="action" value="reject" class="btn btn-ghost">Zamítnout</button>
    </form></section>
<?php }
?>
<p id="reviewMessage" role="status" aria-live="polite"></p>
<div id="reviewContext" data-revision-id="<?= (int)$row['revision_id'] ?>" data-result-id="<?= (int)$row['validation_result_id'] ?>"></div>
<script type="module" src="/js/admin-review.mjs"></script>
<?php kvazi_page_end(); ?>
