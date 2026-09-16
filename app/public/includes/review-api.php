<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/validator.php';
require_once __DIR__ . '/review-services.php';

function kvazi_review_api_request(bool $admin, array $fields): array {
    auth_session_start();
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') kvazi_review_api_error(405, 'Method not allowed');
    if (auth_user() === null) kvazi_review_api_error(401, 'Nejste přihlášeni.');
    if ($admin) auth_require_admin();
    try { $payload = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR); }
    catch (JsonException) { kvazi_review_api_error(400, 'Neplatný formát dat.'); }
    if (!is_array($payload) || array_is_list($payload)) kvazi_review_api_error(400, 'Neplatný formát dat.');
    if (!is_string($payload['csrf'] ?? null) || !auth_csrf_check_value($payload['csrf'])) kvazi_review_api_error(403, 'Neplatný bezpečnostní token.');
    if (array_diff(array_keys($payload), array_merge(['csrf'], $fields))) kvazi_review_api_error(422, 'Nepodporovaná pole požadavku.');
    return $payload;
}

function kvazi_review_api_error(int $status, string $message): never {
    http_response_code($status);
    echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

function kvazi_review_api_id(array $payload, string $field, bool $zero = false): int {
    $value = $payload[$field] ?? null;
    if (!is_int($value) || $value < ($zero ? 0 : 1)) throw new InvalidArgumentException('Neplatné ID nebo pořadí rozhodnutí.');
    return $value;
}

function kvazi_review_api_token(array $payload): string {
    $id = $payload['tokenId'] ?? null;
    if (!is_string($id) || $id === '' || strlen($id) > 200) throw new InvalidArgumentException('Neplatné ID tokenu.');
    return $id;
}

function kvazi_review_api_text(array $payload, string $field): string {
    $value = $payload[$field] ?? '';
    if (!is_string($value) || strlen($value) > 10000) throw new InvalidArgumentException('Neplatný text rozhodnutí.');
    return preg_replace('/^[\s\p{Z}]+|[\s\p{Z}]+$/u', '', $value);
}

function kvazi_review_api_failure(Throwable $e): never {
    if ($e instanceof InvalidArgumentException) kvazi_review_api_error(422, $e->getMessage());
    if ($e instanceof KvaziReviewNotFound) kvazi_review_api_error(404, $e->getMessage());
    if ($e instanceof KvaziReviewConflict || ($e instanceof PDOException && in_array($e->getCode(), ['40001', '40P01', '23505'], true))) {
        kvazi_review_api_error(409, 'Případ se mezitím změnil. Obnovte jeho stav.');
    }
    kvazi_review_api_error(503, 'Službu se nyní nepodařilo použít.');
}
