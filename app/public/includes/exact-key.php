<?php
declare(strict_types=1);

/** Canonical complete token keys. No client JSON object is persisted wholesale. */
function kvazi_key_text(mixed $value): string {
    $normalized = is_string($value) ? Normalizer::normalize($value, Normalizer::FORM_C) : false;
    if (!is_string($normalized) || $normalized === '' || !preg_match('/^\p{L}+$/uD', $normalized)) {
        throw new InvalidArgumentException('Neúplná nebo neplatná deklarace slova.');
    }
    return Normalizer::normalize(mb_strtolower($normalized, 'UTF-8'), Normalizer::FORM_C);
}

function kvazi_key_enum(array $values, string $field, array $nd, ?string $enum = null): string {
    $value = $values[$field] ?? null;
    if (!is_string($value) || !in_array($value, $nd['field_enums'][$enum ?? $field], true)) {
        throw new InvalidArgumentException('Neúplné nebo neplatné vlastnosti použitého tvaru.');
    }
    return $value;
}

function kvazi_key_prefix(string $surface, array $nd): bool {
    return str_starts_with($surface, $nd['kvazi_prefix']) && mb_strlen($surface, 'UTF-8') > $nd['kvazi_prefix_len'];
}

function kvazi_key_noun_lemma(string $lemma, array $model, array $nd): void {
    $last = mb_substr($lemma, -1, 1, 'UTF-8');
    $valid = match ($model['cond']) {
        'ends_consonant' => !str_contains($nd['vowels'], $last),
        'ends_a' => $last === 'a', 'ends_e' => $last === 'e',
        'ends_o' => $last === 'o', 'ends_í' => $last === 'í',
        default => false,
    };
    if (!$valid) throw new InvalidArgumentException('Lemma neodpovídá zvolenému modelu.');
}

