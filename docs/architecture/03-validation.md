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
- zda spojení slov tvoří přípustný souvislý úsek motivů,
- počet slov,
- počet písmen,
- závěrečnou interpunkci.

Hráč nezadává rozklad na motivy.

Interní implementace může použít regulární výraz, konečný automat, parser nebo jiný deterministický postup. Implementace není sama pravidlem hry; musí být ekvivalentní slovnímu normativnímu popisu.

## Jazyková validace

Dokud není schválen interní morfologický katalog, aplikace automaticky nerozhoduje morfologii, skloňování, časování, valenci, syntaxi ani významovou obhajobu.

## Budoucí morfologická validace

Po vytvoření interního katalogu může produkční kontrola deterministicky porovnávat deklarovanou analýzu se schválenými katalogovými daty.

Katalog je podřízen pravidlům. Pokud hráč prokáže chybu nebo neúplnost katalogu, následuje ruční posouzení, případná oprava katalogu a opakovaná validace.

## Bez generování řešení

Validátor nesmí navrhovat jiné slovo, jiný tvar, jiné rozdělení slov ani jiné kandidátní řešení. Smí pouze vyhodnotit zadané řešení v rozsahu svých deterministických kontrol.

Rozhraní nesmí být navrženo pro dávkové nebo automatizované testování kandidátů ani pro vytěžování interního katalogu. Systematické iterativní zkoušení variant za účelem nalezení řešení není povoleným ověřením konkrétního lidského nápadu.
