# Rozhodnutí projektu

Tento dokument shrnuje stabilní rozhodnutí, která už byla explicitně přijata decision ownerem. Detailní diskuse, auditní nálezy a implementační práce zůstávají v GitHub Issues.

> **Stav po auditu 2026-09-14:** původní sada produktových rozhodnutí byla uzavřena; následný produktový audit může otevírat další skutečné pravidlové nebo koncepční volby. Otevřené rozhodovací body se vedou v GitHub Issues a po rozhodnutí se jejich stabilní výsledek promítá sem a do normativních artefaktů.

## Autorita a governance

- Finální produktová a pravidlová rozhodnutí provádí Josef Bukovský.
- Normativní pravidla mají vyšší autoritu než architektura, databáze nebo UI.
- Technická implementace nesmí sama vytvářet nové soutěžní pravidlo.
- TODO není implicitní rozhodnutí.
- Uživatelská deklarace analýzy není sama morfologickou pravdou.
- Projekt upřednostňuje srozumitelnou a praktickou správu recesní hry před maximální formální přesností tam, kde by přesnost nepřinášela odpovídající herní hodnotu.
- Férové hraní stojí na vzájemné důvěře; projekt záměrně nevytváří dohledový nebo disciplinární systém pro způsob vzniku řešení.

## Soutěžní abeceda a motiv

### Q je samostatné soutěžní písmeno — rozhodnutí #65

- `Q` je samostatné soutěžní písmeno, nikoli zkratka, ligatura ani alternativní zápis dvojice `KV`.
- `Q` se shodou pravidla vyslovuje `/kv/`, ale tato akustická shoda nemá morfologický ani lexikální účinek.
- Při určování lemmatu, základního tvaru, morfologie, soutěžní identity, skutečnosti slova ani při práci s jazykovými zdroji se `Q` nikdy automaticky nerozvíjí nebo nenormalizuje na `KV`.
- `QAZ` a `KVAZ` jsou dvě různě zapsaná slova a nelze jim pouze kvůli stejné výslovnosti přiřadit tutéž morfologickou identitu.
- Tvorba motivu proto používá alternativu `KV | Q`; nejde o pravidlo jazykové ekvivalence.

## Soutěžní identita a morfologické modely

### Variantní realizace paradigmat — rozhodnutí 1/19

- Každá morfologická kombinace má v normativním soutěžním modelu výslovně uvedenou jednu nebo více povolených realizací.
- Existence jiné spisovné varianty mimo normativní tabulku sama o sobě nezakládá soutěžní přípustnost.
- Další variantní realizace se přidává pouze vědomě jako součást pravidel, zejména pokud přináší odlišnou herně relevantní dosažitelnou možnost.
- Variantní realizace nevytváří novou soutěžní identitu.
- Produkční formulář, katalog ani validátor nesmějí automaticky přebírat obecné české dublety mimo normativní model.

### Slovesné časovací typy — rozhodnutí 2/19

- Finální soutěžní sada slovesných typů bude minimální a odvozená z reachability auditu.
- Samostatný typ se zařadí pouze tehdy, pokud přináší alespoň jednu novou soutěžně dosažitelnou morfologickou možnost, kterou nelze reprezentovat existujícím typem.
- Typy se nepřebírají jen proto, že obecná česká mluvnice rozlišuje další třídy nebo vzory.
- Reachability audit musí prověřit relevantní rodiny nad základy typu `VAZ-`, `KVAZ-` i `Q-` / `QAZ-`; pracovní kandidáti zahrnují minimálně `V-AT`, `V-IT`, `KV-AT`, `KV-IT`, `Q-AT`, `Q-IT`.
- Kandidátní typy se mohou sloučit, pokud jsou soutěžně reachability-ekvivalentní; samotná výslovnost `Q` jako `/kv/` však není důvodem ke sloučení `Q` a `KV` v morfologii.
- Každý typ musí zachovat konečný a rozhodnutelný počet soutěžních identit pro konkrétní použitý tvar.

### Vid — rozhodnutí 3/19

Povolené hodnoty jsou:
- `nedokonavý`,
- `dokonavý`,
- `obouvidový`.

Vid sám o sobě nevytváří soutěžní identitu. Obouvidovost je jedna gramatická hodnota, nikoli dvě identity. Stejná sada platí i pro kvazislovesa.

### Valence — rozhodnutí 4/19, 5/19 a #66

