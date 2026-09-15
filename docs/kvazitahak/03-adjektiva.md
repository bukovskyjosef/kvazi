# Kvazitahák – adjektiva

> **Status:** normativní adjektivní morfologie pro první rules verzi je zmrazena.

## Místo v normativním balíku

Tento modul je autoritativní **pro soutěžní adjektivní modely, jejich paradigmata, přivlastňovací odvození a stupňování**. Obecná pravidla platnosti řeší `../rules/02-rozhodcovska-specifikace.md`; syntaxi, substantiva, slovesa, valenci, hraniční pravidla a prefix `kvazi-` řeší ostatní NORMATIVNÍ moduly `01-02` a `04-07`; AI a verzování mají vlastní dokumenty v `../rules/`. Žádný jednotlivý soubor není „úplná pravidla“; úplnou mapu autority udržuje pouze `../README.md`.

## NORMATIVNÍ: obecný princip

Adjektivní soutěžní model je stejně jako substantivní model **uzavřený herní morfologický model**.

- Soutěžní kmen a případné další podoby se odvozují deterministicky.
- Hráč si kmen ani alternaci nevolí a neobhajuje ji vlastní analogií.
- Každá morfologická buňka má právě jednu kanonickou realizaci; dublety se ve v1 nepovolují.
- Obecné české hláskové alternace, nepravidelnosti a lexikální výjimky se automaticky nepřenášejí.
- Adjektivum rozlišuje rod, číslo a pád; u mužského rodu také životnost tam, kde ji paradigma morfologicky rozlišuje.
- Reachability není kritériem existence ani zveřejnění normativního modelu.

Normativní modely jsou `mladý`, `jarní`, `otcův` a `matčin`.

## NORMATIVNÍ: model `mladý`

Lemma má podobu `S+ý`; soutěžní kmen `S` vznikne odebráním koncového `ý`.

### Singulár

| Pád | m. živ. | m. neživ. | ž. | stř. |
|---|---|---|---|---|
| 1. | `S+ý` | `S+ý` | `S+á` | `S+é` |
| 2. | `S+ého` | `S+ého` | `S+é` | `S+ého` |
| 3. | `S+ému` | `S+ému` | `S+é` | `S+ému` |
| 4. | `S+ého` | `S+ý` | `S+ou` | `S+é` |
| 5. | `S+ý` | `S+ý` | `S+á` | `S+é` |
| 6. | `S+ém` | `S+ém` | `S+é` | `S+ém` |
| 7. | `S+ým` | `S+ým` | `S+ou` | `S+ým` |

### Plurál

| Pád | m. živ. | m. neživ. | ž. | stř. |
|---|---|---|---|---|
| 1. | `S+í` | `S+é` | `S+é` | `S+á` |
| 2. | `S+ých` | `S+ých` | `S+ých` | `S+ých` |
| 3. | `S+ým` | `S+ým` | `S+ým` | `S+ým` |
| 4. | `S+é` | `S+é` | `S+é` | `S+á` |
| 5. | `S+í` | `S+é` | `S+é` | `S+á` |
| 6. | `S+ých` | `S+ých` | `S+ých` | `S+ých` |
| 7. | `S+ými` | `S+ými` | `S+ými` | `S+ými` |

## NORMATIVNÍ: model `jarní`

Lemma má podobu `S+í`; soutěžní kmen `S` vznikne odebráním koncového `í`.

### Singulár

| Pád | m. živ. | m. neživ. | ž. | stř. |
|---|---|---|---|---|
| 1. | `S+í` | `S+í` | `S+í` | `S+í` |
| 2. | `S+ího` | `S+ího` | `S+í` | `S+ího` |
| 3. | `S+ímu` | `S+ímu` | `S+í` | `S+ímu` |
| 4. | `S+ího` | `S+í` | `S+í` | `S+í` |
| 5. | `S+í` | `S+í` | `S+í` | `S+í` |
| 6. | `S+ím` | `S+ím` | `S+í` | `S+ím` |
| 7. | `S+ím` | `S+ím` | `S+í` | `S+ím` |

### Plurál

| Pád | m. živ. | m. neživ. | ž. | stř. |
|---|---|---|---|---|
| 1. | `S+í` | `S+í` | `S+í` | `S+í` |
| 2. | `S+ích` | `S+ích` | `S+ích` | `S+ích` |
| 3. | `S+ím` | `S+ím` | `S+ím` | `S+ím` |
| 4. | `S+í` | `S+í` | `S+í` | `S+í` |
| 5. | `S+í` | `S+í` | `S+í` | `S+í` |
| 6. | `S+ích` | `S+ích` | `S+ích` | `S+ích` |
| 7. | `S+ími` | `S+ími` | `S+ími` | `S+ími` |

## NORMATIVNÍ: přivlastňovací modely

Přivlastňovací kvaziadjektivum musí být odvozeno od konkrétního platného substantiva, skutečného nebo kvazisubstantiva. Zdrojové substantivum nemusí být ve větě použito ani samo mít soutěžně použitelný povrchový tvar.

