# Rozhodcovská specifikace

> **Status:** hlavní normativní dokument. Společně s výslovně normativními částmi kvazitaháku určuje platnost řešení. Morfologický freeze ještě blokují otevřené #1 a #2; technická implementace nesmí jejich mezery sama doplnit.

## 1. Hierarchie

Při posuzování platí v tomto pořadí:

1. tato rozhodcovská specifikace,
2. normativní tabulky a seznamy kvazitaháku v rozsahu, v němž na ně pravidla odkazují,
3. `03-ai-policy.md` a `04-verzovani-a-sprava.md` pro jejich normativní oblasti,
4. současná spisovná čeština ve věcech, které soutěžní systém výslovně neupravuje,
5. konečný výklad kvaziautority v nejasném nebo sporném případě.

Technická implementace, databáze ani formulář nejsou vyšší autoritou než pravidla. Spravovaný katalog skutečných slov má pouze zvláštní autoritativní roli vymezenou v oddílu 9.

## 2. Soutěžní abeceda

Povolené znaky:

`K V Q A Á Z I Í Y Ý`

Velká a malá písmena jsou při kontrole řetězce i identity totožná.

Diakritika se rozlišuje:

- `A ≠ Á`,
- `I ≠ Í`,
- `Y ≠ Ý`.

Každý skutečně zapsaný soutěžní znak má při skórování hodnotu jednoho písmene. `Q = 1`, `KV = 2`.

`Q` se vyslovuje `/kv/`, ale je samostatným soutěžním písmenem. Není zkratkou, ligaturou ani alternativním pravopisným zápisem dvojice `KV`.

Při určování lemmatu, základního tvaru, morfologie, soutěžní identity, skutečnosti slova a při práci s jazykovými zdroji se `Q` nikdy automaticky nerozvíjí ani nenormalizuje na `KV`.

Shodná výslovnost `Q` a posloupnosti `KV` sama o sobě nezakládá žádnou morfologickou, lexikální ani identitní shodu. Například `QAZ` a `KVAZ` jsou dva různé zápisy a nelze jim jen kvůli výslovnosti přiřadit tutéž morfologickou identitu.

## 3. Motiv

Základní motiv je `KVAZI`.

V každém výskytu lze nezávisle použít:

- na začátku `KV | Q`,
- `A | Á`,
- `Z`,
- `I | Í | Y | Ý`.

Úplné motivy:

```text
KVAZI KVAZÍ KVAZY KVAZÝ
KVÁZI KVÁZÍ KVÁZY KVÁZÝ
QAZI  QAZÍ  QAZY  QAZÝ
QÁZI  QÁZÍ  QÁZY  QÁZÝ
```

Celá věta po spojení slov musí být souvislým úsekem nepřetržité posloupnosti těchto motivů. Začátek a konec smějí ležet uvnitř motivu.

Volba `Q` místo úvodního `KV` je pouze pravidlem tvorby motivu. Nevytváří pravidlo jazykové ekvivalence mezi `Q` a `KV`.

Pravidla nevyžadují ani normativně neurčují konkrétní interní algoritmus rozkladu na motivy.

## 4. Slovo

Běžné slovo:

- má 3–5 soutěžních znaků,
- je souvislou částí jediného motivu,
- nepřekračuje hranici dvou motivů.

Jednopísmenné výjimky:

- předložky `k`, `v`, `z`,
- spojky `a`, `i`.

Každé z těchto pěti slov lze použít nejvýše jednou.

Předložky `k`, `v`, `z` se z herních důvodů používají vždy v nevokalizované podobě; `ke`, `ve`, `ze` se nepoužívají. Tato výjimka se týká pouze jejich povrchové podoby. Jinak zůstávají běžnými českými předložkami a musí tvořit jazykově platnou předložkovou konstrukci s řízeným jmenným členem:

- `k` + dativ,
- `v` + lokál nebo akuzativ podle významu konstrukce,
- `z` + genitiv.

## 5. Věta

Kvazivěta je jedna jednoduchá věta s jedinou hlavní predikační osou.

Musí obsahovat:

- právě jeden podmět, s výjimkou pravidelně nevyjádřeného podmětu u dovoleného imperativu,
- právě jeden přísudek,
- právě jeden token plnovýznamového slovesa.