- Valence není součástí morfologické ani soutěžní identity slovesa.
- Morfologickou soutěžní identitu slovesa tvoří `infinitiv + soutěžní časovací typ`.
- Vid ani valence samy o sobě novou identitu slovesa nevytvářejí.
- Valence není uzavřený whitelist rámců a nepřevádí se na povinný kanonický kód nebo strukturovaný seznam slotů.
- Hráč ji obhajuje volným textem pro konkrétní použití slovesa ve větě.
- Obhajoba musí srozumitelně uvést, jaká doplnění zvolené použití vyžaduje, která slova ve větě je realizují a o jaké konkrétní současné české sloveso a jeho použití se opírá.
- Všechna obligatorní doplnění vyplývající z obhájeného použití musí být ve větě výslovně realizována.
- Valence se automaticky jazykově nevaliduje ani neporovnává jako katalogová identita. Při jazykovém review ale může vést k zamítnutí věty, pokud analogie nebo realizace obligatorních doplnění neobstojí.
- Modelové sloveso pro valenci nemusí být stejné jako případný jazykový podklad pro časování.

## Syntaxe a formulář

### Globální syntax jedné věty — rozhodnutí #67

- Kvazivěta má jediný přísudek jako jediný kořen hlavní predikační osy.
- Všechny ostatní větné členy musí být zapojeny do jedné propojené syntaktické analýzy této věty.
- Syntaktické závislosti nesmějí tvořit kruh.
- Podmět a přísudek musí být v relevantních kategoriích v běžné morfosyntaktické shodě současné spisovné češtiny.
- Koordinované části musí mít stejnou hlavní syntaktickou funkci a jejich skupina jako celek zastává jednu syntaktickou roli vůči nadřazené konstrukci.
- Soutěžní výjimka pro `k/v/z` se týká pouze nevokalizované podoby. Jinak jde o běžné české předložky s běžnou rekcí: `k` + dativ, `v` + lokál nebo akuzativ podle významu, `z` + genitiv.
- Není-li další mezislovní podmínka soutěžně výslovně upravena, musí konstrukce obstát jako současná spisovná čeština.

### Token vs. slovo a předložky — rozhodnutí 6/19

- `token` je technický identifikátor konkrétního výskytu slova v podání.
- Jazykové vlastnosti včetně hlavní větné funkce náležejí slovu v daném výskytu, nikoli tokenu jako technickému objektu.
- `k/v/z` jsou funkční předložky bez hlavní větné funkce.
- Jejich technická reprezentace má právě jednu vazbu na řízené jmenné slovo; hlavní větnou funkci nese jmenný člen/konstrukce.

### Fallback při omezení UI — rozhodnutí 7/19

Pokud pravidla dovolují případ, který veřejný formulář neumí reprezentovat:
- aplikace na tuto možnost viditelně upozorní,
- hráč kontaktuje rozhodčího/admina e-mailem,
- nejde o obcházení pravidel,
- pro MVP se nezavádí zvláštní fallback workflow ani nový stav podání.

Technické/resource limity formuláře jsou nenormativní a nesmějí vytvořit skrytý maximální počet slov.

### Reachability — rozhodnutí 8/19

Mechanismus může být:
1. **dosažitelný** — existuje nebo lze odvodit alespoň jeden soutěžně použitelný povrchový tvar,
2. **neprokázaný/hraniční** — dosažitelnost zatím není dokázána ani vyvrácena,
3. **prokazatelně nedosažitelný** — úplný normativní model dokazuje, že žádná povolená realizace nemůže vytvořit soutěžně použitelný povrchový tvar.

Pouze třetí stav dovoluje mechanismus odstranit z aktivního taháku/produkčního UI. „Nenašli jsme příklad“, nevhodné lemma nebo typický nepoužitelný tvar nejsou důkaz nedosažitelnosti. Znaková pravidla se vztahují na konkrétní použitý povrchový tvar; lemma a jiné tvary paradigmatu mohou obsahovat jiné znaky.

### Typ věty a interpunkce — rozhodnutí 9/19

Hráč explicitně deklaruje typ věty a ten přímo určuje povinnou závěrečnou interpunkci:
- oznamovací → `.`,
- tázací → `?`,
- rozkazovací → `!`.

U rozkazovací věty může být podmět pravidelně nevyjádřený pouze v dovoleném imperativu; ostatní věty se řídí obecným požadavkem na explicitní podmět.

