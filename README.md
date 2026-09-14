# Nejdelší kvazivěta

Repozitář projektu **Nejdelší kvazivěta**.

## Rychlá orientace

### Pro hráče
- `docs/rules/01-jak-hrat.md`
- `docs/kvazitahak/README.md`

### Pro agenty
- `AGENTS.md` – kanonický vstupní kontrakt
- `docs/00-project-context.md` – smysl a principy projektu
- `docs/README.md` – mapa dokumentace a autority
- GitHub Issues – jediný aktuální backlog

### Pro audit
- `AGENTS.md`
- `docs/audit/README.md`
- GitHub Issues

### Pro vývoj
- `AGENTS.md`
- `docs/architecture/00-boundaries.md`
- `app/README.md`
- GitHub Issues

## Normativní zdroje

Soutěžní platnost určují:
- `docs/rules/02-rozhodcovska-specifikace.md`
- výslovně označené normativní části `docs/kvazitahak/`
- `docs/rules/03-ai-policy.md`
- `docs/rules/04-verzovani-a-sprava.md`

`docs/rules/01-jak-hrat.md` je stručná vysvětlující vrstva.

Architektura, databáze, UI a interní katalog pravidla implementují; samy je nemění.

## Struktura

```text
AGENTS.md
.github/
app/
db/
docs/
  audit/
  rules/
  kvazitahak/
  architecture/
  governance/
  history/
```

## Řízení práce

Finální produktová a pravidlová rozhodnutí provádí Josef Bukovský.

**GitHub Issues jsou jediný aktuální backlog projektu.** README ani jiný Markdown soubor neudržuje seznam otevřených úkolů, jejich stavů nebo priorit.

Detailní governance, labely a issue workflow jsou pouze v `docs/governance/decision-workflow.md`.

## Dokumentační vrstvy pro hráče

1. **Jak hrát** – jednoduchý vstup.
2. **Kvazitahák** – praktické modely a tabulky.
3. **Rozhodcovská specifikace** – úplná normativní pravidla.

## Autorství

Autorem této podoby kvaziproblému, konceptu **Nejdelší kvazivěty** a jejích pravidel je **Josef Bukovský**.