Několikanásobný podmět a několikanásobný přísudek nejsou dovoleny. U oznamovací a tázací věty je podmět výslovně vyjádřen a má jednu řídící hlavu.

Doplněk se pro účely soutěže nepovažuje za další hlavní predikační osu ani další přísudek. Přístavek není dovolen. Elipsa obligatorního členu není dovolena.

Všechna obligatorní doplnění, která vyplývají z obhájeného valenčního použití slovesa, musí být ve větě výslovně realizována; jedinou zvláštní výjimkou je povolený nevyjádřený podmět imperativu.

Celá syntaktická analýza musí být jedna propojená struktura kolem jediného přísudku. Syntaktické závislosti nesmějí tvořit kruh. Podmět a přísudek musí být v kategoriích, v nichž to současná spisovná čeština vyžaduje, v běžné morfosyntaktické shodě.

### Složené slovesné tvary a pomocná slovesa

Pravidla mohou formálně připustit složený slovesný tvar, aniž by tím vznikl druhý přísudek nebo druhé plnovýznamové sloveso. Pomocný slovesný token musí být součástí jediného přísudku a sám splnit obecná pravidla pro svůj konkrétní povrchový tvar.

Jeho normativní morfologická reprezentace a přesný rozsah se uzavírají společně se slovesným systémem v #2. **Reachability není důvod tento mechanismus skrýt, odstranit ani považovat za rozhodnutý.**

## 6. Povolená syntax

Povoleny jsou pouze hlavní syntaktické vztahy a konstrukce uvedené v normativním `docs/kvazitahak/01-syntax.md`:

- podmět,
- přísudek,
- předmět,
- přívlastek shodný,
- přívlastek neshodný,
- příslovečné určení,
- doplněk,
- koordinace pomocí `a` nebo `i`, pokud nevznikne několikanásobný podmět ani přísudek.

Spojky `a`, `i` musí spojovat dvě výslovně přítomné souřadné části téže věty. Obě části musí mít stejnou hlavní syntaktickou funkci a koordinovaná skupina jako celek zastává jednu syntaktickou roli vůči nadřazené konstrukci.

Lexikální rekce podstatných a přídavných jmen se v soutěži nepoužívá.

Uzavřenost platí pro hlavní vztahy. Jejich běžné významové podtypy nejsou samostatnými soutěžními konstrukcemi a nemusí být vyjmenovány všechny. Příklady v kvazitaháku jsou názorné, nikoli vyčerpávající.

Každý deklarovaný vztah musí splnit rozhodovací test své hlavní funkce a odevzdání musí zachytit všechny tímto testem vyžadované vazby ke konkrétním tokenům. Pouhé přiřazení názvu povolené funkce konstrukci, která její test nesplňuje, nestačí.

Je-li syntaktická platnost členu závislá na valenci slovesa, posuzuje se podle slovní valenční obhajoby dle oddílu 13 a `05-valence.md`, nikoli podle uzavřeného seznamu strukturovaných rámců.

Není-li některá další mezislovní podmínka výslovně soutěžně upravena, musí konstrukce obstát jako současná spisovná čeština.

## 7. Slovní druhy

Povoleny jsou:

- substantiva,
- adjektiva,
- slovesa,
- skutečná česká zájmena,
- `k`, `v`, `z`,
- `a`, `i`.

Zakázány jsou:

- číslovky,
- příslovce,
- částice,
- citoslovce,
- ostatní neuvedené slovní druhy.

Nová kvazizájmena nelze vytvářet.

### Skutečná zájmena

Zájmena jsou zvláštní `real-word-only` kategorie. Nemají produktivní soutěžní morfologický model, podle kterého by bylo možné vytvářet nová kvazizájmena.

Hráč u zájmena deklaruje alespoň:

- konkrétní použitý tvar,
- zájmenný lexém / lemma,
- slovní druh `zájmeno`,
- morfologické vlastnosti konkrétního použitého tvaru v rozsahu relevantním pro daný lexém, zejména pád, číslo, rod nebo osobu tam, kde je daná kategorie použitelná.

