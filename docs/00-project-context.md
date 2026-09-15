# Kontext projektu

## Smysl kvaziproblému

Nejdelší kvazivěta je záměrně nepraktický problém. Má vytvářet prostor pro lidské přemýšlení, kombinování a práci s češtinou v době, kdy lidé stále častěji delegují i drobné myšlenkové úlohy na stroje.

Hra nemá dokazovat jazykovědnou erudici. Dlouhodobým cílem je, aby byla hratelná pro běžnou veřejnost a aby výhodu nepřinášelo především vytěžování odborných lingvistických databází.

Proto se systém postupně posouvá od otevřeného „použij cokoli, co existuje v češtině“ k uzavřeným soutěžním morfologickým a syntaktickým modelům, k explicitně deklarované a obhajované valenci a k vlastnímu spravovanému katalogu skutečných slov.

Projekt je recesní a herní. Pravidla mají být dost přesná pro férové hraní, ale cílem není vytvářet jazykově-právní systém s absolutní reprodukovatelností každého externího zdroje a rozhodnutí.

## Princip objevování a slepých cest

Pravidla popisují povolený herní prostor podle morfologické, syntaktické a jiné vnitřní logiky hry. **Reachability není normativní filtr.** Morfologický model, tvarová větev nebo jiný mechanismus se neodstraňuje, neskrývá ani nezakazuje jen proto, že podle aktuální analýzy zřejmě nebo prokazatelně nevede k použitelnému soutěžnímu povrchovému tvaru.

Je záměrně přípustné, aby pravidla obsahovala i slepé cesty. Hráč má mít možnost sám zkoumat, kombinovat a zjistit, že určitá pravidlově povolená cesta v konkrétním znakovém systému nikam nevede. Toto bádání a objevování neúspěšných cest je součástí hry a jejího vzdělávacího rozměru.

Interní reachability analýza může pomáhat autorovi pravidel a vývojářům chápat herní prostor, testovat implementaci nebo hledat nečekané důsledky. Nesmí však sama rozhodovat, které jinak normativně povolené modely nebo mechanismy hráči dostanou k dispozici. Hráčské materiály nemají známé slepé cesty označovat ani předem prozrazovat, pokud to není nutné k vysvětlení samotného pravidla.

## Manifest férovosti a důvěry

Kvazi dává smysl jen tehdy, pokud si hráči navzájem věří, že řešení opravdu hledají v duchu hry.

Nechceme z recesní soutěže dělat policejní ani forenzní systém. Nebudeme sledovat historii práce hráčů, vyžadovat logy, screenshoty nebo záznamy promptů ani vyšetřovat, zda někdo použil zakázaný nástroj. Pravidla práce s nástroji jsou čestná dohoda, ne technicky vynucovaný režim.

Kdo chce podvádět, pravděpodobně si cestu najde. Tím ale neporáží ostatní hráče — pouze přestává hrát tutéž hru. Proto dáváme přednost důvěře, hravosti a recesi před dohledem a dokazováním.

## Princip práce člověka a techniky

Člověk má vymýšlet soutěžní řešení vlastní hlavou.

Pasivní zdroje jako slovníky, příručky, knihy a odborné texty mohou pomáhat s obecnou češtinou a dokazováním. AI může pomoci vysvětlit pravidla hry nebo obecnou češtinu, ale nemá za hráče hledat, navrhovat, opravovat ani optimalizovat konkrétní soutěžní řešení.

O tom, zda se konkrétní identita a tvar pro soutěž považují za skutečné slovo, rozhoduje náš spravovaný katalog skutečných slov. Pokud kandidát v katalogu chybí, lze požádat o přezkoumání; při správě katalogu může kvaziautorita využívat IJP, ASSČ i další relevantní jazykové zdroje. Katalog lze průběžně doplňovat a opravovat.

Katalog není veřejným seznamem k procházení. Hráč může nechat ověřit až svůj vlastní hotový návrh: musí uvést úplnou morfologickou identitu slova a konkrétní použitý tvar. Pokud tato přesná kombinace v katalogu již je schválená jako skutečné slovo, systém to potvrdí. Z neúplného zadání katalog nic nenapovídá, nevypisuje možné identity ani nenabízí alternativy. Pokud přesná kombinace potvrzená není, může ji hráč normálně předložit k posouzení.

Pravidlo práce s nástroji je jednoduché: nástroj může pomoci studovat, počítat nebo mechanicky ověřit konkrétní lidský nápad. Nesmí za hráče automaticky hledat, generovat, skládat nebo optimalizovat soutěžní kandidáty.

Soutěžní aplikace má mechanicky kontrolovat jen to, co lze deterministicky ověřit. Učící se morfologický katalog může šetřit opakované posuzování, ale nesmí vytvářet nové jazykové pravidlo.

## Veřejnost, hráčská cesta a normativní balík

Hráčská dokumentace má tři navazující vrstvy:

1. **Jak hrát** – rychlý vstup pro nováčka.
2. **Hráčský tahák** – praktický rozcestník.
3. **Přesné moduly kvazitaháku** – tabulky a konkrétní mechanika podle potřeby.

Vedle této hráčské cesty existuje **kanonický normativní balík**. Žádný jednotlivý soubor není „úplná pravidla“ sám o sobě: rozhodcovská specifikace řeší obecnou soutěžní platnost, NORMATIVNÍ moduly kvazitaháku přesnou mechaniku svých oblastí, AI policy práci s nástroji a dokument verzování lifecycle pravidel. Úplnou mapu jejich autority udržuje pouze `docs/README.md`.

Každý hráčský a normativní dokument u svého začátku stručně uvádí **Místo v normativním balíku**, aby bylo ihned zřejmé, co řeší on a které sousední artefakty tvoří zbytek celku.

Hráč nemá být nucen studovat technickou normu českého jazyka jen proto, aby mohl začít hrát.

## Rekord a kvazicena

Rekord je objektivní skóre mezi platnými a řádně uznanými řešeními podle příslušných pravidel.

Kvazicena je subjektivní ocenění, které může reflektovat například eleganci, originalitu, vtip, kvazietymologii nebo komunitní přínos.

## Otevřenost soutěže

Soutěž nemá pevný konec. Rekord lze překonávat a pravidla mohou získávat nové verze.

Platný exploit se ve své verzi uzná; nežádoucí vlastnost pravidel se opravuje až novou verzí. Průběžná oprava katalogu skutečných slov je provozní správa, nikoli sama o sobě nová verze pravidel.

## Autorství

Autorem této podoby kvaziproblému, konceptu Nejdelší kvazivěty a jejích pravidel je **Josef Bukovský**.