### Morfologický panel

Dříve schválený UX princip zůstává:
- celé editovatelné paradigma je součást formuláře,
- buňky mohou být předvyplněny aktuálním povrchovým tvarem jako UX zkratka,
- předvyplnění není jazykový návrh ani verifikace systému,
- uživatel může předvyplněné hodnoty ponechat beze změny,
- potvrzuje přesně: **„Potvrzuji, že toto je můj morfologický návrh.“**,
- potvrzení se váže ke konkrétnímu aktuálnímu snapshotu a změna potvrzovaných dat je zneplatní,
- FE správnost paradigmatu před submittem neposuzuje.

### Katalog a formulář

- Morfologický učící se katalog nesmí před submittem radit hráči, zda jeho novou morfologickou analýzu už zná.
- Katalog skutečných slov není veřejně procházetelný. Hráč může po kompletním vyplnění vlastní morfologické identity a konkrétního použitého tvaru požádat o exact-match kontrolu podle #72.
- Exact-match kontrola pouze potvrdí již schválenou kombinaci; z částečných údajů nesmí vypisovat možné identity, podobná slova ani jiné alternativy.
- Hráč vždy předkládá požadovanou deklaraci podle pravidel; technické UI nesmí samo vytvářet jazykové pravidlo.

## Uživatelské účty a administrace

### Registrace — rozhodnutí 10/19

MVP používá klasickou lehkou registraci:
- povinný globálně unikátní `username`,
- povinný globálně unikátní neveřejný e-mail,
- heslo ukládané pouze jako bezpečný jednosměrný hash.

Soutěžní podání se váže na stabilní interní `user_id`; veřejná atribuce používá `username`.

Magic-link login se pro MVP nepoužívá. Zapomenuté heslo se řeší časově omezeným jednorázovým resetovacím tokenem/odkazem zaslaným na registrovaný e-mail; tento token slouží pouze ke změně hesla.

### Admin — rozhodnutí 11/19

- Administrátor je běžný registrovaný uživatel se stejnou autentizační identitou.
- Pro MVP stačí role `USER` a `ADMIN`.
- Samostatný `admin_user` se nepoužívá.
- Admin roli nelze získat veřejnou registrací ani měnit z klientského UI.
- Každý admin endpoint kontroluje oprávnění server-side.
- Citlivé administrativní zásahy se auditují proti adminovu `user_id`.

### Komentáře — rozhodnutí 12/19

Komentáře nejsou součástí MVP. Neimplementují se komentářové identity, magic linky, moderace komentářů ani jejich privacy/retention lifecycle. Případné budoucí komentáře budou nové produktové rozhodnutí.

## Férovost a nástroje

### Důvěra místo kontroly — rozhodnutí #71

- Kvazi stojí na vzájemné důvěře; bez ní recesní soutěž nedává smysl.
- Soutěžní řešení má vzniknout lidskou hlavou.
- Nástroje smějí pomáhat se studiem, počítáním a mechanickou kontrolou konkrétního lidského nápadu; nesmějí kandidáty automaticky hledat, generovat, skládat nebo optimalizovat.
- AI smí vysvětlovat pravidla Kvazi i obecnou češtinu, ale nesmí za hráče řešit konkrétní soutěžní případ, navrhovat kandidáty, opravovat řešení nebo hledat lepší varianty.
- Praktická zkratka zní: **„AI ti smí vysvětlit hru. Nesmí ji za tebe hrát.“**
- Projekt nebude vyžadovat pracovní logy, screenshoty, historii promptů ani jiné důkazy a nebude vyšetřovat způsob vzniku řešení.
- Odesláním řešení hráč jednoduše prohlašuje, že hrál fér a řešení vytvořil v duchu pravidel.
- Kvaziautorita nevede disciplinární řízení o použití AI nebo jiných nástrojů.

## Veřejnost a autorství

### Otevřený kumulativní problém — rozhodnutí #69

