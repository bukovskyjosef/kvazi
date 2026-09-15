# Kvazitahák – slovesa

> **Status:** normativní slovesná morfologie pro první rules verzi je zmrazena.

## Místo v normativním balíku

Tento modul je autoritativní **pro soutěžní slovesné modely, jejich tvary, vid a uzavřenou pomocnou sadu `být`**. Obecná pravidla platnosti řeší `../rules/02-rozhodcovska-specifikace.md`; syntaxi, jmennou morfologii, valenci, hraniční pravidla a prefix `kvazi-` řeší ostatní NORMATIVNÍ moduly `01-03` a `05-07`; AI a verzování mají vlastní dokumenty v `../rules/`. Žádný jednotlivý soubor není „úplná pravidla“; úplnou mapu autority udržuje pouze `../README.md`.

## NORMATIVNÍ: obecný princip

Každé kvazisloveso má právě jeden soutěžní časovací typ, jeden deklarovaný vid a valenční obhajobu konkrétního použití podle `05-valence.md`.

Morfologickou soutěžní identitu slovesa tvoří:

`infinitiv + soutěžní časovací typ`

Vid, osoba, číslo, čas, způsob ani valence samy o sobě novou identitu nevytvářejí.

Slovesný model je uzavřený herní model. Hráč si kmen, alternaci ani koncovku nevolí. Každá normativní buňka má právě jednu kanonickou realizaci. Obecné české nepravidelnosti, dublety a hláskové alternace se automaticky nepřenášejí. Reachability není filtrem modelů ani jejich buněk.

## NORMATIVNÍ: finální sada pěti typů

První rules verze používá právě těchto pět produktivních typů:

| Kód | Pracovní název | Podmínka infinitivu | Soutěžní základ |
|---|---|---|---|
| `V-AT` | `dělat` | lemma `S+at` | `S` = lemma bez `at` |
| `V-IT` | `prosit` | lemma `S+it` | `S` = lemma bez `it` |
| `V-NOUT` | `tisknout` | lemma `S+nout` | `S` = lemma bez `nout` |
| `V-ÝT` | `krýt` | lemma `S+ýt` | `S` = lemma bez `ýt` |
| `V-OVAT` | `kupovat` | lemma `S+ovat` | `S` = lemma bez `ovat` |

Názvy českých vzorových sloves jsou pouze mnemotechnické názvy soutěžních modelů. Neotevírají další české konjugační varianty.

## NORMATIVNÍ: přítomné / jednoduché osobní tvary

Pořadí v tabulce je `1.sg, 2.sg, 3.sg, 1.pl, 2.pl, 3.pl`.

| Typ | Tvary |
|---|---|
| `V-AT` | `S+ám`, `S+áš`, `S+á`, `S+áme`, `S+áte`, `S+ají` |
| `V-IT` | `S+ím`, `S+íš`, `S+í`, `S+íme`, `S+íte`, `S+í` |
| `V-NOUT` | `S+nu`, `S+neš`, `S+ne`, `S+neme`, `S+nete`, `S+nou` |
| `V-ÝT` | `S+yji`, `S+yješ`, `S+yje`, `S+yjeme`, `S+yjete`, `S+yjí` |
| `V-OVAT` | `S+uji`, `S+uješ`, `S+uje`, `S+ujeme`, `S+ujete`, `S+ují` |

U dokonavého slovesa se stejné jednoduché osobní tvary vykládají časově podle běžné české gramatiky jako budoucí; soutěžní morfologie kvůli tomu nevytváří druhé paradigma.

## NORMATIVNÍ: imperativ

Povolena je 2.sg, 1.pl a 2.pl. Jedině u takového imperativního přísudku může zůstat pravidelný podmět nevyjádřený.

| Typ | 2.sg | 1.pl | 2.pl |
|---|---|---|---|
| `V-AT` | `S+ej` | `S+ejme` | `S+ejte` |
| `V-IT` | `S` | `S+me` | `S+te` |
| `V-NOUT` | `S+ni` | `S+nime` | `S+nite` |
| `V-ÝT` | `S+yj` | `S+yjme` | `S+yjte` |
| `V-OVAT` | `S+uj` | `S+ujme` | `S+ujte` |

Žádná další česká imperativní alternace se nepřenáší.

## NORMATIVNÍ: l-ové příčestí

L-ové příčestí je jediný plnovýznamový slovesný token ve složeném minulém čase a kondicionálu. Tvary jsou mechanické.

