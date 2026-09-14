# Nejdelší kvazivěta

Repozitář projektu **Nejdelší kvazivěta**.

## Rychlá orientace

### Pro hráče
- `docs/rules/01-jak-hrat.md`
- `docs/kvazitahak/README.md`

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

## Řízení práce přes GitHub Issues

Finální produktová a pravidlová rozhodnutí provádí Josef Bukovský.

**GitHub Issues jsou jediný aktuální backlog projektu.** README ani jiný Markdown soubor neudržuje ruční seznam otevřených úkolů.

Aktuální práci je nutné získávat přímo z Issues podle stavu a labelů. Každé issue musí mít alespoň jeden smysluplný label.

Základní labely:
- `question` – otevřená pravidlová, produktová, specifikační nebo auditní otázka,
- `enhancement` – plánovaná implementace nebo feature,
- `bug` – chyba vůči přijatému chování,
- `documentation` – pravidla/specifikace/dokumentace,
- `duplicate` – práce absorbovaná do jiného master issue.

Prefixy názvů (`[SPEC]`, `[DECISION]`, `[AUDIT]`, `[IMPLEMENTATION]`, `[FEATURE]`, `[META]`) jsou pouze pomocné pro čitelnost.

Podrobný proces: `docs/governance/decision-workflow.md`.

## Dokumentační vrstvy pro hráče

1. **Jak hrát** – jednoduchý vstup.
2. **Kvazitahák** – praktické modely a tabulky.
3. **Rozhodcovská specifikace** – úplná normativní pravidla.

## Autorství

Autorem této podoby kvaziproblému, konceptu **Nejdelší kvazivěty** a jejích pravidel je **Josef Bukovský**.
