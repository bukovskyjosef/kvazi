<?php
declare(strict_types=1);
require_once __DIR__ . '/exact-key.php';

class KvaziReviewConflict extends RuntimeException {}
class KvaziReviewNotFound extends RuntimeException {}

function kvazi_review_transaction(PDO $db, callable $operation): mixed {
    $ownsTransaction = !$db->inTransaction();
    if ($ownsTransaction) $db->beginTransaction();
    try {
        $result = $operation();
        if ($ownsTransaction) $db->commit();
        return $result;
    } catch (Throwable $e) {
        if ($ownsTransaction && $db->inTransaction()) $db->rollBack();
        throw $e;
    }
}

/** Read the immutable runtime dataset belonging to the recorded result, not active rules. */
function kvazi_review_data(PDO $db, string $appRoot, array $result): array {
    $version = $result['rules_version'];
    if (!preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]*$/D', $version)) throw new RuntimeException('Invalid recorded release');
    $release = $db->prepare('SELECT normative_hash, validator_version FROM kvazi.rules_release WHERE version = :v');
    $release->execute([':v' => $version]);
    $registered = $release->fetch(PDO::FETCH_ASSOC);
    $dir = $appRoot . '/data/rules/' . $version;
    if (!is_readable($dir . '/manifest.json') || !is_readable($dir . '/normative.json')) throw new RuntimeException('Missing recorded release');
    $manifest = json_decode(file_get_contents($dir . '/manifest.json'), true, 512, JSON_THROW_ON_ERROR);
    $raw = file_get_contents($dir . '/normative.json');
    $nd = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    if (!$registered || ($manifest['version'] ?? '') !== $version || ($nd['version'] ?? '') !== $version
        || ($manifest['normative_file'] ?? '') !== 'normative.json'
        || ($manifest['validator_version'] ?? '') !== $registered['validator_version']
        || $result['validator_version'] !== $registered['validator_version']
        || ($manifest['normative_hash'] ?? '') !== $registered['normative_hash']
        || hash('sha256', $raw) !== $registered['normative_hash']) {
        throw new RuntimeException('Recorded release integrity mismatch');
    }
    return $nd;
}