| Typ | m.sg | f.sg | n.sg | m.anim.pl | m.inanim/f.pl | n.pl |
|---|---|---|---|---|---|---|
| `V-AT` | `S+al` | `S+ala` | `S+alo` | `S+ali` | `S+aly` | `S+ala` |
| `V-IT` | `S+il` | `S+ila` | `S+ilo` | `S+ili` | `S+ily` | `S+ila` |
| `V-NOUT` | `S+nul` | `S+nula` | `S+nulo` | `S+nuli` | `S+nuly` | `S+nula` |
| `V-ÝT` | `S+yl` | `S+yla` | `S+ylo` | `S+yli` | `S+yly` | `S+yla` |
| `V-OVAT` | `S+oval` | `S+ovala` | `S+ovalo` | `S+ovali` | `S+ovaly` | `S+ovala` |

Rod/životnost/číslo příčestí se musí shodovat s podmětem podle běžných českých pravidel.

## NORMATIVNÍ: pomocné sloveso `být`

Pomocné `být` je uzavřená zvláštní **reálná pomocná sada**, nikoli šestý produktivní model kvazislovesa. Jeho token není druhým plnovýznamovým slovesem a spolu s plnovýznamovým tvarem tvoří jediný přísudek.

Každý skutečně zapsaný pomocný token je však samostatné soutěžní slovo: musí sám projít obecnými povrchovými pravidly hry, počítá se jako jedno slovo do primárního skóre a jeho skutečně zapsané znaky se standardně počítají do sekundárního skóre.

Všechny níže povolené pomocné tvary mají jedinou soutěžní identitu **`být`**. Osoba, číslo, čas ani způsob novou identitu nevytvářejí. Uzavřená pomocná sada je normativně povolena přímo tímto modulem a **nepodléhá katalogu skutečných slov**.

Pro v1 jsou povoleny pouze následující pomocné tvary:

- minulý čas: 1.sg `jsem`, 2.sg `jsi`, 1.pl `jsme`, 2.pl `jste`; ve 3. osobě je pomocný token nulový,
- analytické futurum nedokonavých sloves: `budu`, `budeš`, `bude`, `budeme`, `budete`, `budou`,
- kondicionál přítomný: `bych`, `bys`, `by`, `bychom`, `byste`, `by`.

Jiné tvary pomocného `být`, kondicionál minulý, opisné pasivum a další složené slovesné konstrukce nejsou v první rules verzi součástí soutěžního systému.

Normativní morfologie a povrchová použitelnost jsou oddělené vrstvy. Tvar z této uzavřené sady zůstává morfologicky povolený i tehdy, když jeho konkrétní token dnes nemůže projít aktuální znakovou nebo motivovou sekvencí. Pokud se v budoucí rules verzi změní soutěžní sada znaků nebo pravidla sekvence, může se stát povrchově použitelným bez změny tohoto morfologického pravidla.

### Minulý čas

Minulý čas = příslušné l-ové příčestí + pomocný tvar minulého času podle osoby a čísla. Ve 3. osobě stojí pouze l-ové příčestí.

### Budoucí čas

- dokonavé sloveso: jednoduchý osobní tvar z tabulky výše,
- nedokonavé sloveso: analytické futurum `být` + infinitiv,
- u obouvidového slovesa musí deklarovaný konkrétní význam jednoznačně určit, zda se v daném použití chová jako dokonavé nebo nedokonavé.

Infinitiv v analytickém futuru je plnovýznamový slovesný token. Pomocný tvar `být` je pomocný token téhož přísudku.

### Kondicionál

Kondicionál přítomný = l-ové příčestí + odpovídající pomocný kondicionálový tvar. Kondicionál minulý se ve v1 nepovoluje.

## NORMATIVNÍ: vid

Povolené hodnoty jsou `nedokonavý`, `dokonavý`, `obouvidový`. Vid je povinná deklarovaná vlastnost, ale není součástí soutěžní identity. Jeho jazyková přijatelnost podléhá rozhodcovskému posouzení.

## NORMATIVNÍ: co v1 neobsahuje

Mimo systém jsou zejména přechodníky, participia mimo výše uvedené l-ové příčestí, opisné pasivum, kondicionál minulý, nepravidelná slovesa jako produktivní kvazimodel, české dublety a libovolné kmenové alternace.

Skutečné plnovýznamové sloveso soutěžně používá tutéž uzavřenou morfologickou reprezentaci jako kvazisloveso; samotná existence českého nepravidelného paradigmatu neotevírá další soutěžní tvary.

## Implementační invariant

Pro produktivní sloveso musí být možné mechanicky vyhodnotit:

`infinitiv + typ + vid + způsob/čas + osoba + číslo + případný rod/životnost → právě jeden plnovýznamový tvar (+ přesně určený pomocný tvar, pokud jej konstrukce vyžaduje)`.

Pomocný token se eviduje jako součást stejného přísudku, ale jako samostatné soutěžní slovo s jedinou sdílenou identitou `být`. Celá věta stále obsahuje právě jeden plnovýznamový slovesný token.