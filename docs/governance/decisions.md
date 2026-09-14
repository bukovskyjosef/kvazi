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

### Uzavřený a deterministický morfologický model — rozhodnutí v #1

- Soutěžní vzor je uzavřený herní model inspirovaný češtinou, nikoli otevřený odkaz na všechny české dublety, alternace a lexikální výjimky.
- Soutěžní kmen a případné další kmenové podoby se vždy odvozují mechanicky ze základního tvaru a zvoleného modelu; hráč je nevolí ani neobhajuje vlastní analogií.
- U běžných substantivních modelů se kmen tvoří mechanicky z lemmatu: u souhláskových modelů je kmen celé lemma; u modelů na `-a`, `-e`, `-o` a `-í` se příslušná nominativní koncovka odtrhne. Nominativ singuláru je přímo lemma.
- Pokud konkrétní model potřebuje další kmenovou podobu, musí ji sám výslovně a deterministicky definovat včetně buněk, kde se použije.
- Po vydání je normativní autoritou konkrétní zmrazená tabulka Kvazi, nikoli živý stav externí jazykové příručky ani pořadí variant v ní.
- Obecné české hláskové alternace se automaticky nepřenášejí; změna kmene nebo hlásky existuje jen tehdy, pokud ji konkrétní model výslovně a deterministicky definuje.
- **V první zmrazené rules verzi má každá morfologická buňka právě jednu kanonickou realizaci. Morfologické dublety se nepovolují.**
- Další realizaci lze zavést pouze explicitní změnou budoucí verze pravidel.
- Existence jiné spisovné varianty mimo normativní tabulku sama o sobě nezakládá soutěžní přípustnost.
- Reachability není kritériem existence modelu ani varianty; normativně povolené slepé cesty zůstávají součástí pravidel a hráčské nabídky.
- Cílová vlastnost každého produktivního modelu je mechanicky rozhodnutelný vztah `lemma + model + morfologické hodnoty → právě jeden povolený tvar`.

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

### Reachability — aktuální rozhodnutí #4
