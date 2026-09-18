# Konfigurátor kvazivěty – funkční a UX specifikace

> **Status:** nenormativní funkční specifikace aktivního konfigurátoru. Soutěžní pravidla sama neurčuje a musí být vždy v souladu s aktuálním normativním balíkem podle `docs/README.md` a s aktuálními GitHub Issues.

## 0. Role dokumentu

Konfigurátor umožňuje hráči zapsat konkrétní kvazivětu, deklarovat analýzu jednotlivých slov a odeslat podání. Nemá hru řešit, generovat kandidáty ani hráči prozrazovat, které normativní cesty jsou podle aktuálního motivu slepé.

Klíčový UX princip:

> **Normativní nabídka je úplná; validační hloubka může být podmíněná dřívějším rozhodujícím gate.**

To znamená například:

- model `kuře` zůstává normálně v roletě substantivních modelů,
- `otcův` a `matčin` zůstávají v nabídce adjektivních modelů,
- všech pět normativních slovesných typů zůstává v nabídce,
- normativní druhy slovesných tvarů se neschovávají pouze kvůli reachability,
- konfigurátor hráče neupozorňuje, že některá volba je podle současné abecedy nebo motivu slepá.

Reachability nesmí fungovat jako nápověda.

## 1. Základní struktura stránky

Aktivní konfigurátor je `app/public/konfigurator.php` a používá moduly v `app/public/js/konfigurator/`.

Hlavní části UI:

1. **Zadání věty** – preview, typ věty, vkládání a pořadí tokenů.
2. **Deklarace slova** – editor vybraného tokenu.
3. **Kontrola** – živý přehled povrchové, strukturální a případně deep-validace.
4. **Akce** – lokální JSON preview a skutečný submit.

Submit používá autentizovanou backend cestu a serverovou autoritativní validaci. Konfigurátor není pouze lokální prototyp.

## 2. Vkládání slov

Hráč zadává konkrétní povrchové tvary jako samostatné tokeny.

- mezera nebo Enter commitne aktuální token,
- Backspace v prázdném vstupu může odstranit poslední token,
- nové tokeny se přidávají pouze na konec věty v pořadí zadání,
- surface se normalizuje do Unicode NFC,
- pořadí tokenů je stabilní a vazby používají jejich interní ID,
- závěrečná interpunkce souvisí s typem věty.

Surface vloženého tokenu lze přímo změnit v editoru vybraného slova. Zůstává jeho pořadí a interní ID; změna používá stejnou NFC normalizaci a převod na malá písmena jako vložení. Existující surface gate se okamžitě přepočítá, stejně jako inference jednopísmenného POS/role a prefixu `kvazi-`.

Při zachování stejné deklarativní kategorie se zachovají kompatibilní hráčské údaje (model, vlastnosti tvaru, syntax a obhajoby). Funkčnímu slovu se aktualizuje lemma. Přechod mezi funkčními kategoriemi, od funkčního slova k běžnému nebo k jinému odvozenému POS resetuje deklaraci a reference ostatních tokenů na změněný token; hráč je musí znovu potvrdit. Změna prefixu u substantiva zachová model/tvar/syntax, ale vyprázdní lemma a podklady vztahující se ke staré identitě. Nové lemma systém nehádá. Morfologická shoda se vždy ověřuje proti novému surface; zachovaná deklarace sama nestačí k submitu.

Každá změna surface zneplatní katalogový výsledek i pending request, včetně editace zpět na původní tvar; nikdy sama nespustí lookup. Lokální JSON preview se také zneplatní. Placeholder hlavního vstupu se zobrazuje pouze při nulovém počtu tokenů a prázdném inputu. Validace je neblokující; neplatnost se projeví ve stavu kontroly a zablokuje submit.

## 3. Typ věty

Konfigurátor nabízí normativní typy věty z aktivního rules release.

U rozkazovací věty lze podle pravidel deklarovat normativně dovolený nevyjádřený podmět.

Závěrečná interpunkce se odvozuje deterministicky z typu věty a nesmí vytvořit vlastní pravidlo mimo release data.

