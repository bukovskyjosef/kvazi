<?php
/**
 * validator.php — PHP deterministický validátor kvazivěty.
 *
 * Čte normativní data z app/data/rules/<version>/normative.json.
 * Implementuje stejnou deterministickou semantiku jako JS validation.mjs + morpho.mjs.
 * Paralelní normativní zdroj: app/data/rules/public-1/normative.json.
 *
 * Oba enginy (JS i PHP) musí pro stejný kanonický vstup vrátit stejný výsledek.
 *
 * Nevytváří nové pravidlo. Implementuje pouze to, co je jednoznačně dáno
 * normativními dokumenty a GitHub Issues.
 */
declare(strict_types=1);

class KvaziValidator {
    private array $nd; // normative data
    private string $version;
    private string $validatorVersion;

    public function __construct(string $normativeJsonPath) {
        $raw = file_get_contents($normativeJsonPath);
        if ($raw === false) {
            throw new RuntimeException("Nelze načíst normativní data: $normativeJsonPath");
        }
        $this->nd = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        $this->version = $this->nd['version'];
        $this->validatorVersion = '1.0.0';
    }

    public function getRulesVersion(): string { return $this->version; }
    public function getValidatorVersion(): string { return $this->validatorVersion; }

    // ─────────────────────────────────────────────────────────
    // NFC + case helpers
    // ─────────────────────────────────────────────────────────

    private function nfc(string $s): string {
        return \Normalizer::normalize($s, \Normalizer::FORM_C);
    }

    private function folded(string $s): string {
        return mb_strtolower($this->nfc($s), 'UTF-8');
    }

    private function mbLen(string $s): int {
        return mb_strlen($s, 'UTF-8');
    }

    private function mbChars(string $s): array {
        preg_match_all('/./us', $s, $m);
        return $m[0];
    }

    // ─────────────────────────────────────────────────────────
    // Prefix inference (mirrors state.mjs inferKvaziPrefix)
    // ─────────────────────────────────────────────────────────

    private function inferKvaziPrefix(string $surface): bool {
        $s = $this->folded($surface);
        return str_starts_with($s, 'kvazi') && $this->mbLen($s) > 5;
    }

    // ─────────────────────────────────────────────────────────
    // DFA transition (mirrors validation.mjs transition())
    // ─────────────────────────────────────────────────────────

    private function dfaTransition(int $state, string $c): int {
        $c = mb_strtoupper($c, 'UTF-8');
        return match ($state) {
            0 => match ($c) { 'K' => 1, 'Q' => 2, default => -1 },
            1 => $c === 'V' ? 2 : -1,
            2 => in_array($c, ['A', 'Á'], true) ? 3 : -1,
            3 => $c === 'Z' ? 4 : -1,
            4 => in_array($c, ['I', 'Í', 'Y', 'Ý'], true) ? 0 : -1,
            default => -1,
        };
    }

    // ─────────────────────────────────────────────────────────
    // validateTokenSequence (mirrors validation.mjs)
    // ─────────────────────────────────────────────────────────

    private function validateTokenSequence(array $tokens): array {
        $issues = [];
        $singles = $this->nd['single_tokens'];
        $minChars = $this->nd['token_min_chars'];
        $maxChars = $this->nd['token_max_chars'];
        $prefixLen = $this->nd['kvazi_prefix_len'];
        $charset = $this->nd['surface_charset'];

        if (empty($tokens)) {
            $issues[] = ['id' => null, 'message' => 'Věta zatím neobsahuje slova.'];
        }

        $used = [];
        foreach ($tokens as $w) {
            $s = $this->nfc($w['surface'] ?? '');
            $length = $this->mbLen($s);

            if (!preg_match('/' . $charset . '/iu', $s)) {
                $issues[] = ['id' => $w['id'], 'message' => 'Použijte pouze znaky K V Q A Á Z I Í Y Ý, bez mezer a znamének.'];
            }

            $hasPrefix = $this->inferKvaziPrefix($s);
            $foldedS = $this->folded($s);

            if (!in_array($foldedS, $singles, true)) {
                if ($hasPrefix) {
                    $baseLen = $length - $prefixLen;
                    if ($baseLen < $minChars || $baseLen > $maxChars) {
                        $issues[] = ['id' => $w['id'], 'message' => 'Základ za prefixem kvazi- musí mít 3–5 znaků.'];
                    }
                } elseif ($length < $minChars || $length > $maxChars) {
                    $issues[] = ['id' => $w['id'], 'message' => 'Běžné slovo musí mít 3–5 znaků; výjimky jsou pouze k/v/z/a/i.'];
                }
            }

            if (in_array($foldedS, $singles, true)) {
                if (isset($used[$foldedS])) {
                    $issues[] = ['id' => $w['id'], 'message' => 'Jednopísmennou výjimku lze použít jen jednou.'];
                    $issues[] = ['id' => $used[$foldedS], 'message' => 'Jednopísmenná výjimka je ve větě opakovaná.'];
                }
                $used[$foldedS] = $w['id'];
            }
        }

        // Build segments for DFA: prefix token → [KVAZI chars] + [base chars]
        $segments = [];
        foreach ($tokens as $w) {
            $upper = mb_strtoupper($this->nfc($w['surface'] ?? ''), 'UTF-8');
            if ($this->inferKvaziPrefix($w['surface'] ?? '')) {
                $chars = $this->mbChars($upper);
                $segments[] = array_slice($chars, 0, $prefixLen);
                $segments[] = array_slice($chars, $prefixLen);
            } else {
                $segments[] = $this->mbChars($upper);
            }
        }

        $fits = false;
        if (!empty($tokens)) {
            for ($start = 0; $start <= 4; $start++) {
                $state = $start;
                $ok = true;
                foreach ($segments as $seg) {
                    foreach ($seg as $i => $ch) {
                        $state = $this->dfaTransition($state, $ch);
                        if ($state < 0 || ($state === 0 && $i < count($seg) - 1)) {
                            $ok = false;
                            break 2;
                        }
                    }
                }
                if ($ok) { $fits = true; break; }
            }
            if (!$fits) {
                $issues[] = ['id' => null, 'message' => 'Slova netvoří souvislou posloupnost motivů, v níž každé slovo leží uvnitř jediného motivu.'];
            }
        }

        return ['ok' => empty($issues), 'issues' => $issues];
    }