- Zveřejněné schválené řešení je legitimní společná znalost hry.
- Kdokoli je smí použít, upravit, prodloužit nebo převzít jednotlivé kvazislovo, morfologický nápad, syntaktickou konstrukci či jinou část řešení.
- Jednotlivé herní nápady nejsou pro účely soutěže výhradním vlastnictvím autora původního podání.
- Na jednom podání může spolupracovat více lidí a mohou být uvedeni jako spoluautoři; podíl zásluh se nevyčísluje.
- Autory konkrétního podání jsou osoby uvedené u tohoto podání; navázání na starší řešení samo nepřenáší jeho autorství na řešení nové.
- Přesně shodné řešení může podat více lidí; při shodném skóre jde o společný rekord a pořadí podání nerozhoduje.
- Projekt nezkoumá, zda byl zveřejněný herní nápad později převzat nebo nezávisle znovu objeven.

### Veřejný detail schválené věty — rozhodnutí #73

- Výsledkový přehled ukazuje zejména samotnou schválenou větu, počet slov, počet soutěžních znaků a autora nebo spoluautory.
- Detail věty je srozumitelný jazykový rozbor, nikoli úplný validační spis.
- U jednotlivých slov se veřejně ukazuje zejména použitý tvar, skutečné/kvazislovo, slovní druh, lemma nebo základní tvar, soutěžní vzor/model, základní morfologické vlastnosti konkrétního použitého tvaru a hlavní syntaktická role; podle potřeby lze ukázat i jednoduchou vazbu na další slovo.
- Veřejně se standardně nezobrazuje celé paradigma, úplná morfologická obhajoba, detailní zdrojové podklady, interní katalogové stavy ani úplný záznam review.
- Neveřejná úplná evidence zůstává k dispozici kvaziautoritě pro posouzení, audit a případné námitky.
- Omezený veřejný detail nijak neomezuje právo ostatních na zveřejněnou větu navazovat podle #69.

## Katalogy

### Katalog skutečných slov — rozhodnutí #68 a #72

- Pro status „skutečné slovo“ je soutěžní autoritou náš ručně spravovaný katalog skutečných slov/tvarů.
- Je-li odpovídající soutěžní identita a použitý tvar v katalogu schválený, považuje se pro soutěž za skutečné slovo.
- Není-li v katalogu, hráč může požádat o přezkoumání nebo vznést námitku; po jazykovém ověření lze katalog doplnit nebo opravit.
- IJP, ASSČ a další odborné jazykové zdroje jsou podklady pro správu katalogu, nikoli samy přímý soutěžní whitelist.
- Katalog je záměrně průběžně spravovatelný a jeho jednotlivé změny nevyžadují novou `rules_version`.
- Přijímáme tím menší míru formální reprodukovatelnosti ve prospěch jednoduchosti a recesního charakteru projektu.
- Katalog se veřejně nezveřejňuje jako taxativní ani procházetelný seznam.
- Hráč může ověřit pouze vlastní hotový návrh: uvede úplnou morfologickou identitu a konkrétní použitý tvar a dostane pouze potvrzení, zda tato přesná kombinace již je schválena jako skutečné slovo.
- Z neúplného zadání katalog nesmí napovídat možné identity, podobné položky ani jiné kandidáty.
- Nepotvrzená přesná kombinace není automaticky zamítnutá; lze ji předložit k ručnímu posouzení.

### Morfologický učící se katalog — rozhodnutí 13/19

Morfologický katalog je znalostní báze předchozího morfologického rozhodování pro konkrétní `rules_version`, nikoli předem úplný whitelist.

- Nová rules verze začíná z hlediska automatického morfologického schvalování prázdná.
- `APPROVED` znamená, že přesná identita/tvar jsou pro danou rules verzi morfologicky schválené a další shodný výskyt lze automaticky uznat.
- `REJECTED` znamená předchozí negativní morfologické rozhodnutí s uloženým důvodem.
- `UNKNOWN` znamená, že rozhodná znalost neexistuje a je nutné ruční review.
- Valenční obhajoba není součástí katalogového klíče morfologické identity slovesa.

### Katalogová podpora je součást MVP — rozhodnutí 19/19

První veřejné MVP musí umět používat katalog skutečných slov a minimální učící se morfologický katalog při review. Pokročilé bulk importy a složitý námitkový workflow mohou zůstat mimo první MVP; veřejná exact-match kontrola katalogu skutečných slov se řídí #72.

## Revize, revalidace a historie

### Historické a aktuální schválení — rozhodnutí 14/19

