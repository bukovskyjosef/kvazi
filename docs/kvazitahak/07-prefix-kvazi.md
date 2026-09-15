# Prefix `kvazi-`

> **Status:** NORMATIVNÍ pravidlo první rules verze. Rozhodnutí #60 a synchronizace #79.

## NORMATIVNÍ: rozsah výjimky

Prefix `kvazi-` je zvláštní tematická výjimka dostupná **pouze substantivům**. Nejde o obecný prefixační mechanismus pro jiné slovní druhy.

Prefixované substantivum lze vytvořit ze skutečného i kvazisubstantiva, ale jen z již úplně platné substantivní soutěžní identity podle `02-substantiva.md`. Je-li základ skutečným slovem, katalog potvrzuje pouze základ; prefixovaná odvozenina vzniká normativním herním mechanismem a sama katalogové potvrzení nepotřebuje.

K lemmatu a ke každému tvaru paradigmatu základu se zleva mechanicky připojí doslovný řetězec `kvazi`.

- prefix je vždy právě `kvazi`; podoby `qazi-`, `kvázi-`, `quasi-` ani jiné varianty se nepovolují,
- `Q` se uvnitř prefixu nepoužívá a nevzniká žádná ekvivalence `Q` ↔ `KV`,
- prefix lze použít nejvýše jednou v celé odvozené identitě; řetězení typu `kvazikvazi-` je zakázáno,
- základem proto nesmí být substantivum, které už samo vzniklo tímto normativním prefixačním mechanismem,
- základ musí být platný sám o sobě; prefix neopravuje neplatné lemma, model, morfologii, syntaxi ani povrchovou použitelnost,
- prefix nemění rod, životnost, substantivní model, pád, číslo, způsob tvorby kmene ani syntaktické chování základu,
- prefix nevytváří novou valenci ani jinou syntaktickou možnost základu,
- prefixovaná odvozenina má vlastní soutěžní identitu odlišnou od neprefixovaného základu.

Je-li základní lemma `L` a jeho konkrétní tvar `T`, prefixovaná odvozenina má lemma `kvaziL` a odpovídající tvar `kvaziT`. Morfologická analýza části `T` zůstává přesně analýzou základního substantiva; hráč pro prefixovanou identitu nevolí nový rod, životnost ani deklinační model.

## NORMATIVNÍ: základ musí fungovat i bez prefixu

Konkrétní základní tvar `T` musí být plnohodnotně použitelný **na témže místě věty i po odstranění prefixu `kvazi-`**. Musí tedy sám splnit svou morfologii, pád a syntaktické vazby a zároveň na témže místě projít globální motivovou sekvencí.

Prefix nesmí zachránit základ, který by bez něj na daném místě věty nebyl platný. Prefix pouze před již platný základ přidává jeden celý motiv `KVAZI` a vytváří novou substantivní identitu.

## NORMATIVNÍ: povrchová výjimka

Prefixované substantivum je pro soutěž **jedno slovo**.

Doslovný prefix `kvazi` tvoří zvláštní povolený úvod tohoto slova a je výjimkou z běžného pravidla, že celé slovo má 3–5 soutěžních znaků a leží uvnitř jediného motivu. Podmínka 3–5 soutěžních znaků se u prefixovaného substantiva vztahuje na část `T` za prefixem; pět znaků prefixu se do tohoto limitu nezapočítává.

Část za prefixem musí sama jako konkrétní základní tvar splnit běžná pravidla pro substantivní slovo: povolené soutěžní znaky, délku 3–5 znaků a umístění uvnitř jednoho motivu. Prefix nelze použít k překlenutí jinak neplatné hranice základního slova.

Při kontrole celé věty se doslovný prefix `kvazi` chová jako právě jeden celý motiv `KVAZI`; bezprostředně následující základ pokračuje v běžné motivové posloupnosti. Prefix tedy není volný text mimo soutěžní řetězec. Zároveň musí podle předchozího oddílu zůstat platná i globální sekvence po odstranění prefixu.

## NORMATIVNÍ: skóre

Prefixované substantivum se v primárním skóre počítá jako **jedno slovo**, stejně jako jeho neprefixovaná varianta.

Pět znaků doslovného prefixu `kvazi` je jedinou zvláštní výjimkou ze standardního sekundárního skórování: má skórovou hodnotu 0 a do počtu soutěžních znaků rozhodujícího při shodném počtu slov se nezapočítává. Znaky základního tvaru za prefixem se počítají standardně (`Q = 1`, `KV = 2`).

Tato skórová neutralita nemění motivovou validaci: prefix je fyzicky přítomen a pro motivovou kontrolu představuje právě jeden celý motiv `KVAZI`.

## NORMATIVNÍ: identita a opakování

Prefixované a neprefixované substantivum jsou dvě různé soutěžní identity. Zákaz opakování stejné identity se na každou z nich uplatní samostatně.

Samotné přidání prefixu však nevytváří nový substantivní model a nedovoluje měnit morfologické ani syntaktické vlastnosti základu. Pro kontrolu se vždy nejprve ověří základní substantivní identita, její konkrétní tvar a použitelnost na daném místě a teprve poté mechanická prefixace.

## Implementační invariant

Validace musí oddělit tyto otázky:

1. je základní substantivní identita a použitý základní tvar platný podle `02-substantiva.md`,
2. je tentýž konkrétní základ platný na stejném místě věty i bez prefixu,
3. je prefixace přesně jednorázové přidání doslovného `kvazi` a splňuje zvláštní motivovou/povrchovou výjimku,
4. skóre počítá prefixované substantivum jako jedno slovo a pěti prefixovým znakům přiděluje skórovou hodnotu 0.

Reachability není důvod tuto možnost skrývat ani předem hodnotit.