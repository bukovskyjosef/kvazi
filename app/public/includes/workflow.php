<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/review-services.php';

function kvazi_html(mixed $value): string {
    return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function kvazi_revision_id(): int {
    $id = $_GET['revisionId'] ?? '';
    if (!is_string($id) || !ctype_digit($id) || (int)$id < 1) throw new KvaziReviewNotFound('Revize nebyla nalezena.');
    return (int)$id;
}

function kvazi_page_failure(Throwable $e): never {
    $status = $e instanceof KvaziReviewNotFound ? 404 : ($e instanceof KvaziReviewConflict ? 409 : 503);
    http_response_code($status);
    header('Content-Type: text/html; charset=UTF-8');
    $message = match ($status) {
        404 => 'Revize nebyla nalezena.',
        409 => $e->getMessage(),
        default => 'Podání se nyní nepodařilo načíst.',
    };
    echo '<!DOCTYPE html><html lang="cs"><meta charset="UTF-8"><title>Podání není dostupné</title><p>' . kvazi_html($message) . '</p></html>';
    exit;
}

/** The MVP submit creates exactly one result. No automatic revalidation selection. */
function kvazi_submission(PDO $db, int $revisionId, ?int $owner = null, bool $public = false): array {
    $sql = 'SELECT r.id AS revision_id, r.sentence_id, r.revision_no, r.rules_version AS submitted_rules,
        r.draft_json, r.created_at AS submitted_at, s.user_id, u.username,
        a.action, a.reason, a.decided_at
        FROM kvazi.sentence_revision r JOIN kvazi.sentence s ON s.id=r.sentence_id
        JOIN kvazi.user_account u ON u.id=s.user_id
        LEFT JOIN kvazi.administrative_decision a ON a.revision_id=r.id WHERE r.id=:id';
    if ($owner !== null) $sql .= ' AND s.user_id=:owner';
    if ($public) $sql .= " AND a.action='approve'";
    $q = $db->prepare($sql);
    $q->execute([':id' => $revisionId] + ($owner !== null ? [':owner' => $owner] : []));
    $row = $q->fetch();
    if (!$row) throw new KvaziReviewNotFound('Revize nebyla nalezena.');
    $q = $db->prepare('SELECT id AS validation_result_id, rules_version, validator_version, word_score, char_score,
        is_valid, result_json FROM kvazi.validation_result WHERE revision_id=:id');
    $q->execute([':id' => $revisionId]);
    $results = $q->fetchAll();
    if (count($results) !== 1 || $results[0]['rules_version'] !== $row['submitted_rules']) {
        throw new KvaziReviewConflict('Nelze jednoznačně určit autoritativní výsledek revize.');
    }
    $row += $results[0];
    $row['draft'] = json_decode($row['draft_json'], true, 512, JSON_THROW_ON_ERROR);
    $row['validation'] = json_decode($row['result_json'], true, 512, JSON_THROW_ON_ERROR);
    $row['text'] = kvazi_sentence_text($row['draft']);
    return $row;
}

function kvazi_sentence_text(array $draft): string {
    $text = implode(' ', array_map(fn($t) => $t['surface'] ?? '', $draft['tokens'] ?? []));
    $text = Normalizer::normalize($text, Normalizer::FORM_C);
    $punctuation = ['declarative' => '.', 'interrogative' => '?', 'imperative' => '!'];
    return mb_strtoupper(mb_substr($text, 0, 1)) . mb_substr($text, 1) . ($punctuation[$draft['sentenceType'] ?? ''] ?? '');
}

function kvazi_revision_history(PDO $db, int $sentenceId): array {
    $q = $db->prepare('SELECT r.id AS revision_id, r.revision_no, a.action FROM kvazi.sentence_revision r
        LEFT JOIN kvazi.administrative_decision a ON a.revision_id=r.id WHERE r.sentence_id=:id ORDER BY r.revision_no DESC');
    $q->execute([':id' => $sentenceId]);
    return $q->fetchAll();
}

function kvazi_status(?string $action): string {
    return match ($action) { 'approve' => 'approved — Schváleno', 'return' => 'returned — Vráceno k přepracování',
        'reject' => 'rejected — Zamítnuto', default => 'pending — Čeká na posouzení' };
}

/** ADMIN-only exact lexical projection; optionally locks existing entries for approval. */
function kvazi_catalog_peek(PDO $db, array $key, bool $lock = false): ?array {
    $q = $db->prepare('SELECT id, is_approved, reason, source, admin_id, updated_at FROM kvazi.real_word_catalog
        WHERE identity_json=CAST(:identity AS jsonb) AND form_json=CAST(:form AS jsonb) AND surface_form=:surface' . ($lock ? ' FOR SHARE' : ''));
    $q->execute(kvazi_review_key_params($key));
    return $q->fetch() ?: null;
}

function kvazi_lexical_expected(array $token, array $reviewKey): bool {
    return $token['pos'] === 'pronoun' || !empty($reviewKey['identity_json']['kvaziPrefix']) || $token['lexicalStatus'] === 'real';
}

/** GET projection is deliberately separate from write-producing M2 preconditions. */
function kvazi_review_peek(PDO $db, string $appRoot, array $submission): array {
    $nd = kvazi_review_data($db, $appRoot, $submission);
    $service = new KvaziMorphologyReview($db, $appRoot);
    $tokens = []; $morphologyBlocked = 0; $lexicalBlocked = 0;
    foreach ($submission['draft']['tokens'] as $token) {
        $id = $token['id'];
        try {
            $key = kvazi_exact_key($token, $nd);
            if ($key === null) { $tokens[$id] = ['exception' => true]; continue; }
            $review = $service->peek((int)$submission['revision_id'], (int)$submission['validation_result_id'], $id);
            $effective = $review['usedDecisionId'] !== null ? $review['usedStatus'] : $review['status'];
            if ($effective !== 'APPROVED') $morphologyBlocked++;
            $catalogKey = kvazi_exact_key($token, $nd, true);
            $catalog = kvazi_catalog_peek($db, $catalogKey);
            $expected = kvazi_lexical_expected($token, $key);
            $resolved = $catalog !== null && $catalog['is_approved'] === $expected;
            if (!$resolved) $lexicalBlocked++;
            $tokens[$id] = ['exception' => false, 'review' => $review, 'catalogKey' => $catalogKey,
                'catalog' => $catalog, 'expectedReal' => $expected, 'lexicallyResolved' => $resolved];
        } catch (InvalidArgumentException $e) {
            $morphologyBlocked++; $lexicalBlocked++;
            $tokens[$id] = ['error' => $token['pos'] === 'pronoun'
                ? 'Historická deklarace neobsahuje dnešní úplnou zájmennou form-signature.'
                : 'Úplný exact review klíč nelze bezpečně rekonstruovat.'];
        }
    }
    return ['tokens' => $tokens, 'morphologyBlocked' => $morphologyBlocked, 'lexicalBlocked' => $lexicalBlocked,
        'canApprove' => $submission['is_valid'] && !$morphologyBlocked && !$lexicalBlocked && $submission['action'] === null];
}

function kvazi_sentence_decide(PDO $db, string $appRoot, int $revisionId, int $resultId, string $action, string $reason, int $adminId): void {
    if (!in_array($action, ['approve', 'return', 'reject'], true)
        || ($action !== 'approve' && !preg_match('/[^\s\p{Z}]/u', $reason))) throw new InvalidArgumentException('Vrácení a zamítnutí vyžadují neprázdný důvod.');
    kvazi_review_transaction($db, function () use ($db, $appRoot, $revisionId, $resultId, $action, $reason, $adminId) {
        $submission = kvazi_submission($db, $revisionId);
        // Same parent lock as resubmit, then exact revision. M2 locks cases before results.
        $q = $db->prepare('SELECT id FROM kvazi.sentence WHERE id=:id FOR UPDATE');
        $q->execute([':id' => $submission['sentence_id']]);
        $q = $db->prepare('SELECT id FROM kvazi.sentence_revision WHERE id=:id FOR UPDATE');
        $q->execute([':id' => $revisionId]);
        $submission = kvazi_submission($db, $revisionId);
        if ((int)$submission['validation_result_id'] !== $resultId) throw new KvaziReviewNotFound('Výsledek nepatří k submit kontextu revize.');
        if ($submission['action'] !== null) throw new KvaziReviewConflict('Revize již byla rozhodnuta.');
        $history = kvazi_revision_history($db, (int)$submission['sentence_id']);
        if ((int)$history[0]['revision_id'] !== $revisionId) throw new KvaziReviewConflict('Rozhodnout lze pouze aktuální čekající revizi.');
        if ($action === 'approve') {
            if (!$submission['is_valid']) throw new InvalidArgumentException('Deterministická validace neprošla.');
            $morphology = (new KvaziMorphologyReview($db, $appRoot))->preconditions($revisionId, $resultId);
            if (!$morphology['allApproved']) throw new InvalidArgumentException('Morfologické review obsahuje UNKNOWN nebo REJECTED případy.');
            $nd = kvazi_review_data($db, $appRoot, $submission);
            $entries = [];
            foreach ($submission['draft']['tokens'] as $token) {
                $reviewKey = kvazi_exact_key($token, $nd);
                if ($reviewKey === null) continue;
                $key = kvazi_exact_key($token, $nd, true);
                $catalog = kvazi_catalog_peek($db, $key);
                if (!$catalog) throw new InvalidArgumentException('Nevyřešený lexikální katalogový případ.');
                $entries[] = ['key' => $key, 'id' => (int)$catalog['id'], 'expected' => kvazi_lexical_expected($token, $reviewKey)];
            }
            // Lock catalog rows in stable order; concurrent lexical corrections cannot
            // change the checked value before the administrative decision commits.
            usort($entries, fn($a, $b) => $a['id'] <=> $b['id']);
            foreach ($entries as $entry) {
                $catalog = kvazi_catalog_peek($db, $entry['key'], true);
                if (!$catalog || $catalog['is_approved'] !== $entry['expected']) throw new InvalidArgumentException('Lexikální stav je v konfliktu s deklarací.');
            }
        }
        $q = $db->prepare('INSERT INTO kvazi.administrative_decision(sentence_id,revision_id,admin_id,action,reason)
            VALUES (:sentence,:revision,:admin,:action,:reason)');
        $q->execute([':sentence' => $submission['sentence_id'], ':revision' => $revisionId, ':admin' => $adminId, ':action' => $action, ':reason' => $reason]);
    });
}
