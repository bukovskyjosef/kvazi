# Rozhodcovská specifikace

> **Status:** normativní dokument pro obecná pravidla soutěžní platnosti. Přesná mechanika jednotlivých oblastí je kanonicky definována ve výslovně NORMATIVNÍCH částech příslušných modulů `docs/kvazitahak/`. Dokumentace zaznamenává rozhodnutí kvaziautority; není autoritou nad ní.

## 1. Místo v normativním balíku

**Neexistuje jeden soubor „úplných pravidel“.** Tato rozhodcovská specifikace je autoritativní pro **obecná pravidla soutěžní platnosti a sporné případy**. Přesnou morfologii, paradigmata, syntaktické testy, valenci, hraniční mechaniku a prefix `kvazi-` určují výslovně NORMATIVNÍ části příslušných modulů `docs/kvazitahak/`. `03-ai-policy.md` je autoritativní pro používání AI a nástrojů a `04-verzovani-a-sprava.md` pro verzování, revalidaci a správu.

Úplnou mapu normativního balíku a autority všech ostatních artefaktů udržuje **pouze `docs/README.md`**. Lokální přehled v tomto dokumentu ji nenahrazuje.

**Konečnou autoritou hry je kvaziautorita / Josef Bukovský.** Normativní dokumenty jsou kanonickým záznamem přijatých rozhodnutí a musí být navzájem konzistentní.

Současná spisovná čeština se použije ve věcech, které soutěžní systém výslovně neupravuje. Pokud si dva normativní dokumenty odporují, jde o dokumentační/governance vadu, nikoli o prostor pro volnou interpretaci; do opravy rozhoduje výklad kvaziautority.

Technická implementace, databáze ani formulář nejsou vyšší autoritou než pravidla. Spravovaný katalog skutečných slov má zvláštní lexikální autoritativní roli vymezenou v oddílu 9.

## 2. Soutěžní abeceda

Povolené znaky:

`K V Q A Á Z I Í Y Ý`

Velká a malá písmena jsou při kontrole řetězce i identity totožná. Diakritika se rozlišuje: `A ≠ Á`, `I ≠ Í`, `Y ≠ Ý`.

Standardně má každý skutečně zapsaný soutěžní znak při sekundárním skórování hodnotu jednoho písmene. `Q = 1`, `KV = 2`. Jedinou zvláštní výjimkou je pět znaků normativního substantivního prefixu `kvazi-`, které mají skórovou hodnotu 0 podle `docs/kvazitahak/07-prefix-kvazi.md`.

`Q` se vyslovuje `/kv/`, ale je samostatným soutěžním písmenem. Není zkratkou, ligaturou ani alternativním pravopisným zápisem dvojice `KV`.

Při určování lemmatu, základního tvaru, morfologie, soutěžní identity, skutečnosti slova a při práci s jazykovými zdroji se `Q` nikdy automaticky nerozvíjí ani nenormalizuje na `KV`. Shodná výslovnost `Q` a posloupnosti `KV` sama o sobě nezakládá žádnou morfologickou, lexikální ani identitní shodu.

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

Celá věta po spojení slov musí být souvislým úsekem nepřetržité posloupnosti těchto motivů. Začátek a konec smějí ležet uvnitř motivu. Volba `Q` místo úvodního `KV` je pouze pravidlem tvorby motivu a nevytváří jazykovou ekvivalenci mezi `Q` a `KV`.

Pravidla nevyžadují ani normativně neurčují konkrétní interní algoritmus rozkladu na motivy.

## 4. Slovo

Běžné slovo:

- má 3–5 soutěžních znaků,
- je souvislou částí jediného motivu,
- nepřekračuje hranici dvou motivů.

Jednopísmenné výjimky jsou předložky `k`, `v`, `z` a spojky `a`, `i`. Každé z těchto pěti slov lze použít nejvýše jednou.

Předložky `k`, `v`, `z` se z herních důvodů používají vždy v nevokalizované podobě; `ke`, `ve`, `ze` se nepoužívají. Jinak zůstávají běžnými českými předložkami a musí tvořit jazykově platnou předložkovou konstrukci: `k` + dativ, `v` + lokál nebo akuzativ podle významu, `z` + genitiv.