    // ─────────────────────────────────────────────────────────
    // validateSyntax (mirrors validation.mjs validateSyntax)
    // ─────────────────────────────────────────────────────────

    private function validateSyntax(array $draft): array {
        $issues = [];
        $words = $draft['tokens'] ?? [];
        $byId = [];
        foreach ($words as $w) { $byId[$w['id']] = $w; }

        $nominal = fn($w) => $w && in_array($w['pos'] ?? '', ['noun', 'adjective', 'pronoun'], true);
        $isPredicate = fn($w) => $w && ($w['role'] ?? '') === 'predicate' && ($w['pos'] ?? '') === 'verb';

        $shapes = $this->nd['relation_shapes'];

        foreach ($words as $w) {
            $wid = $w['id'];
            $add = function (string $msg) use (&$issues, $wid) {
                $issues[] = ['id' => $wid, 'message' => $msg];
            };

            $role = $w['role'] ?? '';
            if (!array_key_exists($role, $shapes)) {
                $add('Chybí povolená větná funkce nebo technická role.');
                continue;
            }

            $expected = $shapes[$role];
            $relations = $w['relations'] ?? [];
            $actual = array_keys(array_filter($relations, fn($v) => $v !== null && $v !== ''));

            if (count($actual) !== count($expected) || array_diff($actual, $expected) || array_diff($expected, $actual)) {
                $add('Počet nebo druh vazeb neodpovídá zvolené funkci.');
            }

            foreach ($expected as $key) {
                $targetId = $relations[$key] ?? null;
                if (!$targetId || !isset($byId[$targetId]) || $targetId === $wid) {
                    $add('Každá vazba musí mířit na jiné existující slovo této věty.');
                }
            }

            $head = isset($relations['head']) ? ($byId[$relations['head']] ?? null) : null;

            if ($role === 'predicate' && ($w['pos'] ?? '') !== 'verb') {
                $add('Přísudek musí být plnovýznamové sloveso.');
            }

            if ($role === 'auxiliary') {
                if (($w['pos'] ?? '') !== 'verb' || $this->folded($w['lemma'] ?? '') !== 'být') {
                    $add('Pomocné být musí mít slovní druh sloveso a lemma „být".');
                }
                $predTarget = isset($relations['predicate']) ? ($byId[$relations['predicate']] ?? null) : null;
                if (!$isPredicate($predTarget)) {
                    $add('Pomocné být musí odkazovat na přísudek — plnovýznamové sloveso.');
                }
            }

            if (in_array($role, ['subject', 'object', 'adverbial'], true) && !$isPredicate($head)) {
                $add('Řídícím slovem musí být přísudek.');
            }

            if (in_array($role, ['agreeingAttribute', 'attribute'], true) && !$nominal($head)) {
                $add('Přívlastek musí odkazovat na jmenný člen.');
            }

            if ($role === 'preposition') {
                $nomTarget = isset($relations['nominal']) ? ($byId[$relations['nominal']] ?? null) : null;
                if (!$nominal($nomTarget) || ($w['pos'] ?? '') !== 'preposition') {
                    $add('Předložka vyžaduje právě jednu vazbu na řízené jmenné slovo.');
                }
            }

            if ($role === 'supplement') {
                $predTarget = isset($relations['predicate']) ? ($byId[$relations['predicate']] ?? null) : null;
                $nomTarget  = isset($relations['nominal']) ? ($byId[$relations['nominal']] ?? null) : null;
                if (!$isPredicate($predTarget) || !$nominal($nomTarget) ||
                    !in_array($nomTarget['role'] ?? '', ['subject', 'object'], true)) {
                    $add('Doplněk vyžaduje přísudek a jmenný podmět nebo předmět.');
                }
            }

            if ($role === 'coordination') {
                $leftW  = isset($relations['left']) ? ($byId[$relations['left']] ?? null) : null;
                $rightW = isset($relations['right']) ? ($byId[$relations['right']] ?? null) : null;
                $allowedCoordRoles = ['object', 'agreeingAttribute', 'attribute', 'adverbial', 'supplement'];
                if (($w['pos'] ?? '') !== 'conjunction' || !$leftW || !$rightW ||
                    $leftW['id'] === $rightW['id'] ||
                    ($leftW['role'] ?? '') !== ($rightW['role'] ?? '') ||
                    !in_array($leftW['role'] ?? '', $allowedCoordRoles, true)) {
                    $add('Spojka musí spojovat dvě různé části se stejnou dovolenou hlavní funkcí, nikoli podměty či přísudky.');
                }
            }
        }

        // Cycle detection (iterative, mirrors JS version)
        $done = [];
        foreach ($words as $root) {
            $active = [];
            $stack = [[$root, false]];
            while (!empty($stack)) {
                [$w, $leaving] = array_pop($stack);
                if ($leaving) {
                    unset($active[$w['id']]);
                    $done[$w['id']] = true;
                    continue;
                }
                if (isset($active[$w['id']])) {
                    $issues[] = ['id' => $w['id'], 'message' => 'Syntaktické vazby obsahují kruh.'];
                    break;
                }
                if (isset($done[$w['id']])) continue;
                $active[$w['id']] = true;
                $stack[] = [$w, true];
                foreach (($w['relations'] ?? []) as $targetId) {
                    if ($targetId && isset($byId[$targetId])) {
                        $stack[] = [$byId[$targetId], false];
                    }
                }
            }
        }

        return ['ok' => !empty($words) && empty($issues), 'issues' => $issues];
    }

