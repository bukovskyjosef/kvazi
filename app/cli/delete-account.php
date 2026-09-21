#!/usr/bin/env php
<?php
declare(strict_types=1);

/**
 * Operator CLI: delete/anonymize a user account.
 *
 * Usage (inside the PHP container):
 *   php /usr/local/bin/kvazi-cli/delete-account.php <user_id>          # preflight (read-only)
 *   php /usr/local/bin/kvazi-cli/delete-account.php <user_id> --confirm  # destructive
 *
 * Issue: #162
 */

// ── Bootstrap ────────────────────────────────────────────────────────────────

// Include auth.php for kvazi_db() and nothing else web-related.
// Resolve the app root: in Docker image /var/www/html, locally relative.
$_SERVER['REQUEST_METHOD'] = 'CLI';
$appRoot = getenv('KVAZI_APP_ROOT') ?: '/var/www/html';
require_once $appRoot . '/includes/auth.php';

// ── Argument parsing ─────────────────────────────────────────────────────────

$args = array_slice($argv, 1);
$confirm = in_array('--confirm', $args, true);
$args = array_values(array_filter($args, fn($a) => $a !== '--confirm'));

if (count($args) !== 1 || !ctype_digit($args[0]) || (int)$args[0] < 1) {
    fwrite(STDERR, "Usage: php delete-account.php <user_id> [--confirm]\n");
    exit(2);
}

$targetId = (int)$args[0];

// ── Helpers ──────────────────────────────────────────────────────────────────

function cli_abort(string $msg): never {
    fwrite(STDERR, "ABORT: $msg\n");
    exit(1);
}

// ── Preflight ────────────────────────────────────────────────────────────────

$pdo = kvazi_db();

// Load target account.
$stmt = $pdo->prepare('SELECT id, username, email, role, deleted_at, created_at FROM kvazi.user_account WHERE id = :id');
$stmt->execute([':id' => $targetId]);
$account = $stmt->fetch();

if ($account === false) {
    cli_abort("User ID $targetId not found.");
}

if ($account['deleted_at'] !== null) {
    echo "User ID $targetId is already deleted (deleted_at: {$account['deleted_at']}). No-op.\n";
    exit(0);
}

if ($account['role'] !== 'USER') {
    cli_abort("User ID $targetId has role '{$account['role']}'. Only USER accounts can be deleted.");
}

// Check admin provenance: admin_id in administrative_decision, morphology_review_decision, real_word_catalog.
$stmt = $pdo->prepare(
    "(SELECT 'administrative_decision' AS src FROM kvazi.administrative_decision WHERE admin_id = :id1 LIMIT 1)
     UNION ALL
     (SELECT 'morphology_review_decision' FROM kvazi.morphology_review_decision WHERE admin_id = :id2 LIMIT 1)
     UNION ALL
     (SELECT 'real_word_catalog' FROM kvazi.real_word_catalog WHERE admin_id = :id3 LIMIT 1)"
);
$stmt->execute([':id1' => $targetId, ':id2' => $targetId, ':id3' => $targetId]);
$provenance = $stmt->fetchAll(PDO::FETCH_COLUMN);
if ($provenance) {
    cli_abort("User ID $targetId has admin provenance in: " . implode(', ', $provenance) . ". Cannot delete.");
}

// Count revisions: approved vs non-approved.
$stmt = $pdo->prepare(
    "SELECT sr.id AS revision_id, s.id AS sentence_id,
            COALESCE(ad.action, 'pending') AS status
       FROM kvazi.sentence_revision sr
       JOIN kvazi.sentence s ON s.id = sr.sentence_id AND s.user_id = :uid
       LEFT JOIN kvazi.administrative_decision ad ON ad.revision_id = sr.id"
);
$stmt->execute([':uid' => $targetId]);
$revisions = $stmt->fetchAll();

$approved = array_filter($revisions, fn($r) => $r['status'] === 'approve');
$nonApproved = array_filter($revisions, fn($r) => $r['status'] !== 'approve');
$tokenCount = (int)$pdo->prepare('SELECT count(*) FROM kvazi.auth_token WHERE user_id = :uid')
    ->execute([':uid' => $targetId]) ? (int)$pdo->query("SELECT count(*) FROM kvazi.auth_token WHERE user_id = $targetId")->fetchColumn() : 0;

$maskedEmail = substr($account['email'], 0, 3) . '***';
echo "=== Preflight for user ID $targetId ===\n";
echo "Username:       {$account['username']}\n";
echo "Contact:        $maskedEmail\n";
echo "Role:           {$account['role']}\n";
echo "Created:        {$account['created_at']}\n";
echo "Total revisions: " . count($revisions) . "\n";
echo "  Approved:      " . count($approved) . "\n";
echo "  Non-approved:  " . count($nonApproved) . "\n";
echo "Auth tokens:    $tokenCount\n";
echo "Outcome:        " . (count($approved) > 0 ? 'TOMBSTONE (approved history retained)' : 'FULL DELETE') . "\n";

if (!$confirm) {
    echo "\nDry run complete. Add --confirm to execute.\n";
    exit(0);
}

// ── Destructive execution ────────────────────────────────────────────────────

