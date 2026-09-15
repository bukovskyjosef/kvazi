# Kvazitahák – substantiva

> **Status:** seznam vzorů i jejich přesná normativní paradigmata jsou pro první rules verzi zmrazeny.

## NORMATIVNÍ: princip soutěžního modelu

Názvy `pán`, `muž`, `předseda`, `soudce`, `hrad`, `stroj`, `žena`, `růže`, `píseň`, `kost`, `město`, `moře`, `kuře` a `stavení` jsou názvy **uzavřených soutěžních morfologických modelů inspirovaných českými vzory**.

Název modelu není otevřeným odkazem na všechny varianty, dublety, kmenové alternace nebo lexikální výjimky, které se mohou vyskytovat u českých slov tradičně řazených ke stejnojmennému vzoru.

Pro každý soutěžní model normativní tabulka přesně určuje podmínku lemmatu, mechanické pravidlo určení soutěžního kmene a právě jednu kanonickou realizaci každé buňky. Co v normativním modelu výslovně uvedeno není, nelze převzít jen proto, že taková varianta existuje v češtině.

**Soutěžní kmen je vždy odvozen deterministicky z lemmatu a zvoleného modelu. Hráč jej nevolí ani neobhajuje vlastní analogií.** V první zmrazené rules verzi platí **jedna morfologická buňka = právě jedna kanonická realizace**; morfologické dublety se nepovolují.

**Obecné české hláskové alternace se automaticky nepoužívají.** Jestliže model pracuje se vztahem `kmen + koncovka`, použije se mechanicky kmen určený modelem bez další fonologické změny. Změna kmene je dovolena pouze tehdy, když je deterministicky zabudována přímo do konkrétního soutěžního modelu.

Výsledný model musí umožnit mechanickou kontrolu `lemma + model + morfologické hodnoty → právě jeden povolený tvar`.

**Reachability není kritériem existence modelu.** Model zůstává součástí pravidel i tehdy, pokud nemá při aktuálních znakových a motivových omezeních žádný použitelný povrchový tvar. Hráčské materiály případnou slepou cestu předem neoznačují.

## NORMATIVNÍ: základní odvození kmene

U běžných modelů:

- lemma zakončené souhláskou: `S = celé lemma`,
- lemma na `-a`: `S = lemma bez posledního a`,
- lemma na `-e`: `S = lemma bez posledního e`,
- lemma na `-o`: `S = lemma bez posledního o`,
- model `stavení` na `-í`: `S = lemma bez posledního í`.

Nominativ singuláru je přímo lemma. Ostatní buňky se tvoří přesně podle tabulek níže. Výjimkou s vlastní konstrukcí kmenů je pouze explicitně popsaný model `kuře`.

## NORMATIVNÍ: úplná paradigmata substantiv

### Mužský rod

| Model | Životnost | Podmínka lemmatu |
|---|---|---|
| pán | životný | souhláska |
| muž | životný | souhláska |
| předseda | životný | `-a` |
| soudce | životný | `-e` |
| hrad | neživotný | souhláska |
| stroj | neživotný | souhláska |

U dvojic `pán/muž` a `hrad/stroj` se nezkoumá fonologická preference tvrdosti či měkkosti; rozhoduje zvolený soutěžní model.

#### `pán` — `S = lemma`

| Pád | sg | pl |
|---|---|---|
| 1. | `S` | `S+i` |
| 2. | `S+a` | `S+ů` |
| 3. | `S+ovi` | `S+ům` |
| 4. | `S+a` | `S+y` |
| 5. | `S+e` | `S+i` |
| 6. | `S+ovi` | `S+ech` |
| 7. | `S+em` | `S+y` |

#### `muž` — `S = lemma`

| Pád | sg | pl |
|---|---|---|
| 1. | `S` | `S+i` |
| 2. | `S+e` | `S+ů` |
| 3. | `S+i` | `S+ům` |
| 4. | `S+e` | `S+e` |
| 5. | `S+i` | `S+i` |
| 6. | `S+i` | `S+ích` |
| 7. | `S+em` | `S+i` |

#### `předseda` — lemma `S+a`

| Pád | sg | pl |
|---|---|---|
| 1. | `S+a` | `S+ové` |
| 2. | `S+y` | `S+ů` |
| 3. | `S+ovi` | `S+ům` |
| 4. | `S+u` | `S+y` |
| 5. | `S+o` | `S+ové` |
| 6. | `S+ovi` | `S+ech` |
| 7. | `S+ou` | `S+y` |

#### `soudce` — lemma `S+e`

| Pád | sg | pl |
|---|---|---|
| 1. | `S+e` | `S+i` |
| 2. | `S+e` | `S+ů` |
| 3. | `S+i` | `S+ům` |
| 4. | `S+e` | `S+e` |
| 5. | `S+e` | `S+i` |
| 6. | `S+i` | `S+ích` |
| 7. | `S+em` | `S+i` |

#### `hrad` — `S = lemma`

| Pád | sg | pl |
|---|---|---|
| 1. | `S` | `S+y` |
| 2. | `S+u` | `S+ů` |
| 3. | `S+u` | `S+ům` |
| 4. | `S` | `S+y` |
| 5. | `S+e` | `S+y` |
| 6. | `S+u` | `S+ech` |
| 7. | `S+em` | `S+y` |

#### `stroj` — `S = lemma`