    // ─────────────────────────────────────────────────────────
    // Morphological validation helpers
    // ─────────────────────────────────────────────────────────

    private function isVowel(string $c): bool {
        return preg_match('/[aeiouyáéíóúůýě]/iu', $c) === 1;
    }

    private function endsConsonant(string $s): bool {
        if ($s === '') return false;
        return !$this->isVowel(mb_substr($s, -1, 1, 'UTF-8'));
    }

    private function nounCond(string $cond, string $lemma): bool {
        return match ($cond) {
            'ends_consonant' => $this->endsConsonant($lemma),
            'ends_a'         => str_ends_with($lemma, 'a'),
            'ends_e'         => str_ends_with($lemma, 'e'),
            'ends_o'         => str_ends_with($lemma, 'o'),
            'ends_í'         => str_ends_with($lemma, 'í'),
            default          => false,
        };
    }

    private function nounStem(string $stem, string $lemma): string {
        return match ($stem) {
            'identity' => $lemma,
            'drop_1'   => mb_substr($lemma, 0, -1, 'UTF-8'),
            default    => $lemma,
        };
    }

    // ─────────────────────────────────────────────────────────
    // validateNoun (mirrors morpho.mjs validateNoun)
    // ─────────────────────────────────────────────────────────

    private function validateNoun(array $w): array {
        $modelName = $w['model'] ?? '';
        $nounModels = $this->nd['noun_models'];
        if (!isset($nounModels[$modelName])) {
            return ['ok' => true, 'expected' => null, 'message' => null];
        }
        $m = $nounModels[$modelName];

        $lemma   = mb_strtolower($this->nfc($w['lemma'] ?? ''), 'UTF-8');
        $surface = mb_strtolower($this->nfc($w['surface'] ?? ''), 'UTF-8');
        $hasPrefix = !empty($w['kvaziPrefix']);

        if ($hasPrefix) {
            if (!str_starts_with($lemma, 'kvazi')) {
                return ['ok' => false, 'expected' => null, 'message' => 'Lemma s prefixem kvazi- musí začínat na kvazi.'];
            }
            $lemma = mb_substr($lemma, 5, null, 'UTF-8');
        }

        if ($lemma === '') {
            return ['ok' => false, 'expected' => null, 'message' => 'Chybí základní tvar.'];
        }
        if (!$this->nounCond($m['cond'], $lemma)) {
            return ['ok' => false, 'expected' => null, 'message' => "Lemma „{$lemma}\" nesplňuje podmínku modelu {$modelName}: {$m['cond_hint']}."];
        }

        $number  = $w['form']['number'] ?? '';
        $caseNum = $w['form']['case'] ?? '';
        if (!$number || !$caseNum) {
            return ['ok' => false, 'expected' => null, 'message' => 'Chybí číslo nebo pád použitého tvaru.'];
        }

        $key = "{$number}-{$caseNum}";
        if (!isset($m['endings'][$key])) {
            return ['ok' => false, 'expected' => null, 'message' => "Kombinace číslo/pád „{$key}\" není v tabulce modelu {$modelName}."];
        }

        $stem        = $this->nounStem($m['stem'], $lemma);
        $expectedBase = $stem . $m['endings'][$key];
        $expected    = $hasPrefix ? 'kvazi' . $expectedBase : $expectedBase;

        return $expected === $surface
            ? ['ok' => true, 'expected' => $expected, 'message' => null]
            : ['ok' => false, 'expected' => $expected, 'message' => "Použitý tvar „{$surface}\" neodpovídá modelu {$modelName} a deklarovaným morfologickým hodnotám (očekáváno „{$expected}\")."];
    }

    // ─────────────────────────────────────────────────────────
    // validateAdjective (mirrors morpho.mjs validateAdjective)
    // ─────────────────────────────────────────────────────────

