# Nezávislý návrh obsahu kvazitaháku

> **Status:** NENORMATIVNÍ návrh k zapracování. Tento dokument nic nemění na platných pravidlech a neuzavírá issues #1–#4.

## 1. Závěr návrhu

Kvazitahák nemá být zkrácená mluvnice ani druhé vydání `Jak hrát`. Má být pracovní pomůcka, ze které hráč během několika sekund zjistí:

1. zda lze zamýšlený tvar použít,
2. jaký model mu může přiřadit,
3. co dané slovo smí ve větě dělat,
4. co musí uvést při odevzdání.

Navrhuji proto jeden hráčský materiál se třemi úrovněmi:

- **stolní strana** – mechanika a rozhodovací postup na jednu obrazovku / jednu A4,
- **karty modelů** – pouze soutěžně dosažitelné morfologické a syntaktické možnosti,
- **hraniční dodatek** – závazná, ale při běžné hře nepotřebná pravidla.

Stávající soubory `01`–`06` mohou zůstat zdrojovými moduly. Hráčská podoba by se z nich měla sestavit do jednoho souvislého materiálu, aby hráč nemusel při jednom tahu přecházet mezi syntaxí, morfologií a valencí.

## 2. Hlavní obsah stolní strany

### 2.1 Pruh „Nejdřív ověř tvar“

Tento blok má být plně mechanický a bez lingvistické terminologie:

```text
1. Použij jen K V Q A Á Z I Í Y Ý.
2. Běžné slovo má 3–5 znaků a celé leží v jednom motivu.
3. Jednopísmenné k, v, z, a, i lze použít každé nejvýše jednou.
4. Po odstranění mezer musí věta tvořit souvislý úsek motivů KVAZI.
5. Q nahrazuje KV a počítá se jako jeden znak.
```

Pod tím má být jediný kompaktní přehled motivu:

| Pozice | Povolená volba |
|---|---|
| začátek | `KV` nebo `Q` |
| samohláska | `A` nebo `Á` |
| střed | vždy `Z` |
| konec | `I`, `Í`, `Y` nebo `Ý` |

Úplný výčet šestnácti motivů je vhodný pro detailní nápovědu, ne pro hlavní stolní stranu.

### 2.2 Pruh „Postav jednu větu“

```text
PODMĚT  →  JEDNO SLOVESO  →  případné povinné předměty
                 ↘ volné přívlastky, určení a doplněk
```

Šipky vyjadřují vztahy, nikoli pevný slovosled.

Vedle schématu pouze:

- jeden podmět s jednou hlavou; u povoleného rozkazu může zůstat nevyjádřený,
- právě jeden slovesný token,
- všechny povinné sloty zvoleného valenčního rámce musí být vyplněny,
- přívlastky, příslovečná určení, doplněk a koordinace se používají jen podle karet níže.

### 2.3 Rozhodovací postup pro jedno slovo

```text
Je tvar technicky přípustný?
  → Je to skutečné spisovné slovo, nebo kvazislovo?
  → Vyber slovní druh.
  → Vyber přesně jeden soutěžní model.
  → Ověř, že použitý tvar je v kartě modelu.
  → Urči funkci a řídící slovo.
  → Zkontroluj, že stejná soutěžní identita už ve větě není.
```

Tento postup je pro hráče užitečnější než úvodní souvislý výklad morfologie.

## 3. Jak mají fungovat morfologické karty

### 3.1 Doporučený princip: zobrazovat dosažitelné tvary

Ve veřejné části doporučuji nezobrazovat všech čtrnáct buněk paradigmatu, pokud většina z nich kvůli soutěžní abecedě nikdy nemůže být použita.

Každá karta má obsahovat:

- podmínku lemmatu,
- jednoznačné určení soutěžního kmene `S`,
- všechny **soutěžně dosažitelné** kombinace tvaru, pádu a čísla,
- údaje, které hráč zapíše do formuláře,
- odkaz na úplné paradigma v rozhodcovském dodatku.

Úplná paradigmata mají být normativními daty a mají projít samostatnou jazykovou kontrolou. Hráč však při běžné hře potřebuje především projekci těchto dat do dosažitelného prostoru.