Platnost deklarace ověřuje katalog skutečných slov podle oddílu 9. Reachability není důvod zájmena nebo jejich konkrétní lexémy skrývat z pravidel či UI.

## 8. Kvazislovo

Kvazislovo nemusí existovat v češtině ani mít konkrétní věcný význam.

U každého kvazislova musí být v závazné analýze určeno alespoň:

- slovní druh,
- lemma / základní tvar,
- soutěžní morfologický model,
- konkrétní použitý tvar,
- další údaje vyžadované daným modelem.

Znaková pravidla musí splňovat pouze konkrétní tvar použitý ve větě. Lemma a jiné tvary paradigmatu mohou obsahovat jiné znaky.

Existence jiné možné analýzy stejného povrchového tvaru nevadí; rozhodující je jedna úplná a konzistentní deklarovaná analýza.

Shoda zápisu se skutečným českým slovem sama o sobě neurčuje, zda jde o skutečné slovo, nebo kvazislovo. Rozhoduje celá soutěžní identita a stav katalogu:

- odpovídá-li deklarovaná identita a použitý tvar schválené položce katalogu, jde pro soutěž o skutečné slovo a tutéž identitu nelze v daném posouzení znovu prohlásit za kvazislovo,
- není-li deklarovaná identita/tvar v katalogu jako skutečné slovo schválená, může být při splnění ostatních pravidel posuzována jako kvazislovo,
- kvazislovo musí samo splnit zvolený soutěžní model; pouhá existence stejně zapsaného českého slova mimo katalog jeho kvazimorfologii nedokládá.

Výjimkou z posledních dvou bodů jsou zájmena: nová kvazizájmena se nevytvářejí, takže zájmenný kandidát musí obstát jako skutečné zájmeno podle oddílu 7 a katalogu.

## 9. Skutečné české slovo a katalog

Pro soutěžní status skutečného slova je autoritou **spravovaný katalog skutečných slov a tvarů**.

U kategorií řízených soutěžním morfologickým modelem lze skutečné slovo použít pouze tehdy, když:

1. jeho základní tvar, slovní druh a vlastnosti tvořící soutěžní identitu odpovídají schválené položce katalogu,
2. jeho konkrétní použitý tvar je v katalogu schválený pro tuto identitu a deklarované morfologické hodnoty,
3. tentýž konkrétní tvar současně odpovídá povolenému soutěžnímu morfologickému modelu.

### Zvláštní režim skutečných zájmen

U zájmena katalog ověřuje konkrétní skutečný zájmenný lexém / lemma, jeho použitý tvar a deklarované morfologické vlastnosti. Zájmeno nemusí současně procházet produktivním soutěžním morfologickým modelem, protože takový model pro zájmena neexistuje.

Nepravidelnost, defektivnost nebo jiná lexikální zvláštnost skutečného zájmena sama o sobě nebrání použití, pokud katalog potvrzuje konkrétní lexém a konkrétní použitý tvar s jeho vlastnostmi. Toto pravidlo nelze zobecnit na tvorbu nových zájmen ani na jiné slovní druhy.

Není-li kandidátní skutečné slovo v katalogu schválené, řešitel může požádat kvaziautoritu o přezkoumání. Po jazykovém ověření lze katalog doplnit nebo opravit.

Při správě katalogu může kvaziautorita vycházet zejména z IJP, ASSČ, dalších jazykových příruček, mluvnic a relevantních odborných zdrojů. Tyto zdroje však samy nejsou přímým soutěžním whitelistem hráče; rozhodující je přijatý stav katalogu.

Katalog je záměrně průběžně spravovatelný. Jeho jednotlivé opravy nebo doplnění samy o sobě nevyžadují novou `rules_version`.

Katalog není veřejně procházetelný. Hráč může nechat ověřit pouze **hotový vlastní návrh**: úplnou morfologickou identitu a konkrétní použitý tvar. Exact-match kontrola smí pouze potvrdit, že tato přesná kombinace je již schválená; nesmí z částečných údajů nabízet možné identity, autocomplete, podobná slova ani alternativní analýzy. Nepotvrzený exact match neznamená zamítnutí a hráč může kandidát normálně předložit k review.