function kvazi_review_revision(PDO $db, int $revisionId, int $resultId): array {
    $q = $db->prepare('SELECT v.id AS validation_result_id, v.rules_version, v.validator_version, r.draft_json
        FROM kvazi.validation_result v JOIN kvazi.sentence_revision r ON r.id = v.revision_id
        WHERE v.id = :vid AND r.id = :rid');
    $q->execute([':vid' => $resultId, ':rid' => $revisionId]);
    $row = $q->fetch(PDO::FETCH_ASSOC);
    if (!$row) throw new KvaziReviewNotFound('Revize nebo výsledek nebyly nalezeny.');
    $row['draft'] = json_decode($row['draft_json'], true, 512, JSON_THROW_ON_ERROR);
    return $row;
}

function kvazi_review_token(array $revision, string $tokenId): array {
    $matches = array_values(array_filter($revision['draft']['tokens'], fn($t) => ($t['id'] ?? null) === $tokenId));
    if (count($matches) !== 1) throw new KvaziReviewNotFound('Token revize nebyl nalezen jednoznačně.');
    return $matches[0];
}

function kvazi_review_key_params(array $key): array {
    return [':identity' => kvazi_key_json($key['identity_json']), ':form' => kvazi_key_json($key['form_json']), ':surface' => $key['surface_form']];
}

/** Internal post-submit morphology service. Callers must authorize ADMIN access. */
class KvaziMorphologyReview {
    public function __construct(private PDO $db, private string $appRoot) {}

    private function context(int $revisionId, int $resultId, string $tokenId): array {
        $revision = kvazi_review_revision($this->db, $revisionId, $resultId);
        $key = kvazi_exact_key(kvazi_review_token($revision, $tokenId), kvazi_review_data($this->db, $this->appRoot, $revision));
        if ($key === null) throw new InvalidArgumentException('Normativní výjimka nevyžaduje morfologické review.');
        return [$revision, $key];
    }

    private function findCase(array $revision, array $key, bool $lock = true): ?array {
        $q = $this->db->prepare('SELECT id FROM kvazi.morphology_review_case
            WHERE rules_version = :rules AND identity_json = CAST(:identity AS jsonb)
            AND form_json = CAST(:form AS jsonb) AND surface_form = :surface' . ($lock ? ' FOR UPDATE' : ''));
        $q->execute([':rules' => $revision['rules_version']] + kvazi_review_key_params($key));
        return $q->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    private function latest(int $caseId): ?array {
        $q = $this->db->prepare('SELECT id, decision_no, verdict, reason, admin_id, decided_at
            FROM kvazi.morphology_review_decision WHERE case_id = :id ORDER BY decision_no DESC LIMIT 1');
        $q->execute([':id' => $caseId]);
        return $q->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    private function bind(array $revision, string $tokenId, ?array $case, ?array $decision): ?array {
        // Lock order everywhere: case, then result. A binding is immutable once used.
        $lock = $this->db->prepare('SELECT id FROM kvazi.validation_result WHERE id = :id FOR UPDATE');
        $lock->execute([':id' => $revision['validation_result_id']]);
        if ($decision) {
            $q = $this->db->prepare('INSERT INTO kvazi.validation_result_review
                (validation_result_id, token_id, review_decision_id, rules_version)
                VALUES (:vid, :token, :decision, :rules) ON CONFLICT DO NOTHING');
            $q->execute([':vid' => $revision['validation_result_id'], ':token' => $tokenId,
                ':decision' => $decision['id'], ':rules' => $revision['rules_version']]);
        }
        $q = $this->db->prepare('SELECT d.id, d.case_id, d.decision_no, d.verdict FROM kvazi.validation_result_review b
            JOIN kvazi.morphology_review_decision d ON d.id = b.review_decision_id
            WHERE b.validation_result_id = :vid AND b.token_id = :token');
        $q->execute([':vid' => $revision['validation_result_id'], ':token' => $tokenId]);
        $used = $q->fetch(PDO::FETCH_ASSOC) ?: null;
        if ($used && (!$case || (int)$used['case_id'] !== (int)$case['id'])) throw new KvaziReviewConflict('Review vazba neodpovídá přesnému případu revize.');
        return $used;
    }

    private function response(?array $case, ?array $decision, ?array $used): array {
        return ['status' => $decision['verdict'] ?? 'UNKNOWN', 'decisionNo' => (int)($decision['decision_no'] ?? 0),
            'caseId' => $case ? (int)$case['id'] : null, 'decision' => $decision,
            'usedStatus' => $used['verdict'] ?? 'UNKNOWN', 'usedDecisionId' => $used ? (int)$used['id'] : null];
    }

    public function lookup(int $revisionId, int $resultId, string $tokenId): array {
        return kvazi_review_transaction($this->db, function () use ($revisionId, $resultId, $tokenId) {
            [$revision, $key] = $this->context($revisionId, $resultId, $tokenId);
            $case = $this->findCase($revision, $key);
            $decision = $case ? $this->latest((int)$case['id']) : null;
            $used = $this->bind($revision, $tokenId, $case, $decision);
            return $this->response($case, $decision, $used);
        });
    }

    public function decide(int $revisionId, int $resultId, string $tokenId, int $expectedNo,
        string $verdict, string $reason, int $adminId): array {
        if (!in_array($verdict, ['APPROVED', 'REJECTED'], true) || $expectedNo < 0
            || ($verdict === 'REJECTED' && !preg_match('/[^\s\p{Z}]/u', $reason))) throw new InvalidArgumentException('Neplatné rozhodnutí nebo chybějící důvod.');
        return kvazi_review_transaction($this->db, function () use ($revisionId, $resultId, $tokenId, $expectedNo, $verdict, $reason, $adminId) {
            [$revision, $key] = $this->context($revisionId, $resultId, $tokenId);
            $q = $this->db->prepare('INSERT INTO kvazi.morphology_review_case (rules_version, identity_json, form_json, surface_form)
                VALUES (:rules, CAST(:identity AS jsonb), CAST(:form AS jsonb), :surface) ON CONFLICT DO NOTHING');
            $q->execute([':rules' => $revision['rules_version']] + kvazi_review_key_params($key));
            $case = $this->findCase($revision, $key);
            $old = $this->latest((int)$case['id']);
            if ((int)($old['decision_no'] ?? 0) !== $expectedNo) throw new KvaziReviewConflict('Případ byl mezitím rozhodnut. Obnovte jeho stav.');
            $q = $this->db->prepare('INSERT INTO kvazi.morphology_review_decision
                (case_id, rules_version, decision_no, verdict, reason, admin_id)
                VALUES (:case, :rules, :no, :verdict, :reason, :admin)');
            $q->execute([':case' => $case['id'], ':rules' => $revision['rules_version'], ':no' => $expectedNo + 1,
                ':verdict' => $verdict, ':reason' => $reason, ':admin' => $adminId]);
            $decision = $this->latest((int)$case['id']);
            $used = $this->bind($revision, $tokenId, $case, $decision);
            return $this->response($case, $decision, $used);
        });
    }

    /** Only review preconditions; M3 must separately enforce deterministic validity. */
    public function preconditions(int $revisionId, int $resultId): array {
        return kvazi_review_transaction($this->db, function () use ($revisionId, $resultId) {
            $revision = kvazi_review_revision($this->db, $revisionId, $resultId);
            $nd = kvazi_review_data($this->db, $this->appRoot, $revision);
            $cases = [];
            foreach ($revision['draft']['tokens'] as $token) {
                $key = kvazi_exact_key($token, $nd);
                if ($key === null) continue;
                kvazi_review_token($revision, $token['id']);
                $cases[$token['id']] = $this->findCase($revision, $key, false);
            }
            // Acquire all existing cases in ID order before binding/locking the result.
            // An absent case remains UNKNOWN for this lookup if a concurrent decision
            // creates it; a later review refresh will use that new decision.
            $ids = array_unique(array_map(fn($c) => (int)$c['id'], array_filter($cases)));
            if ($ids) $this->db->query('SELECT id FROM kvazi.morphology_review_case WHERE id IN (' . implode(',', $ids) . ') ORDER BY id FOR UPDATE')->fetchAll();
            $tokens = [];
            foreach ($cases as $tokenId => $case) {
                $tokenId = (string)$tokenId;
                $decision = $case ? $this->latest((int)$case['id']) : null;
                $tokens[$tokenId] = $this->response($case, $decision, $this->bind($revision, $tokenId, $case, $decision));
            }
            $statuses = array_column($tokens, 'usedStatus');
            return ['hasUnknown' => in_array('UNKNOWN', $statuses, true), 'hasRejected' => in_array('REJECTED', $statuses, true),
                'allApproved' => !in_array('UNKNOWN', $statuses, true) && !in_array('REJECTED', $statuses, true), 'tokens' => $tokens];
        });
    }
}

/** Separate lexical service: binary approved exact match; no review queries. */
function kvazi_catalog_match(PDO $db, array $key): bool {
    $q = $db->prepare('SELECT 1 FROM kvazi.real_word_catalog WHERE identity_json = CAST(:identity AS jsonb)
        AND form_json = CAST(:form AS jsonb) AND surface_form = :surface AND is_approved = TRUE');
    $q->execute(kvazi_review_key_params($key));
    return $q->fetchColumn() !== false;
}

function kvazi_catalog_decide(PDO $db, string $appRoot, int $revisionId, int $resultId, string $tokenId,
    bool $approved, string $reason, string $source, int $adminId): void {
    kvazi_review_transaction($db, function () use ($db, $appRoot, $revisionId, $resultId, $tokenId, $approved, $reason, $source, $adminId) {
        $revision = kvazi_review_revision($db, $revisionId, $resultId);
        $key = kvazi_exact_key(kvazi_review_token($revision, $tokenId), kvazi_review_data($db, $appRoot, $revision), true);
        if ($key === null) throw new InvalidArgumentException('Normativní výjimka nepatří do katalogu.');
        $q = $db->prepare('INSERT INTO kvazi.real_word_catalog
            (identity_json, form_json, surface_form, is_approved, reason, source, admin_id)
            VALUES (CAST(:identity AS jsonb), CAST(:form AS jsonb), :surface, :approved, :reason, :source, :admin)
            ON CONFLICT (identity_json, form_json, surface_form) DO UPDATE SET is_approved = EXCLUDED.is_approved,
            reason = EXCLUDED.reason, source = EXCLUDED.source, admin_id = EXCLUDED.admin_id, updated_at = now()');
        $q->bindValue(':approved', $approved, PDO::PARAM_BOOL);
        foreach (kvazi_review_key_params($key) + [':reason' => $reason, ':source' => $source, ':admin' => $adminId] as $name => $value) $q->bindValue($name, $value);
        $q->execute();
    });
}