### 3.2 Jedna oficiální koncovka místo dublet

Navrhuji, aby soutěžní model pro každou kombinaci obsahoval právě jeden základní tvar. Variantní koncovka se připustí pouze tehdy, pokud:

1. je soutěžně dosažitelná,
2. přidává skutečně jinou herní možnost,
3. je výslovně uvedena v normativní tabulce.

Tím se tahák nestane seznamem reálných dublet a hráč nemusí zjišťovat, zda vzácná koncovka existuje u konkrétního českého slova.

### 3.3 Soutěžní kmen musí být datový údaj

Tradiční školské vzory někdy pracují s hláskovou změnou nebo rozšířeným kmenem. Pro deterministické použití nestačí název vzoru.

Každý model proto musí definovat jedno z následujícího:

- kmen `S` se mechanicky odvodí z lemmatu,
- nebo se `S` deklaruje a stává se kontrolovanou součástí morfologického modelu.

Bez tohoto údaje nelze přesně vytvořit tabulky pro typy jako `píseň` a `kuře` ani spolehlivě uložit analýzu do katalogu.

Závazné kritérium pro všechny výsledné modely je navíc toto: jeden konkrétní použitý tvar nesmí být možné odvodit z libovolně mnoha základních tvarů a soutěžních identit. Konečná morfologická víceznačnost nevadí, pokud lze každou analýzu samostatně ověřit z normativních dat.

## 4. Navržený obsah substantivních karet

### 4.1 Hlavní sada

V hlavním taháku doporučuji po reachability auditu ponechat:

| Rod | Modely |
|---|---|
| mužský životný | `pán`, `muž`, `předseda`, `soudce` |
| mužský neživotný | `hrad`, `stroj` |
| ženský | `žena`, `růže`, `píseň`, `kost` |
| střední | `město`, `moře`, `stavení` |

Model `kuře` doporučuji z hlavní sady vyřadit. Jeho charakteristické tvary obsahují zejména `e` a `t`, a návrh proto nepředpokládá žádnou dosažitelnou realizaci. Konečný přesun musí potvrdit issue #4.

### 4.2 Obsah jedné karty

Příklad požadované struktury, nikoli hotové normativní paradigma:

| Pole | Obsah |
|---|---|
| Model | `hrad` |
| Rod / životnost | mužský neživotný |
| Lemma | končí na souhlásku |
| Kmen `S` | přesné pravidlo odvození |
| Dosažitelné tvary | např. `S`, `S+a`, `S+y`, vždy s konkrétním pádem a číslem |
| Ve formuláři | lemma, model, rod, životnost, pád, číslo |
| Pozor | jiný pád nebo číslo nevytváří novou identitu |

### 4.3 Pracovní projekce dosažitelných zakončení

Následující tabulka je **pracovní návrh k morfologickému ověření**, nikoli normativní paradigma. Ukazuje, jak stručný může výsledný tahák být, pokud zobrazí jen tvary, které mohou projít soutěžní abecedou.

| Model | Doporučené zobrazované formy |
|---|---|
| `pán` | `S`, `S+a`, `S+i`, `S+y` |
| `muž` | `S`, `S+i` |
| `předseda` | `S+a`, `S+y` |
| `soudce` | `S+i` |
| `hrad` | `S`, `S+a`, `S+y` |
| `stroj` | `S`, `S+i` |
| `žena` | `S`, `S+a`, `S+y` |
| `růže` | `S+i`, `S+í` |
| `píseň` | `S`, `S+i`, `S+í` |
| `kost` | `S`, `S+i`, `S+í` |
| `město` | `S`, `S+a`, `S+y` |
| `moře` | `S+i`, `S+í` |
| `stavení` | `S+í` |

Ve výsledné tabulce musí být každá forma rozepsána na konkrétní kombinace pádu a čísla. Nelze připustit, aby si hráč pád pouze dovodil z významu.

## 5. Navržený obsah adjektivních karet

### 5.1 Hlavní sada

V hlavním taháku doporučuji ponechat pouze:

- tvrdý typ `mladý`,
- měkký typ `jarní`.

U typu `mladý` má karta zobrazit pouze dosažitelné formy založené na `S+ý`, `S+á` a `S+í`, vždy s úplným rodem, číslem a pádem.

U typu `jarní` má karta zobrazit dosažitelné formy `S+í`; jednu povrchovou podobu lze nabídnout ve více přesně popsaných morfologických analýzách.

### 5.2 Co přesunout mimo hlavní tahák

| Mechanismus | Doporučení |
|---|---|
| `otcův` | po potvrzení reachability přesunout mezi nedosažitelné |
| `matčin` | po potvrzení reachability přesunout mezi nedosažitelné |
| pravidelné stupňování | po potvrzení reachability přesunout mezi nedosažitelné |
| krátké jmenné tvary | ponechat jen v hraničním dodatku do prokázání konkrétního případu |
| substantivizace | nevytvářet zvláštní kartu; pouze poznámka, že identita zůstává adjektivní |

Přivlastňovací typy nesou ve svých paradigmatech nepovolené znaky (`o`, `ů`, `n` apod.). Pravidelné komparativy a superlativy závisejí na nepovolených znacích a morfologii mimo základní dva modely. Výsledek však musí formálně uzavřít reachability audit, ne tento návrh.

### 5.3 Povinná kontrola shody

Na každé adjektivní kartě má být stejná věta:

> Uveď podstatné jméno, se kterým se adjektivum shoduje, a zkontroluj stejný rod, číslo a pád. U doplňku uveď také sloveso, ke kterému se vztahuje.

## 6. Navržený slovesný systém

### 6.1 Dvě časovací rodiny pro hlavní hru

Pro veřejnou hru doporučuji pouze dva produktivní typy:

| Kód | Lemma | Hlavní dosažitelný tvar | Hodnota tvaru |
|---|---|---|---|
| `V-AT` | `S+at` | `S+á` | přítomný čas, 3. osoba j. č. |
| `V-IT` | `S+it` | `S+í` | přítomný čas, 3. osoba j. nebo mn. č. |

U `V-IT` doporučuji po jazykovém ověření připustit také `S` jako rozkazovací způsob, 2. osobu jednotného čísla. Právě tato větev odůvodňuje výjimku s nevyjádřeným podmětem. Pokud nebude schválena, má se imperativní výjimka z hlavního taháku odstranit.

Každá karta musí vedle dosažitelných tvarů obsahovat úplné pravidlo tvorby kmene. Nestačí napsat „jako prosit“ nebo „jako dělat“.

### 6.2 Proč nepřidávat další typy

Další české časovací typy mají být přidány pouze tehdy, pokud reachability audit doloží nový použitelný povrchový tvar nebo novou herně podstatnou konstrukci. Samotná úplnost českého časování není cílem soutěže.

### 6.3 Vid

Navrhuji uzavřenou sadu:

- `NEDOK` – nedokonavý,
- `DOK` – dokonavý.

Obouvidovost doporučuji nepovolovat. Nepřidává v aktuálním systému novou morfologickou možnost, ale přidává další místo pro spor.

Tahák má výslovně připomenout, že vid není součástí soutěžní identity slovesa.

### 6.4 Pomocná slovesa

V hlavním taháku je nedoporučuji uvádět. Běžné tvary pomocného `být` neprocházejí současně znakovým a délkovým omezením. Formální závěr opět patří do issue #4 a poté do hraničního dodatku.

## 7. Navržená uzavřená sada valence

Podmět je společný všem rámcům a v kódu se neopakuje. U imperativu může být realizován pravidelně nevyjádřenou druhou osobou.

| Kód | Povinné doplnění | Lidský popis |
|---|---|---|
| `V0` | žádný předmět | slovesu stačí podmět |
| `V2` | substantivní skupina v GEN | sloveso vyžaduje 2. pád |
| `V3` | substantivní skupina v DAT | sloveso vyžaduje 3. pád |
| `V4` | substantivní skupina v ACC | sloveso vyžaduje 4. pád |
| `V7` | substantivní skupina v INS | sloveso vyžaduje 7. pád |
| `V34` | DAT + ACC | sloveso vyžaduje příjemce i předmět |

