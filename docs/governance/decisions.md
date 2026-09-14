# Rozhodnutí projektu

Tento dokument shrnuje stabilní rozhodnutí, která už byla explicitně přijata. Detailní diskuse a otevřené varianty zůstávají v GitHub Issues.

## Autorita a governance

- Finální produktová a pravidlová rozhodnutí provádí Josef Bukovský.
- Technická implementace nesmí sama vytvářet nová soutěžní pravidla.
- Pokud je pravidlo nejasné a otevřená otázka není rozhodnutá, implementace ji nesmí hardcodovat.

## Hranice pravidel, dat a implementace

- Normativní pravidla mají vyšší autoritu než architektura, databáze, UI nebo interní katalog.
- Interní katalog je provozní znalostní báze, nikoli zdroj nových pravidel.
- Uživatelská deklarace analýzy není sama morfologickou pravdou.
- Odvozená data musí být znovu vypočitatelná ze zdrojových dat a příslušné verze pravidel/validátoru.

## Soutěžní řetězec a validace

- Soutěžní aplikace smí před odesláním deterministicky kontrolovat veřejná znaková a strukturální pravidla a úplnost formuláře.
- Každý běžný token musí celý ležet v jednom motivu; nestačí validita spojeného řetězce bez ohledu na hranice tokenů.
- Hráč ručně nezadává rozklad věty na motivy.
- Interní katalog se před odesláním nepoužívá jako veřejný membership oracle.
- Katalogová kontrola může proběhnout až nad uzamčenou revizí podání a její výsledek je před rozhodnutím neveřejný.

## Soutěžní identita a morfologické modely

- Každý soutěžní model musí přesně určit vztah mezi základním tvarem, morfologickými hodnotami a použitým tvarem.
- Jeden použitý tvar nesmí přes jeden model otevírat libovolně mnoho základních tvarů nebo soutěžních identit; konečný počet jednotlivě ověřitelných analýz je přípustný.
- Status skutečné slovo / kvazislovo se posuzuje podle celé soutěžní identity, nikoli pouze podle zápisu.
- Stejný zápis může představovat skutečnou identitu a odlišnou kvaziidentitu, pokud se liší vlastností, která je součástí soutěžní identity.
- Tutéž doloženou skutečnou identitu nelze pouze deklarací přeznačit na kvazislovo.

### Variantní realizace paradigmat

- Každá morfologická kombinace má v normativním soutěžním modelu výslovně uvedenou jednu nebo více povolených realizací.
- Existence jiné spisovné varianty mimo normativní tabulku sama o sobě nezakládá její soutěžní přípustnost.
- Jedna realizace je základní soutěžní forma; další variantní realizace se přidává pouze vědomým rozhodnutím jako součást pravidel, zejména pokud přináší skutečně odlišnou a herně relevantní dosažitelnou možnost.
- Variantní realizace nevytváří novou soutěžní identitu.
- Produkční formulář, katalog ani validátor nesmějí automaticky přebírat obecné spisovné dublety, které nejsou uvedeny v normativním soutěžním modelu.

### Slovesné časovací typy

- Soutěžní sada slovesných časovacích typů bude minimální a odvozená z reachability auditu.
- Samostatný časovací typ se zařadí pouze tehdy, pokud přináší alespoň jednu novou soutěžně dosažitelnou morfologickou možnost, kterou nelze reprezentovat již existujícím soutěžním typem.
- Typy se nepřebírají jen proto, že v obecné češtině představují odlišné slovesné vzory nebo třídy.
- Reachability audit nesmí být omezen pracovním názvem typu a musí prověřit relevantní rodiny nad základy typu `VAZ-`, `KVAZ-` i `Q-`/`QAZ-`; pracovní kandidáti zahrnují minimálně `V-AT`, `V-IT`, `KV-AT`, `KV-IT`, `Q-AT`, `Q-IT`.
- Každý kandidátní typ musí zachovat konečný a rozhodnutelný počet soutěžních identit pro konkrétní použitý tvar.

### Vid a valence sloves

- Povolené hodnoty vidu jsou `nedokonavý`, `dokonavý`, `obouvidový`.
- Vid sám o sobě nevytváří soutěžní identitu.
- Valence kvazislovesa není omezena malým normativním whitelistem rámců.
- Hráč musí deklarovaný valenční rámec doložit konkrétním současným českým slovesem se stejnou valencí.
- Modelové sloveso pro valenci nemusí být stejné jako model časování.

## Syntaxe a formulář

