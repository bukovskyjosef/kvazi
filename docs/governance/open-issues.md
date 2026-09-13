# Otevřené body a úkoly

Tento dokument je stručný index. Autoritativní diskuse a stav jednotlivých otevřených bodů jsou v GitHub Issues.

Finální produktová a pravidlová rozhodnutí provádí Josef Bukovský.

## P0 – pravidla a kvazitahák

- **#1** `[DECISION] Dokončit normativní kvazitahák`
- **#2** `[DECISION] Navrhnout uzavřené slovesné časovací typy`
- **#3** `[DECISION] Uzavřít soutěžní sadu valenčních rámců a vidu`
- **#4** `[DECISION] Provést reachability audit a rozdělit hlavní vs. hraniční pravidla`

Výstup reachability auditu má rozlišit:
- reálně použitelné mechanismy pro hlavní tahák,
- hraniční nebo málo pravděpodobné mechanismy pro závazný dodatek,
- prokazatelně nedosažitelné větve, které nemají zatěžovat veřejnou vrstvu.

## P1 – formulář a interní morfologická znalost

- **#5** `[DECISION] Navrhnout úplný morfologický formulář a soutěžní identitu`
- **#6** `[DECISION] Navrhnout interní morfologický katalog a námitkový proces`

Veřejný kompletní katalog slov se nezveřejňuje. Interní katalog může sloužit deterministické validaci, ale je podřízen pravidlům a musí být opravitelný přes námitkový proces.

## P2 – validace, architektura a DB

- **#7** `[DECISION] Uzavřít deterministický znakový validátor a jeho testovací model`
- **#8** `[DECISION] Uzavřít architekturu a databázový model před implementací MVP`

Pracovní SQL návrh je v `db/schema-draft.sql` a zatím není produkční migrační historií.

## P3 – release a implementace

- **#9** `[DECISION] Připravit release proces pravidel, dokumentace a implementace`
- **#10** `[DECISION] Definovat implementační scope MVP po auditu`

Vývoj nemá předjímat výsledky otevřených decision issues.

## Nezávislý audit

- **#11** `[AUDIT] Kompletní nezávislý audit repozitáře`

Auditor má načíst:
- `AGENTS.md`
- `docs/audit/README.md`
- celý normativní balík,
- kvazitahák,
- governance,
- architekturu,
- DB model.

Každý samostatný nový nález má dostat vlastní `[AUDIT]` issue.

## Další redakční a launch úkoly

Tyto úkoly zatím nemusí mít vlastní decision issue, dokud se neobjeví sporná volba:
- po dokončení kvazitaháku zjednodušit veřejné `Jak hrát` pro pochopení během několika minut,
- připravit didaktické příklady bez vytvoření katalogu kandidátních tahů,
- připravit veřejnou prezentaci kvaziceny a kvazizasedání,
- doplnit produkční DB migrace až po uzavření relevantních rozhodnutí.
