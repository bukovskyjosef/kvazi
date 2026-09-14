# Rozhodcovská specifikace

> **Status:** hlavní normativní dokument. Společně s výslovně normativními částmi kvazitaháku určuje platnost řešení.

## 1. Hierarchie

Při posuzování platí v tomto pořadí:

1. výslovná pravidla kvaziproblému,
2. normativní tabulky a seznamy kvazitaháku v rozsahu, v němž na ně pravidla odkazují,
3. současná spisovná čeština ve věcech, které soutěžní systém výslovně neupravuje,
4. konečný výklad kvaziautority v nejasném nebo sporném případě.

Technická implementace, formulář ani interní katalog nejsou vyšší autoritou než pravidla.

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

`Q` se vyslovuje `/kv/`.

## 3. Motiv

Základní motiv je `KVAZI`.

V každém výskytu lze nezávisle použít:

- `KV → Q`
- `A → A | Á`
- `Z → Z`
- `I → I | Í | Y | Ý`

Úplné motivy:

```text
KVAZI KVAZÍ KVAZY KVAZÝ
KVÁZI KVÁZÍ KVÁZY KVÁZÝ
QAZI  QAZÍ  QAZY  QAZÝ
QÁZI  QÁZÍ  QÁZY  QÁZÝ
```

Celá věta po spojení slov musí být souvislým úsekem nepřetržité posloupnosti těchto motivů. Začátek a konec smějí ležet uvnitř motivu.

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

Pro soutěž jsou nevokalizované `k`, `v`, `z` přípustné před jakýmkoli jinak dovoleným slovem. `ke`, `ve`, `ze` se nepoužívají.

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

Všechny obligatorní členy zvoleného valenčního rámce musí být ve větě výslovně realizovány; jedinou zvláštní výjimkou je povolený nevyjádřený podmět imperativu.

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

Spojky `a`, `i` musí spojovat dvě výslovně přítomné souřadné části téže věty.

Lexikální rekce podstatných a přídavných jmen se v soutěži **nepoužívá**.

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

## 9. Skutečné české slovo

Skutečné české slovo lze použít pouze tehdy, když:

1. jeho konkrétní použitý tvar je doloženým tvarem současné spisovné češtiny,
2. tentýž konkrétní tvar současně odpovídá některému povolenému soutěžnímu morfologickému modelu.

Existenci skutečného slova lze soutěžně doložit pouze:

- slovníkovou částí [Internetové jazykové příručky ÚJČ](https://prirucka.ujc.cas.cz/) (IJP),
- již zveřejněným heslem [Akademického slovníku současné češtiny](https://www.slovnikcestiny.cz/) (ASSČ).

Záznam v některém z těchto zdrojů dokládá pouze existenci slova; nenahrazuje ostatní podmínky tohoto oddílu, zejména současnou spisovnost konkrétního tvaru a shodu se soutěžním modelem.

SSJČ, PSJČ, korpusy, jiné slovníky ani internetové výskyty samy o sobě existenci skutečného soutěžního slova neprokazují.

Nepravidelné, defektivní, nesklonné nebo jinak atypické tvary a vlastnosti, které nespadají do soutěžních modelů, se nepoužívají.

Externí existence zvláštního reálného tvaru sama o sobě nezakládá právo použít jej v soutěži.

Veřejný úplný katalog všech přípustných reálných slov se nezveřejňuje.

## 10. Morfologické modely

Kvazislova i soutěžně použitelná skutečná slova se řídí uzavřenými soutěžními modely.

Konkrétní paradigmata a povolené hodnoty jsou normativně uvedeny v kvazitaháku.

Obecně:

- model přebírá své normativní paradigma,
- varianty výslovně povolené v normativní tabulce nezakládají novou identitu,
- lexikální nebo nepravidelné odchylky mimo model se nepřenášejí.

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

## 13. Slovesa

Kvazisloveso:

- používá jeden z uzavřených soutěžních časovacích typů v kvazitaháku,
- volí vid z uzavřené soutěžní sady,
- volí právě jeden valenční rámec z uzavřené soutěžní sady.

Časování se neposuzuje analogií s libovolným českým slovesem.

Valence se nepřebírá z libovolného českého valenčního slovníku.

Vid se nedokládá libovolným externím modelovým slovesem.

Přesné časovací typy, povolené vidy a valenční rámce jsou `TODO` normativního kvazitaháku.

## 14. Fiktivní význam

Kvazislovo může mít fiktivní význam.

Fiktivní význam:

- může pomoci obhájit syntaktickou roli,
- nesmí vytvářet novou identitu,
- nesmí měnit morfologii,
- nesmí zakládat nepovolenou rekci,
- nesmí nahrazovat valenční rámec,
- nesmí obcházet soutěžní omezení.

Lze jej použít pouze v rámci výslovně povoleného syntaktického vztahu.

Pokud je význam pro platnost konstrukce podstatný, použití musí odpovídat běžné české analogii uvedené v kvazitaháku nebo jiné zjevně stejné konstrukci současné spisovné češtiny.

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

`infinitiv + soutěžní časovací typ + valenční rámec`

Vid sám o sobě novou identitu nevytváří.

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
- variantní koncovka,
- dubleta,
- slovotvorný původ,
- etymologie,
- rozdíl velkých/malých písmen.

Skutečné slovo a kvazislovo stejného zápisu mohou být dvě různé identity jen tehdy, pokud se skutečně liší některou vlastností, která je podle těchto pravidel součástí identity.

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
- morfologickou obhajobu a požadované zdroje,
- syntaktickou funkci,
- všechny vztahy ke konkrétním dalším tokenům, které zvolená syntaktická konstrukce vyžaduje,
- další údaje daného modelu.

Konkrétní UI ani datový model formuláře nesmí měnit jazykovou platnost.

## 18. Zdroje a důkazní břemeno

Důkazní břemeno v jazykovém sporu nese řešitel.

Důkaz existence skutečného soutěžního slova se řídí uzavřeným seznamem zdrojů v oddílu 9.

Pro jiné jazykové otázky mohou být relevantní zejména:

- ÚJČ a jeho slovníky/příručky,
- akademické a vysokoškolské mluvnice,
- odborné slovníky a publikace,
- jiné relevantní odborné zdroje.

Žádný z těchto dalších zdrojů nerozšiřuje množinu skutečných soutěžních slov vymezenou oddílem 9. Náhodný internetový výskyt sám o sobě nestačí ani pro jinou jazykovou obhajobu.

U kvazislova se nedokládá existence slova, ale pravidlo/model, o který se opírá.

## 19. Nástroje a AI

Úplná politika je v `03-ai-policy.md`.

Základ:

- soutěžní řešení vytváří člověk vlastní hlavou,
- soutěžící smí ručně pracovat s dovolenými zdroji a mechanicky ověřit konkrétní vlastní nápad,
- žádný nástroj nesmí soutěžní kandidáty automaticky generovat, enumerovat, hromadně filtrovat, skládat, porovnávat ani optimalizovat,
- AI smí soutěžícímu vysvětlovat pouze obecnou současnou spisovnou češtinu bez kvazikontextu,
- soutěžící nesmí s AI komunikovat o jakémkoli obsahu přímo spojeném s kvaziproblémem nebo soutěží.

## 20. Platnost, uznání a kvaziautorita

Kvaziautorita konečně rozhoduje, zda řešení podle příslušné verze pravidel platné je.

Je-li řešení:

- platné,
- řádně podané,
- nevzniklo porušením pravidel soutěžního procesu nebo zakázaných prostředků,

musí být uznáno.

Jazykově platné řešení nelze odmítnout pouze proto, že využívá neočekávanou nebo nežádoucí vlastnost pravidel.

Taková vlastnost se může změnit až v nové verzi pravidel.

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
