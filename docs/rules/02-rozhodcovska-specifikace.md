# Rozhodcovská specifikace

> **Status:** hlavní normativní dokument. Společně s výslovně normativními částmi kvazitaháku určuje platnost řešení.

## 1. Hierarchie

Při posuzování platí v tomto pořadí:

1. výslovná pravidla kvaziproblému,
2. normativní tabulky a seznamy kvazitaháku v rozsahu, v němž na ně pravidla odkazují,
3. současná spisovná čeština ve věcech, které soutěžní systém výslovně neupravuje,
4. konečný výklad kvaziautority v nejasném nebo sporném případě.

Technická implementace ani formulář nejsou vyšší autoritou než pravidla. Spravovaný katalog skutečných slov má pouze zvláštní autoritativní roli vymezenou v oddílu 9.

## 2. Soutěžní abeceda

Povolené znaky:

`K V Q A Á Z I Í Y Ý`

Velká a malá písmena jsou při kontrole řetězce i identity totožná.

Diakritika se rozlišuje:

- `A ≠ Á`
- `I ≠ Í`
- `Y ≠ Ý`

Každý skutečně zapsaný soutěžní znak má při skórování hodnotu jednoho písmene.

`Q = 1`, `KV = 2`.

`Q` se vyslovuje `/kv/`, ale je samostatným soutěžním písmenem. Není zkratkou, ligaturou ani alternativním pravopisným zápisem dvojice `KV`.

Při určování lemmatu, základního tvaru, morfologie, soutěžní identity, skutečnosti slova a při práci s jazykovými zdroji se `Q` nikdy automaticky nerozvíjí ani nenormalizuje na `KV`.

Shodná výslovnost `Q` a posloupnosti `KV` sama o sobě nezakládá žádnou morfologickou, lexikální ani identitní shodu. Například zápisy `QAZ` a `KVAZ` představují dvě odlišná slova a nelze jim pouze kvůli stejné výslovnosti přiřadit tutéž morfologickou identitu.

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

Předložky `k`, `v`, `z` se z herních důvodů používají vždy v nevokalizované podobě; `ke`, `ve`, `ze` se nepoužívají. Tato výjimka se týká pouze jejich povrchové podoby. Jinak zůstávají běžnými českými předložkami a musí tvořit jazykově platnou předložkovou konstrukci s řízeným jmenným členem. Zachovává se běžná pádová rekce: `k` + dativ, `v` + lokál nebo akuzativ podle významu konstrukce, `z` + genitiv.

## 5. Věta

Kvazivěta je jedna jednoduchá věta s jedinou hlavní predikační osou.

Musí obsahovat:

- právě jeden podmět, s výjimkou pravidelně nevyjádřeného podmětu u dovoleného imperativu,
- právě jeden přísudek,
- právě jeden token plnovýznamového slovesa.

Několikanásobný podmět a několikanásobný přísudek nejsou dovoleny.

U oznamovací a tázací věty je podmět výslovně vyjádřen a má jednu řídící hlavu.

Doplněk se pro účely soutěže nepovažuje za další hlavní predikační osu ani další přísudek.

Přístavek není dovolen.

Elipsa obligatorního členu není dovolena.

Všechna obligatorní doplnění, která vyplývají z obhájeného valenčního použití slovesa, musí být ve větě výslovně realizována; jedinou zvláštní výjimkou je povolený nevyjádřený podmět imperativu.

Celá syntaktická analýza musí být jedna propojená struktura kolem jediného přísudku. Syntaktické závislosti nesmějí tvořit kruh. Podmět a přísudek musí být v kategoriích, v nichž to současná spisovná čeština vyžaduje, v běžné morfosyntaktické shodě.

### Pomocná slovesa

Původní návrh dovoloval skutečný pomocný tvar jako součást jediného přísudku. Tato větev je nyní **předmětem reachability auditu**.

Dokud není audit uzavřen:

- hlavní veřejná pravidla ji nemusí prezentovat jako běžnou herní možnost,
- případné posouzení patří do závazných hraničních pravidel.

## 6. Povolená syntax

Povolené jsou **pouze** syntaktické vztahy a konstrukce uvedené v normativním kvazitaháku.