Každý rámec má na kartě obsahovat:

- počet povinných slotů,
- požadovaný pád,
- obyčejnou českou analogii mimo soutěžní abecedu,
- příklad neplatného nevyplněného slotu,
- pole, který token nebo souřadná skupina slot realizuje.

Předložkové valenční rámce v první veřejné verzi nedoporučuji. Předložky `k`, `v`, `z` mohou mít vlastní uzavřené karty příslovečných určení; tím se valenční tabulka nerozrůstá kombinatoricky.

## 8. Syntaktické karty

Každá karta má mít vždy stejných pět řádků:

1. **Co dělá**
2. **Na čem závisí**
3. **Jaký tvar vyžaduje**
4. **Obyčejná česká analogie**
5. **Častý důvod odmítnutí**

Příklady musí používat slova zjevně mimo soutěžní prostor, aby nebyly zásobníkem kandidátních tahů.

### 8.1 Podmět

- Jedna jmenná skupina s právě jednou řídící hlavou.
- Je v nominativu.
- Určuje osobu a číslo slovesa.
- Adjektiva uvnitř skupiny nejsou dalšími podměty.
- Koordinace více podmětových hlav není dovolena.

### 8.2 Přísudek

- Tvoří jej jediný slovesný token z povoleného typu.
- Uvede se osoba, číslo, způsob, čas, vid a valenční rámec.
- Jiný slovesný token se ve větě objevit nesmí.

### 8.3 Předmět

- Realizuje právě jeden povinný slot valenčního rámce.
- Jeho pád se musí shodovat s kódem slotu.
- Souřadná skupina může vyplnit jeden slot, pokud všechny její členy mají stejnou funkci a požadovaný pád.

### 8.4 Přívlastek shodný

- Je to adjektivum rozvíjející substantivum.
- Shoduje se s ním v rodě, čísle a pádě.
- Může rozvíjet hlavu podmětu, předmětu i jiného dovoleného substantivního členu.

### 8.5 Přívlastek neshodný

Pro veřejnou verzi doporučuji jedinou podobu:

- substantivní skupina v genitivu,
- přímo rozvíjí jiné substantivum,
- není skrytou náhradou nepovolené lexikální rekce.

Toto zúžení odstraňuje potřebu určovat desítky méně běžných typů neshodného přívlastku.

### 8.6 Příslovečné určení

Namísto neurčité kategorie doporučuji uzavřené šablony:

| Kód | Tvar | Základní vztah |
|---|---|---|
| `ADV-K3` | `k` + DAT | směr nebo přiblížení |
| `ADV-V4` | `v` + ACC | směr dovnitř / časový rozsah |
| `ADV-V6` | `v` + LOC | místo nebo čas |
| `ADV-Z2` | `z` + GEN | původ nebo směr odkud |
| `ADV-I7` | prostý INS | nástroj nebo způsob |

Každá šablona musí být připojena ke slovesu a obhájena jedním z významů uvedených na kartě. Fiktivní význam nesmí vytvořit jiný typ příslovečného určení.

### 8.7 Doplněk

- Adjektivum současně závisí na slovese a vztahuje se k podmětu nebo předmětu.
- Shoduje se s řídícím jménem v čísle a pádě a podle povahy tvaru také v rodě.
- Popisuje stav platný při ději.
- Karta má použít běžnou analogii typu „Petr přišel unavený“, ne soutěžní řetězec.

Doplněk bych v hlavním taháku ponechal: je herně užitečný a lze jej vysvětlit bez pojmu „sekundární predikace“.

### 8.8 Koordinace

Tahák musí výslovně rozhodnout následující pracovní pravidla:

- `a` nebo `i` spojuje dvě výslovně uvedené části,
- obě části mají stejnou syntaktickou funkci,
- koordinovaná skupina jako celek obsazuje jeden syntaktický nebo valenční slot,
- nelze tak vytvořit více podmětových hlav ani více přísudků,
- každou z identit `a` a `i` lze použít nejvýše jednou.