    private function validateAdjective(array $w): array {
        $modelName = $w['model'] ?? '';
        $form      = $w['form'] ?? [];
        $identity  = $w['identity'] ?? [];
        $surface   = mb_strtolower($this->nfc($w['surface'] ?? ''), 'UTF-8');
        $lemma     = mb_strtolower($this->nfc($w['lemma'] ?? ''), 'UTF-8');
        $degree    = $form['degree'] ?? '1';

        $adjModels = $this->nd['adj_models'];
        if (!isset($adjModels[$modelName])) {
            return ['ok' => true, 'expected' => null, 'message' => null];
        }

        $caseNum = $form['case'] ?? '';
        $number  = $form['number'] ?? '';
        $gender  = $form['gender'] ?? '';

        if (!$caseNum || !$number || !$gender) {
            return ['ok' => false, 'expected' => null, 'message' => 'Chybí rod, číslo nebo pád použitého tvaru.'];
        }

        $tableKey = "{$gender}-{$number}-{$caseNum}";
        $tables   = $this->nd['adj_tables'];

        // Přivlastňovací adjektiva
        if ($modelName === 'otcův' || $modelName === 'matčin') {
            $srcLemma = mb_strtolower($identity['sourceNounLemma'] ?? '', 'UTF-8');
            $srcModel = $identity['sourceNounModel'] ?? '';
            if (!$srcLemma || !$srcModel) {
                return ['ok' => false, 'expected' => null, 'message' => 'Chybí lemma nebo vzor zdrojového substantiva.'];
            }
            $nounModels = $this->nd['noun_models'];
            if (!isset($nounModels[$srcModel])) {
                return ['ok' => false, 'expected' => null, 'message' => "Zdrojový substantivní model „{$srcModel}\" není v normativní sadě."];
            }
            $srcM = $nounModels[$srcModel];
            if (!$this->nounCond($srcM['cond'], $srcLemma)) {
                return ['ok' => false, 'expected' => null, 'message' => "Lemma zdrojového substantiva „{$srcLemma}\" nesplňuje podmínku vzoru {$srcModel}."];
            }
            $srcStem = $this->nounStem($srcM['stem'], $srcLemma);

            if ($modelName === 'otcův') {
                if ($srcM['gender'] !== 'masculine') {
                    return ['ok' => false, 'expected' => null, 'message' => 'Model otcův se odvozuje pouze z mužského substantiva.'];
                }
                $expectedLemma = $srcStem . 'ův';
                if ($lemma !== $expectedLemma) {
                    return ['ok' => false, 'expected' => null, 'message' => "Lemma adjektiva musí být „{$expectedLemma}\" (zdrojový kmen + ův)."];
                }
                $ending = $tables['ADJ_OTCUV'][$tableKey] ?? null;
                if ($ending === null) {
                    return ['ok' => false, 'expected' => null, 'message' => "Kombinace rod/číslo/pád „{$tableKey}\" není v tabulce modelu otcův."];
                }
                $expected = $srcStem . $ending;
            } else {
                if ($srcM['gender'] !== 'feminine') {
                    return ['ok' => false, 'expected' => null, 'message' => 'Model matčin se odvozuje pouze z ženského substantiva.'];
                }
                $expectedLemma = $srcStem . 'in';
                if ($lemma !== $expectedLemma) {
                    return ['ok' => false, 'expected' => null, 'message' => "Lemma adjektiva musí být „{$expectedLemma}\" (zdrojový kmen + in)."];
                }
                $ending = $tables['ADJ_MATCIN'][$tableKey] ?? null;
                if ($ending === null) {
                    return ['ok' => false, 'expected' => null, 'message' => "Kombinace rod/číslo/pád „{$tableKey}\" není v tabulce modelu matčin."];
                }
                $expected = $srcStem . $ending;
            }

            return $expected === $surface
                ? ['ok' => true, 'expected' => $expected, 'message' => null]
                : ['ok' => false, 'expected' => $expected, 'message' => "Použitý tvar „{$surface}\" neodpovídá modelu {$modelName} (očekáváno „{$expected}\")."];
        }

        // Produktivní modely mladý a jarní (+ stupňování)
        $tableName = null;
        $adjStem   = null;

        if ($degree === '1') {
            if ($modelName === 'mladý') {
                if (!str_ends_with($lemma, 'ý')) {
                    return ['ok' => false, 'expected' => null, 'message' => 'Lemma modelu mladý (1. stupeň) musí zakončit na -ý.'];
                }
                $adjStem   = mb_substr($lemma, 0, -1, 'UTF-8');
                $tableName = 'ADJ_MLADY';
            } else { // jarní
                if (!str_ends_with($lemma, 'í')) {
                    return ['ok' => false, 'expected' => null, 'message' => 'Lemma modelu jarní (1. stupeň) musí zakončit na -í.'];
                }
                $adjStem   = mb_substr($lemma, 0, -1, 'UTF-8');
                $tableName = 'ADJ_JARNI';
            }
        } elseif ($degree === '2') {
            if (!str_ends_with($lemma, 'ější')) {
                return ['ok' => false, 'expected' => null, 'message' => '2. stupeň: lemma musí zakončit na -ější.'];
            }
            $adjStem   = mb_substr($lemma, 0, -4, 'UTF-8');
            $tableName = 'ADJ_JARNI';
        } elseif ($degree === '3') {
            if (!str_starts_with($lemma, 'nej') || !str_ends_with($lemma, 'ější')) {
                return ['ok' => false, 'expected' => null, 'message' => '3. stupeň: lemma musí začínat na nej- a zakončit na -ější.'];
            }
            $adjStem   = 'nej' . mb_substr($lemma, 3, $this->mbLen($lemma) - 7, 'UTF-8');
            $tableName = 'ADJ_JARNI';
        } else {
            return ['ok' => false, 'expected' => null, 'message' => "Neznámý stupeň „{$degree}\"."];
        }

        $ending = $tables[$tableName][$tableKey] ?? null;
        if ($ending === null) {
            return ['ok' => false, 'expected' => null, 'message' => "Kombinace rod/číslo/pád „{$tableKey}\" není v tabulce modelu {$modelName}."];
        }
        $expected = $adjStem . $ending;

        return $expected === $surface
            ? ['ok' => true, 'expected' => $expected, 'message' => null]
            : ['ok' => false, 'expected' => $expected, 'message' => "Použitý tvar „{$surface}\" neodpovídá modelu {$modelName} stupeň {$degree} (očekáváno „{$expected}\")."];
    }