## 4. Deklarace tokenu

### 4.1 Obecná pole

Podle slovního druhu a zvoleného modelu hráč deklaruje zejména:

- slovní druh,
- lemma / základní tvar / infinitiv,
- status skutečné slovo / kvazislovo,
- soutěžní model,
- morfologické vlastnosti konkrétního použitého tvaru,
- větnou funkci nebo technickou roli,
- požadované vazby na další tokeny,
- volitelnou morfologickou obhajobu / zdroj a případně povinnou významovou obhajobu,
- u slovesa valenční obhajobu volným textem.

Podle #86 hráč **nevyplňuje celé paradigma** ani nepoužité tvary.

Obecné `evidence.morphology` je nepovinné a neovlivňuje `structureOk` ani `submitReady` ve FE/PHP. Strukturovaná identita a použitý tvar zůstávají povinné. Plnovýznamové sloveso nadále vyžaduje `valency.declaration`; při `evidence.needsAnalogy` jsou povinné obě položky `explanation` a `analogy`. Runtime oprava je zaznamenaná v immutable release `public-1.3.1` / validator `1.3.1`; pravidlová mechanika se oproti `public-1.3` nemění.

### 4.2 Úplná modelová nabídka

Model selectors se sestavují z aktivních normativních dat a **nesmějí být filtrovány reachability analýzou**.

Konfigurátor tedy nesmí vytvářet druhý seznam „aktivních modelů“ založený na tom, zda v současném motivu známe použitelný surface.

Toto pravidlo platí i pro globálně nedosažitelné větve. Jejich nabídka ve formuláři je záměrná a umožňuje hráči samostatně objevovat slepé cesty.

### 4.3 Prefix `kvazi-`

Prefix se ručně nevolí.

Pokud surface jednoznačně splní normativní podmínku pro inference prefixu:

- POS se automaticky nastaví na substantivum,
- interní `kvaziPrefix` se odvodí z normativních dat,
- hráč tyto odvozené hodnoty pro daný surface nemůže přepsat.

Inference sama nezaručuje platnost tokenu.

### 4.4 Exact-match katalog

Po úplném vyplnění identity a relevantního použitého tvaru nabízí token explicitní akci „Ověřit v katalogu“. Vyžaduje přihlášení a poskytne pouze potvrzení přesné deklarace, nebo zprávu „Tato přesná deklarace zatím v katalogu potvrzena není. Můžete ji přesto odeslat k posouzení.“ Neúplný kandidát akci nenabízí. Smazání tokenu nebo změna identity/modelu či relevantního form field zneplatní starý výsledek; opožděná odpověď jej nesmí obnovit. Editace nikdy sama nespouští nový lookup. Obhajoby a povinná pole zůstávají viditelné a payload úplný; not found neovlivňuje submitReady.

Zájmeno nemá produktivní model. Má čtyři explicitní selecty uložené jako `form.pronoun.{case,number,gender,person}`. Od `public-1.3` / validator `1.3.0` jsou všechny povinné pro autoritativní submit i katalogový lookup podle #109; chybění drží `structureOk=false` a `submitReady=false`. Povolené hodnoty FE/PHP čtou ze stejného `pronoun_form_signature` runtime datasetu. Každé pole nabízí explicitní „Nevztahuje se“ (`notApplicable`); prázdná hodnota ani null tuto deklaraci nenahrazují a vlastnosti se nedovozují z lemmatu. Přesný key kontrakt je v `06-review-services.md`. Enumy produktivních kategorií se nemění a historické releases zůstávají immutable.

Osoba zájmena má vždy popisky „1. osoba“ až „3. osoba“, pád „1. pád“ až „7. pád“, v obou režimech terminologie. Hodnoty payloadu a runtime `pronoun_form_signature` se tím nemění.

Normativní funkční jednopísmenná slova a pomocná sada být akci nepotřebují. Katalog u prefixovaného substantiva ověřuje jen kompletní základ. Interní morphology cache není dostupná hráčskou akcí.

## 5. Syntaxe a vazby

