<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/includes/review-api.php';
try {
    $p = kvazi_review_api_request(true, ['revisionId', 'validationResultId', 'tokenId', 'isApproved', 'reason', 'source']);
    if (!is_bool($p['isApproved'] ?? null)) throw new InvalidArgumentException('Chybí katalogové rozhodnutí.');
    kvazi_catalog_decide(kvazi_db(), dirname(__DIR__, 3), kvazi_review_api_id($p, 'revisionId'),
        kvazi_review_api_id($p, 'validationResultId'), kvazi_review_api_token($p), $p['isApproved'],
        kvazi_review_api_text($p, 'reason'), kvazi_review_api_text($p, 'source'), (int)auth_user()['id']);
    echo json_encode(['ok' => true], JSON_THROW_ON_ERROR);
} catch (Throwable $e) { kvazi_review_api_failure($e); }
