# Kvazitahák – substantiva

> **Status:** seznam vzorů je rozhodnut. Přesná normativní paradigmata je nutné ještě sestavit.

## NORMATIVNÍ: princip soutěžního modelu

Názvy `pán`, `muž`, `předseda`, `soudce`, `hrad`, `stroj`, `žena`, `růže`, `píseň`, `kost`, `město`, `moře`, `kuře` a `stavení` jsou názvy **uzavřených soutěžních morfologických modelů inspirovaných českými vzory**.

Název modelu není otevřeným odkazem na všechny varianty, dublety, kmenové alternace nebo lexikální výjimky, které se mohou vyskytovat u českých slov tradičně řazených ke stejnojmennému vzoru.

Pro každý soutěžní model normativní tabulka přesně určí:

1. podmínku lemmatu / základního tvaru,
2. mechanické pravidlo určení soutěžního kmene, pokud jej model používá,
3. právě jednu kanonickou realizaci pro každou soutěžně přípustnou kombinaci morfologických hodnot.

Co v normativním modelu výslovně uvedeno není, nelze do něj převzít jen proto, že taková varianta existuje v obecné češtině. Hráč si soutěžní kmen ani další alternaci nevytváří volně; musí plynout z pravidla konkrétního modelu.

**Soutěžní kmen je vždy odvozen deterministicky z lemmatu a zvoleného modelu. Hráč jej nevolí ani neobhajuje vlastní analogií.** Pokud model používá více kmenových podob, jejich vznik a použití musí být mechanicky popsány přímo v modelu.

V první zmrazené rules verzi platí **jedna morfologická buňka = právě jedna kanonická realizace**. Morfologické dublety se v této verzi nepovolují, ani když jsou obě varianty v obecné češtině standardní. Případnou další realizaci lze zavést až explicitní změnou budoucí verze pravidel.

**Obecné české hláskové alternace se automaticky nepoužívají.** Jestliže model pracuje se vztahem `kmen + koncovka`, použije se mechanicky kmen určený modelem bez další fonologické změny jen proto, že by ji obecná čeština v podobném prostředí znala. Změna kmene je dovolena pouze tehdy, když je jako deterministické pravidlo výslovně zabudována do konkrétního soutěžního modelu a model určuje i buňky, ve kterých se použije. Taková změna není volbou hráče.

Výsledný model tedy musí umožnit mechanickou kontrolu vztahu:

`lemma + model + morfologické hodnoty → právě jeden povolený tvar`.

**Reachability není kritériem existence modelu.** Všechny níže uvedené normativní modely zůstávají součástí pravidel i tehdy, pokud se později ukáže, že některý z nich při aktuálních znakových a motivových omezeních nemá žádný použitelný povrchový tvar. Hráčské materiály takovou případnou slepou cestu nemají předem označovat.

## NORMATIVNÍ: základní odvození kmene

U běžných substantivních modelů se soutěžní kmen odvodí od lemmatu čistě mechanicky podle nominativní koncovky modelu:

- modely s lemmatem zakončeným souhláskou: **kmen = celé lemma**,
- modely na `-a`: odeber poslední `a`,
- modely na `-e`: odeber poslední `e`,
- modely na `-o`: odeber poslední `o`,
- model `stavení` na `-í`: odeber poslední `í`.

Nominativ singuláru je vždy přímo lemma. Ostatní buňky se standardně tvoří jako `kmen + kanonická koncovka` z normativní tabulky.

Pokud charakter konkrétního modelu vyžaduje další kmenovou podobu, musí ji tento model definovat jako vlastní explicitní deterministické pravidlo včetně přesného určení buněk, ve kterých se použije. Takovou výjimku nevytváří jednotlivé slovo ani hráčova analogie.

## NORMATIVNÍ: soutěžní vzory

### Mužský rod

| Vzor | Životnost | Podmínka lemmatu |
|---|---|---|
| pán | životný | končí na souhlásku |
| muž | životný | končí na souhlásku |
| předseda | životný | končí na `-a` |
| soudce | životný | končí na `-e` |
| hrad | neživotný | končí na souhlásku |
| stroj | neživotný | končí na souhlásku |

