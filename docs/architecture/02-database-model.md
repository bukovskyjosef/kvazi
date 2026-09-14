# Databázový model

> **Status:** cílový logický model MVP. Konkrétní SQL musí tento model respektovat; `db/schema-draft.sql` je pracovní implementační artefakt, nikoli zdroj produktových pravidel.

## Domény

Databáze pokrývá:

1. verze pravidel a immutable manifest normativního balíku,
2. verzované normativní morfologické/syntaktické modely,
3. uživatelské účty, session/recovery data a role,
4. interní učící se katalog znalostí pro konkrétní `rules_version`,
5. věty, editovatelné drafty a immutable revize,
6. výskyty slov a uživatelské deklarované analýzy,
7. specializovanou syntaxi,
8. zdroje a obhajobu,
9. validační běhy, obsahové verdicty a procesní compliance,
10. administrativní rozhodnutí a audit.

Komentáře, komentářové identity a magic linky nejsou součástí MVP.

## Pravidla a manifest

### `rule_version`
Identifikuje jedno vydané znění soutěžních pravidel. Samotné číslo verze musí jednoznačně určit veškerý normativní obsah, který může změnit verdikt.

### `rule_manifest_item`
Logická položka immutable manifestu jedné `rule_version`:
- identifikátor/cesta artefaktu,
- kryptografický hash,
- případně typ artefaktu.

`rule_version` může ukládat také hash celého manifestu a referenční Git commit/tag. Git reference je metadata, nikoli náhrada manifestu.

Normativní číselníky, paradigmata a povolené realizace, které mohou změnit verdikt, musí být reprodukovatelné pro konkrétní `rule_version`; nesmějí existovat pouze jako přepisovatelný aktuální stav.

## Uživatelské účty

### `user_account`
Minimálně:
- stabilní interní `user_id`,
- globálně unikátní `username`,
- globálně unikátní kanonizovaný e-mail,
- bezpečný password hash,
- role `USER` nebo `ADMIN`,
- stav účtu a auditní časy.

E-mail je neveřejný; veřejná atribuce používá `username`.

Administrátor není jiný typ identity. Je to běžný uživatelský účet s rolí `ADMIN`, kterou nelze získat veřejnou registrací ani změnit klientským UI.

### `password_reset_token`
Jednorázový, časově omezený recovery token. Databáze ukládá pouze bezpečnou odvozenou reprezentaci tokenu, nikoli jeho plaintext. Reset token není magic-link login.

Session model musí umožnit bezpečnou invalidaci/rotaci a server-side kontrolu oprávnění.

## Normativní morfologické modely

Logický model musí umět reprezentovat pro konkrétní `rule_version` zejména:
- povolené slovní druhy,
- soutěžní morfologické modely,
- kategorie a hodnoty,
- které vlastnosti tvoří soutěžní identitu,
- které kombinace tvoří jednotlivé buňky normativního paradigmatu,
- jednu nebo více explicitně povolených realizací každé kombinace.

Obecná existence české dublety mimo normativní data nesmí sama vytvořit další povolenou realizaci.

Datový návrh musí zabránit kombinaci hodnot z nesouvisejících kategorií. Kde je kategorie jednoznačně odvoditelná z hodnoty, nemá se ukládat redundantně bez odpovídajícího DB invariantu.

## Interní katalog

Katalog je provozní znalostní báze podřízená pravidlům, nikoli normativní whitelist všeho myslitelného.

### Základní semantika
Pro konkrétní soutěžní identitu/tvar a konkrétní `rules_version` existuje rozhodující stav:
- `APPROVED`,
- `REJECTED`,
- `UNKNOWN` = neexistuje rozhodný záznam.

Katalog začíná pro novou `rules_version` z hlediska automatického schvalování prázdný. Historická znalost starších verzí se zachová, ale nepřenáší se automaticky.

### Katalogové rozhodnutí
Každé finální katalogové rozhodnutí musí uchovat:
- přesný rozhodovaný objekt/identitu/tvar,
- `rules_version`,
- výsledek,
- rozhodujícího admina (`user_id`),
- čas,
- důvod a navázané zdroje,
- dostatečnou historickou/provenance informaci pro reprodukci pozdější validace.

Implementace může používat samostatné `catalog_version` nebo intervalové/eventové historizování. Technická reprezentace je otevřená, ale jedna zaznamenaná validační provenance musí jednoznačně určit tehdejší kompletní stav katalogové znalosti.

Status skutečné slovo / kvazislovo se posuzuje nad celou soutěžní identitou, nikoli nad samotným zápisem. Stejný zápis může mít různé identity; doloženou skutečnou identitu nelze pouze přeznačit na kvazislovo.

## Věta, draft a immutable revize

### `sentence`
Dlouhodobý logický kontejner autorského řešení. Nese minimálně stabilní ID, autora (`user_id`) a veřejný slug/identifikátor. Nemá nést měnitelný obsah, který by zpětně změnil již posouzenou revizi.

### Draft
Editovatelný pracovní stav uživatele. Technicky může být samostatnou entitou nebo explicitně označeným pracovním snapshotem, ale nikdy není cílem finálního administrativního verdiktu.

