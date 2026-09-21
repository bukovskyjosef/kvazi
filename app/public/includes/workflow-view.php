<?php
declare(strict_types=1);
require_once __DIR__ . '/workflow.php';

function kvazi_page_start(string $title, string $active = ''): void {
    $activePage = $active;
    header('Content-Type: text/html; charset=UTF-8');
    echo '<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' . kvazi_html($title) . '</title><link rel="stylesheet" href="/css/site.css"><meta name="csrf" content="' . kvazi_html(auth_csrf_token()) . '"></head><body>';
    include __DIR__ . '/nav.php';
    echo '<main class="container page-body workflow"><h1>' . kvazi_html($title) . '</h1>';
}

function kvazi_page_end(): void {
    echo '</main>';
    include __DIR__ . '/footer.php';
    echo '</body></html>';
}

function kvazi_plain_json(mixed $data): void {
    echo '<pre class="declaration">' . kvazi_html(json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)) . '</pre>';
}

function kvazi_export_datetime(mixed $value): ?string {
    if ($value === null || $value === '') return null;
    return (new DateTimeImmutable((string)$value))->format(DATE_ATOM);
}

/** ADMIN-only, data-minimized projection for manual external consultation. */
function kvazi_ai_consultation_export(array $row, array $review): array {
    $tokens = [];
    foreach ($row['draft']['tokens'] as $token) {
        $id = $token['id'];
        $state = $review['tokens'][$id];
        if (!empty($state['exception'])) {
            $tokens[$id] = ['exception' => true, 'error' => null,
                'morphology' => ['required' => false], 'lexical' => ['required' => false]];
            continue;
        }
        if (isset($state['error'])) {
            $tokens[$id] = ['exception' => false, 'error' => $state['error'],
                'morphology' => ['required' => true], 'lexical' => ['required' => true]];
            continue;
        }
        $morphology = $state['review'];
        $decision = $morphology['decision'];
        $catalog = $state['catalog'];
        $tokens[$id] = [
            'exception' => false,
            'error' => null,
            'morphology' => [
                'required' => true,
                'status' => $morphology['status'],
                'decisionNo' => (int)$morphology['decisionNo'],
                'usedStatus' => $morphology['usedStatus'],
                'usedDecisionId' => $morphology['usedDecisionId'],
                'latestDecision' => $decision === null ? null : [
                    'decisionNo' => (int)$decision['decision_no'],
                    'verdict' => $decision['verdict'],
                    'reason' => $decision['reason'],
                    'decidedAt' => kvazi_export_datetime($decision['decided_at']),
                ],
                'reviewKey' => $morphology['key'],
            ],
            'lexical' => [
                'required' => true,
                'expectedReal' => (bool)$state['expectedReal'],
                'resolved' => (bool)$state['lexicallyResolved'],
                'catalogKey' => $state['catalogKey'],
                'catalog' => $catalog === null ? null : [
                    'isApproved' => (bool)$catalog['is_approved'],
                    'reason' => $catalog['reason'],
                    'source' => $catalog['source'],
                    'updatedAt' => kvazi_export_datetime($catalog['updated_at']),
                ],
            ],
        ];
    }
    $action = $row['action'];
    return [
        'exportSchemaVersion' => '1.0',
        'context' => [
            'sentenceId' => (int)$row['sentence_id'],
            'revisionId' => (int)$row['revision_id'],
            'revisionNo' => (int)$row['revision_no'],
            'text' => $row['text'],
            'submittedAt' => kvazi_export_datetime($row['submitted_at']),
            'rulesVersion' => $row['rules_version'],
            'validatorVersion' => $row['validator_version'],
            'validationResultId' => (int)$row['validation_result_id'],
            'deterministicValidation' => [
                'isValid' => (bool)$row['is_valid'],
                'wordScore' => (int)$row['word_score'],
                'charScore' => (int)$row['char_score'],
            ],
        ],
        // Decode the stored JSON as objects here so empty {} values do not round-trip as [].
        'draft' => json_decode($row['draft_json'], false, 512, JSON_THROW_ON_ERROR),
        'validation' => json_decode($row['result_json'], false, 512, JSON_THROW_ON_ERROR),
        'review' => [
            'summary' => [
                'canApprove' => (bool)$review['canApprove'],
                'morphologyBlocked' => (int)$review['morphologyBlocked'],
                'lexicalBlocked' => (int)$review['lexicalBlocked'],
            ],
            'tokens' => (object)$tokens,
            'sentenceDecision' => [
                'status' => match ($action) {
                    'approve' => 'approved', 'return' => 'returned', 'reject' => 'rejected', default => 'pending',
                },
                'action' => $action,
                'reason' => $row['reason'],
                'decidedAt' => kvazi_export_datetime($row['decided_at']),
            ],
        ],
    ];
}

