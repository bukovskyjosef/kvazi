# Validace

> **Status:** cílové hranice deterministické validace MVP.

## Vstup

Věta je tvořena seřazeným seznamem výskytů slov. Každé slovo je samostatný řetězec bez mezer. Frontend normalizuje text do Unicode NFC ještě před živou kontrolou; backend stejnou normalizaci autoritativně zopakuje. Mezery mezi slovy generuje aplikace.

Uživatel explicitně deklaruje typ věty. Z něj plyne závěrečná interpunkce:
- oznamovací → `.`,
- tázací → `?`,
- rozkazovací → `!`.

## Znaková validace

Aplikace může deterministicky kontrolovat:
- Unicode NFC a povolené znaky,
- délku běžného slova a zvláštní pravidlo prefixu `kvazi-`,
- automatickou inference prefixovaného substantiva v jednoznačném případě popsaném níže,
- jednopísmenné výjimky,
- pořadí tokenů,
- globální motivovou posloupnost včetně normativní prefixové výjimky,
- počet slov,
- sekundární skóre včetně nulové skórové hodnoty pěti znaků normativního prefixu `kvazi-`,
- typ věty a odpovídající závěrečnou interpunkci.

Hráč nezadává rozklad na motivy.

Interní implementace může použít regulární výraz, konečný automat, parser nebo jiný deterministický postup. Implementace není sama pravidlem hry; musí být ekvivalentní slovnímu normativnímu popisu.

### Automatická inference normativního `kvazi-`

Pokud je po NFC a kanonické normalizaci velikosti písmen povrchový token delší než 5 soutěžních znaků a začíná sekvencí `kvazi`, konfigurátor i backend deterministicky odvodí:
- POS = substantivum,
- interní `kvaziPrefix = kvazi`.

Hráč prefix ručně nevolí a UI pro něj nesmí zobrazovat roletku, checkbox ani jiný ovladač. Pro takový povrchový tvar nelze ručně zvolit jiný POS. Po změně povrchového tvaru se odvozené hodnoty znovu přepočítají.

Porovnání je bez ohledu na velikost písmen (`kvazi…`, `Kvazi…`, `KVAZI…`), ale neprovádí jiné lexikální nebo diakritické normalizace: `qazi…`, `kvázi…`, `quasi…` se tímto mechanismem nerozpoznávají.

Automatická inference sama neznamená, že je token platný. Následně musí projít úplná normativní kontrola `07-prefix-kvazi.md`, zejména platnost základního substantiva, globální replaceability a motivová pravidla. Skórová výjimka se použije až na takto odvozený a normativně platný prefix.

## Živá strukturální a morfologická validace formuláře

Před konečným odesláním může formulář živě ověřovat zveřejněnou strukturu podání a deterministicky odvoditelné vlastnosti konkrétního hráčova návrhu:
- zda jsou vyplněna všechna povinná pole aktuálního field schema,
- zda zvolené hodnoty patří do veřejných seznamů aktuální verze pravidel,
- zda deklarovaná morfologická identita a morfologické hodnoty konkrétního použití podle normativní tabulky vytvářejí právě hráčem zadaný `surfaceForm`,
- zda automaticky odvozený `kvaziPrefix` a POS odpovídají povrchovému tvaru,
- zda syntaktické odkazy míří na existující tokeny téhož draftu,
- zda je vložen požadovaný počet strukturovaných vztahů a podkladů,
- právě jeden plnovýznamový slovesný token a pouze normativně dovolené pomocné tokeny `být`,
- deterministické invarianty jednopísmenných výjimek a jejich veřejných rolí.

Podle #86 se nevyžaduje celé uživatelsky editovatelné paradigma ani jeho snapshotové potvrzení. Normativní tabulka je zdrojem pravdy pro odvození konkrétního použitého tvaru.

Počet a typ povinných syntaktických odkazů se odvozuje od zvolené hlavní syntaktické funkce nebo technické role. Živá kontrola sama neposuzuje, zda valenční nebo významová obhajoba skutečně obstojí.

Pro MVP strukturální kontrola vyžaduje:
- u běžného závislého členu právě jedno řídící slovo,
- u přísudku žádné řídící slovo,
- u doplňku právě jednu vazbu k přísudku a právě jednu vazbu k podmětu nebo předmětu,
- u koordinace právě dvě různé spojované části,
- u předložek `k/v/z` technickou prepoziční roli a právě jednu vazbu na řízené jmenné slovo; předložka sama nemá hlavní větnou funkci.

Volný text nemůže chybějící strukturovanou syntaktickou vazbu nahradit.

## Dva odlišné katalogové mechanismy

Validace musí důsledně rozlišovat:

### Katalog skutečných slov
- samostatná lexikální autorita pro status skutečné slovo / kvazislovo,
- není obecně scoped na jednu `rules_version`,
- hráč smí po zadání kompletního vlastního návrhu použít pouze exact-match kontrolu úplné soutěžní identity + konkrétního použitého tvaru,
- výsledek pouze potvrzuje nebo nepotvrzuje existující schválený exact match,
- nenalezený exact match není sám o sobě zamítnutí,
- žádný browse, prefix search, autocomplete, podobné položky nebo nabídka alternativ.