Bez věty o jednom společném slotu zůstává nejasné, zda dva koordinované předměty plní jednu valenční pozici, nebo vytvářejí dvě doplnění.

## 9. Samostatná karta jednopísmenných slov

| Slovo | Funkce | Vyžadovaný tvar za ním |
|---|---|---|
| `k` | předložka | DAT |
| `v` | předložka | ACC nebo LOC podle zvolené šablony |
| `z` | předložka | GEN |
| `a` | spojka | dvě souřadné výslovné části |
| `i` | spojka | dvě souřadné výslovné části |

Společná poznámka:

> Každé slovo lze použít nejvýše jednou. Předložky se v soutěži nevokalizují; `ke`, `ve`, `ze` se nepoužívají.

## 10. Identita jako kontrolní tabulka

| Slovní druh | Identitu tvoří | Identitu nemění |
|---|---|---|
| substantivum | lemma + rod + životnost, je-li relevantní + model | pád, číslo, význam, funkce |
| adjektivum | základní tvar + model | rod, pád, číslo, stupeň, funkce |
| sloveso | infinitiv + časovací typ + valenční rámec | vid, osoba, číslo |
| funkční slovo | samotné `k`, `v`, `z`, `a`, `i` | konkrétní vazba ve větě |

Pod tabulkou má být praktická otázka:

> Použil jsem už totéž lemma se stejnými údaji v levém sloupci? Pokud ano, identita je vyčerpaná.

## 11. Skutečné slovo versus kvazislovo

Tahák má použít jednu srovnávací tabulku:

| Otázka | Skutečné slovo | Kvazislovo |
|---|---|---|
| Musí být doložené ve spisovné češtině? | ano | ne |
| Musí odpovídat soutěžnímu modelu? | ano | ano |
| Smí využít nepravidelnost mimo model? | ne | ne |
| Smí mít fiktivní význam? | pro soutěžní obhajobu není potřeba | ano, v mezích povolené syntaxe |
| Potřebuje externí zdroj? | při sporu ano | dokládá se model, ne existence slova |

Klíčová věta:

> Skutečnost slova nestačí. Konkrétní použitý tvar musí současně projít soutěžním modelem.

Rozhodnuté rozlišení má tahák ukázat i na krátkém příkladu: skutečné `VAZ + mužský neživotný + hrad` nelze podruhé prohlásit za kvazislovo, ale `VAZ + mužský životný + pán` je jiná soutěžní identita a kvazislovem být může. Status tedy neurčuje samotný zápis.

## 12. Odevzdávací checklist

### Za celou větu

- technicky platný řetězec motivů,
- jeden podmět nebo povolený imperativ,
- jeden slovesný token,
- všechny povinné valenční sloty,
- žádná opakovaná soutěžní identita,
- závěrečné `.`, `?` nebo `!`.

### Za každý token

- pořadí a povrchový tvar,
- skutečné slovo / kvazislovo,
- slovní druh,
- lemma nebo základní tvar,
- soutěžní model,
- morfologické hodnoty konkrétního tvaru,
- soutěžní identita,
- syntaktická funkce,
- řídící token nebo skupina,
- valenční slot, pokud jej token realizuje,
- fiktivní význam pouze tehdy, když je pro syntaxi potřebný,
- zdroj pouze tam, kde se dokládá skutečné slovo nebo sporné pravidlo češtiny.

Hráč nemá ručně zapisovat mezery ani rozklad na motivy; tyto údaje může odvodit aplikace.

## 13. Hraniční dodatek

Po uzavření reachability auditu má mít každá zkoumaná větev právě jeden z těchto stavů:

| Stav | Umístění |
|---|---|
| dosažitelná a běžně použitelná | hlavní karty |
| dosažitelná, ale okrajová nebo složitá | hraniční dodatek |
| prokazatelně nedosažitelná | stručný registr nedostupných mechanismů, nikoli herní karta |

Pracovní doporučení:

| Mechanismus | Navržený stav |
|---|---|
| pomocné sloveso | nedosažitelné |
| skutečná zájmena | nedosažitelná; ověřit proti uzavřenému seznamu tvarů |
| `kuře` | nedosažitelné |
| `otcův`, `matčin` | nedosažitelné |
| stupňování | nedosažitelné |
| krátké tvary adjektiv | hraniční do ukončení lexikální kontroly |
| imperativ `V-IT` | hlavní, pokud se schválí přesná tvorba `S` |

Registr nedostupných mechanismů má být krátký. Nemá hráče učit paradigma, které stejně nikdy nepoužije; má pouze vysvětlit, proč se možnost známá z úplné češtiny v taháku nenachází.

## 14. Označení závaznosti

Každý blok finálního taháku musí nést právě jeden stav:

- **NORMATIVNÍ TABULKA** – rozhoduje soutěžní platnost,
- **VYSVĚTLENÍ** – převádí tabulku do běžné řeči,
- **PŘÍKLAD** – ilustruje, ale nerozšiřuje tabulku,
- **HRANIČNÍ PRAVIDLO** – závazné, ale mimo běžný postup.

Nedoporučuji spoléhat pouze na barvu. Stav má být vždy uveden i textovým štítkem.

## 15. Co do kvazitaháku nepatří

- úplný seznam přípustných skutečných slov,
- nalezené kandidátní kvazitvary,
- konkrétní rekordní nebo testovací kvazivěty,
- historie rozhodovacích diskusí,
- zdůvodnění každé DB tabulky,
- interní kódy katalogu odlišné od veřejných kódů modelů,
- jazykové možnosti, které nejsou v soutěžním systému povoleny,
- obecná výuka češtiny přesahující konkrétní herní rozhodnutí.

## 16. Doporučené pořadí zapracování

1. Uzavřít formální pojem soutěžního kmene `S`.
2. Dokončit reachability audit a odstranit mrtvé větve z hlavní vrstvy.
3. Schválit dvě slovesné rodiny a přesné dosažitelné tvary.
4. Schválit vid `DOK/NEDOK` a valenční rámce `V0`, `V2`, `V3`, `V4`, `V7`, `V34`.
5. Schválit uzavřené šablony příslovečného určení.
6. Vytvořit úplná normativní paradigmata a z nich automaticky odvodit hráčskou projekci dosažitelných tvarů.
7. Doplnit obyčejné české analogie a důvody odmítnutí.
8. Teprve potom z materiálu vysázet jednostránkovou stolní verzi.

## 17. Kritéria hotového kvazitaháku

Kvazitahák je připravený k vydání, když:

- hráč dokáže bez jiné příručky zařadit každý standardně povolený tvar,
- všechny volby jsou uzavřené tabulkami,
- žádný příklad nevytváří novou možnost,
- ke každému syntaktickému vztahu existuje jednoduchý test,
- z taháku lze přímo odvodit pole odevzdávacího formuláře,
- normativní tabulky lze reprezentovat jako verzovaná strukturovaná data,
- dvě osoby používající tahák dojdou u běžného případu ke stejnému výsledku bez hledání v odborné mluvnici.

## 18. Body vyžadující rozhodnutí Josefa Bukovského

Tento návrh předkládá k explicitnímu rozhodnutí zejména:

1. zda hráčská vrstva ukáže jen dosažitelné buňky, zatímco úplná paradigmata zůstanou v dodatku,
2. zda soutěžní modely používají přesně definovaný kmen `S`,
3. zda se variantní koncovky omezí na výslovně herně užitečné varianty,
4. zda hlavní slovesnou sadu tvoří `V-AT` a `V-IT`,
5. zda `V-IT` připustí imperativ `S`,
6. zda se vid omezí na `DOK/NEDOK`,
7. zda se přijme šest navržených valenčních rámců,
8. zda se příslovečné určení omezí na pět navržených šablon,
9. zda koordinovaná skupina vyplňuje právě jeden syntaktický nebo valenční slot,
10. zda se neshodný přívlastek v hlavní hře omezí na genitivní jmennou skupinu.

Dokud tyto body nejsou rozhodnuté a zaneseny do normativních souborů, zůstává celý dokument pouze návrhem k zapracování.