    // ─────────────────────────────────────────────────────────
    // validateVerb (mirrors morpho.mjs validateVerb)
    // ─────────────────────────────────────────────────────────

    private function validateVerb(array $w): array {
        $modelName = $w['model'] ?? '';
        $verbModels = $this->nd['verb_models'];
        if (!isset($verbModels[$modelName])) {
            return ['ok' => true, 'expected' => null, 'message' => null];
        }

        $lemma   = mb_strtolower($this->nfc($w['lemma'] ?? ''), 'UTF-8');
        $surface = mb_strtolower($this->nfc($w['surface'] ?? ''), 'UTF-8');
        $form    = $w['form'] ?? [];
        $suffix  = $verbModels[$modelName]['suffix'];

        if (!str_ends_with($lemma, $suffix)) {
            return ['ok' => false, 'expected' => null, 'message' => "Neurčitek modelu {$modelName} musí zakončit na -{$suffix}."];
        }
        $stem = mb_substr($lemma, 0, -$this->mbLen($suffix), 'UTF-8');

        $vft = $form['verbFormType'] ?? '';
        if (!$vft) {
            return ['ok' => false, 'expected' => null, 'message' => 'Chybí druh slovesného tvaru (přítomný/budoucí, rozkazovací, l-příčestí).'];
        }

        $presentTable    = $this->nd['verb_present'];
        $imperativeTable = $this->nd['verb_imperative'];
        $lpartTable      = $this->nd['verb_lparticiple'];

        if ($vft === 'present') {
            $person = $form['verbPerson'] ?? '';
            $number = $form['number'] ?? '';
            if (!$person || !$number) {
                return ['ok' => false, 'expected' => null, 'message' => 'Chybí osoba nebo číslo přítomného/budoucího tvaru.'];
            }
            $p   = (int)$person - 1;
            $n   = $number === 'plural' ? 3 : 0;
            $idx = $p + $n;
            if ($idx < 0 || $idx > 5) {
                return ['ok' => false, 'expected' => null, 'message' => 'Neplatná kombinace osoby a čísla.'];
            }
            $ending  = $presentTable[$modelName][$idx];
            $expected = $stem . $ending;
            return $expected === $surface
                ? ['ok' => true, 'expected' => $expected, 'message' => null]
                : ['ok' => false, 'expected' => $expected, 'message' => "Použitý tvar „{$surface}\" neodpovídá modelu {$modelName} přítomný/budoucí (očekáváno „{$expected}\")."];
        }

        if ($vft === 'imperative') {
            $vp = $form['verbPerson'] ?? '';
            if (!$vp) {
                return ['ok' => false, 'expected' => null, 'message' => 'Chybí osoba/číslo rozkazovacího způsobu.'];
            }
            $impIdx = ['2sg' => 0, '1pl' => 1, '2pl' => 2];
            $idx = $impIdx[$vp] ?? null;
            if ($idx === null) {
                return ['ok' => false, 'expected' => null, 'message' => 'Rozkazovací způsob dovoluje jen 2.sg, 1.pl, 2.pl.'];
            }
            $ending  = $imperativeTable[$modelName][$idx];
            $expected = $stem . $ending;
            return $expected === $surface
                ? ['ok' => true, 'expected' => $expected, 'message' => null]
                : ['ok' => false, 'expected' => $expected, 'message' => "Použitý tvar „{$surface}\" neodpovídá modelu {$modelName} imperativ (očekáváno „{$expected}\")."];
        }

        if ($vft === 'lParticiple') {
            $gender  = $form['verbGender'] ?? '';
            $number  = $form['number'] ?? '';
            $animacy = $form['verbAnimacy'] ?? '';
            if (!$gender || !$number) {
                return ['ok' => false, 'expected' => null, 'message' => 'Chybí rod nebo číslo l-příčestí.'];
            }
            if ($number === 'singular') {
                $idx = match ($gender) { 'masculine' => 0, 'feminine' => 1, 'neuter' => 2, default => -1 };
            } else {
                if ($gender === 'masculine') {
                    if (!$animacy) {
                        return ['ok' => false, 'expected' => null, 'message' => 'Chybí životnost l-příčestí pro mužský rod množného čísla.'];
                    }
                    $idx = $animacy === 'animate' ? 3 : 4;
                } elseif ($gender === 'feminine') {
                    $idx = 4;
                } elseif ($gender === 'neuter') {
                    $idx = 5;
                } else {
                    $idx = -1;
                }
            }
            if ($idx < 0) {
                return ['ok' => false, 'expected' => null, 'message' => 'Neznámý rod.'];
            }
            $ending  = $lpartTable[$modelName][$idx];
            $expected = $stem . $ending;
            return $expected === $surface
                ? ['ok' => true, 'expected' => $expected, 'message' => null]
                : ['ok' => false, 'expected' => $expected, 'message' => "Použitý tvar „{$surface}\" neodpovídá modelu {$modelName} l-příčestí (očekáváno „{$expected}\")."];
        }

        return ['ok' => false, 'expected' => null, 'message' => "Neznámý druh slovesného tvaru „{$vft}\"."];
    }

