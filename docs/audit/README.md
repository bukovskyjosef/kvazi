# Instrukce pro nezávislý audit

Tento adresář definuje způsob, jakým má nezávislý auditor posoudit repozitář.

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
- verzování,
- revalidace,
- interní katalog,
- proces námitek,
- oddělení platnosti a implementace.

### D. Architektura a DB
Audituj:
- `docs/architecture/`
- `db/schema-draft.sql`

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

Každý samostatný nález založ jako vlastní GitHub Issue s prefixem `[AUDIT]`.

Doporučená struktura issue:

```markdown
# Shrnutí

## Závažnost
critical / high / medium / low / editorial

## Dotčené artefakty
- cesta/soubor

## Nález
Konkrétní problém.

## Proč je to problém
Dopad na hratelnost, férovost, konzistenci, implementaci nebo bezpečnost.

## Varianta A
Výhody / nevýhody.

## Varianta B
Výhody / nevýhody.

## Varianta C
Výhody / nevýhody.

## Doporučení auditora
Jedna preferovaná varianta a argumentace.

## Závislosti
Která otevřená decision issues nebo jiné artefakty nález ovlivňuje.
```

Není nutné uměle vytvářet tři varianty, pokud jsou rozumné jen jedna či dvě.

## Co auditor nesmí udělat

- Neměň normativní soubory jen proto, že doporučuješ jiné řešení.
- Nezavírej `[DECISION]` issues.
- Neinterpretuj TODO jako rozhodnutí.
- Nedoplňuj chybějící produktové rozhodnutí vlastním předpokladem.
- Nevytvářej implementaci jako náhradu za neuzavřenou specifikaci.

## Co je žádoucí

Auditor může:
- přidat auditní poznámky do `docs/audit/`,
- založit nové `[AUDIT]` issues,
- komentovat existující decision issues,
- navrhovat zjednodušení,
- navrhovat spojení nebo rozdělení artefaktů,
- upozornit, že některé současné decision issue je špatně položené.

## Hlavní red-team otázka

> Dokáže znalost nějakého neobvyklého lingvistického, technického nebo databázového detailu dát hráči nebo implementaci možnost, kterou základní hráč z dokumentace nemohl rozumně předvídat?

Pokud ano, je to kandidát na auditní nález.
