# Rozhodnutí projektu

Tento dokument shrnuje stabilní rozhodnutí, která už byla explicitně přijata decision ownerem. Detailní diskuse, auditní nálezy a implementační práce zůstávají v GitHub Issues.

> **Stav po auditu 2026-09-14:** původní sada produktových rozhodnutí byla uzavřena; následný produktový audit může otevírat další skutečné pravidlové nebo koncepční volby. Otevřené rozhodovací body se vedou v GitHub Issues a po rozhodnutí se jejich stabilní výsledek promítá sem a do normativních artefaktů.

## Autorita a governance

- Finální produktová a pravidlová rozhodnutí provádí Josef Bukovský.
- Normativní pravidla mají vyšší autoritu než architektura, databáze, UI nebo interní katalog.
- Technická implementace nesmí sama vytvářet nové soutěžní pravidlo.
- TODO není implicitní rozhodnutí.
- Uživatelská deklarace analýzy není sama morfologickou pravdou.
- Odvozená data musí být reprodukovatelná ze zdrojových dat a příslušné rules/catalog/validator provenance.

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

### Valence — rozhodnutí 4/19 a 5/19

- Valence kvazislovesa není omezena malým normativním whitelistem rámců typu ACC/DAT/GEN/INS.
- Hráč musí rámec jednoznačně deklarovat a realizovat všechny jeho obligatorní sloty.
- Deklarovaný rámec kvazislovesa musí být doložen konkrétním současným českým slovesem se stejnou valencí.
- Modelové sloveso pro valenci nemusí být stejné jako model časování.
- FE před submittem ověřuje pouze úplnost/strukturu, nikoli jazykovou správnost valenční analogie.

## Syntaxe a formulář

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

### Katalog nesmí měnit formulář — rozhodnutí 15/19

- Hráč před submittem nikdy nedostane informaci, zda interní katalog jeho identitu/tvar už zná.
- Formulář je stejný při prázdném i vybudovaném katalogu.
- Hráč vždy předkládá úplnou požadovanou strukturovanou deklaraci a minimální důkaz/obhajobu podle pravidel.
- Katalog šetří práci rozhodčímu, nikoli povinnosti formuláře hráči.

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

## Interní učící se katalog

### Semantika katalogu — rozhodnutí 13/19

Katalog je znalostní báze předchozího rozhodování pro konkrétní `rules_version`, nikoli předem úplný whitelist.

- Nová rules verze začíná z hlediska automatického schvalování prázdná.
- `APPROVED` znamená, že přesná identita/tvar jsou pro danou rules verzi schválené a další shodný výskyt lze automaticky uznat.
- `REJECTED` znamená předchozí negativní rozhodnutí s uloženým důvodem/provenance.
- `UNKNOWN` znamená, že rozhodná znalost neexistuje; absence není neplatnost a vyžaduje ruční review.
- Schválení neznámého případu vytváří budoucí `APPROVED`; zamítnutí `REJECTED`.
- Zamítnutí kteréhokoli slova/identity nezbytné pro deklarovanou analýzu znamená zamítnutí dané revize věty.
- Historie katalogu starších rules verzí se zachovává, ale automaticky se nepřenáší do verze nové.

### Katalog je součást MVP — rozhodnutí 19/19

Minimální učící se katalog je povinnou součástí prvního veřejného MVP. Musí podporovat interní lookup po uzamčeném submitu, stavy/semantiku `APPROVED / REJECTED / UNKNOWN`, automatické znovupoužití schválení v rámci stejné rules verze a auditní stopu rozhodnutí.

Mimo první MVP mohou zůstat pokročilé bulk importy, veřejné katalogové rozhraní, složitý námitkový workflow, AI příprava katalogových dat a pokročilé porovnávání verzí.

## Revize, revalidace a historie

### Historické a aktuální schválení — rozhodnutí 14/19

- Schválení podle starší rules verze je neměnný historický fakt.
- Nová `rules_version` vytvoří nový obsahový validační výsledek nad stejou immutable revizí; starý verdikt nepřepisuje.
- Do aktuálního žebříčku vstupují jen řešení platná/uznaná podle aktuální rules verze.
- Historická procesní compliance původního podání (např. tehdy platná AI/tool policy) se při obsahové revalidaci retroaktivně nepřehodnocuje.
- Pokud se scoring semantics změní, skóre patří ke konkrétní validaci podle konkrétní rules verze.