Zvláštní substantivní prefix `kvazi-` je jedinou samostatně definovanou výjimkou z běžné délky a hranice slova. Jeho úplné normativní podmínky jsou pouze v `docs/kvazitahak/07-prefix-kvazi.md`. Prefix je fyzicky součástí slova a při motivové validaci představuje právě jeden celý motiv `KVAZI`, ale jeho pět znaků se nezapočítává do limitu 3–5 znaků základu ani do sekundárního skóre.

## 5. Věta

Kvazivěta je jedna jednoduchá věta s jedinou hlavní predikační osou.

Musí obsahovat právě jeden podmět, s výjimkou pravidelně nevyjádřeného podmětu u dovoleného imperativu, právě jeden přísudek a právě jeden token plnovýznamového slovesa.

Několikanásobný podmět a několikanásobný přísudek nejsou dovoleny. U oznamovací a tázací věty je podmět výslovně vyjádřen a má jednu řídící hlavu. Doplněk se nepovažuje za další hlavní predikační osu ani další přísudek. Přístavek není dovolen. Elipsa obligatorního členu není dovolena.

Všechna obligatorní doplnění vyplývající z obhájeného valenčního použití slovesa musí být ve větě výslovně realizována; jedinou zvláštní výjimkou je povolený nevyjádřený podmět imperativu.

Celá syntaktická analýza musí být jedna propojená struktura kolem jediného přísudku. Syntaktické závislosti nesmějí tvořit kruh. Podmět a přísudek musí být v kategoriích, v nichž to současná spisovná čeština vyžaduje, v běžné morfosyntaktické shodě.

### Složené slovesné tvary a pomocné `být`

Povolené složené slovesné mechanismy a přesná uzavřená sada pomocných tvarů `být` jsou kanonicky definovány v `docs/kvazitahak/04-slovesa.md`. Pomocné `být` není šestý produktivní kvazislovesný model ani druhé plnovýznamové sloveso; jeho token je součástí jediného přísudku.

Každý skutečně zapsaný pomocný token je však samostatné soutěžní slovo: musí sám projít aktuálními povrchovými pravidly, počítá se jako jedno slovo do primárního skóre a jeho znaky standardně do sekundárního skóre. Všechny povolené pomocné tvary sdílejí jedinou soutěžní identitu `být`.

Uzavřená pomocná sada `být` je normativní výjimka definovaná přímo pravidly a nepodléhá katalogu skutečných slov. Morfologicky povolený složený tvar se nestává zakázaným jen proto, že jeho pomocný token není v aktuálním povrchovém systému dosažitelný. Pokud se v budoucí rules verzi změní soutěžní znaky nebo pravidla sekvence, může se takový tvar stát povrchově použitelným bez změny morfologie.

## 6. Povolená syntax

Povoleny jsou pouze hlavní syntaktické vztahy a konstrukce uvedené v normativním `docs/kvazitahak/01-syntax.md`: podmět, přísudek, předmět, přívlastek shodný, přívlastek neshodný, příslovečné určení, doplněk a koordinace pomocí `a` nebo `i`, pokud nevznikne několikanásobný podmět ani přísudek.

Spojky `a`, `i` musí spojovat dvě výslovně přítomné souřadné části téže věty. Obě části musí mít stejnou hlavní syntaktickou funkci a koordinovaná skupina jako celek zastává jednu syntaktickou roli vůči nadřazené konstrukci.

Lexikální rekce podstatných a přídavných jmen se v soutěži nepoužívá. Uzavřenost platí pro hlavní vztahy; jejich běžné významové podtypy nejsou samostatnými soutěžními konstrukcemi a nemusí být vyjmenovány všechny.

Každý deklarovaný vztah musí splnit rozhodovací test své hlavní funkce. Je-li syntaktická platnost členu závislá na valenci slovesa, posuzuje se podle slovní valenční obhajoby dle oddílu 13 a `05-valence.md`. Není-li některá další mezislovní podmínka výslovně soutěžně upravena, musí konstrukce obstát jako současná spisovná čeština.

## 7. Slovní druhy

