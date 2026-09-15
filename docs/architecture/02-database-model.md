# Databázový model

> **Status:** cílový logický model MVP. Konkrétní SQL musí tento model respektovat; `db/schema-draft.sql` je pracovní implementační artefakt, nikoli zdroj produktových pravidel.

## Domény

Databáze pokrývá:

1. verze pravidel a immutable manifest normativního balíku,
2. verzované normativní morfologické/syntaktické modely,
3. uživatelské účty, session/recovery data a role,
4. **spravovaný katalog skutečných slov** jako samostatnou lexikální autoritu,
5. **interní morfologickou review cache** pro konkrétní `rules_version`,
6. věty, editovatelné drafty a immutable revize,
7. výskyty slov a uživatelské deklarované analýzy,
8. specializovanou syntaxi,
9. zdroje a obhajobu,
10. validační běhy, obsahové verdicty a procesní compliance,
11. administrativní rozhodnutí a audit.

Katalog skutečných slov a interní review cache jsou dvě oddělené domény s odlišným lifecyclem a nesmějí být implementovány jako jeden významově nejasný katalogový stav.

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

E-mail je neveřejný; veřejná atribuce používá `username`. Účet může reprezentovat jednotlivce i kolektiv a e-mail může patřit jednotlivci nebo skupině. Datový model neeviduje samostatné spoluautory ani identity lidí stojících za účtem.

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
- právě povolené realizace každé kombinace,
- uzavřenou normativní sadu pomocných tvarů `být` a jejich společnou soutěžní identitu `být`.

Obecná existence české dublety mimo normativní data nesmí sama vytvořit další povolenou realizaci.

Datový návrh musí zabránit kombinaci hodnot z nesouvisejících kategorií. Kde je kategorie jednoznačně odvoditelná z hodnoty, nemá se ukládat redundantně bez odpovídajícího DB invariantu.

Pomocné `být` není produktivní šestý slovesný model a jeho normativně vyjmenované pomocné tvary nepodléhají katalogu skutečných slov.

## Katalog skutečných slov

Katalog skutečných slov je samostatná lexikální autorita pro status **skutečné slovo / kvazislovo**. Není obecně scoped na jednu `rules_version` a jeho průběžná oprava sama o sobě nevytváří novou verzi pravidel.

### Semantika
Katalog rozhoduje exact match nad:
- úplnou soutěžní identitou,
- konkrétním použitým tvarem.

Záznam musí umožnit jednoznačně určit, že přesně tato kombinace je uznána jako skutečné slovo. Stejný povrchový zápis s jinou soutěžní identitou není automaticky stejná katalogová položka.

### Veřejné rozhraní
Hráč smí po zadání kompletního vlastního návrhu získat pouze exact-match odpověď, zda tato kombinace již je schválena jako skutečné slovo.

Katalog nesmí poskytovat:
- browse/export,
- prefixové hledání,
- autocomplete,
- podobné položky,
- nabídku možných identit nebo alternativních tvarů.

Nenalezený exact match neznamená automatické zamítnutí; kandidát může jít k ručnímu review a případnému doplnění katalogu.

### Historie a audit
Správa katalogu musí být auditovatelná: kdo záznam změnil, kdy, na základě jakého důvodu/zdrojů a jaký byl předchozí stav. Katalog se však záměrně nechová jako immutable součást `rules_version`.

## Interní morfologická review cache

Review cache je neveřejná provozní znalostní báze podřízená pravidlům. Je oddělena od katalogu skutečných slov.

### Základní semantika
Pro konkrétní soutěžní identitu/tvar a konkrétní `rules_version` existuje rozhodující stav:
- `APPROVED`,
- `REJECTED`,
- `UNKNOWN` = neexistuje rozhodný záznam.

Review cache začíná pro novou `rules_version` z hlediska automatického schvalování prázdná. Historická znalost starších verzí se zachová, ale nepřenáší se automaticky.

### Rozhodnutí review cache
Každé finální rozhodnutí musí uchovat:
- přesný rozhodovaný objekt/identitu/tvar,
- `rules_version`,
- výsledek,
- rozhodujícího admina (`user_id`),
- čas,
- důvod a navázané zdroje,
- dostatečnou historickou/provenance informaci pro reprodukci pozdější validace.

Implementace může používat samostatnou `review_cache_revision` nebo eventové historizování. Technická reprezentace je otevřená, ale validační provenance musí jednoznačně určit tehdejší rozhodnou znalost.

Review cache není veřejný membership oracle a nerozhoduje status skutečné slovo / kvazislovo.

## Věta, draft a immutable revize

### `sentence`
Dlouhodobý logický kontejner řešení. Nese minimálně stabilní ID, právě jeden owning `user_id` a veřejný slug/identifikátor. Owning účet může reprezentovat jednotlivce i kolektiv; samostatní spoluautoři se neevidují. `sentence` nemá nést měnitelný obsah, který by zpětně změnil již posouzenou revizi.

### Draft
Editovatelný pracovní stav uživatele. Technicky může být samostatnou entitou nebo explicitně označeným pracovním snapshotem, ale nikdy není cílem finálního administrativního verdiktu.

### `sentence_revision`
Neměnný snapshot vytvořený každým submittem. Obsahuje nebo jednoznačně vlastní všechny údaje, které byly předmětem podání:
- pořadí výskytů slov,
- typ věty,
- závěrečnou interpunkci,
- uživatelské morfologické a syntaktické deklarace,
- morfologické vlastnosti konkrétního použití podle #86,
- zdroje/obhajobu,
- fiktivní význam / kvazietymologii, pokud jsou součástí podání,
- owning/submitting `user_id` a čas submitu,
- verzi pravidel platnou při původním podání.