U dvojic `pán/muž` a `hrad/stroj` se u kvazislova nezkoumá přirozená fonologická preference tvrdosti nebo měkkosti. Rozhoduje výhradně zvolený uzavřený soutěžní model.

### Ženský rod

| Vzor | Podmínka lemmatu |
|---|---|
| žena | `-a` |
| růže | `-e` |
| píseň | souhláska |
| kost | souhláska |

### Střední rod

| Vzor | Podmínka lemmatu |
|---|---|
| město | `-o` |
| moře | `-e` |
| kuře | `-e`, rozšířené kmeny podle normativního modelu |
| stavení | `-í` |

## NORMATIVNÍ: paradigma modelu `kuře`

Model `kuře` je explicitní modelová výjimka z obecného jednokmenného pravidla. Jeho charakteristické rozšířené kmeny jsou součástí samotného soutěžního modelu, nikoli obecnou českou alternací.

Je-li lemma ve tvaru `S+e`, model deterministicky používá tyto tři podoby:

- základ `S`,
- singulárový rozšířený kmen `S+et`,
- plurálový rozšířený kmen `S+at`.

Hráč mezi nimi nevolí. Použití je určeno tabulkou:

| Číslo | Pád | Kanonický tvar |
|---|---:|---|
| sg | 1. | `S+e` |
| sg | 2. | `S+ete` |
| sg | 3. | `S+eti` |
| sg | 4. | `S+e` |
| sg | 5. | `S+e` |
| sg | 6. | `S+eti` |
| sg | 7. | `S+etem` |
| pl | 1. | `S+ata` |
| pl | 2. | `S+at` |
| pl | 3. | `S+atům` |
| pl | 4. | `S+ata` |
| pl | 5. | `S+ata` |
| pl | 6. | `S+atech` |
| pl | 7. | `S+aty` |

Tato tabulka je úplná pro první rules verzi; žádná další dubleta nebo lexikální alternace modelu `kuře` se nepřenáší.

## NORMATIVNÍ: skutečné slovo versus kvazislovo

O zařazení nerozhoduje samotný zápis, ale úplná soutěžní identita substantiva: základní tvar, rod, životnost a vzor.

- Odpovídá-li tato celá identita a použitý tvar schválené položce katalogu skutečných slov, musí být použita jako skutečné slovo a nelze tutéž identitu znovu prohlásit za kvazislovo.
- Stejný základní tvar může být kvazislovem, pokud se jeho identita liší od každé odpovídající schválené skutečné identity a splní jiné normativní paradigma.

Příklad: `VAZ + mužský neživotný + hrad` a `VAZ + mužský životný + pán` jsou dvě různé soutěžní identity. O tom, zda je některá z nich skutečným slovem, rozhoduje katalog skutečných slov.

## TODO – NORMATIVNÍ PARADIGMATA

Pro každý dosud nezmrazený vzor sestavit úplnou tabulku:

- singulár: 1.–7. pád,
- plurál: 1.–7. pád,
- přesné případné modelové odchylky od základního pravidla kmene,
- právě jednu kanonickou realizaci každé buňky,
- žádné implicitní lexikální výjimky jednotlivých slov.

To, co bude v normativní tabulce, platí. Externí dubleta nebo alternace mimo tabulku se do soutěžního modelu nepřenáší.

## Skutečná slova

Konkrétní skutečný tvar je pro soutěž přípustný jen tehdy, když:

1. jeho úplná identita a deklarované morfologické hodnoty odpovídají schválené položce spravovaného katalogu skutečných slov,
2. konkrétní použitý tvar je v katalogu pro tuto identitu schválený,
3. současně jej lze mechanicky odvodit podle jednoho z výše uvedených uzavřených soutěžních modelů.

IJP, ASSČ a jiné jazykové zdroje mohou kvaziautoritě sloužit jako podklad při správě katalogu, nejsou však samy přímým soutěžním whitelistem hráče.

Atypické skutečné tvary mimo soutěžní modely se nepoužívají.