Povoleny jsou substantiva, adjektiva, slovesa, skutečná česká zájmena a `k`, `v`, `z`, `a`, `i`. Zakázány jsou číslovky, příslovce, částice, citoslovce a ostatní neuvedené slovní druhy. Nová kvazizájmena nelze vytvářet.

### Skutečná zájmena

Zájmena jsou zvláštní `real-word-only` kategorie. Nemají produktivní soutěžní morfologický model. Hráč deklaruje konkrétní použitý tvar, zájmenný lexém/lemma, slovní druh a relevantní morfologické vlastnosti konkrétního tvaru. Platnost deklarace ověřuje katalog skutečných slov podle oddílu 9.

Od runtime release `public-1.3` je podle rozhodnutí #74/#109 úplnou explicitní deklarací použitého zájmenného tvaru čtveřice pád (1–7), číslo (jednotné/množné), rod (mužský životný/mužský neživotný/ženský/střední) a osoba (1–3). U každé kategorie může hráč výslovně uvést „nevztahuje se“ (`notApplicable`). Chybějící hodnota, prázdný řetězec ani `null` tuto deklaraci nenahrazují; relevance se nedovozuje automaticky z lemmatu. Jde o deklaraci konkrétního skutečného tvaru pro katalogové posouzení, nikoli o produktivní zájmenné paradigma.

## 8. Kvazislovo

Kvazislovo nemusí existovat v češtině ani mít konkrétní věcný význam. U každého kvazislova musí být v závazné analýze určeny údaje vyžadované příslušným kanonickým modelem, zejména slovní druh, lemma/základní tvar, soutěžní morfologický model, konkrétní použitý tvar a další modelové vlastnosti.

Znaková pravidla musí splňovat pouze konkrétní tvar použitý ve větě. Lemma a jiné tvary paradigmatu mohou obsahovat jiné znaky. Existence jiné možné analýzy stejného povrchového tvaru nevadí; rozhodující je jedna úplná a konzistentní deklarovaná analýza.

Shoda zápisu se skutečným českým slovem sama o sobě neurčuje, zda jde o skutečné slovo, nebo kvazislovo. Rozhoduje celá soutěžní identita a stav katalogu. Výjimkou jsou zájmena, u nichž se nová kvazizájmena nevytvářejí.

## 9. Skutečné české slovo a katalog

Pro soutěžní status skutečného slova je autoritou **spravovaný katalog skutečných slov a tvarů**.

U kategorií řízených soutěžním morfologickým modelem lze skutečné slovo použít pouze tehdy, když jeho základní tvar, slovní druh a vlastnosti tvořící soutěžní identitu odpovídají schválené položce katalogu, konkrétní použitý tvar je pro tuto identitu schválený a současně odpovídá povolenému soutěžnímu morfologickému modelu.

U zájmena katalog ověřuje konkrétní skutečný zájmenný lexém/lemma, jeho použitý tvar a deklarované morfologické vlastnosti; produktivní soutěžní model pro zájmena neexistuje.

Není-li kandidátní skutečné slovo v katalogu schválené, řešitel může požádat kvaziautoritu o přezkoumání. Při správě katalogu může kvaziautorita vycházet zejména z IJP, ASSČ, dalších jazykových příruček, mluvnic a relevantních odborných zdrojů. Tyto zdroje samy nejsou přímým soutěžním whitelistem hráče.

Katalog je průběžně spravovatelný a jeho jednotlivé opravy či doplnění samy nevyžadují novou `rules_version`. Není veřejně procházetelný. Hráč může nechat ověřit pouze hotový vlastní návrh: úplnou morfologickou identitu a konkrétní použitý tvar. Exact-match kontrola smí pouze potvrdit tuto přesnou kombinaci; nesmí z částečných údajů nabízet identity, autocomplete, podobná slova ani alternativní analýzy. Nepotvrzený exact match neznamená zamítnutí.

Uzavřená pomocná sada `být` a jednopísmenná funkční slova `k/v/z/a/i` jsou explicitně normativně povolené a jejich povolení nezávisí na katalogu. U normativního prefixu `kvazi-` katalog případně potvrzuje pouze skutečný základ; prefixovaná odvozenina sama katalogové potvrzení nepotřebuje.

