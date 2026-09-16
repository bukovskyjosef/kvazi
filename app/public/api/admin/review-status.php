<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/includes/review-api.php';
try {
    $p = kvazi_review_api_request(true, ['revisionId', 'validationResultId']);
    $service = new KvaziMorphologyReview(kvazi_db(), dirname(__DIR__, 3));
    echo json_encode(['ok' => true] + $service->preconditions(kvazi_review_api_id($p, 'revisionId'),
        kvazi_review_api_id($p, 'validationResultId')), JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
} catch (Throwable $e) { kvazi_review_api_failure($e); }