UI nabízí normativně povolené hlavní syntaktické funkce a technické role.

Podle role se zobrazí příslušné vazby na jiné tokeny, například:

- řídící slovo,
- přísudek,
- jmenný cíl,
- dvě části koordinace.

Vazby musí používat stabilní token ID a nesmějí mířit na neexistující nebo nepovolený cíl.

Valenční obhajoba slovesa je volný text; konfigurátor nemá hráči generovat nebo navrhovat valenční rámec.

## 6. Validační UX

### 6.1 Povrchová brána

První viditelná validační vrstva kontroluje zejména:

- Unicode NFC,
- povolené znaky,
- délku,
- jednopísmenné výjimky,
- prefixovou povrchovou výjimku,
- globální motivovou/tokenovou sekvenci.

Tato vrstva je společná všem modelům a má přednost před deep validační diagnostikou.

Po přechodu do stavu explicitní závěrečné interpunkce `.`, `?` nebo `!` a `state.sequence.ok=true` se zobrazí pozitivní feedback „Výborně, věta vypadá na první pohled správně, pojďme na obhajobu!“ s krátkým světelným efektem. Používá pouze existující Phase 1 výsledek, nezaručuje full validity a nemění submit readiness ani backend verdict. Výchozí interpunkce preview bez `closingPunct` nestačí. Reward se spustí jednou na přechod; výběr tokenu, katalogový výsledek, změna obhajoby ani JSON preview jej neopakují. Po otevření věty nebo surface failure se znovu připraví na další úspěšný přechod. Při `prefers-reduced-motion: reduce` animace neběží a zůstává čitelný statický success feedback v samostatném status regionu.

### 6.2 Deep-validace se nespouští zbytečně

Pokud konkrétní token nebo věta už na povrchové vrstvě deterministicky selže, submit je neplatný. UI nemusí v takové situaci současně zobrazovat detailní branch-specific morfologické chyby, které už konečný verdikt nemohou změnit.

Doporučené uživatelské chování je:

- povrchová chyba je zobrazena jasně,
- deep morfologická kontrola je označena jako **neprovedená / nevyhodnocená kvůli povrchové chybě**, nikoli jako úspěšná,
- hráč není zahlcen sekundárními chybami odvozenými z větve, ke které se aktivní validace vůbec nemusela dostat,
- `submitReady` zůstává `false`.

### 6.3 Surface-validní kandidát

Pokud povrchová brána projde, konfigurátor provede relevantní strukturální a deterministickou deep-validaci:

- completeness/closed enums,
- konkrétní morfologický form-check,
- syntaktické vazby,
- deterministickou shodu,
- prefixové invarianty,
- další pravidlově jednoznačné kontroly.

Klientská kontrola je pouze UX; backend vše potřebné autoritativně zopakuje.

## 7. Dormant deep-validace

Současná codebase může obsahovat funkční deep-validátory normativních větví, které se při aktuálním surface/motivu prakticky nebo globálně nedostanou do aktivního submit flow.

Takovou implementaci:

- **nemažeme pouze kvůli současné reachability**,
- **nezakomentováváme jako velký mrtvý blok**,
- necháváme normálně syntakticky aktivní a udržovatelnou,
- odpojíme pouze její volání z cesty, kde už surface gate definitivně rozhodl INVALID,
- můžeme chránit levnými unit/regression testy,
- nemusíme pro ni udržovat samostatný browser/HTTP/DB/E2E scénář.

Důvodem je možnost budoucí rules verze s jinou abecedou nebo motivem. Při takové změně se nejprve prověří, zda lze zachovanou implementaci znovu zapojit.

## 8. Validační panel

Panel má odlišit minimálně:

1. **Povrchová / znaková a motivová kontrola**,
2. **Strukturované údaje a syntax**,
3. **Morfologická kontrola**,
4. **Připravenost k odeslání**,
5. počet slov a autoritativně odvoditelné skóre pro aktuální draft.

