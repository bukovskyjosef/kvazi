<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/includes/auth.php';
auth_session_start();

header('Content-Type: application/json; charset=utf-8');

// Server-side rules version — never taken from the client payload.
const RULES_VERSION = 'public-1';

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

// Basic structural validation + NFC normalisation of each surface.
// Allowed surface characters: K V Q A Á Z I Í Y Ý (case-insensitive, Unicode).
foreach ($draft['tokens'] as &$token) {
    if (!is_array($token) || !isset($token['surface']) || !is_string($token['surface'])) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => 'Každé slovo musí mít řetězcový povrchový tvar (surface).']);
        exit;
    }
    $surface = class_exists('Normalizer')
        ? \Normalizer::normalize($token['surface'], \Normalizer::FORM_C)
        : $token['surface'];
    if ($surface === false || $surface === '') {
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => 'Povrchový tvar nesmí být prázdný.']);
        exit;
    }
    if (!preg_match('/^[KVQAÁZIÍYÝ]+$/iu', $surface)) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => 'Povrchový tvar obsahuje nepovolené znaky.']);
        exit;
    }
    $token['surface'] = $surface;
}
unset($token);

try {
    $db = kvazi_db();
    $db->beginTransaction();

    // 1. Create long-lived sentence container
    $stmt = $db->prepare('INSERT INTO kvazi.sentence (user_id) VALUES (:uid) RETURNING id');
    $stmt->execute([':uid' => $user['id']]);
    $sentenceId = (int)$stmt->fetchColumn();

    // 2. Create immutable revision snapshot
    $stmt = $db->prepare(
        'INSERT INTO kvazi.sentence_revision (sentence_id, rules_version, draft_json)
         VALUES (:sid, :rv, :dj)
         RETURNING id, created_at'
    );
    $stmt->execute([
        ':sid' => $sentenceId,
        ':rv'  => RULES_VERSION,
        ':dj'  => json_encode($draft, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
    ]);
    $revision = $stmt->fetch(PDO::FETCH_ASSOC);

    // 3. Create mutable process row (tracks review status for the active revision)
    $stmt = $db->prepare(
        'INSERT INTO kvazi.sentence_process (sentence_id, revision_id)
         VALUES (:sid, :rid)'
    );
    $stmt->execute([':sid' => $sentenceId, ':rid' => (int)$revision['id']]);

    $db->commit();
    echo json_encode(['ok' => true, 'id' => $sentenceId, 'submittedAt' => $revision['created_at']]);
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Chyba při ukládání přihlášky. Zkuste znovu.']);
}