| Pád | sg | pl |
|---|---|---|
| 1. | `S` | `S+e` |
| 2. | `S+e` | `S+ů` |
| 3. | `S+i` | `S+ům` |
| 4. | `S` | `S+e` |
| 5. | `S+i` | `S+e` |
| 6. | `S+i` | `S+ích` |
| 7. | `S+em` | `S+i` |

### Ženský rod

| Model | Podmínka lemmatu |
|---|---|
| žena | `-a` |
| růže | `-e` |
| píseň | souhláska |
| kost | souhláska |

#### `žena` — lemma `S+a`

| Pád | sg | pl |
|---|---|---|
| 1. | `S+a` | `S+y` |
| 2. | `S+y` | `S` |
| 3. | `S+ě` | `S+ám` |
| 4. | `S+u` | `S+y` |
| 5. | `S+o` | `S+y` |
| 6. | `S+ě` | `S+ách` |
| 7. | `S+ou` | `S+ami` |

#### `růže` — lemma `S+e`

| Pád | sg | pl |
|---|---|---|
| 1. | `S+e` | `S+e` |
| 2. | `S+e` | `S+í` |
| 3. | `S+i` | `S+ím` |
| 4. | `S+i` | `S+e` |
| 5. | `S+e` | `S+e` |
| 6. | `S+i` | `S+ích` |
| 7. | `S+í` | `S+emi` |

#### `píseň` — `S = lemma`

Model je v první rules verzi **jednokmenný**. Pohyblivé `e`, vypouštění samohlásky ani jiná lexikální změna skutečného slova `píseň` se nepřenáší.

| Pád | sg | pl |
|---|---|---|
| 1. | `S` | `S+e` |
| 2. | `S+e` | `S+í` |
| 3. | `S+i` | `S+ím` |
| 4. | `S` | `S+e` |
| 5. | `S+i` | `S+e` |
| 6. | `S+i` | `S+ích` |
| 7. | `S+í` | `S+emi` |

#### `kost` — `S = lemma`

| Pád | sg | pl |
|---|---|---|
| 1. | `S` | `S+i` |
| 2. | `S+i` | `S+í` |
| 3. | `S+i` | `S+em` |
| 4. | `S` | `S+i` |
| 5. | `S+i` | `S+i` |
| 6. | `S+i` | `S+ech` |
| 7. | `S+í` | `S+mi` |

### Střední rod

| Model | Podmínka lemmatu |
|---|---|
| město | `-o` |
| moře | `-e` |
| kuře | `-e`, vlastní rozšířené kmeny |
| stavení | `-í` |

#### `město` — lemma `S+o`

| Pád | sg | pl |
|---|---|---|
| 1. | `S+o` | `S+a` |
| 2. | `S+a` | `S` |
| 3. | `S+u` | `S+ům` |
| 4. | `S+o` | `S+a` |
| 5. | `S+o` | `S+a` |
| 6. | `S+ě` | `S+ech` |
| 7. | `S+em` | `S+y` |

#### `moře` — lemma `S+e`

| Pád | sg | pl |
|---|---|---|
| 1. | `S+e` | `S+e` |
| 2. | `S+e` | `S+í` |
| 3. | `S+i` | `S+ím` |
| 4. | `S+e` | `S+e` |
| 5. | `S+e` | `S+e` |
| 6. | `S+i` | `S+ích` |
| 7. | `S+em` | `S+i` |

#### `kuře` — lemma `S+e`

Model `kuře` je explicitní výjimka z jednokmenného pravidla. Deterministicky používá základ `S`, singulárový rozšířený kmen `S+et` a plurálový rozšířený kmen `S+at`.

| Pád | sg | pl |
|---|---|---|
| 1. | `S+e` | `S+ata` |
| 2. | `S+ete` | `S+at` |
| 3. | `S+eti` | `S+atům` |
| 4. | `S+e` | `S+ata` |
| 5. | `S+e` | `S+ata` |
| 6. | `S+eti` | `S+atech` |
| 7. | `S+etem` | `S+aty` |

#### `stavení` — lemma `S+í`

| Pád | sg | pl |
|---|---|---|
| 1. | `S+í` | `S+í` |
| 2. | `S+í` | `S+í` |
| 3. | `S+í` | `S+ím` |
| 4. | `S+í` | `S+í` |
| 5. | `S+í` | `S+í` |
| 6. | `S+í` | `S+ích` |
| 7. | `S+ím` | `S+ími` |

Žádná tabulka nepovoluje další implicitní dubletu nebo lexikální alternaci.

## NORMATIVNÍ: skutečné slovo versus kvazislovo

O zařazení nerozhoduje samotný zápis, ale úplná soutěžní identita substantiva: základní tvar, rod, životnost a model.

- Odpovídá-li celá identita a použitý tvar schválené položce katalogu skutečných slov, musí být použita jako skutečné slovo a nelze tutéž identitu znovu prohlásit za kvazislovo.
- Stejný základní tvar může být kvazislovem, pokud se jeho identita liší od každé odpovídající schválené skutečné identity a splní jiné normativní paradigma.

Konkrétní skutečný tvar je přípustný jen tehdy, když jeho úplná identita a deklarované morfologické hodnoty odpovídají schválené položce spravovaného katalogu skutečných slov, použitý tvar je pro tuto identitu schválený a současně jej lze mechanicky odvodit podle jednoho z uzavřených soutěžních modelů.

IJP, ASSČ a jiné jazykové zdroje mohou kvaziautoritě sloužit jako podklad při správě katalogu, nejsou však samy přímým soutěžním whitelistem hráče. Atypické skutečné tvary mimo soutěžní modely se nepoužívají.