Nepoužité tvary celého paradigmatu nejsou povinnou součástí hráčovy revize; jsou deterministicky odvoditelné z normativního modelu.

Vrácení k doplnění nepřepisuje revizi. Nový submit vytvoří revizi další.

Submission/review stav a všechna rozhodnutí musí být jednoznačně svázána s konkrétní `sentence_revision`, nikoli pouze s nadřazenou `sentence`.

## Výskyty slov a deklarovaná analýza

### `sentence_token`
Technický identifikátor konkrétního skutečně zapsaného soutěžního slova v jedné revizi. Uchovává pořadí a povrchový tvar. Token je technická reference; jazykové vlastnosti náležejí deklaraci konkrétního výskytu slova.

Skutečně zapsaný pomocný tvar `být` je samostatný `sentence_token`: samostatně prochází povrchovou validací, počítá se jako slovo a jeho znaky standardně do sekundárního skóre. Syntakticky však patří do téhož jediného přísudku jako příslušný plnovýznamový slovesný token a všechny povolené pomocné tvary sdílejí jednu soutěžní identitu `být`.

### Uživatelská deklarace
Musí být datově oddělena od pozdějšího výsledku katalogu skutečných slov i od interní review cache. Uživatelská deklarace sama nevytváří autoritativní morfologickou nebo lexikální pravdu.

Podle POS/modelu zachycuje minimálně úplnou soutěžní identitu, lemma/základní tvar, morfologické hodnoty konkrétního použití, použitý povrchový tvar, syntaktickou funkci/technickou roli, povinné vztahy a evidence.

U substantiva musí datový model explicitně odlišit normativní prefixaci `kvazi-` od samotného základu. Cílová deklarace proto obsahuje ekvivalent pole `kvaziPrefix = none | kvazi` a samostatně základní substantivní identitu. Prefixovaná identita je od základní identity odlišná, ale morfologii a syntaktické chování dědí ze základu podle `07-prefix-kvazi.md`. Prefix není katalogovým heslem sám o sobě a nelze jej použít rekurzivně.

Resolved odkazy katalogu skutečných slov a výsledky review cache patří do samostatných semantických vrstev, ne do původního tvrzení hráče.

## Syntaxe

Pro MVP se používá specializovaný model, ne obecný graf hran.

- běžný závislý člen: právě jedno řídící slovo,
- přísudek: bez headu; obsahuje právě jeden plnovýznamový slovesný token a může obsahovat normativně povolený pomocný token `být` téhož složeného slovesného tvaru,
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

Zdroj nesmí existovat jen jako globální bibliografický záznam bez vazby na tvrzení. Pro MVP stačí strukturovaný seznam zdrojů/obhajoby navázaný alespoň na konkrétní uživatelskou analýzu, rozhodnutí katalogu skutečných slov nebo rozhodnutí review cache. Jemnější claim-level evidence lze přidat později.

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
- relevantní provenance interní review cache,
- `validator_version`,
- automatický vs. ruční původ výsledku,
- čas a případného rozhodujícího admina.

Pokud rozhodnutí záviselo na tehdejším statusu skutečného slova, musí být dohledatelná i použitá katalogová položka/revize katalogu skutečných slov. To z katalogu skutečných slov nedělá součást `rules_version`.

Nová `rules_version` může vytvořit nový validační výsledek nad stejnou immutable revizí.

## Text a skóre

Kanonickým zdrojem textu jsou seřazené tokeny revize a její typem určená závěrečná interpunkce. Pokud se pro výkon ukládá `sentence_text`, `normalized_text` nebo skóre jako cache, generuje je pouze server a musí být deterministicky ověřitelné z kanonických dat.

Skóre, jehož semantics mohou být verzované, patří k validačnímu výsledku pro konkrétní `rules_version`, nikoli jako jediná neměnná hodnota celé revize.

Při sekundárním skóre se všechny skutečně zapsané soutěžní znaky standardně počítají (`Q = 1`, `KV = 2`) s jedinou úzkou výjimkou: přesně pět znaků normativního substantivního prefixu `kvazi-` má skórovou hodnotu 0. Prefixované substantivum zůstává jedním slovem pro primární skóre.

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
5. katalog skutečných slov a interní review cache jsou dvě oddělené domény.
6. katalog skutečných slov není obecně scoped na `rules_version`; review cache ano.
7. absence review-cache záznamu znamená `UNKNOWN`, ne neplatnost.
8. hráč smí exact-match dotaz pouze do katalogu skutečných slov nad kompletním vlastním návrhem; review cache se před submittem neprozrazuje.
9. uživatelská deklarace je oddělena od obou resolved vrstev.
10. syntaktické reference nesmějí překročit hranici revize.
11. normativní modely a číselníky jsou reprodukovatelné pro konkrétní rules version.
12. typ věty a interpunkce tvoří deterministický invariant.
13. text a skóre nesmějí driftovat od kanonické tokenové reprezentace; pět znaků normativního prefixu `kvazi-` je jediná explicitní skórová výjimka.
14. prefix `kvazi-` je v deklaraci explicitně odlišen od základní substantivní identity a nesmí být rekurzivní.
15. skutečně zapsané pomocné `být` je samostatný soutěžní token, ale syntakticky součást jediného přísudku a sdílí jednu identitu `být`.
16. administrátor je `user_account` s rolí `ADMIN`, ne samostatná identita.
17. jedno podání vlastní právě jeden účet; spoluautoři/osoby za účtem se neevidují.
18. komentáře a magic-link identity nejsou součástí MVP.
