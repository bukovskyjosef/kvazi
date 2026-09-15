<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/includes/auth.php';
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

$rulesVersion = is_string($payload['schema'] ?? null)
    ? substr($payload['schema'], 0, 80)
    : 'configurator-structural-prototype-1';

try {
    $db   = kvazi_db();
    $stmt = $db->prepare(
        'INSERT INTO kvazi.submission (user_id, rules_version, draft_json)
         VALUES (:uid, :rv, :dj)
         RETURNING id, submitted_at'
    );
    $stmt->execute([
        ':uid' => $user['id'],
        ':rv'  => $rulesVersion,
        ':dj'  => json_encode($draft, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
    ]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(['ok' => true, 'id' => (int)$row['id'], 'submittedAt' => $row['submitted_at']]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Chyba při ukládání přihlášky. Zkuste znovu.']);
}
