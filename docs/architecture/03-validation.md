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
- délku běžného slova,
- jednopísmenné výjimky,
- pořadí tokenů,
- zda lze celou větu umístit do souvislé posloupnosti přípustných motivů tak, aby každý jednotlivý token celý ležel uvnitř jediného motivu a žádný token nepřekročil jeho vnitřní hranici,
- počet slov,
- počet písmen,
- typ věty a odpovídající závěrečnou interpunkci.

Hráč nezadává rozklad na motivy.

Pouhá validita spojeného řetězce bez zohlednění hranic tokenů nestačí. Testovací sada musí obsahovat pozitivní i negativní případy, které odliší přípustné rozdělení slov od tokenu překračujícího jinak platnou hranici motivu.

Interní implementace může použít regulární výraz, konečný automat, parser nebo jiný deterministický postup. Implementace není sama pravidlem hry; musí být ekvivalentní slovnímu normativnímu popisu.

## Živá strukturální validace formuláře

Před konečným odesláním může formulář vedle znakové kontroly živě ověřovat pouze zveřejněnou strukturu podání:
- zda jsou vyplněna všechna povinná pole aktuálního field schema,
- zda zvolené hodnoty patří do veřejných seznamů aktuální verze pravidel,
- zda syntaktické odkazy míří na existující tokeny téhož draftu,
- zda je vložen požadovaný počet strukturovaných vztahů a podkladů,
- zda uživatelské potvrzení morfologického návrhu odpovídá aktuálnímu snapshotu potvrzovaných dat,
- právě jeden plnovýznamový slovesný token podle aktuálního veřejného modelu,
- deterministické invariants jednopísmenných výjimek a jejich veřejných rolí.

Počet a typ povinných odkazů se odvozuje od zvolené hlavní syntaktické funkce nebo technické role. Živá kontrola nevyžaduje odborný významový podtyp a sama neposuzuje, zda obhajoba skutečně splňuje jazykový rozhodovací test.

Pro MVP strukturální kontrola vyžaduje:
- u běžného závislého členu právě jedno řídící slovo,
- u přísudku žádné řídící slovo,
- u doplňku právě jednu vazbu k přísudku a právě jednu vazbu k podmětu nebo předmětu,
- u koordinace právě dvě různé spojované části,
- u předložek `k/v/z` technickou prepoziční roli a právě jednu vazbu na řízené jmenné slovo; předložka sama nemá hlavní větnou funkci.

Volný text nemůže chybějící strukturovanou vazbu nahradit.

Tato kontrola potvrzuje úplnost a formální strukturu deklarace, nikoli její jazykovou správnost. Nesmí se při ní dotazovat interní katalog ani vracet informaci, zda katalog konkrétní slovo, tvar, identitu nebo analýzu zná.

## Jazyková validace

Aplikace před konečným odesláním automaticky nerozhoduje jazykovou správnost deklarované morfologie, skloňování, časování, valence, syntaxe ani významové obhajoby. Kontrola, že deklarovaná hodnota patří do veřejného seznamu nebo že povinné pole není prázdné, není jazykovým schválením.

UI musí významy stavů jasně odlišit:
- znaková kontrola splněna,
- strukturované údaje úplné,
- morfologický návrh uživatelem potvrzen,
- připraveno k odeslání,
- čeká na jazykové posouzení,
- uznáno / zamítnuto.

Povinné znění potvrzení morfologického návrhu je:

> **Potvrzuji, že toto je můj morfologický návrh.**

## Konečný submit

Submit musí vždy provést autoritativní server-side přepočet všech deterministických blockerů nad aktuálním obsahem. Stav tlačítka nebo dřívější FE validace není důkazem přijatelnosti requestu.

Úspěšný submit vytvoří immutable `sentence_revision`. Katalogová a administrativní kontrola probíhá výhradně nad touto uzamčenou revizí.

## Interní učící se katalog v MVP

Katalog je povinnou součástí MVP. Nejde však o předem úplný whitelist; je to znalostní báze předchozích rozhodnutí pro konkrétní `rules_version`.

Pro každou relevantní deklarovanou soutěžní identitu/tvar backend po submitu interně zjistí:
- `APPROVED` — lze automaticky znovu použít schválení v téže `rules_version`,
- `REJECTED` — admin dostane předchozí negativní rozhodnutí a jeho důvod,
- `UNKNOWN` — musí následovat ruční posouzení.

`UNKNOWN` je absence rozhodné znalosti, nikoli neplatnost.

Schválením neznámého případu vzniká znalost použitelná pro budoucí shodné výskyty v téže rules verzi. Zamítnutím vzniká negativní znalost s důvodem. Zamítnutí kteréhokoli slova/identity nezbytné pro deklarovanou analýzu znamená zamítnutí dané revize věty.

Nová `rules_version` nezačne automaticky používat schválení předchozí verze. Historie se zachová, ale nový validační prostor začíná bez přenesených schválení.

## Porovnání deklarace s katalogem

Porovnává se celá deklarovaná soutěžní identita. Samotná shoda zápisu s reálným slovem nesmí způsobit odmítnutí odlišné platné kvaziidentity; deklaraci shodnou s doloženou reálnou identitou naopak nelze přijmout jako kvazislovo.

Kontrola musí umět z normativních dat ověřit, že deklarovaný základní tvar, zvolený model a morfologické hodnoty skutečně vytvářejí konkrétní použitý tvar. Volně zapsaná identita bez tohoto vztahu není platným katalogovým dokladem.

Výsledek katalogového lookupu je před administrativním rozhodnutím neveřejný. Autor nedostává okamžitou odpověď o katalogovém členství jednotlivých položek; dostane až výsledek administrativního posouzení a jeho odůvodnění.

Hráč proto vždy předkládá úplnou minimální obhajobu požadovanou pravidly, i když může být stejná identita interně už `APPROVED`.

## Revalidace

Jedna immutable revize může mít samostatný obsahový validační výsledek pro více `rules_version`. Starý verdikt zůstává historicky zachován; aktuální žebříček používá aktuální rules verzi.

Při obsahové revalidaci se znovu neposuzuje historická procesní compliance původního podání podle novější AI/tool policy. Procesní compliance je historický fakt vázaný na podání a tehdy platnou policy.

Pokud se změní scoring semantics, skóre se ukládá/odvozuje jako součást konkrétního validačního výsledku pro konkrétní rules verzi.

Každý rozhodující validační výsledek musí mít úplnou provenance: revizi věty, rules verzi, použitý katalogový snapshot/revision, validator version, automatický/ruční původ, čas a případného rozhodujícího admina.

## Bez generování řešení

Validátor nesmí navrhovat jiné slovo, jiný tvar, jiné rozdělení slov, jinou analýzu ani jiné syntaktické vazby. Smí pouze vyhodnotit zadané řešení v rozsahu povolených deterministických kontrol.

Rozhraní nesmí být navrženo pro dávkové nebo automatizované testování kandidátů ani pro vytěžování interního katalogu. Systematické iterativní zkoušení variant za účelem nalezení řešení není povoleným ověřením konkrétního lidského nápadu.