    // ─────────────────────────────────────────────────────────
    // validateAuxiliary (mirrors morpho.mjs validateAuxiliary)
    // ─────────────────────────────────────────────────────────

    private function validateAuxiliary(array $w): array {
        $surface = mb_strtolower($this->nfc($w['surface'] ?? ''), 'UTF-8');
        $allowed = $this->nd['aux_byt_forms'];
        if (!in_array($surface, $allowed, true)) {
            return ['ok' => false, 'expected' => null, 'message' => "„{$surface}\" není v normativní uzavřené sadě pomocných tvarů být."];
        }
        return ['ok' => true, 'expected' => $surface, 'message' => null];
    }

    // ─────────────────────────────────────────────────────────
    // validateForm (mirrors morpho.mjs validateForm)
    // ─────────────────────────────────────────────────────────

    private function validateForm(array $w): array {
        $pos  = $w['pos'] ?? '';
        $role = $w['role'] ?? '';
        if (in_array($pos, ['preposition', 'conjunction'], true)) {
            return ['ok' => true, 'expected' => null, 'message' => null];
        }
        if ($role === 'auxiliary') return $this->validateAuxiliary($w);
        if ($pos === 'noun')       return $this->validateNoun($w);
        if ($pos === 'adjective')  return $this->validateAdjective($w);
        if ($pos === 'verb')       return $this->validateVerb($w);
        return ['ok' => true, 'expected' => null, 'message' => null];
    }

    // ─────────────────────────────────────────────────────────
    // Field schema completeness check (mirrors validation.mjs deriveValidationState)
    // ─────────────────────────────────────────────────────────

    private function checkFieldSchema(array $w): array {
        $missing = [];
        $pos     = $w['pos'] ?? '';
        $role    = $w['role'] ?? '';
        $singles = $this->nd['single_tokens'];
        $singlePreps = $this->nd['single_prepositions'];
        $singleConjs = $this->nd['single_conjunctions'];
        $foldedS = $this->folded($w['surface'] ?? '');

        $validPos = $this->nd['valid_pos'];
        if (!in_array($pos, $validPos, true)) $missing[] = 'Slovní druh.';

        // Single-token POS cross-check
        $isPrep = in_array($foldedS, $singlePreps, true);
        $isConj = in_array($foldedS, $singleConjs, true);
        if (($isPrep !== ($pos === 'preposition')) || ($isConj !== ($pos === 'conjunction'))) {
            $missing[] = 'Jednopísmenná výjimka a slovní druh si odporují.';
        }
        if ($pos === 'preposition' && $role !== 'preposition') $missing[] = 'Předložka má technickou roli bez hlavní větné funkce.';
        if ($pos === 'conjunction' && $role !== 'coordination') $missing[] = 'Spojka má roli koordinace.';

        $isFunctional = in_array($pos, ['preposition', 'conjunction'], true);
        if ($isFunctional) {
            if (($w['lexicalStatus'] ?? '') !== 'real' || $this->folded($w['lemma'] ?? '') !== $foldedS) {
                $missing[] = 'Identita funkčního slova musí odpovídat jednopísmenné výjimce.';
            }
        } else {
            if ($role === 'auxiliary') {
                if ($this->folded($w['lemma'] ?? '') !== 'být') $missing[] = 'Pomocné sloveso musí mít lemma „být".';
                if (($w['lexicalStatus'] ?? '') !== 'real') $missing[] = 'Pomocné „být" má lexikální status skutečného slova.';
            } else {
                $lemma = trim($w['lemma'] ?? '');
                if (!$lemma) $missing[] = 'Základní tvar / neurčitek.';
                if (!in_array($w['lexicalStatus'] ?? '', ['real', 'quasi'], true)) $missing[] = 'Skutečné slovo nebo kvazislovo podle celé identity.';
                if ($pos === 'pronoun' && ($w['lexicalStatus'] ?? '') !== 'real') $missing[] = 'Nová zájmena nelze vytvářet.';

                // Model check
                $nounModels = $this->nd['noun_models'];
                $adjModels  = $this->nd['adj_models'];
                $verbModels = $this->nd['verb_models'];
                $hasModel = match ($pos) {
                    'noun'      => isset($nounModels[$w['model'] ?? '']),
                    'adjective' => isset($adjModels[$w['model'] ?? '']),
                    'verb'      => isset($verbModels[$w['model'] ?? '']),
                    default     => true,
                };
                if (!$hasModel) $missing[] = 'Povolený soutěžní model.';

                // Identity match for noun
                if ($pos === 'noun' && isset($nounModels[$w['model'] ?? ''])) {
                    $m = $nounModels[$w['model']];
                    $identity = $w['identity'] ?? [];
                    if (isset($m['gender']) && $m['gender'] !== '' && ($identity['gender'] ?? '') !== $m['gender']) {
                        $missing[] = 'Rod nebo životnost neodpovídá zvolenému modelu.';
                    }
                    if (isset($m['animacy']) && $m['animacy'] !== '' && ($identity['animacy'] ?? '') !== $m['animacy']) {
                        $missing[] = 'Rod nebo životnost neodpovídá zvolenému modelu.';
                    }
                }

                // Required form fields for each POS
                if ($pos === 'noun') {
                    if (!($w['form']['case'] ?? '')) $missing[] = 'Pád použitého tvaru.';
                    if (!($w['form']['number'] ?? '')) $missing[] = 'Číslo použitého tvaru.';
                } elseif ($pos === 'adjective') {
                    if (!($w['form']['gender'] ?? '')) $missing[] = 'Rod použitého tvaru.';
                    if (!($w['form']['case'] ?? '')) $missing[] = 'Pád použitého tvaru.';
                    if (!($w['form']['number'] ?? '')) $missing[] = 'Číslo použitého tvaru.';
                } elseif ($pos === 'verb') {
                    if (!($w['form']['verbFormType'] ?? '')) $missing[] = 'Druh slovesného tvaru.';
                    if (!($w['form']['aspect'] ?? '')) $missing[] = 'Vid.';
                    $valDecl = trim($w['valency']['declaration'] ?? '');
                    if (!$valDecl) $missing[] = 'Valenční obhajoba — jaká doplnění použití vyžaduje, která slova je realizují a o jaké české sloveso se opírá.';
                }

                $morphEvidence = trim($w['evidence']['morphology'] ?? '');
                if (!$morphEvidence) $missing[] = 'Morfologická obhajoba a odkaz na použitý model.';
            }
        }

        if (($w['evidence']['needsAnalogy'] ?? false)) {
            if (!trim($w['evidence']['explanation'] ?? '') || !trim($w['evidence']['analogy'] ?? '')) {
                $missing[] = 'Obhajoba nejasného/fiktivního vztahu a běžná česká analogie.';
            }
        }

        return $missing;
    }

