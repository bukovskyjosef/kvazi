# Issue workflow a rozhodování

## Princip

Josef Bukovský je jediný vlastník finálních produktových a pravidlových rozhodnutí.

**GitHub Issues jsou jediný autoritativní backlog projektu.** Dokumentace neudržuje paralelní seznam otevřených bodů, jejich stavů ani priorit.

Agenti mohou:
- hledat problémy,
- připravovat varianty,
- argumentovat,
- navrhovat text změny,
- upozorňovat na závislosti,
- konsolidovat dílčí issues do master issue, pokud se neztratí jejich požadavky.

Agenti nesmějí považovat vlastní doporučení za přijaté rozhodnutí.

## Povinná evidence v GitHub Issues

Každá samostatná práce, která má přežít aktuální chat nebo pracovní session, musí mít issue. To platí pro:
- otevřenou pravidlovou/specifikační otázku,
- produktové rozhodnutí,
- auditní nález,
- implementační úkol nebo feature,
- bug,
- bezpečnostní/provozní práci,
- významný procesní/meta úkol.

Dokument může obsahovat `TODO` jako lokální poznámku, ale pokud TODO představuje samostatně plánovanou práci nebo blokuje další vývoj, musí existovat odpovídající issue.

## Labely

Každé issue musí mít alespoň jeden smysluplný label.

### `question`
Použij pro otevřenou pravidlovou, produktovou nebo specifikační otázku a pro auditní nález, který ještě vyžaduje rozhodnutí/dispozici.

### `enhancement`
Použij pro plánovanou implementaci, feature, technické rozšíření nebo master implementační úkol.

### `bug`
Použij pro rozpor implementace, dat nebo konfigurace s již přijatým chováním.

### `documentation`
Použij, pokud je hlavním výstupem změna pravidel, specifikace nebo dokumentace. Často se kombinuje s `question` u otevřených SPEC témat.

### `duplicate`
Použij, pokud je issue absorbované do jiného master issue. Před uzavřením musí být jeho relevantní požadavky, akceptační kritéria nebo rozhodnutí skutečně přeneseny do cílového issue.

Další labely lze přidat, pokud projekt později potřebuje jemnější třídění. Issue bez labelu je považované za governance chybu.

## Prefixy názvů

Prefixy jsou pouze sekundární pomůcka pro čitelnost:
- `[SPEC]` – otevřená specifikační práce,
- `[DECISION]` – explicitní produktová/pravidlová volba,
- `[AUDIT]` – nezávislý nález,
- `[IMPLEMENTATION]` – technická realizace,
- `[FEATURE]` – uživatelská funkce,
- `[META]` – proces/repozitář/release workflow.

Prefix nenahrazuje label a sám neurčuje stav práce.

## Minimální obsah issue

Issue má podle typu obsahovat přiměřeně:
- kontext a problém/cíl,
- dotčené artefakty,
- dopad,
- závislosti na jiných issues,
- varianty a jejich výhody/nevýhody, pokud je potřeba rozhodnutí,
- doporučení agenta/auditora, pokud relevantní,
- akceptační kritéria pro implementační práci,
- finální rozhodnutí nebo důvod uzavření.

## Životní cyklus

1. **Problem/work discovered**
2. **Existující issue nalezeno nebo nové issue otevřeno**
3. **Labely a závislosti doplněny**
4. **Varianty / plán připraveny**
5. **Diskuse**
6. **Josef rozhodne**, pokud je třeba produktová/pravidlová volba
7. **Výsledek zapsán do issue**
8. **Dotčené artefakty aktualizovány**
9. **Konzistence a akceptační kritéria zkontrolovány**
10. **Issue zavřeno se správným důvodem**

Issue se nemá zavřít už v okamžiku rozhodnutí. Zavře se až po konzistentním zapracování nebo po explicitním rozhodnutí, že se práce nebude realizovat.

## Rozhodnutí vzniklé mimo GitHub

Přijaté rozhodnutí může vzniknout:
- přímo v GitHub issue,
- v chatu s agentem,
- jiným explicitním způsobem.

Pokud vznikne mimo GitHub, agent musí do příslušného issue zapsat stručný a úplný výsledek tak, aby další agent nepotřeboval původní chatový kontext.

Výsledné pravidlo se následně promítne do normativního source of truth. GitHub issue uchovává historii problému a rozhodnutí; normativní dokument uchovává aktuálně platné pravidlo.