- Syntaxe má uzavřený seznam hlavních syntaktických vztahů a pro každý závazný praktický test.
- Významové podtypy hlavních vztahů nejsou samostatným povinným whitelistem a příklady nejsou vyčerpávající.
- Formulář u každého slova strukturovaně zachytí slovní druh, úplnou morfologickou identifikaci, soutěžní identitu, konkrétní použitý tvar, hlavní syntaktickou funkci, všechny povinné vazby na konkrétní výskyty slov a požadovanou obhajobu/zdroje.
- Token je technický identifikátor konkrétního výskytu slova v podání; jazykové vlastnosti, včetně větné funkce, náležejí slovu v daném výskytu, nikoli tokenu jako technickému objektu.
- U `k/v/z` má předložka technickou roli s povinnou vazbou na řízené jmenné slovo; hlavní větnou funkci nese jmenné slovo/skupina, nikoli předložka.
- Povinné strukturované údaje nelze nahradit jedním volným textem.
- U běžného členu se ukládá jedno řídící slovo.
- Doplněk má samostatnou vazbu k přísudku a k podmětu nebo předmětu.
- Koordinace má samostatnou vazbu ke dvěma spojovaným částem.
- Pro MVP se používá specializovaný syntaktický datový model, nikoli obecný graf hran.
- Typ věty hráč explicitně deklaruje jako oznamovací, tázací nebo rozkazovací.
- Typ věty má přímý validační dopad na závěrečnou interpunkci: oznamovací `.`; tázací `?`; rozkazovací `!`.
- U rozkazovací věty může být podmět pravidelně nevyjádřený pouze v dovoleném imperativu; ostatní věty vyžadují explicitní podmět podle pravidel.
- Pokud pravidly přípustný případ formulář neumí zachytit, aplikace pouze viditelně informuje hráče o možnosti kontaktovat rozhodčího e-mailem; pro MVP nevzniká zvláštní fallback workflow ani stav podání.

## Morfologický panel formuláře

- Celé editovatelné paradigma zůstává součástí formuláře.
- Buňky mohou být po volbě slova/modelu předvyplněny aktuálním povrchovým tvarem tokenu jako UX zkratka.
- Předvyplnění není jazykový návrh systému ani tvrzení správnosti.
- Uživatel hodnoty zkontroluje/upraví a explicitně potvrzuje, že aktuálně vyplněné paradigma je jeho vlastní morfologický návrh.
- FE před submittem správnost paradigmatu neposuzuje.
- Potvrzení se musí vztahovat ke konkrétnímu aktuálnímu snapshotu návrhu a po změně potvrzovaných dat se zneplatní.

## Reachability

- Mechanismus se nesmí označit za nedosažitelný jen proto, že nebyl nalezen příklad, že jeho lemma obsahuje nepovolený znak nebo že typický tvar není použitelný.
- Dosažitelnost se posuzuje podle konkrétního použitelného povrchového tvaru; lemma a jiné tvary paradigmatu mohou obsahovat jiné znaky.
- Prokazatelně nedosažitelný je mechanismus teprve tehdy, když úplný normativní model dovoluje dokázat, že žádná jeho povolená realizace nemůže vytvořit soutěžně použitelný tvar.
- Neprokázané/hraniční mechanismy se nesmějí předčasně zakázat; prokazatelně nedosažitelné mechanismy lze odstranit z aktivního taháku a produkčního UI.

## Skutečná česká slova a zdroje

- Existenci skutečného soutěžního slova lze doložit pouze slovníkovou částí IJP nebo již zveřejněným heslem ASSČ.
- SSJČ, PSJČ, korpusy, jiné slovníky ani internetové výskyty samy o sobě existenci soutěžního slova neprokazují.
- Záznam v IJP/ASSČ nenahrazuje požadavek současné spisovnosti konkrétního tvaru ani shodu se soutěžním modelem.
- Hráč hledá skutečná soutěžní slova pouze ručně; úplný předfiltrovaný seznam kandidátů se nezveřejňuje.
- Změna této sady zdrojů vyžaduje novou verzi pravidel.

## Uživatelské účty a autorství podání

- Pro MVP se používá lehká klasická registrace uživatele, nikoli magic-link přihlášení.
- Uživatel při registraci uvádí povinný globálně unikátní `username`, povinný globálně unikátní e-mail a heslo.
- E-mail je neveřejný; veřejná atribuce autora používá `username`.
- Heslo se nikdy neukládá v plaintextu, pouze jako bezpečný jednosměrný password hash.
- Soutěžní podání se váže na stabilní interní `user_id` autora.
- Aplikace musí podporovat zapomenuté heslo prostřednictvím časově omezeného jednorázového resetovacího odkazu/tokenu zaslaného na registrovaný e-mail.
- Reset hesla není magic-link přihlášení a slouží pouze ke změně hesla.
- Konkrétní bezpečnostní parametry password hashování, session/cookies, reset tokenů, rate limitingu a dalších ochran jsou součástí implementační security baseline.

## MVP scope – již rozhodnuté minimum

První veřejné MVP povinně obsahuje:

- prezentaci projektu, vysvětlení a pravidla,
- lehkou registraci/přihlášení uživatele a reset zapomenutého hesla,
- interaktivní strukturovaný formulář pro podání kvazivěty,
- veřejný seznam pouze schválených vět,
- veřejný detail schválené věty včetně obhajoby a morfologické identifikace jednotlivých slov,
- neveřejné admin rozhraní pro posouzení podání.

Čekající a zamítnuté věty nejsou veřejné. Veřejné peer review čekajících podání není součástí MVP.

## Otevřené oblasti

Nadále je nutné rozhodnout zejména:

- přesná normativní paradigmata substantivních a adjektivních modelů,
- konkrétní finální slovesné časovací typy po reachability auditu,
- úplné field schema formuláře,
- interní katalog a jeho verzování,
- semantiku revalidace a historickou provenance,
- release proces,
- komentáře a jejich případný scope,
- admin autentizaci/role a security baseline.
