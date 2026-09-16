<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/includes/review-api.php';
try {
    $p = kvazi_review_api_request(true, ['revisionId', 'validationResultId', 'tokenId', 'verdict', 'reason', 'expectedDecisionNo']);
    $service = new KvaziMorphologyReview(kvazi_db(), dirname(__DIR__, 3));
    $revision = kvazi_review_api_id($p, 'revisionId');
    $result = kvazi_review_api_id($p, 'validationResultId');
    $token = kvazi_review_api_token($p);
    if (array_key_exists('verdict', $p)) {
        if (!is_string($p['verdict'])) throw new InvalidArgumentException('Neplatný verdict.');
        $state = $service->decide($revision, $result, $token, kvazi_review_api_id($p, 'expectedDecisionNo', true),
            $p['verdict'], kvazi_review_api_text($p, 'reason'), (int)auth_user()['id']);
    } else {
        $state = $service->lookup($revision, $result, $token);
    }
    echo json_encode(['ok' => true] + $state, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
} catch (Throwable $e) { kvazi_review_api_failure($e); }