Aktuálně zamýšlené základní kategorie:

- podmět,
- přísudek,
- předmět,
- přívlastek shodný,
- přívlastek neshodný,
- příslovečné určení,
- doplněk,
- koordinace pomocí `a` a `i`, pokud nevznikne několikanásobný podmět ani přísudek.

Spojky `a`, `i` musí spojovat dvě výslovně přítomné souřadné části téže věty. Obě části musí mít stejnou hlavní syntaktickou funkci a koordinovaná skupina jako celek zastává jednu syntaktickou roli vůči nadřazené konstrukci.

Lexikální rekce podstatných a přídavných jmen se v soutěži **nepoužívá**.

Uzavřenost platí pro hlavní syntaktické vztahy uvedené výše. Jejich běžné významové podtypy nejsou samostatnými soutěžními konstrukcemi a nemusí být vyjmenovány všechny. Příklady v kvazitaháku jsou názorné, nikoli vyčerpávající.

Každý deklarovaný vztah musí splnit rozhodovací test své hlavní funkce v normativním kvazitaháku a odevzdání musí zachytit všechny tímto testem vyžadované vazby ke konkrétním tokenům. Pouhé přiřazení názvu povolené funkce konstrukci, která její test nesplňuje, nestačí.

Je-li syntaktická platnost členu závislá na valenci slovesa, posuzuje se podle slovní valenční obhajoby dle oddílu 13 a `docs/kvazitahak/05-valence.md`, nikoli podle uzavřeného seznamu strukturovaných rámců.

Není-li některá další mezislovní podmínka výslovně soutěžně upravena, musí konstrukce obstát jako současná spisovná čeština.

## 7. Slovní druhy

Povoleny jsou:

- substantiva,
- adjektiva,
- slovesa,
- skutečná česká zájmena pouze v rozsahu, který dovolí normativní soutěžní modely a reachability audit,
- `k`, `v`, `z`,
- `a`, `i`.

Zakázány jsou:

- číslovky,
- příslovce,
- částice,
- citoslovce,
- ostatní neuvedené slovní druhy.

Nová zájmena nelze vytvářet.

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

Shoda zápisu se skutečným českým slovem sama o sobě neurčuje, zda jde o skutečné slovo, nebo kvazislovo. Rozhoduje celá soutěžní identita a aktuální stav katalogu skutečných slov:

- odpovídá-li deklarovaná identita a použitý tvar schválené položce katalogu skutečných slov, jde pro soutěž o skutečné slovo a tutéž identitu nelze v daném posouzení znovu prohlásit za kvazislovo,
- není-li deklarovaná identita/tvar v katalogu jako skutečné slovo schválená, může být při splnění ostatních pravidel posuzována jako kvazislovo,
- takové kvazislovo musí samo splnit zvolený soutěžní model; pouhá existence stejně zapsaného českého slova mimo katalog jeho kvazimorfologii nedokládá.

## 9. Skutečné české slovo

Pro soutěžní status skutečného slova je autoritou **spravovaný katalog skutečných slov a tvarů**.

Skutečné české slovo lze použít pouze tehdy, když:

1. jeho základní tvar, slovní druh a vlastnosti tvořící soutěžní identitu odpovídají schválené položce katalogu,
2. jeho konkrétní použitý tvar je v katalogu schválený pro tuto identitu a deklarované morfologické hodnoty,
3. tentýž konkrétní tvar současně odpovídá některému povolenému soutěžnímu morfologickému modelu.

Není-li kandidátní skutečné slovo v katalogu schválené, řešitel může požádat kvaziautoritu o přezkoumání nebo vznést námitku. Po jazykovém ověření lze katalog doplnit nebo opravit.

Při správě katalogu může kvaziautorita vycházet zejména z IJP, ASSČ, dalších jazykových příruček, mluvnic a relevantních odborných zdrojů. Tyto zdroje však samy nejsou přímým soutěžním whitelistem hráče; rozhodující je přijatý stav našeho katalogu.

Katalog je záměrně průběžně spravovatelný. Jeho jednotlivé opravy nebo doplnění samy o sobě nevyžadují novou `rules_version`.

