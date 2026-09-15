<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/includes/auth.php';
require_once dirname(__DIR__) . '/includes/validator.php';
auth_session_start();

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$user = auth_user();
if ($user === null) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Nejste přihlášeni.']);
    exit;
}

$body    = (string) file_get_contents('php://input');
$payload = json_decode($body, true);

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Neplatný formát dat.']);
    exit;
}

// CSRF token is passed in the JSON payload
if (!auth_csrf_check_value((string)($payload['csrf'] ?? ''))) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Neplatný bezpečnostní token. Obnovte stránku.']);
    exit;
}

$draft = $payload['draft'] ?? null;
if (!is_array($draft) || empty($draft['tokens']) || !is_array($draft['tokens'])) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Přihláška neobsahuje žádná slova.']);
    exit;
}

// NFC normalisation is mandatory. The intl extension (docker/php/Dockerfile) must provide
// Normalizer. A missing extension is a deployment error, not a graceful fallback case.
if (!class_exists('Normalizer')) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'Chyba konfigurace serveru: chybí Unicode normalizátor.']);
    exit;
}

// Load validator — rules_version read dynamically from active-release.json.
// Never taken from the client payload, never hardcoded.
$appRoot = dirname(dirname(__DIR__));
try {
    $validator = kvazi_load_validator($appRoot);
} catch (Throwable $e) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'Chyba konfigurace serveru: nelze načíst validátor.']);
    exit;
}
$rulesVersion     = $validator->getRulesVersion();
$validatorVersion = $validator->getValidatorVersion();

// Full deterministic validation — backend re-evaluates independently of the client.
// sentence_revision must not be created until all deterministically decidable blockers pass.
try {
    $valResult = $validator->deriveValidationState($draft);
} catch (Throwable $e) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Validace selhala: ' . $e->getMessage()]);
    exit;
}

if (!$valResult['submitReady']) {
    http_response_code(422);
    echo json_encode([
        'ok'         => false,
        'error'      => 'Přihláška nesplňuje všechna normativní kritéria.',
        'validation' => $valResult,
    ]);
    exit;
}

// Optional: resubmit path — sentence_id provided = revise an existing sentence
// that was returned to the author by admin.
$incomingSentenceId = isset($payload['sentenceId']) ? (int)$payload['sentenceId'] : null;

try {
    $db = kvazi_db();
    $db->beginTransaction();

    if ($incomingSentenceId !== null) {
        // ── Resubmit: create revision N+1 for an existing returned sentence ──

        // Verify the sentence belongs to this user
        $chk = $db->prepare(
            'SELECT id FROM kvazi.sentence WHERE id = :sid AND user_id = :uid'
        );
        $chk->execute([':sid' => $incomingSentenceId, ':uid' => $user['id']]);
        if (!$chk->fetchColumn()) {
            $db->rollBack();
            http_response_code(403);
            echo json_encode(['ok' => false, 'error' => 'Věta nebyla nalezena nebo k ní nemáte přístup.']);
            exit;
        }

        // Latest admin decision must be 'return'
        $adChk = $db->prepare(
            'SELECT action FROM kvazi.administrative_decision
              WHERE sentence_id = :sid
              ORDER BY decided_at DESC LIMIT 1'
        );
        $adChk->execute([':sid' => $incomingSentenceId]);
        $latestAction = $adChk->fetchColumn();
        if ($latestAction !== 'return') {
            $db->rollBack();
            http_response_code(409);
            echo json_encode(['ok' => false, 'error' => 'Větu lze znovu odeslat pouze tehdy, byla-li vrácena k úpravě.']);
            exit;
        }

        // Determine next revision number
        $revNoStmt = $db->prepare(
            'SELECT MAX(revision_no) FROM kvazi.sentence_revision WHERE sentence_id = :sid'
        );
        $revNoStmt->execute([':sid' => $incomingSentenceId]);
        $nextRevNo  = (int)$revNoStmt->fetchColumn() + 1;
        $sentenceId = $incomingSentenceId;
    } else {
        // ── First submit: create a new sentence container ──
        $ins = $db->prepare('INSERT INTO kvazi.sentence (user_id) VALUES (:uid) RETURNING id');
        $ins->execute([':uid' => $user['id']]);
        $sentenceId = (int)$ins->fetchColumn();
        $nextRevNo  = 1;
    }

    // Create immutable revision snapshot
    $stmt = $db->prepare(
        'INSERT INTO kvazi.sentence_revision
             (sentence_id, revision_no, rules_version, submitted_by, draft_json)
         VALUES (:sid, :rno, :rv, :sub, :dj)
         RETURNING id, created_at'
    );
    $stmt->execute([
        ':sid' => $sentenceId,
        ':rno' => $nextRevNo,
        ':rv'  => $rulesVersion,
        ':sub' => $user['id'],
        ':dj'  => json_encode($draft, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
    ]);
    $revision   = $stmt->fetch(PDO::FETCH_ASSOC);
    $revisionId = (int)$revision['id'];

    // Store authoritative validation result (authoritative scores live here)
    $stmt = $db->prepare(
        'INSERT INTO kvazi.validation_result
             (sentence_id, revision_id, rules_version, validator_version,
              word_score, char_score, is_valid, result_json)
         VALUES (:sid, :rid, :rv, :vv, :ws, :cs, TRUE, :rj)'
    );
    $stmt->execute([
        ':sid' => $sentenceId,
        ':rid' => $revisionId,
        ':rv'  => $rulesVersion,
        ':vv'  => $validatorVersion,
        ':ws'  => $valResult['wordCount'],
        ':cs'  => $valResult['charScore'],
        ':rj'  => json_encode($valResult, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
    ]);

    // Create process compliance record (ai_policy_compliant = NULL until admin review)
    $stmt = $db->prepare(
        'INSERT INTO kvazi.process_compliance
             (sentence_id, revision_id, rules_version_at_submit)
         VALUES (:sid, :rid, :rv)'
    );
    $stmt->execute([
        ':sid' => $sentenceId,
        ':rid' => $revisionId,
        ':rv'  => $rulesVersion,
    ]);

    $db->commit();
    echo json_encode([
        'ok'          => true,
        'id'          => $sentenceId,
        'revisionId'  => $revisionId,
        'revisionNo'  => $nextRevNo,
        'submittedAt' => $revision['created_at'],
        'wordScore'   => $valResult['wordCount'],
        'charScore'   => $valResult['charScore'],
    ]);
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Chyba při ukládání přihlášky. Zkuste znovu.']);
}
