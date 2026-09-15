# Prefix `kvazi-`

> **Status:** NORMATIVNÍ pravidlo první rules verze. Rozhodnutí #60.

## NORMATIVNÍ: rozsah výjimky

Prefix `kvazi-` je zvláštní tematická výjimka dostupná **pouze substantivům**. Nejde o obecný prefixační mechanismus pro jiné slovní druhy.

Prefixované substantivum lze vytvořit jen z již úplně platné substantivní soutěžní identity podle `02-substantiva.md`. K jejímu lemmatu a ke každému tvaru paradigmatu se zleva mechanicky připojí doslovný řetězec `kvazi`.

- prefix je vždy právě `kvazi`; podoby `qazi-`, `kvázi-` ani jiné varianty se nepovolují,
- `Q` se uvnitř prefixu nepoužívá a nevzniká žádná ekvivalence `Q` ↔ `KV`,
- prefix lze přidat nejvýše jednou; řetězení typu `kvazikvazi-` je zakázáno,
- základ musí být platný sám o sobě; prefix neopravuje neplatné lemma, model ani morfologii,
- prefix nemění rod, životnost, substantivní model, pád, číslo ani způsob tvorby kmene základu,
- prefixovaná odvozenina má vlastní soutěžní identitu odlišnou od neprefixovaného základu.

Je-li základní lemma `L` a jeho konkrétní tvar `T`, prefixovaná odvozenina má lemma `kvaziL` a odpovídající tvar `kvaziT`. Morfologická analýza části `T` zůstává přesně analýzou základního substantiva.

## NORMATIVNÍ: povrchová výjimka

Prefixované substantivum je pro soutěž **jedno slovo**.

Doslovný prefix `kvazi` tvoří zvláštní povolený úvod tohoto slova a je výjimkou z běžného pravidla, že celé slovo má 3–5 soutěžních znaků a leží uvnitř jediného motivu. Tato výjimka se vztahuje pouze na pět prefixových znaků `kvazi`.

Část za prefixem musí sama jako konkrétní základní tvar splnit běžná pravidla pro substantivní slovo: povolené soutěžní znaky, délku 3–5 znaků a umístění uvnitř jednoho motivu. Prefix nelze použít k překlenutí jinak neplatné hranice základního slova.

Při kontrole celé věty se doslovný prefix `kvazi` chová jako právě jeden celý motiv `KVAZI`; bezprostředně následující základ pokračuje v běžné motivové posloupnosti. Prefix tedy není volný text mimo soutěžní řetězec.

## NORMATIVNÍ: skóre

Prefixované substantivum se v primárním skóre počítá jako **jedno slovo**, stejně jako jeho neprefixovaná varianta.

Pět znaků doslovného prefixu `kvazi` je pro sekundární skóre **neutrálních**. Do počtu soutěžních znaků rozhodujícího při shodném počtu slov se nezapočítávají. Znaky základního tvaru za prefixem se počítají standardně (`Q = 1`, `KV = 2`).

Tato neutralita je záměrná: prefix má rozšířit tematickou a rytmickou podobu kvazivěty, nikoli vytvořit automatický pětibodový bonus a tím motivovat k prefixování každého substantiva.

## NORMATIVNÍ: identita a opakování

Prefixované a neprefixované substantivum jsou dvě různé soutěžní identity. Zákaz opakování stejné identity se na každou z nich uplatní samostatně.

Samotné přidání prefixu však nevytváří nový substantivní model a nedovoluje měnit morfologické vlastnosti základu. Pro morfologickou kontrolu se vždy nejprve ověří základní substantivní identita a její konkrétní tvar a teprve poté mechanická prefixace.

## Implementační invariant

Validace musí oddělit tři otázky:

1. je základní substantivní identita a použitý základní tvar platný podle `02-substantiva.md`,
2. je prefixace přesně jednorázové přidání doslovného `kvazi` a splňuje zvláštní motivovou/povrchovou výjimku,
3. skóre počítá prefixované substantivum jako jedno slovo a z jeho sekundárního skóre odečítá právě pět prefixových znaků.

Reachability není důvod tuto možnost skrývat ani předem hodnotit.