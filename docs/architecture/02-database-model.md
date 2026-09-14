# Databázový model

> **Status:** návrh logického modelu. Konkrétní SQL je v `db/schema-draft.sql`.

## Domény

Databáze pokrývá:

1. verze pravidel,
2. morfologické číselníky a modely,
3. interní katalog lexémů/tvarů,
4. věty a jejich revize,
5. tokeny a deklarované analýzy,
6. syntaxi,
7. validační běhy,
8. zdroje,
9. komentáře,
10. magic linky,
11. administraci,
12. audit.

## Hlavní tabulky

### Pravidla a katalog
- `rule_version`
- `catalog_version`
- `part_of_speech`
- `morph_category`
- `morph_value`
- `pos_morph_category`
- `morph_pattern`
- `morph_combination`
- `morph_combination_value`

### Lexikální a morfologický katalog
- `lexeme`
- `lexeme_identity`
- `identity_morph_value`
- `accepted_word_form`
- `word_form_morph_value`
- `valency_frame`
- `valency_slot`
- `identity_valency`
- `reference_source`
- `catalog_evidence`

### Soutěžní data
- `sentence`
- `sentence_revision`
- `sentence_rule_validation`
- `sentence_token`
- `token_analysis`
- `token_analysis_value`
- `syntax_role`
- `token_syntax`
- `token_supplement_syntax`
- `token_coordination_syntax`
- `analysis_evidence`

### Validace
- `validation_run`
- `validation_issue`

### Komentáře a anonymita
- `commenter_identity`
- `comment_magic_link`
- `comment`

### Administrace
- `admin_user`
- `sentence_status_history`
- `admin_audit_log`

## Klíčové vztahy

### `pos_morph_category`
Určuje, které morfologické kategorie se používají u kterého slovního druhu a zda jsou:
- povinné,
- součást soutěžní identity,
- pouze vlastností konkrétního tvaru.

### `lexeme_identity`
Jedno lemma může mít více soutěžních identit. Identita proto není uložená přímo v `lexeme`.

Status skutečné slovo / kvazislovo se nesmí odvozovat pouze ze zápisu lemmatu nebo povrchového tvaru. Dvě položky se stejným zápisem mohou představovat doloženou skutečnou identitu a odlišnou kvaziidentitu; katalog je musí umět vést odděleně. Deklaraci shodnou s doloženou skutečnou identitou naopak nelze uložením druhé položky proměnit v kvazislovo.

### `accepted_word_form`
Reprezentuje jeden interně schválený konkrétní povrchový tvar. Stejný povrchový řetězec může mít více různých přípustných analýz.

### `sentence_revision`
Je neměnná konkrétní verze soutěžního podání. Editace vytváří novou revizi.

### `sentence_rule_validation`
Reprezentuje platnost jedné revize vůči konkrétní verzi pravidel a umožňuje revalidaci bez nového podání.

### `syntax_role`
Reprezentuje uzavřenou hlavní syntaktickou funkci. Odborný významový podtyp není povinným číselníkem a příklady z kvazitaháku se nesmějí změnit v technický whitelist.

### Syntaktické vztahy
Pro MVP se používá specializovaný model odpovídající uzavřené syntaxi:

- `token_syntax.head_token_id` ukládá jedno řídící slovo běžného členu; u přísudku je prázdné,
- `token_supplement_syntax` ukládá pro doplněk povinnou vazbu k přísudku a povinnou vazbu k podmětu nebo předmětu,
- `token_coordination_syntax` ukládá pro spojku `a` nebo `i` povinné vazby k oběma spojovaným částem.

Specializované tabulky odkazují na příslušný záznam `token_syntax`. Žádnou z těchto povinných vazeb nelze nahradit polem `description` ani jiným volným textem. Obecný graf syntaktických hran se pro MVP nezavádí.

## Důležité invarianty

1. `sentence_revision` je neměnná.
2. revalidace vůči nové verzi nevytváří nové podání.
3. katalog není nad pravidly.
4. uživatelská deklarace automaticky nerozšiřuje katalog.
5. veřejný web neumožní vytěžit úplný interní katalog.
6. morfologická pravda je oddělena od toho, co autor věty pouze deklaruje.
7. každý token podané revize má úplnou deklarovanou identifikaci a všechny pravidly vyžadované syntaktické vztahy uložené strukturovaně.
8. klasifikace skutečné slovo / kvazislovo se vyhodnocuje nad celou soutěžní identitou, nikoli nad samotným zápisem.
9. každý zveřejněný morfologický model ukládá přesný vztah mezi základním a použitým tvarem a pro jeden použitý tvar nepřipouští libovolně mnoho identit.
10. běžný syntaktický člen má nejvýše jedno řídící slovo; doplněk a koordinace mají všechny své dvě povinné vazby ve specializované struktuře.