U kategorií řízených produktivním soutěžním modelem se nepravidelné, defektivní, nesklonné nebo jinak atypické vlastnosti mimo tento model nepoužívají ani tehdy, když dané české slovo v katalogu existuje. Zájmena se řídí zvláštním režimem výše.

## 10. Morfologické modely

Kvazislova i soutěžně použitelná skutečná slova v produktivních kategoriích se řídí uzavřenými soutěžními modely.

Název modelu je herní označení modelu inspirovaného češtinou, nikoli otevřený odkaz na všechny české dublety, alternace nebo lexikální výjimky.

Každý model musí přesně určit:

- podmínku lemmatu / základního tvaru,
- mechanické pravidlo kmene, pokud jej používá,
- vztah mezi deklarovanými morfologickými hodnotami a použitým tvarem,
- všechny normativně povolené realizace a varianty.

Pro jeden použitý tvar nesmí model připouštět libovolně mnoho základních tvarů a soutěžních identit. Konečný počet různých přesně doložitelných analýz je přípustný.

Existence jiné spisovné varianty mimo normativní tabulku sama soutěžní přípustnost nezakládá. Variantní realizace sama nevytváří novou soutěžní identitu.

**Reachability není součást definice modelu.** Normativně povolený model nebo větev zůstává v pravidlech i tehdy, pokud žádná jeho realizace nemůže projít aktuálním znakovým/motivovým systémem.

Zájmena nejsou produktivní kategorií podle tohoto oddílu; jejich zvláštní `real-word-only` režim je v oddílech 7 a 9.

## 11. Substantiva

Soutěžní substantivní modely:

### Mužský rod
- `pán` – životný, lemma na souhlásku,
- `muž` – životný, lemma na souhlásku,
- `předseda` – životný, lemma na `-a`,
- `soudce` – životný, lemma na `-e`,
- `hrad` – neživotný, lemma na souhlásku,
- `stroj` – neživotný, lemma na souhlásku.

U `pán/muž` a `hrad/stroj` se u kvazislov nevyžaduje přirozená fonologická preference tvrdosti/měkkosti; rozhodující je zvolený uzavřený soutěžní model.

### Ženský rod
- `žena` – lemma na `-a`,
- `růže` – lemma na `-e`,
- `píseň` – lemma na souhlásku,
- `kost` – lemma na souhlásku.

### Střední rod
- `město` – lemma na `-o`,
- `moře` – lemma na `-e`,
- `kuře` – lemma na `-e`, rozšířený kmen podle normativního modelu,
- `stavení` – lemma na `-í`.

Všechny uvedené modely zůstávají normativně dostupné bez ohledu na reachability. Přesná paradigmata a pravidla kmene se uzavírají v #1.

## 12. Adjektiva

Soutěžní modely:

- `mladý`,
- `jarní`,
- `otcův`,
- `matčin`.

Stupňování je koncepčně povolený mechanismus. Krátké / jmenné tvary lze použít pouze v rozsahu, který výslovně dovolí finální normativní model. Novému kvaziadjektivu nelze svévolně vytvořit neproduktivní nebo nepravidelný krátký tvar.

Substantivizované adjektivum je morfologicky stále adjektivum.

Reachability není důvodem žádný z těchto modelů nebo mechanismů odstranit, skrýt nebo přesunout mimo hráčskou nabídku. Přesná paradigmata uzavírá #1.

## 13. Slovesa a valence

Kvazisloveso:

- používá jeden z uzavřených soutěžních časovacích typů,
- volí vid z hodnot `nedokonavý`, `dokonavý`, `obouvidový`,
- obsahuje slovní valenční obhajobu konkrétního použití ve větě.

Morfologickou soutěžní identitu slovesa tvoří:

`infinitiv + soutěžní časovací typ`

Vid ani valence samy o sobě novou identitu nevytvářejí.

Valence není samostatný strukturovaný soutěžní model. Hráč ji obhajuje volným textem. Z obhajoby musí být srozumitelné:

- jaká doplnění zvolené použití slovesa vyžaduje,
- která slova nebo části konkrétní kvazivěty tato doplnění realizují,
- o jaké konkrétní současné české sloveso a jeho použití se obhajoba opírá.