## 10. Morfologické modely

Kvazislova i soutěžně použitelná skutečná slova v produktivních kategoriích se řídí **uzavřenými** soutěžními modely. Přesný aktuální výčet modelů, podmínky lemmatu, tvorba kmene, paradigmata a všechny povolené varianty jsou kanonicky definovány pouze v příslušných NORMATIVNÍCH modulech `docs/kvazitahak/`.

Název modelu je herní označení inspirované češtinou, nikoli otevřený odkaz na všechny české dublety, alternace nebo lexikální výjimky. Existence jiné spisovné varianty mimo normativní tabulku sama soutěžní přípustnost nezakládá. Variantní realizace sama nevytváří novou soutěžní identitu.

**Reachability není součást definice modelu.** Normativně povolený model nebo větev zůstává v pravidlech i tehdy, pokud žádná jeho realizace nemůže projít aktuálním znakovým/motivovým systémem.

## 11. Substantiva

Substantiva používají právě uzavřené produktivní modely definované v NORMATIVNÍ části `docs/kvazitahak/02-substantiva.md`. Tento modul je jediným kanonickým místem pro jejich aktuální výčet, pravidla kmene a úplná paradigmata.

Všechny normativně definované modely zůstávají dostupné bez ohledu na reachability. Zvláštní prefix `kvazi-` se řídí `docs/kvazitahak/07-prefix-kvazi.md`.

## 12. Adjektiva

Adjektiva používají právě uzavřené produktivní modely definované v NORMATIVNÍ části `docs/kvazitahak/03-adjektiva.md`; tento modul je jediným kanonickým místem pro jejich aktuální výčet, odvozování, paradigmata a přesnou mechaniku stupňování.

Ve v1 je stupňování dovoleno pouze u modelů, které jej tento kanonický modul výslovně dovoluje. Přivlastňovací adjektiva se nestupňují. Krátké/jmenné tvary nejsou ve v1 povoleny. Substantivizované adjektivum je morfologicky stále adjektivum.

Reachability není důvodem normativní model nebo mechanismus odstranit či skrýt.

## 13. Slovesa a valence

Kvazisloveso používá jeden z uzavřených soutěžních časovacích typů definovaných v NORMATIVNÍ části `docs/kvazitahak/04-slovesa.md`, volí vid z hodnot `nedokonavý`, `dokonavý`, `obouvidový` a obsahuje slovní valenční obhajobu konkrétního použití ve větě.

Morfologickou soutěžní identitu slovesa tvoří `infinitiv + soutěžní časovací typ`. Vid ani valence samy o sobě novou identitu nevytvářejí.

Přesný výčet časovacích typů, jejich paradigmata, povolené slovesné mechanismy a uzavřená pomocná sada `být` jsou kanonicky definovány pouze v `docs/kvazitahak/04-slovesa.md`. Reachability se nepoužívá jako filtr morfologie.

Valence není samostatný strukturovaný soutěžní model. Hráč ji obhajuje volným textem. Z obhajoby musí být srozumitelné, jaká doplnění zvolené použití slovesa vyžaduje, která slova nebo části konkrétní kvazivěty je realizují a o jaké konkrétní současné české sloveso a jeho použití se obhajoba opírá. Všechna obligatorní doplnění musí být ve větě výslovně realizována.

Modelové sloveso pro valenci nemusí být stejné jako případný jazykový podklad pro časování. Časování se neposuzuje analogií s libovolným českým slovesem.

## 14. Fiktivní význam

Kvazislovo může mít fiktivní význam. Ten může pomoci obhájit syntaktickou roli, ale nesmí vytvářet novou identitu, měnit morfologii, zakládat nepovolenou rekci, nahrazovat valenční obhajobu ani obcházet soutěžní omezení.

Lze jej použít pouze v rámci výslovně povoleného syntaktického vztahu. Pokud je význam pro platnost konstrukce podstatný, musí použití odpovídat současné spisovné české analogii stejného hlavního vztahu.

## 15. Soutěžní identita

Jednou použitá soutěžní identita je v dané větě vyčerpaná.

