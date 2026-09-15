# Instrukce pro nezávislý audit

Tento adresář definuje způsob, jakým má nezávislý auditor posoudit repozitář.

## Datované auditní zprávy jsou historické snapshoty

Každá datovaná auditní zpráva uložená v tomto adresáři je **historický, nenormativní snapshot stavu k datu uvedenému v názvu nebo záhlaví zprávy**.

Taková zpráva:

- zachycuje tehdejší stav repozitáře, tehdejší otevřené otázky, nálezy, priority, gates a celkový verdikt,
- **není zdrojem aktuálního backlogu, aktuálního stavu issues ani současného celkového verdiktu projektu**,
- nesmí přebít aktuální normativní balík, současnou architekturu ani pozdější rozhodnutí,
- má svůj historický obsah zachovat; po změně projektu se nepřepisuje tak, aby předstírala dnešní stav.

Aktuální stav práce se vždy ověřuje přímo v **GitHub Issues**. Aktuální soutěžní pravidla se vždy ověřují v současném **normativním balíku podle `docs/README.md`**.

**Každá budoucí datovaná auditní zpráva musí mít bezprostředně na začátku výrazný historical/superseded snapshot banner**, který toto omezení výslovně připomíná ještě před samotným historickým obsahem zprávy.

## Cíl auditu

Audit nemá potvrdit záměr autora. Má aktivně hledat:
- vnitřní rozpory,
- nedořečené nebo skryté podmínky,
- exploity,
- nečekané kombinace pravidel,
- přílišnou expert advantage,
- rozdíl mezi tím, co říkají pravidla, a tím, co předpokládá architektura nebo DB,
- místa, kde by implementace mohla nechtěně vytvořit nové soutěžní pravidlo,
- místa, která jsou pro běžného hráče zbytečně složitá.

## Povinně auditované oblasti

### A. Herní a jazyková specifikace
- `docs/rules/01-jak-hrat.md`
- `docs/rules/02-rozhodcovska-specifikace.md`
- `docs/rules/03-ai-policy.md`
- `docs/rules/04-verzovani-a-sprava.md`

### B. Kvazitahák jako samostatný artefakt
Audituj `docs/kvazitahak/` nejen jako přílohu, ale jako produkt pro hráče.

Posuď zejména:
- zda je normativní vs. vysvětlující obsah jasně oddělen,
- zda hráči stačí pro běžnou hru,
- zda nevytváří nové pravidlo mimo rozhodcovskou specifikaci,
- zda neprozrazuje příliš mnoho kandidátních tahů,
- zda uzavřené seznamy skutečně eliminují expert advantage,
- zda jsou TODO správně označené a nic z nich není omylem používáno jako hotové pravidlo.

### C. Governance
- decision ownership,
- issue workflow a labely,
- verzování a revalidace,
- interní katalog,
- oddělení platnosti a implementace.

### D. Architektura a DB
Audituj:
- `docs/architecture/`
- `db/schema-draft.sql`
- `docker-compose.yml`
- `docker/db/init/`

Při DB/runtime auditu vždy rozlišuj návrhový `db/schema-draft.sql` od executable bootstrap/runtime schema-init vrstvy v `docker/db/init/`, kterou připojuje `docker-compose.yml`.

Hledej:
- chybnou kardinalitu,
- redundanci,
- nekonzistentní versioning,
- chybějící historii,
- nemožnost revalidace,
- konflikt mezi catalog truth a user-declared analysis,
- možnosti race condition,
- privacy/security problémy,
- místa, kde DB constraint může nechtěně přebít pravidla.

### E. Budoucí implementace
Posuď, zda dokumentace dostatečně odděluje:
- normativní pravidla,
- technickou specifikaci,
- implementační detail,
- provozní data,
- interní morfologickou znalost.

## Forma výstupu

**Každý samostatný akční nález musí existovat jako GitHub Issue. GitHub Issues jsou jediný auditní backlog.**

Nové auditní issue:
- použije prefix `[AUDIT]` pro čitelnost,
- dostane alespoň jeden smysluplný label; výchozí template používá `question`,
- pokud jde o čistý implementační defect vůči již rozhodnutému chování, použij `bug`,
- pokud je hlavním výstupem změna dokumentace/specifikace, lze přidat `documentation`,
- nesmí zůstat bez labelu.

Doporučená struktura issue:

```markdown
## Závažnost
critical / high / medium / low / editorial

## Dotčené artefakty
- cesta/soubor

## Nález
Konkrétní problém.

## Dopad
Dopad na hratelnost, férovost, konzistenci, implementaci nebo bezpečnost.

## Varianta A
Výhody / nevýhody.

## Varianta B
Výhody / nevýhody.

## Doporučení auditora
Preferovaná varianta a argumentace.

## Závislosti
Související issues a artefakty.
```

Není nutné uměle vytvářet tři varianty, pokud jsou rozumné jen jedna či dvě.

## Konsolidace nálezů

Audit nemá udržovat desítky dílčích issues, pokud popisují jednu implementační oblast.

Pokud se nález překrývá s existujícím master issue:
1. přenes do master issue relevantní požadavek a akceptační kritérium,
2. zanech vazbu mezi issues,
3. původní issue označ `duplicate` a zavři.

Nikdy nezavírej nález jen proto, aby byl backlog menší; jeho podstata musí být nejprve zachycena jinde.

## Co auditor nesmí udělat

- Neměň normativní soubory jen proto, že doporučuješ jiné řešení.
- Neuzavírej produktovou/pravidlovou otázku bez rozhodnutí Josefa.
- Neinterpretuj TODO jako rozhodnutí.
- Nedoplňuj chybějící produktové rozhodnutí vlastním předpokladem.
- Nevytvářej implementaci jako náhradu za neuzavřenou specifikaci.
- Nevytvářej textový soubor sloužící jako paralelní backlog auditních nálezů.

## Co je žádoucí

Auditor může:
- přidat auditní zprávu nebo metodickou poznámku do `docs/audit/`, pokud nejde o backlog,
- zakládat a komentovat GitHub Issues,
- navrhovat zjednodušení,
- navrhovat spojení nebo rozdělení issues,
- upozornit, že existující issue je špatně položené nebo špatně označené.

## Hlavní red-team otázka

> Dokáže znalost nějakého neobvyklého lingvistického, technického nebo databázového detailu dát hráči nebo implementaci možnost, kterou základní hráč z dokumentace nemohl rozumně předvídat?

Pokud ano, je to kandidát na auditní nález a má být zachycen v GitHub Issue.