Pravidla nevyžadují převod této obhajoby do kanonického kódu nebo strukturovaného seznamu valenčních slotů. Všechna obligatorní doplnění z obhájeného použití musí být ve větě výslovně realizována.

Modelové sloveso pro valenci nemusí být stejné jako případný jazykový podklad pro časování. Časování se neposuzuje analogií s libovolným českým slovesem.

Finální soutěžní časovací typy, jejich úplná paradigmata a pomocné slovesné mechanismy uzavírá #2. Reachability se při jejich výběru nepoužívá jako filtr.

## 14. Fiktivní význam

Kvazislovo může mít fiktivní význam.

Fiktivní význam:

- může pomoci obhájit syntaktickou roli,
- nesmí vytvářet novou identitu,
- nesmí měnit morfologii,
- nesmí zakládat nepovolenou rekci,
- nesmí nahrazovat valenční obhajobu,
- nesmí obcházet soutěžní omezení.

Lze jej použít pouze v rámci výslovně povoleného syntaktického vztahu. Pokud je význam pro platnost konstrukce podstatný, musí použití odpovídat současné spisovné české analogii stejného hlavního vztahu.

## 15. Soutěžní identita

Jednou použitá soutěžní identita je v dané větě vyčerpaná.

### Substantivum
`lemma + rod + životnost (je-li relevantní) + soutěžní skloňovací model`

Pád a číslo novou identitu nevytvářejí.

### Adjektivum
`lemma / základní tvar + soutěžní skloňovací model`

Rod, pád, číslo, stupeň a syntaktická funkce novou identitu nevytvářejí.

### Sloveso
`infinitiv + soutěžní časovací typ`

Vid ani valence novou identitu nevytvářejí.

### Zájmeno
Soutěžní identitu tvoří konkrétní zájmenný lexém / lemma.

Pád, číslo, rod, osoba a jiné morfologické vlastnosti konkrétního použitého tvaru samy novou soutěžní identitu nevytvářejí. Tentýž zájmenný lexém proto nelze v jedné větě znovu použít jen v jiné morfologické podobě.

### Funkční jednopísmenná slova
`k`, `v`, `z`, `a`, `i` jsou jednotlivé soutěžní identity; každou lze použít nejvýše jednou.

Rozdíl mezi `Q` a `KV` není variantním zápisem téže identity. Rozdíl velkých/malých písmen identitu nemění.

## 16. Interpunkce

Uvnitř soutěžního zápisu nejsou čárky, středníky, dvojtečky, pomlčky, spojovníky, závorky, uvozovky, lomítka, apostrofy ani jiná pomocná znaménka.

Nelze použít konstrukci, která by takové znaménko podle současné spisovné normy vyžadovala.

Hráč deklaruje typ věty:

- oznamovací → `.`,
- tázací → `?`,
- rozkazovací → `!`.

Závěrečné znaménko není soutěžním znakem a nepočítá se do délky.

## 17. Analýza řešení a veřejný detail

Stačí jedna úplná a interně konzistentní analýza. Řešitel nemusí dokazovat, že jiná možná analýza neexistuje.

Odevzdání musí obsahovat úplná data vyžadovaná aktuálními modely a field schematem #5, včetně plné morfologické deklarace a případných obhajob. U slovesa je navíc povinná slovní valenční obhajoba podle oddílu 13. U zájmena se místo soutěžního morfologického modelu uvádí zájmenný lexém / lemma a relevantní vlastnosti konkrétního použitého tvaru podle oddílů 7 a 9.

Konkrétní UI ani datový model nesmí měnit jazykovou platnost.

### Veřejné zveřejnění schválené věty
Úplný rozhodcovský spis není veřejným výstupem.

V seznamu schválených vět se zveřejňuje zejména:

- věta,
- počet slov,
- počet soutěžních znaků,
- autor / spoluautoři.

V detailu lze u jednotlivých slov zveřejnit lehký jazykový rozbor: použitý tvar, skutečné slovo / kvazislovo, slovní druh, lemma, soutěžní model tam, kde jej daná kategorie používá, základní vlastnosti konkrétního použitého tvaru a syntaktickou roli / jednoduché vazby.