- **Substantivum:** `lemma + rod + životnost (je-li relevantní) + soutěžní skloňovací model`; pád a číslo novou identitu nevytvářejí. Normativní `kvazi-` vytváří od základu odlišnou identitu, ale morfologické a syntaktické vlastnosti základu mechanicky dědí.
- **Adjektivum:** `lemma / základní tvar + soutěžní skloňovací model`; rod, pád, číslo, stupeň a syntaktická funkce novou identitu nevytvářejí.
- **Sloveso:** `infinitiv + soutěžní časovací typ`; vid ani valence novou identitu nevytvářejí.
- **Pomocné `být`:** všechny povolené pomocné tvary sdílejí jedinou soutěžní identitu `být`.
- **Zájmeno:** konkrétní zájmenný lexém/lemma; jeho morfologické tvary novou identitu nevytvářejí.
- **Funkční jednopísmenná slova:** `k`, `v`, `z`, `a`, `i` jsou jednotlivé identity a každou lze použít nejvýše jednou.

Rozdíl mezi `Q` a `KV` není variantním zápisem téže identity. Rozdíl velkých/malých písmen identitu nemění.

## 16. Interpunkce

Uvnitř soutěžního zápisu nejsou čárky, středníky, dvojtečky, pomlčky, spojovníky, závorky, uvozovky, lomítka, apostrofy ani jiná pomocná znaménka. Nelze použít konstrukci, která by takové znaménko podle současné spisovné normy vyžadovala.

Hráč deklaruje typ věty: oznamovací → `.`, tázací → `?`, rozkazovací → `!`. Závěrečné znaménko není soutěžním znakem a nepočítá se do délky.

## 17. Analýza řešení a veřejný detail

Stačí jedna úplná a interně konzistentní analýza. Řešitel nemusí dokazovat, že jiná možná analýza neexistuje.

Odevzdání musí u produktivních slov obsahovat údaje, které jednoznačně určují soutěžní identitu, morfologické vlastnosti konkrétního použitého tvaru a samotný použitý `surfaceForm`, plus syntaktickou analýzu a případné obhajoby/zdroje vyžadované pravidly. **Hráč ručně nevyplňuje celé paradigma ani nepoužité tvary.** Normativní paradigma zůstává autoritativním zdrojem, ze kterého systém deterministicky ověří právě použitý tvar. U slovesa je navíc povinná slovní valenční obhajoba. U zájmena se místo produktivního modelu uvádí zájmenný lexém/lemma a relevantní vlastnosti konkrétního tvaru.

Konkrétní UI ani datový model nesmí měnit jazykovou platnost.

### Veřejné zveřejnění schválené věty

Úplný rozhodcovský spis není veřejným výstupem. V seznamu schválených vět se zveřejňuje zejména věta, počet slov, počet soutěžních znaků a veřejná identita (`username`) **jednoho registrovaného účtu**, který podání vlastní a odevzdal. Systém neeviduje identity jednotlivých lidí stojících za účtem ani samostatné spoluautory.

V detailu lze u jednotlivých slov zveřejnit lehký jazykový rozbor: použitý tvar, skutečné slovo/kvazislovo, slovní druh, lemma, soutěžní model tam, kde jej kategorie používá, základní vlastnosti konkrétního tvaru a syntaktickou roli/jednoduché vazby.

Kompletní paradigma, úplná morfologická obhajoba, interní review, důkazní podklady a katalogové interní stavy zůstávají neveřejné.

## 18. Zdroje a důkazní břemeno

Důkazní břemeno v jazykovém sporu nese řešitel. Status skutečného soutěžního slova se neposuzuje přímým splněním jednoho povinného externího slovníku, ale podle katalogu z oddílu 9.

Při námitce proti katalogu nebo jiné jazykové obhajobě mohou být relevantní zejména IJP, ASSČ a další zdroje ÚJČ, akademické a vysokoškolské mluvnice, odborné slovníky a publikace a jiné relevantní odborné zdroje. Náhodný internetový výskyt sám o sobě nestačí. U kvazislova se nedokládá existence slova, ale pravidlo/model; u valence jazyková analogie konkrétního použití slovesa.

## 19. Nástroje, fair play a důvěra