## Dokumentace nesmí být backlog

Dokumentace smí:
- popisovat stabilní pravidla, architekturu a proces,
- odkazovat na konkrétní issue jako na závislost nebo historii,
- obsahovat historické shrnutí.

Dokumentace nesmí:
- vést ručně aktualizovaný seznam otevřených issues,
- duplikovat jejich `open/closed` stav,
- používat vlastní priority/stavy paralelně ke GitHub Issues,
- nahrazovat issue textovým TODO seznamem.

Při potřebě zjistit aktuální práci se vždy dotazuje GitHub Issues.

## Konsolidace a master issues

Pokud audit nebo vývoj vytvoří mnoho úzce souvisejících dílčích issues, je vhodné je konsolidovat:

1. vyber nebo založ master issue,
2. přenes do něj všechny stále relevantní požadavky a akceptační kritéria,
3. v původním issue zanech vazbu na master,
4. původní issue označ `duplicate` a zavři,
5. master issue zůstává otevřené do skutečného dokončení celé oblasti.

Konsolidace nesmí sloužit k tichému zahození nálezu.

## Konflikty mezi artefakty

Při nalezení rozporu:
1. zjisti, zda existuje issue nebo explicitní přijaté rozhodnutí,
2. pokud je výsledek rozhodnutý, oprav odvozený artefakt,
3. pokud rozhodnutý není, založ nebo aktualizuj issue,
4. nevytvářej vlastní produktové pravidlo jen kvůli konzistenci implementace.

## Zachování funkční dormant implementace

Pokud přijaté rozhodnutí pouze mění, **zda se určitá hotová technická větev aktivně volá**, ale její funkční implementace může být užitečná pro budoucí variantu pravidel nebo konfigurace, výchozí postup je:

- nemaž ji pouze proto, že je nyní nedosažitelná,
- nearchivuj ji jako velký zakomentovaný blok,
- ponech ji normálně udržovatelnou a syntakticky kontrolovatelnou,
- odpoj pouze aktivní wiring/call site, který už není potřeba,
- zachovej levné regresní testy, pokud dávají smysl proti zahnívání,
- drahé integrační testy vyžaduj podle aktivního runtime rizika, ne podle pouhé existence dormant kódu.

Toto je obecný implementační princip. Nesmí být použit k obcházení pravidel, k tichému ponechání bezpečnostní chyby ani k odporu proti issue, které odstranění kódu výslovně požaduje z jiného důvodu.

## Definice hotového issue

Issue je hotové, když podle svého typu:
- má jasný výsledek,
- jsou splněna akceptační kritéria,
- jsou aktualizovány dotčené normativní/technické artefakty,
- nejsou známy neřešené rozpory,
- případné navazující práce mají vlastní issues,
- je jasný důvod uzavření (`completed`, `not planned`, `duplicate`).

## Vývojový gate

Do implementace funkcionality závislé na otevřeném `question`/SPEC issue se nemá jít, pokud nelze bezpečně vytvořit technický základ bez předjímání výsledku.

Obecný příklad:
- lze připravit neutrální technickou infrastrukturu, která umí pojmout více možných výsledků budoucího rozhodnutí,
- nelze natvrdo implementovat jednu konkrétní variantu, pokud by tím implementace předjímala dosud nepřijaté produktové nebo pravidlové rozhodnutí.

Příklady v tomto governance dokumentu mají být **stavově nezávislé**. Nemají používat konkrétní aktuální nebo již uzavřené issue, pravidlový mechanismus či produktovou variantu jako obecný vzor, pokud by změnou jejich stavu mohl příklad zastarat nebo působit jako živé rozhodnutí. Konkrétní historii rozhodování zachycují GitHub Issues a případně `docs/governance/decisions.md`, nikoli obecný workflow.

## Praktické GitHub filtry

Aktuální backlog se získává například přes:
- `is:issue is:open` – vše otevřené,
- `is:issue is:open label:question` – otevřené otázky/specifikace,
- `is:issue is:open label:enhancement` – plánovaná implementace/features,
- `is:issue is:open label:bug` – chyby,
- `is:issue is:open label:documentation` – otevřená dokumentační/specifikační práce,
- `is:issue no:label` – governance chyba, kterou je třeba opravit.