Kompletní paradigma, úplná morfologická obhajoba, interní review, důkazní podklady a katalogové interní stavy zůstávají neveřejné.

## 18. Zdroje a důkazní břemeno

Důkazní břemeno v jazykovém sporu nese řešitel.

Status skutečného soutěžního slova se neposuzuje přímým splněním jednoho povinného externího slovníku, ale podle katalogu z oddílu 9.

Při námitce proti katalogu nebo při jiné jazykové obhajobě mohou být relevantní zejména:

- IJP, ASSČ a další zdroje ÚJČ,
- akademické a vysokoškolské mluvnice,
- odborné slovníky a publikace,
- jiné relevantní odborné zdroje.

Náhodný internetový výskyt sám o sobě nestačí jako přesvědčivá jazyková obhajoba. U kvazislova se nedokládá existence slova, ale pravidlo/model, o který se opírá. U valence se dokládá jazyková analogie konkrétního použití slovesa.

## 19. Nástroje, fair play a důvěra

Úplná normativní politika používání nástrojů je v `03-ai-policy.md`.

Základní duch je: **AI smí vysvětlit hru, nesmí ji za hráče hrát.** Automatický nástroj nesmí za hráče hledat, generovat, skládat nebo optimalizovat soutěžní kandidáty.

Dodržování této části stojí na fair play a vzájemné důvěře. Projekt nevyžaduje pracovní logy, screenshoty, historii promptů ani jiný dohledový důkaz způsobu vzniku řešení a nevytváří vyšetřovací režim používání nástrojů.

## 20. Platnost, uznání a kvaziautorita

Kvaziautorita konečně rozhoduje, zda je řešení podle příslušné verze pravidel platné.

Jazykově platné a řádně podané řešení nelze odmítnout pouze proto, že využívá neočekávanou nebo nežádoucí vlastnost pravidel. Pravidlovou díru lze zavřít až v nové verzi pravidel. Oprava nebo doplnění katalogu skutečných slov je běžná provozní správa podle oddílu 9.

Nepravdivé nebo zfalšované údaje v samotném podání mohou vést k jeho zamítnutí. Projekt ale neprovádí forenzní kontrolu toho, jak hráč řešení hledal.

## 21. Skóre

Primární: počet slov.

Sekundární: počet soutěžních znaků bez mezer.

Shoda obou hodnot = společný rekord. Pořadí podání nerozhoduje.

`Q` se počítá jako jeden skutečně zapsaný znak; `KV` jako dva.

## 22. Reachability a slepé cesty

**Reachability je analytická vlastnost pravidel, nikoli normativní filtr.**

Platí:

- model, morfologická větev nebo jiný normativně povolený mechanismus zůstává součástí pravidel i při prokázané nedosažitelnosti,
- nedosažitelnost není důvodem volbu skrýt, zakázat, odstranit z UI ani přesunout do hraniční kapitoly,
- hráčské materiály nemají známé slepé cesty označovat nebo prozrazovat jen proto, že je interní audit zjistil,
- interní reachability analýza může sloužit k auditu, testům a poznání herního prostoru,
- konkrétní hráčův použitý povrchový tvar musí samozřejmě vždy splnit všechna znaková, motivová, morfologická a syntaktická pravidla.

Možnost hledat i cesty, které nakonec nevedou k platnému tahu, je záměrnou součástí hry.

## 23. Autorství, spolupráce a navazování

Kvazi je otevřený kumulativní problém.

- zveřejněné schválené řešení, jednotlivé kvazislovo, konstrukci nebo jiný zveřejněný nápad smí kdokoli použít, upravit nebo rozvíjet,
- na jednotlivé herní nápady se nezavádí výlučné vlastnictví,
- lidé smějí řešení konzultovat a tvořit společně,
- jedno podání může mít více spoluautorů,
- autorem konkrétního podání je osoba / skupina uvedená u tohoto podání; předchozí rekordy a jejich autoři se zpětně nemažou,
- přesná kopie existující věty sama nevytváří nový delší rekord; pravidla nevyšetřují, zda šlo o opis nebo nezávislý objev.

Veřejné zveřejnění podle oddílu 17 proto zároveň vytváří legitimní společnou znalost hry.