echo "\n=== Executing account deletion ===\n";

$pdo->beginTransaction();
try {
    // Lock the target account row.
    $pdo->prepare('SELECT id FROM kvazi.user_account WHERE id = :id FOR UPDATE')
        ->execute([':id' => $targetId]);

    // Re-verify preconditions under lock.
    $stmt = $pdo->prepare('SELECT role, deleted_at FROM kvazi.user_account WHERE id = :id');
    $stmt->execute([':id' => $targetId]);
    $locked = $stmt->fetch();
    if ($locked['deleted_at'] !== null) {
        $pdo->rollBack();
        echo "Already deleted under lock. No-op.\n";
        exit(0);
    }
    if ($locked['role'] !== 'USER') {
        $pdo->rollBack();
        cli_abort("Role changed under lock to '{$locked['role']}'. Aborting.");
    }

    // 1. Mark as deleted FIRST (the trigger needs this for erasure exception).
    $pdo->prepare('UPDATE kvazi.user_account SET deleted_at = now() WHERE id = :id')
        ->execute([':id' => $targetId]);
    echo "  [1] deleted_at set.\n";

    // 2. Delete all auth tokens.
    $stmt = $pdo->prepare('DELETE FROM kvazi.auth_token WHERE user_id = :uid');
    $stmt->execute([':uid' => $targetId]);
    echo "  [2] Auth tokens deleted: {$stmt->rowCount()}\n";

    // 3. Delete non-approved submission data.
    $erasedRevisions = 0;
    $erasedSentences = 0;

    // Get all sentences for this user.
    $sentences = $pdo->prepare('SELECT id FROM kvazi.sentence WHERE user_id = :uid FOR UPDATE');
    $sentences->execute([':uid' => $targetId]);
    $sentenceIds = $sentences->fetchAll(PDO::FETCH_COLUMN);

    foreach ($sentenceIds as $sentenceId) {
        // Get revisions for this sentence, classified.
        $revs = $pdo->prepare(
            "SELECT sr.id, COALESCE(ad.action, 'pending') AS status
               FROM kvazi.sentence_revision sr
               LEFT JOIN kvazi.administrative_decision ad ON ad.revision_id = sr.id
              WHERE sr.sentence_id = :sid"
        );
        $revs->execute([':sid' => $sentenceId]);
        $sentenceRevisions = $revs->fetchAll();

        $hasApproved = false;
        foreach ($sentenceRevisions as $rev) {
            if ($rev['status'] === 'approve') {
                $hasApproved = true;
                continue; // Skip approved — immutable
            }

            $revId = (int)$rev['id'];

            // Delete in FK dependency order: review bindings → result → decision → revision.
            $pdo->prepare(
                'DELETE FROM kvazi.validation_result_review WHERE validation_result_id IN
                    (SELECT id FROM kvazi.validation_result WHERE revision_id = :rid)'
            )->execute([':rid' => $revId]);

            $pdo->prepare('DELETE FROM kvazi.validation_result WHERE revision_id = :rid')
                ->execute([':rid' => $revId]);

            $pdo->prepare('DELETE FROM kvazi.administrative_decision WHERE revision_id = :rid')
                ->execute([':rid' => $revId]);

            $pdo->prepare('DELETE FROM kvazi.sentence_revision WHERE id = :rid')
                ->execute([':rid' => $revId]);

            $erasedRevisions++;
        }

        // If no approved revisions remain, delete the sentence container.
        if (!$hasApproved) {
            $pdo->prepare('DELETE FROM kvazi.sentence WHERE id = :sid')
                ->execute([':sid' => $sentenceId]);
            $erasedSentences++;
        }
    }

    echo "  [3] Erased revisions: $erasedRevisions, orphan sentences: $erasedSentences\n";

    // 4. Account identity disposition.
    $hasRetainedHistory = count($approved) > 0;

    if ($hasRetainedHistory) {
        // Tombstone: opaque random values, non-authenticatable credential.
        $opaqueSuffix = bin2hex(random_bytes(8));
        $tombstoneUsername = '_del_' . $opaqueSuffix;
        $tombstoneEmail = '_del_' . $opaqueSuffix . '@deleted.invalid';
        $tombstonePassword = password_hash(bin2hex(random_bytes(32)), PASSWORD_BCRYPT, ['cost' => 4]);

        $pdo->prepare(
            'UPDATE kvazi.user_account SET
                username = :u, email = :e, password_hash = :p,
                email_verified_at = NULL
             WHERE id = :id'
        )->execute([
            ':u' => $tombstoneUsername,
            ':e' => $tombstoneEmail,
            ':p' => $tombstonePassword,
            ':id' => $targetId,
        ]);
        echo "  [4] Account tombstoned (approved history retained).\n";
    } else {
        // No retained history: full physical delete.
        $pdo->prepare('DELETE FROM kvazi.user_account WHERE id = :id')
            ->execute([':id' => $targetId]);
        echo "  [4] Account fully deleted (no retained history).\n";
    }

    $pdo->commit();
    echo "=== DONE: user ID $targetId processed. ===\n";

} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    fwrite(STDERR, "ROLLBACK: {$e->getMessage()}\n");
    exit(1);
}
