# Nejdelší kvazivěta

Repozitář projektu **Nejdelší kvazivěta** – jazykové soutěže založené na skládání co nejdelší české věty z omezeného systému odvozeného od motivu `KVAZI`.

## Dokumentace

- `docs/00-project-context.md` – smysl projektu a designové principy
- `docs/rules/` – veřejná i rozhodcovská pravidla, AI policy a verzování
- `docs/kvazitahak/` – normativní soutěžní modely a jejich rozpracování
- `docs/architecture/` – návrh webu, databáze, validace, komentářů a administrace
- `docs/governance/decisions.md` – přijatá rozhodnutí
- `docs/governance/open-issues.md` – otevřené body a roadmapa
- `docs/governance/glossary.md` – pojmy
- `docs/history/README.md` – historie vývoje pravidel
- `db/schema-draft.sql` – pracovní PostgreSQL schéma

## Aktuální TODO

Největší otevřené úkoly jsou:

- dokončit normativní kvazitahák,
- navrhnout slovesné časovací typy,
- uzavřít sadu valenčních rámců a vidu,
- provést reachability audit,
- dokončit datový model morfologického formuláře,
- připravit a naplnit interní morfologický katalog.

## Normativní vrstvy

1. **Jak hrát** – stručná veřejná vrstva.
2. **Kvazitahák** – praktická vrstva; normativní jsou jen výslovně označené tabulky a seznamy.
3. **Rozhodcovská specifikace** – úplná pravidla pro platnost, spory, identitu, proces a verzování.

## Autorství

Autorem této podoby kvaziproblému, konceptu **Nejdelší kvazivěty** a jejích pravidel je **Josef Bukovský**.
