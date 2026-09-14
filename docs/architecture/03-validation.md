# Validace

> **Status:** návrh hranic deterministické validace.

## Vstup

Věta je tvořena seřazeným seznamem slov. Každé slovo je samostatný řetězec bez mezer. Backend provede Unicode NFC normalizaci a kontrolu povolených soutěžních znaků. Mezery mezi slovy generuje aplikace.

## Znaková validace

Aplikace může deterministicky kontrolovat:

- povolené znaky,
- délku běžného slova,
- jednopísmenné výjimky,
- pořadí tokenů,
- zda lze celou větu umístit do souvislé posloupnosti přípustných motivů tak, aby každý jednotlivý token celý ležel uvnitř jediného motivu a žádný token nepřekročil jeho vnitřní hranici,
- počet slov,
- počet písmen,
- závěrečnou interpunkci.

Hráč nezadává rozklad na motivy.

Pouhá validita spojeného řetězce bez zohlednění hranic tokenů nestačí. Testovací sada musí obsahovat pozitivní i negativní případy, které odliší přípustné rozdělení slov od tokenu překračujícího jinak platnou hranici motivu.

Interní implementace může použít regulární výraz, konečný automat, parser nebo jiný deterministický postup. Implementace není sama pravidlem hry; musí být ekvivalentní slovnímu normativnímu popisu.

## Živá strukturální validace formuláře

Před konečným odesláním může formulář vedle znakové kontroly živě ověřovat pouze zveřejněnou strukturu podání:

- zda jsou vyplněna všechna povinná pole,
- zda zvolené hodnoty patří do veřejných seznamů aktuální verze pravidel,
- zda syntaktické odkazy míří na existující tokeny téhož návrhu,
- zda je vložen požadovaný počet strukturovaných vztahů a podkladů.

Počet a typ povinných odkazů se odvozuje od zvolené hlavní syntaktické funkce. Živá kontrola nevyžaduje odborný významový podtyp a sama neposuzuje, zda obhajoba skutečně splňuje jazykový rozhodovací test.

Pro MVP strukturální kontrola vyžaduje:

- u běžného závislého členu právě jedno řídící slovo,
- u přísudku žádné řídící slovo,
- u doplňku právě jednu vazbu k přísudku a právě jednu vazbu k podmětu nebo předmětu,
- u koordinace právě dvě různé spojované části.

Volný text nemůže chybějící strukturovanou vazbu nahradit.

Tato kontrola potvrzuje úplnost a formální strukturu deklarace, nikoli její jazykovou správnost. Nesmí se při ní dotazovat interní katalog ani vracet informaci, zda katalog konkrétní slovo, tvar, identitu nebo analýzu zná.

## Jazyková validace

Aplikace před konečným odesláním automaticky nerozhoduje jazykovou správnost deklarované morfologie, skloňování, časování, valence, syntaxe ani významové obhajoby. Kontrola, že deklarovaná hodnota patří do veřejného seznamu nebo že povinné pole není prázdné, není jazykovým schválením.

## Budoucí morfologická validace

Po vytvoření interního katalogu může produkční kontrola deterministicky porovnávat deklarovanou analýzu se schválenými katalogovými daty pouze nad konečně odeslanou a uzamčenou revizí.

Porovnává se celá deklarovaná soutěžní identita. Samotná shoda zápisu s reálným slovem nesmí způsobit odmítnutí odlišné platné kvaziidentity; deklaraci shodnou s doloženou reálnou identitou naopak nelze přijmout jako kvazislovo.

Kontrola musí umět z normativních dat ověřit, že deklarovaný základní tvar, zvolený model a morfologické hodnoty skutečně vytvářejí konkrétní použitý tvar. Volně zapsaná identita bez tohoto vztahu není platným katalogovým dokladem.

Výsledek je před rozhodnutím neveřejný a slouží admin review. Autorovi se nevrací okamžitá odpověď o katalogovém členství jednotlivých položek; dostane až výsledek administrativního posouzení a jeho odůvodnění.

Katalog je podřízen pravidlům. Pokud hráč prokáže chybu nebo neúplnost katalogu, následuje ruční posouzení, případná oprava katalogu a opakovaná validace.

## Bez generování řešení

Validátor nesmí navrhovat jiné slovo, jiný tvar, jiné rozdělení slov ani jiné kandidátní řešení. Smí pouze vyhodnotit zadané řešení v rozsahu svých deterministických kontrol.

Rozhraní nesmí být navrženo pro dávkové nebo automatizované testování kandidátů ani pro vytěžování interního katalogu. Systematické iterativní zkoušení variant za účelem nalezení řešení není povoleným ověřením konkrétního lidského nápadu.