### Interní morfologická review cache
- neveřejná provozní paměť předchozích morfologických posouzení,
- je scoped na konkrétní `rules_version`,
- používá `APPROVED / REJECTED / UNKNOWN`,
- membership této cache se hráči před submittem ani po exact-match dotazu katalogu skutečných slov neprozrazuje.

Tyto mechanismy mohou být oba použity v jednom review workflow, ale nesmějí být implementovány jako jeden významově smíšený lookup.

## Katalog skutečných slov – exact match hráče

Po kompletním zadání identity a konkrétního použití může hráč požádat o exact-match ověření, zda je tato přesná kombinace v katalogu skutečných slov už uznána jako skutečné slovo.

Kontrola nesmí doplňovat chybějící pole ani nabízet možné kandidáty. Z částečné deklarace se dotaz neprovádí.

Negativní exact-match odpověď znamená pouze „tato přesná kombinace není aktuálně potvrzena katalogem“; neznamená automaticky „slovo je neplatné“ nebo „jde o kvazislovo“.

## Konečný submit

Submit musí vždy provést autoritativní server-side přepočet všech deterministických blockerů nad aktuálním obsahem. Stav tlačítka nebo dřívější FE validace není důkazem přijatelnosti requestu.

Úspěšný submit vytvoří immutable `sentence_revision`.

Backend u tokenů deklarovaných jako skutečná slova znovu vyhodnotí relevantní stav katalogu skutečných slov. Pokud exact match chybí, případ může jít k ručnímu posouzení a případné správě katalogu; samotná absence není automatickým jazykovým zamítnutím.

Následné rozhodcovské morfologické review může využít interní review cache.

## Interní morfologická review cache v MVP

Review cache je povinnou provozní součástí MVP, nikoli však lexikálním katalogem skutečných slov.

Pro každou relevantní deklarovanou soutěžní identitu/tvar backend po submitu interně zjistí pro konkrétní `rules_version`:
- `APPROVED` — lze automaticky znovu použít předchozí morfologické schválení v téže `rules_version`,
- `REJECTED` — admin dostane předchozí negativní rozhodnutí a jeho důvod,
- `UNKNOWN` — musí následovat ruční posouzení.

`UNKNOWN` je absence rozhodné znalosti, nikoli neplatnost.

Schválením neznámého případu vzniká znalost použitelná pro budoucí shodné výskyty v téže rules verzi. Zamítnutím vzniká negativní znalost s důvodem.

Nová `rules_version` nezačne automaticky používat schválení předchozí verze. Historie se zachová, ale nový review prostor začíná bez přenesených schválení.

## Porovnání deklarace

Deterministická morfologická kontrola porovnává deklarovanou soutěžní identitu, model a morfologické hodnoty konkrétního použití s hráčem zadaným tvarem. Pokud z normativních dat deklarovaný tvar neplyne, deklarace neprojde mechanickou morfologickou kontrolou.

Samotná shoda zápisu s reálným slovem nesmí způsobit odmítnutí odlišné platné kvaziidentity; deklaraci shodnou s katalogově potvrzenou skutečnou identitou naopak nelze přijmout jako kvazislovo.

Katalog skutečných slov řeší lexikální status. Interní review cache řeší opakované rozhodcovské morfologické posouzení. Výsledky těchto dvou vrstev se nesmějí zaměňovat.

## Revalidace

Jedna immutable revize může mít samostatný obsahový validační výsledek pro více `rules_version`. Starý verdikt zůstává historicky zachován; aktuální žebříček používá aktuální rules verzi.

Při obsahové revalidaci se znovu neposuzuje historická procesní compliance původního podání podle novější AI/tool policy. Procesní compliance je historický fakt vázaný na podání a tehdy platnou policy.

Pokud se změní scoring semantics, skóre se ukládá/odvozuje jako součást konkrétního validačního výsledku pro konkrétní rules verzi.

Každý rozhodující validační výsledek musí mít úplnou provenance: revizi věty, rules verzi, validator version, relevantní review-cache provenance, automatický/ruční původ, čas a případného rozhodujícího admina. Pokud verdict závisel na tehdejším stavu katalogu skutečných slov, musí být dohledatelná i příslušná lexikální katalogová položka/revize.

## Bez generování řešení

Validátor ani exact-match rozhraní nesmějí navrhovat jiné slovo, jiné lemma, jiný tvar, jiné rozdělení slov, jinou analýzu ani jiné syntaktické vazby. Smějí pouze vyhodnotit konkrétní zadaný návrh v rozsahu povolených deterministických kontrol.

Rozhraní nesmí být navrženo pro dávkové nebo automatizované testování kandidátů ani pro vytěžování katalogu skutečných slov nebo interní review cache. Systematické iterativní zkoušení variant za účelem nalezení řešení není povoleným ověřením konkrétního lidského nápadu.