/** Null denotes an explicitly normative functional/auxiliary exception. */
function kvazi_exact_key(array $token, array $nd, bool $catalog = false): ?array {
    $surface = kvazi_key_text($token['surface'] ?? null);
    $lemma = kvazi_key_text($token['lemma'] ?? null);
    $pos = $token['pos'] ?? null;
    if (!is_string($pos) || !in_array($pos, $nd['valid_pos'], true)) {
        throw new InvalidArgumentException('Neplatný slovní druh.');
    }
    if (in_array($surface, $nd['single_tokens'], true)) {
        $expectedPos = in_array($surface, $nd['single_prepositions'], true) ? 'preposition' : 'conjunction';
        if ($pos !== $expectedPos || $lemma !== $surface) throw new InvalidArgumentException('Neplatná funkční identita.');
        return null;
    }
    if (($token['role'] ?? '') === 'auxiliary') {
        if ($pos !== 'verb' || $lemma !== 'být' || !in_array($surface, $nd['aux_byt_forms'], true)) {
            throw new InvalidArgumentException('Neplatná pomocná identita.');
        }
        return null;
    }
    if (!in_array($token['lexicalStatus'] ?? null, $nd['field_enums']['lexicalStatus'], true)) {
        throw new InvalidArgumentException('Chybí deklarovaný status identity.');
    }
    $declaredIdentity = $token['identity'] ?? [];
    $declaredForm = $token['form'] ?? [];
    if (!is_array($declaredIdentity) || !is_array($declaredForm)) throw new InvalidArgumentException('Neplatná deklarace.');
    $prefix = kvazi_key_prefix($surface, $nd);
    if ($prefix && $pos !== 'noun') throw new InvalidArgumentException('Prefix je povolen pouze substantivům.');
    $baseLemma = $lemma;
    if ($prefix) {
        if (!str_starts_with($lemma, $nd['kvazi_prefix'])) throw new InvalidArgumentException('Chybí prefix lemmatu.');
        $baseLemma = kvazi_key_text(mb_substr($lemma, $nd['kvazi_prefix_len'], null, 'UTF-8'));
        $baseSurface = kvazi_key_text(mb_substr($surface, $nd['kvazi_prefix_len'], null, 'UTF-8'));
        if (kvazi_key_prefix($baseLemma, $nd) || kvazi_key_prefix($baseSurface, $nd)) {
            throw new InvalidArgumentException('Řetězení prefixu není povoleno.');
        }
        if ($catalog) { $lemma = $baseLemma; $surface = $baseSurface; }
    }
    $identity = ['pos' => $pos, 'lemma' => $lemma];
    $form = [];
    if (in_array($pos, ['noun', 'adjective', 'verb'], true)) {
        $models = $nd[match ($pos) { 'noun' => 'noun_models', 'adjective' => 'adj_models', 'verb' => 'verb_models' }];
        $modelName = $token['model'] ?? null;
        if (!is_string($modelName) || !isset($models[$modelName])) throw new InvalidArgumentException('Neplatný soutěžní model.');
        $model = $models[$modelName];
        $identity['model'] = $modelName;
    }
    if ($pos === 'noun') {
        kvazi_key_noun_lemma($baseLemma, $model, $nd);
        if (($declaredIdentity['gender'] ?? null) !== $model['gender']
            || ($declaredIdentity['animacy'] ?? '') !== ($model['animacy'] ?? '')) {
            throw new InvalidArgumentException('Rod nebo životnost neodpovídá modelu.');
        }
        $identity['gender'] = $model['gender'];
        if (!empty($model['animacy'])) $identity['animacy'] = $model['animacy'];
        if ($prefix && !$catalog) $identity['kvaziPrefix'] = true;
        foreach (['case', 'number'] as $field) $form[$field] = kvazi_key_enum($declaredForm, $field, $nd);
    } elseif ($pos === 'adjective') {
        foreach (['gender', 'case', 'number'] as $field) $form[$field] = kvazi_key_enum($declaredForm, $field, $nd);
        if (isset($model['source_gender'])) {
            $srcLemma = kvazi_key_text($declaredIdentity['sourceNounLemma'] ?? null);
            $srcName = $declaredIdentity['sourceNounModel'] ?? null;
            if (!is_string($srcName) || !isset($nd['noun_models'][$srcName])) throw new InvalidArgumentException('Chybí zdrojový model.');
            $src = $nd['noun_models'][$srcName];
            kvazi_key_noun_lemma($srcLemma, $src, $nd);
            $stem = $src['stem'] === 'drop_1' ? mb_substr($srcLemma, 0, -1, 'UTF-8') : $srcLemma;
            if ($src['gender'] !== $model['source_gender'] || $lemma !== $stem . $model['lemma_suffix']
                || !in_array($declaredForm['degree'] ?? '1', $model['degrees'], true)) {
                throw new InvalidArgumentException('Nekonzistentní přivlastňovací odvození.');
            }
        } else {
            if (!str_ends_with($lemma, $model['lemma_suffix'])) throw new InvalidArgumentException('Lemma neodpovídá modelu.');
            $form['degree'] = kvazi_key_enum($declaredForm, 'degree', $nd);
        }
    } elseif ($pos === 'verb') {
        if (!str_ends_with($lemma, $model['suffix']) || $lemma === $model['suffix']) {
            throw new InvalidArgumentException('Infinitiv neodpovídá modelu.');
        }
        $form['verbFormType'] = kvazi_key_enum($declaredForm, 'verbFormType', $nd);
        $form['aspect'] = kvazi_key_enum($declaredForm, 'aspect', $nd);
        $fields = match ($form['verbFormType']) {
            'present' => ['verbPerson', 'number'], 'imperative' => ['verbPerson'],
            'lParticiple' => ['verbGender', 'number'],
        };
        foreach ($fields as $field) {
            $form[$field] = kvazi_key_enum($declaredForm, $field, $nd,
                $field === 'verbPerson' && $form['verbFormType'] === 'imperative' ? 'imperativePerson' : null);
        }
        if ($form['verbFormType'] === 'lParticiple' && $form['verbGender'] === 'masculine' && $form['number'] === 'plural') {
            $form['verbAnimacy'] = kvazi_key_enum($declaredForm, 'verbAnimacy', $nd);
        }
    } elseif ($pos === 'pronoun') {
        if ($token['lexicalStatus'] !== 'real' || !empty($token['model'])) throw new InvalidArgumentException('Zájmeno je skutečná identita bez produktivního modelu.');
        $signature = $declaredForm['pronoun'] ?? null;
        if (!is_array($signature)) throw new InvalidArgumentException('Chybí úplná zájmenná form-signature.');
        foreach (['case', 'number', 'gender', 'person'] as $field) {
            $value = $signature[$field] ?? null;
            $allowed = $nd['field_enums'][$field === 'person' ? 'verbPerson' : $field];
            if (!is_string($value) || ($value !== 'notApplicable' && !in_array($value, $allowed, true))) {
                throw new InvalidArgumentException('Neúplná nebo neplatná zájmenná form-signature.');
            }
            $form[$field] = $value;
        }
    } else {
        throw new InvalidArgumentException('Tato kategorie nemá katalogový/review klíč.');
    }
    ksort($identity); ksort($form);
    return ['identity_json' => $identity, 'form_json' => $form, 'surface_form' => $surface];
}

function kvazi_key_json(array $object): string {
    return json_encode($object, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
}