### `sentence_revision`
Neměnný snapshot vytvořený každým submittem. Obsahuje nebo jednoznačně vlastní všechny údaje, které byly předmětem podání:
- pořadí výskytů slov,
- typ věty,
- závěrečnou interpunkci,
- uživatelské morfologické a syntaktické deklarace,
- navržená paradigmata a jejich potvrzený snapshot,
- zdroje/obhajobu,
- fiktivní význam / kvazietymologii, pokud jsou součástí podání,
- autora a čas submitu,
- verzi pravidel platnou při původním podání.

Vrácení k doplnění nepřepisuje revizi. Nový submit vytvoří revizi další.

Submission/review stav a všechna rozhodnutí musí být jednoznačně svázána s konkrétní `sentence_revision`, nikoli pouze s nadřazenou `sentence`.

## Výskyty slov a deklarovaná analýza

### `sentence_token`
Technický identifikátor konkrétního výskytu slova v jedné revizi. Uchovává pořadí a povrchový tvar. Token je technická reference; jazykové vlastnosti náležejí deklaraci konkrétního výskytu slova.

### Uživatelská deklarace
Musí být datově oddělena od pozdějšího interního katalogového rozpoznání. Uživatelská deklarace sama nevytváří autoritativní morfologickou pravdu.

Podle POS/modelu zachycuje minimálně úplnou soutěžní identifikaci, lemma/základní tvar, morfologické hodnoty, vlastní paradigma, syntaktickou funkci/technickou roli, povinné vztahy a evidence.

Resolved katalogové odkazy patří do výsledku katalogové/validační vrstvy, ne do stejné semantické vrstvy jako původní tvrzení hráče.

## Syntaxe

Pro MVP se používá specializovaný model, ne obecný graf hran.

- běžný závislý člen: právě jedno řídící slovo,
- přísudek: bez headu,
- doplněk: zvlášť vazba k přísudku a k podmětu/předmětu,
- koordinace: dvě různé spojované části,
- `k/v/z`: technická prepoziční role s právě jednou vazbou na řízené jmenné slovo; předložka sama nemá hlavní větnou funkci.

Všechny reference musí být databázově nebo ekvivalentně silným invariantem omezeny na správnou `sentence_revision`. Nesmí být možné propojit syntax dvou různých revizí.

## Typ věty

Každá revize nese explicitně deklarovaný typ věty:
- `DECLARATIVE` → `.`,
- `INTERROGATIVE` → `?`,
- `IMPERATIVE` → `!`.

Datový/validační model musí tento invariant vynutit. Režim nevyjádřeného podmětu je přípustný pouze tam, kde jej pravidla dovolují pro imperativ.

## Evidence

Zdroj nesmí existovat jen jako globální bibliografický záznam bez vazby na tvrzení. Pro MVP stačí strukturovaný seznam zdrojů/obhajoby navázaný alespoň na konkrétní uživatelskou analýzu nebo katalogové rozhodnutí. Jemnější claim-level evidence lze přidat později.

## Validace a tři oddělené osy

Systém nesmí slít do jednoho stavu:

1. **obsahovou/jazykovou platnost revize vůči `rules_version`,**
2. **historickou compliance procesu původního podání,**
3. **administrativní uznání/publikaci.**

Procesní compliance je historický fakt svázaný s podáním a tehdy platnou policy; při obsahové revalidaci podle nové verze se retroaktivně nepřehodnocuje.

### Validační provenance
Každý rozhodující validační záznam musí jednoznačně uvádět minimálně:
- `sentence_revision`,
- `rules_version`,
- katalogový snapshot/revision/provenance použitý při rozhodnutí,
- `validator_version`,
- automatický vs. ruční původ výsledku,
- čas a případného rozhodujícího admina.

Nová `rules_version` může vytvořit nový validační výsledek nad stejnou immutable revizí.

## Text a skóre

Kanonickým zdrojem textu jsou seřazené tokeny revize a její typem určená závěrečná interpunkce. Pokud se pro výkon ukládá `sentence_text`, `normalized_text` nebo skóre jako cache, generuje je pouze server a musí být deterministicky ověřitelné z kanonických dat.

Skóre, jehož semantics mohou být verzované, patří k validačnímu výsledku pro konkrétní `rules_version`, nikoli jako jediná neměnná hodnota celé revize.

## Admin audit

Citlivé administrativní zásahy se auditují minimálně údaji:
- admin `user_id`,
- akce,
- typ a ID entity,
- stav před/po změně nebo ekvivalentní strukturovaný diff,
- čas.

## Důležité invarianty

1. `sentence_revision` je immutable.
2. verdikt/review vždy míří na konkrétní revizi.
3. revalidace vůči nové rules version nevytváří novou revizi.
4. historický verdikt se nepřepisuje novým verdiktem.
5. katalog je podřízen pravidlům a je oddělený podle rules version.
6. absence katalogového záznamu znamená `UNKNOWN`, ne neplatnost.
7. katalog se před submittem uživateli neprozrazuje.
8. uživatelská deklarace je oddělena od katalogově resolved pravdy.
9. syntaktické reference nesmějí překročit hranici revize.
10. normativní modely a číselníky jsou reprodukovatelné pro konkrétní rules version.
11. typ věty a interpunkce tvoří deterministický invariant.
12. text a skóre nesmějí driftovat od kanonické tokenové reprezentace.
13. administrátor je `user_account` s rolí `ADMIN`, ne samostatná identita.
14. komentáře a magic-link identity nejsou součástí MVP.
