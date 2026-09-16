<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/includes/review-api.php';
require_once dirname(__DIR__, 2) . '/includes/workflow.php';
$payload = kvazi_review_api_request(true, ['revisionId', 'validationResultId', 'action', 'reason']);
try {
    $action = $payload['action'] ?? null;
    if (!is_string($action)) throw new InvalidArgumentException('Neplatná akce.');
    kvazi_sentence_decide(kvazi_db(), dirname(__DIR__, 3), kvazi_review_api_id($payload, 'revisionId'),
        kvazi_review_api_id($payload, 'validationResultId'), $action, kvazi_review_api_text($payload, 'reason'), (int)auth_user()['id']);
    echo json_encode(['ok' => true], JSON_THROW_ON_ERROR);
} catch (Throwable $e) { kvazi_review_api_failure($e); }