/** Plain text read-only declaration, including stored evidence for owner/admin. */
function kvazi_declaration(array $data): void {
    $labels = ['surface' => 'Použitý tvar', 'pos' => 'Slovní druh', 'lexicalStatus' => 'Skutečné slovo / kvazislovo',
        'lemma' => 'Lemma / neurčitek', 'model' => 'Soutěžní model', 'role' => 'Syntaktická role',
        'form' => 'Vlastnosti použitého tvaru', 'identity' => 'Vlastnosti identity', 'relations' => 'Vazby na slova',
        'evidence' => 'Obhajoba a podklady', 'morphology' => 'Morfologická obhajoba', 'valency' => 'Valence',
        'declaration' => 'Valenční obhajoba', 'source' => 'Zdroj / reference', 'case' => 'Pád', 'number' => 'Číslo',
        'gender' => 'Rod', 'animacy' => 'Životnost', 'person' => 'Osoba', 'pronoun' => 'Zájmenná signature',
        'head' => 'Řídící slovo', 'predicate' => 'Přísudek', 'nominal' => 'Jmenný člen', 'left' => 'Levá vazba',
        'right' => 'Pravá vazba', 'verbFormType' => 'Druh slovesného tvaru', 'verbPerson' => 'Osoba slovesa',
        'verbGender' => 'Rod slovesa', 'verbAnimacy' => 'Životnost slovesa', 'aspect' => 'Vid', 'degree' => 'Stupeň',
        'explanation' => 'Vysvětlení', 'analogy' => 'Česká analogie', 'needsAnalogy' => 'Vyžaduje analogii',
        'sentenceType' => 'Typ věty', 'implicitSubject' => 'Nevyjádřený podmět', 'id' => 'ID slova'];
    echo '<dl class="submission-summary token-declaration">';
    foreach ($data as $key => $value) {
        echo '<dt>' . kvazi_html($labels[$key] ?? $key) . '</dt><dd class="plain-text">';
        if (is_array($value)) kvazi_declaration($value);
        else {
            $values = [
                'pos' => ['noun' => 'Podstatné jméno', 'adjective' => 'Přídavné jméno', 'verb' => 'Sloveso', 'pronoun' => 'Zájmeno', 'preposition' => 'Předložka', 'conjunction' => 'Spojka'],
                'lexicalStatus' => ['real' => 'Skutečné slovo', 'quasi' => 'Kvazislovo'],
                'number' => ['singular' => 'Jednotné', 'plural' => 'Množné'],
                'gender' => ['masculine' => 'Mužský', 'masculineAnimate' => 'Mužský životný', 'masculineInanimate' => 'Mužský neživotný', 'feminine' => 'Ženský', 'neuter' => 'Střední'],
                'role' => ['subject' => 'Podmět', 'predicate' => 'Přísudek', 'object' => 'Předmět', 'auxiliary' => 'Pomocné být', 'preposition' => 'Předložka', 'coordination' => 'Koordinace', 'attribute' => 'Přívlastek neshodný', 'agreeingAttribute' => 'Přívlastek shodný', 'adverbial' => 'Příslovečné určení', 'supplement' => 'Doplněk'],
            ];
            $display = is_bool($value) ? ($value ? 'Ano' : 'Ne') : $value;
            if (is_string($value)) $display = $value === 'notApplicable' ? 'Nevztahuje se' : ($values[$key][$value] ?? $value);
            echo kvazi_html($display);
        }
        echo '</dd>';
    }
    echo '</dl>';
}

function kvazi_submission_summary(array $row): void {
    echo '<p class="sentence-text">' . kvazi_html($row['text']) . '</p><dl class="submission-summary">';
    foreach (['sentence_id' => 'Sentence ID', 'revision_id' => 'Revision ID', 'revision_no' => 'Číslo revize',
        'username' => 'Autor', 'submitted_at' => 'Odesláno', 'rules_version' => 'Pravidla',
        'word_score' => 'Počet slov', 'char_score' => 'Počet soutěžních znaků'] as $field => $label) {
        echo '<dt>' . $label . '</dt><dd data-field="' . $field . '">' . kvazi_html($row[$field]) . '</dd>';
    }
    echo '</dl><p class="revision-status" data-action="' . kvazi_html($row['action'] ?? 'pending') . '">' . kvazi_html(kvazi_status($row['action'])) . '</p>';
}

function kvazi_history_links(array $history, string $path): void {
    echo '<nav aria-label="Historie revizí"><h2>Historie revizí</h2><ul>';
    foreach ($history as $r) echo '<li><a href="' . $path . '?revisionId=' . (int)$r['revision_id'] . '">rev' . (int)$r['revision_no'] . '</a> — ' . kvazi_html(kvazi_status($r['action'])) . '</li>';
    echo '</ul></nav>';
}

/** Explicit #73 public projection. Never expose arbitrary draft/form/evidence keys. */
function kvazi_public_token(array $token, array $tokens = []): array {
    $result = [];
    foreach (['surface', 'pos', 'lexicalStatus', 'lemma', 'model', 'role'] as $field) {
        if (is_string($token[$field] ?? null)) $result[$field] = $token[$field];
    }
    $fields = match ($token['pos'] ?? '') {
        'noun' => ['case', 'number'], 'adjective' => ['gender', 'case', 'number', 'degree'],
        'verb' => ['verbFormType', 'aspect', 'verbPerson', 'number', 'verbGender', 'verbAnimacy'],
        default => [],
    };
    foreach ($fields as $field) if (is_string($token['form'][$field] ?? null)) $result['form'][$field] = $token['form'][$field];
    if (($token['pos'] ?? '') === 'pronoun') {
        foreach (['case', 'number', 'gender', 'person'] as $field) if (is_string($token['form']['pronoun'][$field] ?? null)) $result['form']['pronoun'][$field] = $token['form']['pronoun'][$field];
    }
    if (($token['pos'] ?? '') === 'noun') {
        foreach (['gender', 'animacy'] as $field) if (is_string($token['identity'][$field] ?? null)) $result['identity'][$field] = $token['identity'][$field];
    }
    foreach (['head', 'predicate', 'nominal', 'left', 'right'] as $field) if (is_string($token['relations'][$field] ?? null)) {
        foreach ($tokens as $index => $target) if (($target['id'] ?? null) === $token['relations'][$field]) {
            $result['relations'][$field] = ($index + 1) . '. ' . ($target['surface'] ?? '');
        }
    }
    return $result;
}