- Schválení podle starší rules verze je neměnný historický fakt.
- Nová `rules_version` vytvoří nový obsahový validační výsledek nad stejnou immutable revizí; starý verdikt nepřepisuje.
- Do aktuálního žebříčku vstupují jen řešení platná/uznaná podle aktuální rules verze.
- Způsob, jakým hráč řešení vytvořil, se při revalidaci zpětně nevyšetřuje; fair-play pravidla stojí na důvěře.
- Průběžná správa katalogu skutečných slov není sama o sobě novou `rules_version` a nemá sloužit k bezdůvodnému rušení již schválených historických řešení.

### Immutable revize — rozhodnutí 18/19

- Uživatel pracuje s editovatelným draftem.
- Každý submit vytvoří immutable `sentence_revision` se snapshotem celého podání.
- Review, katalog, validace, skóre a publikace se vždy vážou ke konkrétní revizi.
- Vrácení k doplnění nepřepisuje starou revizi; nový submit vytvoří revizi další.
- Revalidace podle nové rules verze nevytváří novou revizi, pokud se obsah nezměnil.

## Rules release a reprodukovatelnost

### Kdy vzniká nová rules version — rozhodnutí 16/19 + #68

- Nová `rules_version` je potřeba při změně samotných soutěžních pravidel nebo autoritativního výkladu pravidla.
- Čistě redakční změny pravidel novou verzi nevyžadují.
- Doplnění nebo oprava provozního katalogu skutečných slov se nepovažuje za změnu pravidla a novou `rules_version` sama o sobě nevyžaduje.
- Projekt vědomě neusiluje o absolutní historickou reprodukovatelnost každého stavu externích jazykových zdrojů.

### Immutable manifest — rozhodnutí 17/19

- Každá rules verze má immutable manifest normativních pravidlových artefaktů a hash každé položky; manifest může mít i vlastní souhrnný hash.
- Git commit/tag se ukládá pouze jako doplňková reference, nikoli jako jediná definice normativního rozsahu.
- Normativní paradigmata a modely patří do stejného verzovaného normativního balíku.
- Provozní katalog skutečných slov a učící se katalog jsou od pravidel oddělené znalosti.

## Hranice live validace

- FE může před submittem deterministicky kontrolovat pouze veřejná znaková a strukturální pravidla a úplnost deklarace.
- FE neposuzuje jazykovou správnost morfologie, syntaxe, významu ani slovní valenční obhajoby.
- FE nesmí navrhovat náhradní slova, tvary, tokenizaci, analýzu nebo syntaktické vazby.
- Výjimkou je explicitně vyžádaná exact-match kontrola katalogu skutečných slov podle #72, která je dostupná až po kompletním vyplnění morfologické identity a konkrétního použitého tvaru a smí pouze potvrdit již schválenou přesnou kombinaci.

## MVP scope – uzavřeno

První veřejné MVP povinně obsahuje:
- prezentaci projektu, vysvětlení a pravidla,
- registraci/přihlášení a reset zapomenutého hesla,
- interaktivní strukturovaný formulář,
- immutable submission revisions,
- katalog skutečných slov a minimální interní učící se morfologický katalog,
- exact-match ověření vlastního kompletně deklarovaného kandidáta proti katalogu skutečných slov podle #72,
- neveřejné admin review,
- veřejný seznam pouze schválených vět se skóre a autorstvím,
- veřejný detail schválené věty s lehkým jazykovým rozborem podle #73, nikoli s úplným paradigmatem a validačním spisem,
- základní historii verzí pravidel a podání.

Čekající a zamítnuté věty nejsou veřejné. Veřejné peer review ani komentáře nejsou součástí MVP.

## Zbývající práce — není to otevřená produktová volba

Před implementací/produkčním releasem zbývá zejména:

### `[SPEC]`
- doplnit přesná normativní paradigmata substantivních a adjektivních modelů (#1),
- odvodit finální slovesné časovací typy podle reachability (#2/#4),
- dokončit reachability audit hlavních a hraničních mechanismů (#4),
- dokončit úplné field schema formuláře podle POS/modelu (#5).

### `[IMPLEMENTATION]`
- promítnout rozhodnutí do DB/migrací, katalogů, auth/security a release procesu,
- opravit a dokončit konfigurátor podle frontendového auditu,
- vytvořit automatické testy deterministického validátoru,
- před produkcí uzavřít security baseline a query/index review.

Pokud při SPEC nebo implementaci vznikne nová skutečná produktová volba, nesmí ji vývojový agent rozhodnout sám; musí ji znovu eskalovat decision ownerovi.