Morfologický stav nemá být nuceně binární `OK/FAIL`, pokud kontrola nebyla kvůli dřívějšímu failure provedena. UI smí používat třetí stav typu „nevyhodnoceno“.

Per-token detail má primárně zobrazovat chyby relevantní pro aktuální validační fázi a nemá zahlcovat hráče výsledky dormant větví po definitivním surface failure.

## 9. Lokální preview

Tlačítko pro JSON preview:

- vždy pracuje s aktuálním draftem,
- nic samo neodesílá,
- po změně draftu se starý preview stav zneplatní,
- může zobrazit odvozený validační stav včetně informace, že určitá deep kontrola nebyla provedena.

Preview není autoritou pro serverový submit.

## 10. Submit

Submit je dostupný pouze tehdy, když klientská validace považuje draft za připravený.

Backend však klientskému výsledku nedůvěřuje a znovu autoritativně vyhodnotí request.

Backend smí short-circuitovat po definitivním surface failure stejně jako frontend, ale musí:

- request bezpečně odmítnout,
- nevytvořit novou `sentence_revision`,
- nepřevzít klientský score, rules version, prefix/POS odvozeninu ani jiný derived state jako autoritu.

Surface-valid direct request musí projít dostatečnou kontrolou deklarace i tehdy, když klient tvrdí model nebo větev, která je při běžném používání globálně nedosažitelná.

## 11. Resubmit a historie

Vrácené podání se načítá z immutable předchozí revize do nového editovatelného draftu.

- starší revision se nepřepisuje,
- staré administrativní rozhodnutí neopravňuje libovolně další revize,
- další submit vytváří novou revision stejné sentence pouze podle revision-scoped workflow.

Reachability optimalizace nemá měnit uloženou hráčskou deklaraci ani historická data.

## 12. Přístupnost a bezpečné renderování

- viditelné formulářové prvky mají mít label nebo ekvivalentní accessible name,
- user-entered text se escapuje a nesmí vytvořit XSS,
- focus se při re-renderu nemá zbytečně ztrácet,
- konfigurátor musí být použitelný i na mobilním viewportu,
- validace nesmí spoléhat na klientské UI jako bezpečnostní hranici.

## 13. Testovací kontrakt konfigurátoru

Browser test má dokazovat reprezentativní skutečnou hráčskou cestu, nikoli úplný kartézský součin normativních paradigmat.

Povinně má pokrýt zejména:

- vkládání/editaci tokenů,
- NFC a základní povrchovou kontrolu,
- přímou editaci prvního/prostředního/posledního surface se stabilním ID/pořadím, změny POS/prefix inference a invalidaci lookupu i opožděné odpovědi,
- správné popisky osoby/pádu zájmena v obou režimech terminologie,
- surface reward pouze pro uzavřený PASS, single-fire a reduced motion,
- pozitivní submit bez obecné morfologické obhajoby a odmítnutí při chybějící povinné valenci/analogii,
- úplnost model selectorů včetně reprezentativní slepé možnosti (`kuře` je minimální regression anchor),
- syntaktické vazby,
- prefix inference,
- reprezentativní surface-valid noun/adjective/verb deklaraci,
- pozitivní `submitReady`,
- skutečný authenticated submit do DB,
- bezpečné odmítnutí surface-invalidního kandidáta,
- žádné JS errors/XSS a základní responzivitu.
- explicitní katalogové ověření úplného kandidáta, invalidaci po key změně včetně opožděné odpovědi a valid submit po not found.

Není povinné proklikávat a deep-validovat každou globálně nedosažitelnou větev. Hotové deep-validator funkce mohou mít samostatné levné unit testy.

## 14. Anti-goals

Konfigurátor nesmí:

- filtrovat normativní modely podle reachability,
- označovat hráči slepé cesty,
- z konkrétního surface nabízet jen modely, které by mohly projít,
- generovat kandidátní slova nebo věty,
- navrhovat alternativní morfologickou/syntaktickou analýzu,
- zaměnit `deep validation not evaluated` za `deep validation passed`,
- mazat fungující dormant validator jen kvůli současnému motivu bez samostatného technického důvodu.