    // ─────────────────────────────────────────────────────────
    // charScore computation (mirrors validation.mjs charScore)
    // ─────────────────────────────────────────────────────────

    private function computeCharScore(array $tokens, array $sequenceIssueIds): int {
        $score = 0;
        foreach ($tokens as $w) {
            $s = $this->nfc($w['surface'] ?? '');
            $len = $this->mbLen($s);
            if (($w['kvaziPrefix'] ?? '') === 'kvazi' && !in_array($w['id'], $sequenceIssueIds, true)) {
                $score += $len - $this->nd['kvazi_prefix_len'];
            } else {
                $score += $len;
            }
        }
        return $score;
    }

    // ─────────────────────────────────────────────────────────
    // Full deriveValidationState (mirrors validation.mjs deriveValidationState)
    // ─────────────────────────────────────────────────────────

    public function deriveValidationState(array $draft): array {
        $tokens     = $draft['tokens'] ?? [];
        $sentType   = $draft['sentenceType'] ?? '';
        $punctMap   = $this->nd['punctuation'];
        $implicit   = $draft['implicitSubject'] ?? false;

        $sequence = $this->validateTokenSequence($tokens);
        $syntax   = $this->validateSyntax($draft);

        $sentenceIssues = [];
        $predicates     = array_filter($tokens, fn($w) => ($w['role'] ?? '') === 'predicate');
        $subjects       = array_filter($tokens, fn($w) => ($w['role'] ?? '') === 'subject');
        $verbs          = array_filter($tokens, fn($w) => ($w['pos'] ?? '') === 'verb');
        $auxiliaries    = array_filter($tokens, fn($w) => ($w['role'] ?? '') === 'auxiliary');
        $fullContentVerbs = array_filter($verbs, fn($w) => ($w['role'] ?? '') !== 'auxiliary');

        if (!array_key_exists($sentType, $punctMap)) $sentenceIssues[] = 'Vyberte typ věty.';

        $fullVerbOk = count($fullContentVerbs) === 1;
        if (!$fullVerbOk) $sentenceIssues[] = 'Věta musí obsahovat právě jeden plnovýznamový slovesný token.';
        if (count($predicates) !== 1) $sentenceIssues[] = 'Věta musí mít právě jeden přísudek.';

        if ($implicit) {
            if ($sentType !== 'imperative' || count($subjects) !== 0) {
                $sentenceIssues[] = 'Nevyjádřený podmět je možný jen u rozkazovací věty bez explicitního podmětu.';
            }
            // For implicit subject in imperative, the verb must have a known model
            $verbArr = array_values($verbs);
            $verbModels = $this->nd['verb_models'];
            $verbModel = $verbArr[0]['model'] ?? '';
            if (!isset($verbModels[$verbModel])) {
                $sentenceIssues[] = 'Dovolený imperativ pro nevyjádřený podmět musí určit dokončený slovesný model (#2/#4).';
            }
        } elseif (count($subjects) !== 1) {
            $sentenceIssues[] = 'Věta musí mít právě jeden výslovný podmět.';
        }

        // Per-token check
        $tokenResults = [];
        $identities   = [];
        foreach ($tokens as $w) {
            $missing   = $this->checkFieldSchema($w);
            $formCheck = $this->validateForm($w);

            // Duplicate identity check for nouns/adjectives
            $pos = $w['pos'] ?? '';
            $nounModels = $this->nd['noun_models'];
            $adjModels  = $this->nd['adj_models'];
            if (in_array($pos, ['noun', 'adjective'], true) && trim($w['lemma'] ?? '') !== '') {
                $hasModel = $pos === 'noun' ? isset($nounModels[$w['model'] ?? '']) : isset($adjModels[$w['model'] ?? '']);
                if ($hasModel) {
                    $parts = [$pos, $this->folded($w['lemma'] ?? ''), $w['model'] ?? ''];
                    if ($pos === 'noun') {
                        $parts[] = $w['identity']['gender'] ?? '';
                        $parts[] = $w['identity']['animacy'] ?? '';
                    }
                    $identKey = implode('|', $parts);
                    if (isset($identities[$identKey])) {
                        $missing[] = 'Soutěžní identita už je ve větě použita.';
                        $tokenResults[$identities[$identKey]]['missing'][] = 'Soutěžní identita už je ve větě použita.';
                    }
                    $identities[$identKey] = $w['id'];
                }
            }

            $tokenResults[$w['id']] = ['missing' => $missing, 'formCheck' => $formCheck, 'issues' => []];
        }

        // Unique IDs check
        $ids = array_column($tokens, 'id');
        if (count(array_unique($ids)) !== count($ids) || in_array('', $ids, true) || in_array(null, $ids)) {
            $sentenceIssues[] = 'Interní ID slov musejí být neprázdná a jedinečná.';
        }

        $structureOk  = !empty($tokens) && !array_filter($tokenResults, fn($t) => !empty($t['missing']));
        $morphologyOk = !empty($tokens) && !array_filter($tokenResults, fn($t) => !$t['formCheck']['ok']);
        $sentenceOk   = empty($sentenceIssues);

        // Merge sequence/syntax issues into per-token results
        foreach ($tokens as $w) {
            $tokenIssues = [];
            foreach ($sequence['issues'] as $issue) {
                if ($issue['id'] === null || $issue['id'] === $w['id']) $tokenIssues[] = $issue['message'];
            }
            foreach ($syntax['issues'] as $issue) {
                if ($issue['id'] === $w['id']) $tokenIssues[] = $issue['message'];
            }
            $tokenResults[$w['id']]['issues'] = $tokenIssues;
            $tokenResults[$w['id']]['complete'] = empty($tokenResults[$w['id']]['missing'])
                && empty($tokenIssues)
                && $tokenResults[$w['id']]['formCheck']['ok'];
        }

        // charScore
        $sequenceIssueIds = array_map(fn($i) => $i['id'], array_filter($sequence['issues'], fn($i) => $i['id'] !== null));
        $charScore = $this->computeCharScore($tokens, $sequenceIssueIds);

        // Text preview
        $previewParts = [];
        foreach ($tokens as $i => $w) {
            $s = $this->nfc($w['surface'] ?? '');
            $previewParts[] = $i === 0 && $s !== '' ? mb_strtoupper(mb_substr($s, 0, 1, 'UTF-8'), 'UTF-8') . mb_substr($s, 1, null, 'UTF-8') : $s;
        }
        $termPunct = $draft['closingPunct'] ?? ($punctMap[$sentType] ?? '');
        $text = implode(' ', $previewParts) . $termPunct;

        $submitReady = $sequence['ok'] && $syntax['ok'] && $sentenceOk && $structureOk && $morphologyOk;

        return [
            'sequence'      => $sequence,
            'syntax'        => $syntax,
            'sentenceIssues' => $sentenceIssues,
            'tokens'        => $tokenResults,
            'structureOk'   => $structureOk,
            'morphologyOk'  => $morphologyOk,
            'sentenceOk'    => $sentenceOk,
            'fullVerbOk'    => $fullVerbOk,
            'submitReady'   => $submitReady,
            'text'          => $text,
            'wordCount'     => count($tokens),
            'charScore'     => $charScore,
        ];
    }
}

/**
 * Načte aktivní rules release a vrátí inicializovaný validátor.
 * Hledá normativní data relativně k $appRoot (= adresář app/).
 */
function kvazi_load_validator(string $appRoot): KvaziValidator {
    $activeReleaseFile = $appRoot . '/data/active-release.json';
    if (!file_exists($activeReleaseFile)) {
        throw new RuntimeException("Chybí konfigurace aktivního rules releasu: $activeReleaseFile");
    }
    $activeRelease = json_decode(file_get_contents($activeReleaseFile), true, 512, JSON_THROW_ON_ERROR);
    $version = $activeRelease['version'] ?? '';
    if (!$version) throw new RuntimeException("active-release.json neobsahuje pole version.");

    $normativePath = $appRoot . "/data/rules/{$version}/normative.json";
    if (!file_exists($normativePath)) {
        throw new RuntimeException("Normativní data rules verze „{$version}\" nenalezena: $normativePath");
    }
    return new KvaziValidator($normativePath);
}