Derivační základ je vždy základ `S`, z něhož se podle substantivního modelu konstruuje lemma. U vícekmenového modelu `kuře` je derivačním základem základní `S`, nikoli rozšířené `S+et` nebo `S+at`.

- mužský rod zdrojového substantiva → model `otcův`, lemma `S+ův`,
- ženský rod → model `matčin`, lemma `S+in`,
- ze substantiva středního rodu se tento typ přivlastňovacího adjektiva netvoří.

Hráč mezi `-ův` a `-in` nevolí. Paradigmata níže pracují přímo s derivačním základem `S`; vztah `ův/ov` je explicitní součást modelu, nikoli obecná hlásková alternace.

### Model `otcův` – singulár

| Pád | m. živ. | m. neživ. | ž. | stř. |
|---|---|---|---|---|
| 1. | `S+ův` | `S+ův` | `S+ova` | `S+ovo` |
| 2. | `S+ova` | `S+ova` | `S+ovy` | `S+ova` |
| 3. | `S+ovu` | `S+ovu` | `S+ově` | `S+ovu` |
| 4. | `S+ova` | `S+ův` | `S+ovu` | `S+ovo` |
| 5. | `S+ův` | `S+ův` | `S+ova` | `S+ovo` |
| 6. | `S+ově` | `S+ově` | `S+ově` | `S+ově` |
| 7. | `S+ovým` | `S+ovým` | `S+ovou` | `S+ovým` |

### Model `otcův` – plurál

| Pád | m. živ. | m. neživ. | ž. | stř. |
|---|---|---|---|---|
| 1. | `S+ovi` | `S+ovy` | `S+ovy` | `S+ova` |
| 2. | `S+ových` | `S+ových` | `S+ových` | `S+ových` |
| 3. | `S+ovým` | `S+ovým` | `S+ovým` | `S+ovým` |
| 4. | `S+ovy` | `S+ovy` | `S+ovy` | `S+ova` |
| 5. | `S+ovi` | `S+ovy` | `S+ovy` | `S+ova` |
| 6. | `S+ových` | `S+ových` | `S+ových` | `S+ových` |
| 7. | `S+ovými` | `S+ovými` | `S+ovými` | `S+ovými` |

### Model `matčin` – singulár

| Pád | m. živ. | m. neživ. | ž. | stř. |
|---|---|---|---|---|
| 1. | `S+in` | `S+in` | `S+ina` | `S+ino` |
| 2. | `S+ina` | `S+ina` | `S+iny` | `S+ina` |
| 3. | `S+inu` | `S+inu` | `S+ině` | `S+inu` |
| 4. | `S+ina` | `S+in` | `S+inu` | `S+ino` |
| 5. | `S+in` | `S+in` | `S+ina` | `S+ino` |
| 6. | `S+ině` | `S+ině` | `S+ině` | `S+ině` |
| 7. | `S+iným` | `S+iným` | `S+inou` | `S+iným` |

### Model `matčin` – plurál

| Pád | m. živ. | m. neživ. | ž. | stř. |
|---|---|---|---|---|
| 1. | `S+ini` | `S+iny` | `S+iny` | `S+ina` |
| 2. | `S+iných` | `S+iných` | `S+iných` | `S+iných` |
| 3. | `S+iným` | `S+iným` | `S+iným` | `S+iným` |
| 4. | `S+iny` | `S+iny` | `S+iny` | `S+ina` |
| 5. | `S+ini` | `S+iny` | `S+iny` | `S+ina` |
| 6. | `S+iných` | `S+iných` | `S+iných` | `S+iných` |
| 7. | `S+inými` | `S+inými` | `S+inými` | `S+inými` |

## NORMATIVNÍ: stupňování

Stupňovat lze pouze adjektiva modelů `mladý` a `jarní`. Modely `otcův` a `matčin` jsou nestupňovatelné.

Pro oba stupňovatelné modely se používá jejich základní kmen `S`:

- 1. stupeň: základní lemma podle modelu (`S+ý` nebo `S+í`),
- 2. stupeň: jediné kanonické lemma `S+ější`,
- 3. stupeň: jediné kanonické lemma `nejS+ější`.

`nej-` je součást jednoho slovního tvaru, nikoli samostatné slovo. Druhý i třetí stupeň se skloňují přesně podle paradigmatu `jarní`. Nepravidelné komparativy, alternativní přípony ani kmenové alternace se ve v1 nepovolují. Jiný stupeň sám o sobě nevytváří novou soutěžní identitu; původní model `mladý` nebo `jarní` zůstává součástí identity.

## NORMATIVNÍ: krátké tvary

Krátké / jmenné tvary adjektiv se v první rules verzi **nepovolují**.

## Substantivizace

Substantivně použité adjektivum zůstává pro soutěž morfologicky adjektivem.

## Implementační invariant

Normativní tabulky musí umožnit mechanickou kontrolu vztahu:

`základ / lemma + model + stupeň + rod + životnost + číslo + pád → právě jeden povolený tvar`.

Interní reachability analýza může sloužit k poznání herního prostoru, ale nesmí normativní modely, buňky ani stupně odstraňovat nebo před hráčem označovat jako slepé cesty.