Normativní politika používání nástrojů pro tuto oblast je v `03-ai-policy.md`. Základní duch je: **AI smí vysvětlit hru, nesmí ji za hráče hrát.** Automatický nástroj nesmí za hráče hledat, generovat, skládat nebo optimalizovat soutěžní kandidáty.

Dodržování této části stojí na fair play a vzájemné důvěře. Projekt nevyžaduje pracovní logy, screenshoty, historii promptů ani jiný dohledový důkaz způsobu vzniku řešení a nevytváří vyšetřovací režim používání nástrojů.

## 20. Platnost, uznání a kvaziautorita

Kvaziautorita je konečnou autoritou a rozhoduje, zda je řešení podle příslušné verze pravidel platné. Normativní dokumentace je závazným kanonickým záznamem jejích přijatých rozhodnutí; zjistí-li se rozpor v dokumentaci, musí být opraven.

Jazykově platné a řádně podané řešení nelze odmítnout pouze proto, že využívá neočekávanou nebo nežádoucí vlastnost pravidel. Pravidlovou díru lze zavřít až v nové verzi pravidel. Oprava nebo doplnění katalogu skutečných slov je běžná provozní správa podle oddílu 9.

Nepravdivé nebo zfalšované údaje v samotném podání mohou vést k jeho zamítnutí. Projekt ale neprovádí forenzní kontrolu toho, jak hráč řešení hledal.

## 21. Skóre

Primární: počet skutečně zapsaných slov. Každý samostatný pomocný token `být` se počítá jako samostatné slovo; normativní prefix `kvazi-` je součástí jediného substantiva a další slovo nevytváří.

Sekundární: počet soutěžních znaků bez mezer. `Q` se počítá jako jeden skutečně zapsaný znak a `KV` jako dva. **Jedinou zvláštní výjimkou je pět znaků normativního prefixu `kvazi-`, které se do sekundárního skóre nezapočítávají.**

Shoda obou hodnot = společný rekord. Pořadí podání nerozhoduje.

## 22. Reachability a slepé cesty

**Reachability je analytická vlastnost pravidel, nikoli normativní filtr.**

Normativně povolený model, morfologická větev nebo jiný mechanismus zůstává součástí pravidel i při prokázané nedosažitelnosti. Nedosažitelnost není důvodem volbu skrýt, zakázat, odstranit z UI ani přesunout do hraniční kapitoly. Hráčské materiály nemají známé slepé cesty označovat nebo prozrazovat jen proto, že je interní audit zjistil.

Interní reachability analýza může sloužit k auditu, testům a poznání herního prostoru. Konkrétní hráčův použitý povrchový tvar však vždy musí splnit aktuální znaková, motivová, morfologická a syntaktická pravidla. Změna soutěžní abecedy nebo sekvenčních pravidel v budoucí rules verzi proto může zpřístupnit dnes nedosažitelný morfologicky povolený tvar bez změny samotné morfologie.

## 23. Autorství, spolupráce a navazování

Kvazi je otevřený kumulativní problém. Zveřejněné schválené řešení, jednotlivé kvazislovo, konstrukci nebo jiný zveřejněný nápad smí kdokoli použít, upravit nebo rozvíjet. Na jednotlivé herní nápady se nezavádí výlučné vlastnictví.

Na řešení může fakticky spolupracovat libovolný počet lidí, ale **soutěž jejich počet ani identity nesleduje**. Každé podání vlastní a odevzdává právě **jeden registrovaný účet**. Registrovaný účet může reprezentovat jednotlivce i libovolný kolektiv a jeho registrační e-mail může patřit jednotlivci nebo skupině. Systém neeviduje samostatné spoluautory, jejich identity ani podíly. Veřejná atribuce používá pouze `username` registrovaného účtu.

Přesně shodnou větu může podat více registrovaných účtů. Při shodném primárním i sekundárním skóre jde o společný rekord a pořadí podání nerozhoduje. Projekt nezkoumá, zda pozdější použití zveřejněného nápadu vzniklo nezávislým znovuobjevením nebo převzetím.

Veřejné zveřejnění podle oddílu 17 vytváří legitimní společnou znalost hry.