Nepravidelné, defektivní, nesklonné nebo jinak atypické tvary a vlastnosti, které nespadají do soutěžních modelů, se nepoužívají ani tehdy, když příslušné české slovo v katalogu existuje.

Zda bude úplný katalog veřejně a taxativně zveřejněn, je samostatné otevřené produktové rozhodnutí (#72).

## 10. Morfologické modely

Kvazislova i soutěžně použitelná skutečná slova se řídí uzavřenými soutěžními modely.

Konkrétní paradigmata a povolené hodnoty jsou normativně uvedeny v kvazitaháku.

Obecně:

- model přebírá své normativní paradigma,
- model přesně určuje vztah mezi základním tvarem, deklarovanými morfologickými hodnotami a konkrétním použitým tvarem,
- samotná deklarace hráče bez odvození použitého tvaru podle zvoleného modelu nestačí,
- model nesmí umožňovat odvození téhož konkrétního použitého tvaru z libovolně mnoha základních tvarů a soutěžních identit,
- varianty výslovně povolené v normativní tabulce nezakládají novou identitu,
- lexikální nebo nepravidelné odchylky mimo model se nepřenášejí.

Tento požadavek nepřikazuje jedinou možnou analýzu povrchového tvaru. Konečný počet různých analýz, které jsou jednotlivě přesně doložitelné normativními modely, je přípustný.

## 11. Substantiva

Soutěžní substantivní vzory:

### Mužský rod
- `pán` – životný, lemma na souhlásku
- `muž` – životný, lemma na souhlásku
- `předseda` – životný, lemma na `-a`
- `soudce` – životný, lemma na `-e`
- `hrad` – neživotný, lemma na souhlásku
- `stroj` – neživotný, lemma na souhlásku

U `pán/muž` a `hrad/stroj` se u kvazislov nevyžaduje přirozená fonologická preference tvrdosti/měkkosti; rozhodující je konzistence zvoleného soutěžního modelu.

### Ženský rod
- `žena` – lemma na `-a`
- `růže` – lemma na `-e`
- `píseň` – lemma na souhlásku
- `kost` – lemma na souhlásku

### Střední rod
- `město` – lemma na `-o`
- `moře` – lemma na `-e`
- `kuře` – lemma na `-e`, rozšířený kmen typu `kuřete/kuřeti`
- `stavení` – lemma na `-í`

Model `kuře` podléhá reachability auditu; pokud se ukáže soutěžně nedosažitelný, přesune se z hlavního herního taháku do hraniční specifikace.

## 12. Adjektiva

Aktuálně definované soutěžní modely:

- `mladý`
- `jarní`
- přivlastňovací typy `otcův`, `matčin`

Přivlastňovací typy, stupňování a krátké jmenné tvary podléhají reachability auditu.

Substantivizované adjektivum je morfologicky stále adjektivum.

Skutečné doložené krátké formy lze použít pouze tehdy, pokud je připouští normativní soutěžní model; novému adjektivu nelze svévolně vytvořit nepravidelný krátký tvar.

Obecná slovotvorba sama o sobě nezakládá platnost ani identitu. Slovotvorný vztah se dokládá jen tam, kde jej konkrétní soutěžní model výslovně vyžaduje.

## 13. Slovesa a valence

Kvazisloveso:

- používá jeden z uzavřených soutěžních časovacích typů v kvazitaháku,
- volí vid z uzavřené soutěžní sady,
- obsahuje slovní valenční obhajobu konkrétního použití ve větě.

Valence není samostatný strukturovaný soutěžní model a není součástí morfologické ani soutěžní identity slovesa.

Hráč ji obhajuje volným textem. Z obhajoby musí být srozumitelné:

- jaká doplnění zvolené použití slovesa vyžaduje,
- která slova nebo části konkrétní kvazivěty tato doplnění realizují,
- o jaké konkrétní současné české sloveso a jeho použití se obhajoba opírá.

Pravidla nevyžadují převod této obhajoby do kanonického kódu typu `ACC`, `DAT + ACC` ani do strukturovaného seznamu valenčních slotů.

Všechna obligatorní doplnění vyplývající z obhájeného valenčního použití musí být ve větě výslovně realizována.

Modelové sloveso pro valenci nemusí být stejné jako případný jazykový podklad pro časování nebo jiné morfologické vlastnosti.

Časování se neposuzuje analogií s libovolným českým slovesem.

Vid se nedokládá libovolným externím modelovým slovesem.

Valenční obhajoba se automaticky jazykově nevaliduje ani neporovnává jako katalogová identita. Při jazykovém review však může být důvodem k zamítnutí řešení, pokud analogie neobstojí nebo ve větě chybí obligatorní doplnění, které z obhájeného použití vyplývá.

Přesné časovací typy zůstávají `TODO` normativního kvazitaháku.

## 14. Fiktivní význam

Kvazislovo může mít fiktivní význam.

Fiktivní význam:

- může pomoci obhájit syntaktickou roli,
- nesmí vytvářet novou identitu,
- nesmí měnit morfologii,
- nesmí zakládat nepovolenou rekci,
- nesmí nahrazovat valenční obhajobu,
- nesmí obcházet soutěžní omezení.

Lze jej použít pouze v rámci výslovně povoleného syntaktického vztahu.

Pokud je význam pro platnost konstrukce podstatný, použití musí odpovídat běžné české analogii uvedené v kvazitaháku nebo jiné zjevně stejné konstrukci současné spisovné češtiny. Jiná analogie může doložit běžný významový podtyp povoleného vztahu, ale nesmí vytvořit nový hlavní syntaktický vztah ani obejít jeho rozhodovací test nebo valenční obhajobu.

## 15. Soutěžní identita

Jednou použitá soutěžní identita je v dané větě vyčerpaná.

### Substantivum

Identitu tvoří:

`lemma + rod + životnost (je-li relevantní) + soutěžní skloňovací model`

Pád a číslo novou identitu nevytvářejí.

### Adjektivum

Identitu tvoří:

`lemma / základní tvar + soutěžní skloňovací model`

Rod, pád, číslo, stupeň a syntaktická funkce novou identitu nevytvářejí.

### Sloveso

Identitu tvoří:

`infinitiv + soutěžní časovací typ`

Vid ani valence samy o sobě novou identitu nevytvářejí.

V jedné kvazivětě je právě jeden plnovýznamový slovesný token; valence se proto nepoužívá jako prostředek rozlišování více slovesných identit uvnitř jedné věty.

### Zájmeno

Pokud bude v aktuální verzi soutěžně dosažitelné, identitu tvoří konkrétní skutečný zájmenný lexém podle normativní specifikace.

### Funkční jednopísmenná slova

`k`, `v`, `z`, `a`, `i` jsou jednotlivé soutěžní identity; každou lze použít nejvýše jednou.

### Co identitu nevytváří

Samo o sobě novou identitu nevytváří zejména:

- význam,
- syntaktická funkce,
- pád,
- číslo,
- stupeň adjektiva,
- vid slovesa,
- valenční obhajoba slovesa,
- variantní koncovka,
- dubleta,
- slovotvorný původ,
- etymologie,
- rozdíl velkých/malých písmen.

Rozdíl mezi `Q` a posloupností `KV` není variantním zápisem téže identity. Pokud se dva tvary nebo jejich základní tvary liší `Q` oproti `KV`, jde o skutečný rozdíl v zápisu, který se při morfologické identifikaci zachovává; shodná výslovnost jej nemaže.

Skutečné slovo a kvazislovo stejného zápisu mohou být dvě různé identity jen tehdy, pokud se skutečně liší některou vlastností, která je podle těchto pravidel součástí identity.

Je-li konkrétní identita a tvar schválen v katalogu skutečných slov, nelze tutéž identitu v témže aktuálním posouzení vydávat za kvazislovo. Jiná morfologická identita stejného zápisu může být kvazislovem, pokud sama splní příslušný soutěžní model.

## 16. Interpunkce

Uvnitř soutěžního zápisu nejsou čárky, středníky, dvojtečky, pomlčky, spojovníky, závorky, uvozovky, lomítka, apostrofy ani jiná pomocná znaménka.

Nelze použít konstrukci, která by takové znaménko podle současné spisovné normy vyžadovala.

Na konci je povinně `.`, `?` nebo `!`.

Závěrečné znaménko není soutěžním znakem a nepočítá se do délky.

## 17. Analýza řešení

Stačí jedna úplná a interně konzistentní analýza.

Řešitel nemusí dokazovat, že jiná možná analýza neexistuje.

Odevzdání musí pro každé slovo strukturovaně zachytit alespoň:

- pořadí a použitý tvar,
- slovní druh,
- úplnou morfologickou identifikaci vyžadovanou pro daný slovní druh a soutěžní model,
- soutěžní identitu,
- morfologickou obhajobu a případné požadované podklady,
- syntaktickou funkci,
- všechny vztahy ke konkrétním dalším tokenům, které zvolená syntaktická konstrukce vyžaduje,
- další údaje daného modelu.

U slovesa musí být navíc uvedena slovní valenční obhajoba podle oddílu 13. Tato obhajoba se nepřevádí do další morfologické identity ani do povinného strukturovaného valenčního rámce.

Odborný významový podtyp hlavní syntaktické funkce není povinným strukturovaným údajem, pokud jej jiné výslovné normativní pravidlo nevyžaduje. Je-li vztah nejasný nebo závislý na fiktivním významu, zachytí se v obhajobě běžná česká analogie.

Konkrétní UI ani datový model formuláře nesmí měnit jazykovou platnost.

## 18. Zdroje a důkazní břemeno

Důkazní břemeno v jazykovém sporu nese řešitel.

Status skutečného soutěžního slova se neposuzuje přímým splněním jednoho povinného externího slovníku, ale podle katalogu skutečných slov z oddílu 9.

Při námitce proti katalogu nebo při jiné jazykové obhajobě mohou být relevantní zejména:

- IJP, ASSČ a další zdroje ÚJČ,
- akademické a vysokoškolské mluvnice,
- odborné slovníky a publikace,
- jiné relevantní odborné zdroje.

Náhodný internetový výskyt sám o sobě nestačí jako přesvědčivá jazyková obhajoba. Kvaziautorita však není vázána jediným taxativním seznamem externích zdrojů při správě katalogu skutečných slov.

U kvazislova se nedokládá existence slova, ale pravidlo/model, o který se opírá. U valenční obhajoby se dokládá jazyková analogie konkrétního použití slovesa, nikoli samostatná soutěžní identita.

## 19. Nástroje

Úplná normativní politika používání nástrojů je v `03-ai-policy.md`. Tento dokument ji neduplikuje.

## 20. Platnost, uznání a kvaziautorita

Kvaziautorita konečně rozhoduje, zda řešení podle příslušné verze pravidel platné je.

Je-li řešení:

- platné,
- řádně podané,
- nevzniklo porušením pravidel soutěžního procesu nebo zakázaných prostředků,

musí být uznáno.

Jazykově platné řešení nelze odmítnout pouze proto, že využívá neočekávanou nebo nežádoucí vlastnost pravidel.

Pravidlovou díru lze zavřít až v nové verzi pravidel. Oprava nebo doplnění katalogu skutečných slov je však běžná provozní správa podle oddílu 9 a sama o sobě novou `rules_version` nevyžaduje.

Řešení lze vyřadit při porušení soutěžního procesu, například:

- použitím zakázaných prostředků,
- nepravdivým podáním,
- falšováním podkladů,
- zneužitím soutěžního systému.

## 21. Skóre

Primární: počet slov.

Sekundární: počet soutěžních písmen bez mezer.

Shoda obou hodnot = společný rekord.

Pořadí podání nerozhoduje.

## 22. Reachability a struktura veřejných pravidel

Před veřejnou verzí se provede interní reachability audit.

Hlavní pravidla a normativní tahák mají hráči prezentovat především mechanismy, které jsou v aktuálním soutěžním systému reálně použitelné.

Pravidla pro hraniční, výjimečné nebo málo pravděpodobné situace se přesouvají do samostatné závazné kapitoly.

Samotné nenalezení příkladu není důkaz nedosažitelnosti; odstranění mechanismu má být podloženo jednoznačným závěrem v rámci uzavřeného soutěžního systému.