### Immutable revize — rozhodnutí 18/19

- Uživatel pracuje s editovatelným draftem.
- Každý submit vytvoří immutable `sentence_revision` se snapshotem celého podání.
- Review, katalog, validace, skóre a publikace se vždy vážou ke konkrétní revizi.
- Vrácení k doplnění nepřepisuje starou revizi; nový submit vytvoří revizi další.
- Revalidace podle nové rules verze nevytváří novou revizi, pokud se obsah nezměnil.

## Rules release a reprodukovatelnost

### Kdy vzniká nová rules version — rozhodnutí 16/19

- Bez nové verze jsou dovoleny jen čistě redakční/vysvětlující změny, které nemohou změnit verdikt žádného řešení.
- Jakákoli změna nebo autoritativní výklad, který může změnit platnost alespoň jednoho řešení, vyžaduje novou `rules_version` (typicky patch release).
- Samostatná paralelní `interpretation_revision` se nezavádí.

### Immutable manifest — rozhodnutí 17/19

- Každá rules verze má immutable manifest všech normativních artefaktů a hash každé položky; manifest může mít i vlastní souhrnný hash.
- Git commit/tag se ukládá pouze jako doplňková reference, nikoli jako jediná definice normativního rozsahu.
- Normativní číselníky, paradigmata a modely, které mohou změnit verdikt, patří do stejného verzovaného normativního balíku.
- Interní katalog je od pravidel oddělená provozní znalost.

## Skutečná česká slova a zdroje

- Existenci skutečného soutěžního slova lze doložit pouze slovníkovou částí IJP nebo již zveřejněným heslem ASSČ.
- SSJČ, PSJČ, korpusy, jiné slovníky ani internetové výskyty samy o sobě existenci soutěžního slova neprokazují.
- Záznam v IJP/ASSČ nenahrazuje požadavek současné spisovnosti konkrétního tvaru ani shodu se soutěžním modelem.
- Hráč hledá skutečná soutěžní slova pouze ručně; úplný předfiltrovaný seznam kandidátů se nezveřejňuje.
- Změna této sady zdrojů vyžaduje novou rules verzi.

## Hranice live validace

- FE může před submittem deterministicky kontrolovat pouze veřejná znaková a strukturální pravidla a úplnost deklarace.
- FE neposuzuje jazykovou správnost morfologie, valence, syntaxe ani významu.
- FE nesmí navrhovat náhradní slova, tvary, tokenizaci, analýzu nebo syntaktické vazby.
- Katalogová kontrola probíhá až nad uzamčenou revizí a její interní výsledek je před administrativním rozhodnutím neveřejný.

## MVP scope – uzavřeno

První veřejné MVP povinně obsahuje:
- prezentaci projektu, vysvětlení a pravidla,
- registraci/přihlášení a reset zapomenutého hesla,
- interaktivní strukturovaný formulář,
- immutable submission revisions,
- minimální interní učící se katalog,
- neveřejné admin review,
- veřejný seznam pouze schválených vět,
- veřejný detail schválené věty včetně obhajoby a morfologické identifikace jednotlivých slov,
- rules versioning/revalidation potřebné pro reprodukovatelné soutěžní výsledky.

Čekající a zamítnuté věty nejsou veřejné. Veřejné peer review ani komentáře nejsou součástí MVP.

## Zbývající práce — není to otevřená produktová volba

Před implementací/produkčním releasem zbývá zejména:

### `[SPEC]`
- doplnit přesná normativní paradigmata substantivních a adjektivních modelů (#1),
- odvodit finální slovesné časovací typy podle reachability (#2/#4),
- dokončit reachability audit hlavních a hraničních mechanismů (#4),
- dokončit úplné field schema formuláře podle POS/modelu (#5).

### `[IMPLEMENTATION]`
- promítnout rozhodnutí do DB/migrací, katalogu, provenance, auth/security a release procesu,
- opravit a dokončit konfigurátor podle frontendového auditu,
- vytvořit automatické testy deterministického validátoru,
- před produkcí uzavřít security baseline a query/index review.

Pokud při SPEC nebo implementaci vznikne nová skutečná produktová volba, nesmí ji vývojový agent rozhodnout sám; musí ji znovu eskalovat decision ownerovi.
