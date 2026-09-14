# Politika použití nástrojů a AI

> **Status:** normativní pravidlo soutěžního procesu pro soutěžící a oddělená pravidla pro správce projektu.

## 1. Zásada lidského řešení

Soutěžní řešení vytváří člověk vlastní hlavou.

Přípustnost nástroje se neposuzuje podle jeho názvu, použité technologie ani podle toho, zda využívá AI. Rozhoduje, **co nástroj při řešení dělá**.

Nástroj smí pomáhat s pasivním studiem dovolených zdrojů a s mechanickým ověřením konkrétního lidského nápadu. Nesmí za soutěžícího hledat, vytvářet, doplňovat ani zlepšovat soutěžní kandidáty.

## 2. Povolené použití nástrojů

Soutěžící smí zejména:

- ručně číst dovolené veřejné slovníky, příručky, knihy a odborné texty,
- ručně v dovoleném zdroji vyhledat konkrétní, člověkem předem zvolené slovo nebo obecný jazykový jev,
- zapisovat, řadit a formátovat vlastní poznámky,
- použít kalkulačku nebo jinou mechanickou pomůcku k počítání,
- ověřit jeden konkrétní, člověkem vytvořený kandidát proti výslovnému pravidlu,
- použít soutěžní aplikaci k deterministické kontrole zadaného kandidáta v rozsahu, který aplikace výslovně nabízí.

Ověřovací nástroj smí sdělit, zda zadaný kandidát splňuje kontrolovanou podmínku, a označit konkrétní porušení. Nesmí navrhnout náhradní slovo, tvar, rozdělení, analýzu ani jiné řešení.

Opakované nebo dávkové ověřování systematicky vytvářené řady variant za účelem nalezení řešení se nepovažuje za ověřování konkrétního lidského nápadu, ale za zakázané automatické hledání.

## 3. Zakázané automatické řešení

Bez ohledu na použitou technologii je zakázáno nechat nástroj:

- generovat nebo doplňovat kandidátní slova, tvary, věty či analýzy,
- enumerovat možné kandidáty nebo jejich kombinace,
- automaticky navrhovat hranice slov, motivů, syntaktické vazby nebo soutěžní identity,
- hromadně filtrovat, prohledávat, stahovat nebo zpracovávat slovníky či jiné jazykové zdroje podle omezení kvaziproblému,
- kandidáty řadit, skórovat, porovnávat nebo optimalizovat,
- automaticky skládat části řešení,
- dávkově či iterativně testovat kandidáty s cílem objevit platné řešení,
- vytěžovat neveřejný katalog nebo validátor jako vyhledávací oracle.

Zakázané je zejména použití generátoru, brute-force programu, crawleru, vlastního skriptu, tabulkového makra, SAT/constraint solveru nebo jiného automatického postupu k činnostem uvedeným výše.

## 4. Zvláštní pravidlo pro AI

AI smí soutěžícímu vysvětlovat pouze **obecná pravidla současné spisovné češtiny**, pokud jí soutěžící neposkytne žádný obsah ani omezení kvaziproblému a nežádá aplikaci odpovědi na soutěžní případ.

Přípustnost obecného dotazu se posuzuje podle jeho předaného obsahu a kontextu, nikoli podle nepozorovatelného vnitřního důvodu, proč se soutěžící ptá.

Příklady obecně přípustných dotazů:

- Co je lemma?
- Co je valence slovesa?
- Co je doplněk?
- Jaký je rozdíl mezi pádem a skloňovacím vzorem?
- Co je shodný přívlastek?

AI nesmí být použita ke komunikaci o jakémkoli obsahu přímo souvisejícím s kvaziproblémem nebo soutěží.

Zakázáno je zejména předkládat AI nebo s ní konzultovat:

- pravidla kvaziproblému,
- kvazitahák,
- soutěžní návody,
- existující, připravované nebo hypotetické kvazivěty,
- kandidátní slova a tvary,
- soutěžní identity,
- soutěžní abecedu nebo motivy,
- soutěžní omezení,
- databáze, katalogy, validační data nebo výsledky,
- morfologické či syntaktické analýzy soutěžních případů,
- strategie,
- hledání kandidátů,
- optimalizaci,
- posouzení platnosti nebo opravu řešení.

Zákaz platí i tehdy, pokud soutěžící neukáže celou větu a snaží se získat soutěžně specifickou informaci nepřímo.

> **AI smí soutěžícímu vysvětlovat češtinu bez kvazikontextu. Nesmí s ním komunikovat o kvaziproblému.**

## 5. Soutěžní aplikace a validátor

Deterministický validátor soutěžní aplikace je povolenou ověřovací pomůckou. Smí kontrolovat pouze zadaný kandidát v rozsahu své zveřejněné funkce.

Validátor nesmí:

- generovat nebo doporučovat alternativy,
- měnit hráčovo rozdělení na slova,
- automaticky hledat lepší řešení,
- poskytovat rozhraní určené k dávkovému testování kandidátů,
- vytvářet skryté soutěžní pravidlo nad rámec normativního balíku.

Přesný rozsah kontrol a okamžik případné katalogové kontroly stanoví technická specifikace a příslušná verze pravidel.

## 6. Vývoj a správa projektu

Zákazy pro soutěžící se nevztahují na:

- návrh a audit pravidel,
- vývoj webu a aplikace,
- návrh databáze,
- správu projektu,
- obecnou analýzu herního systému,
- testování validátoru,
- přípravu kandidátních dat interního morfologického katalogu.

Takto vytvořený obsah se nesmí vydávat za lidské soutěžní řešení.

AI ani jiný automatický proces nesmí učinit svá data normativní soutěžní pravdou. Pokud připraví kandidátní data interního katalogu, musí před jejich přijetím do schválené části katalogu proběhnout požadovaná kontrola a explicitní schválení.

## 7. Porušení

Použití nástroje nebo AI v rozporu s těmito pravidly je porušením soutěžního procesu a může vést k vyřazení podání i tehdy, pokud by samotná věta byla jinak jazykově platná.
