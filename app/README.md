# Aplikační část – rezervovaný prostor

Tento adresář je vyhrazen pro budoucí implementaci webové aplikace.

## Před zahájením vývoje

Vývojový agent musí přečíst:
- `/AGENTS.md`
- `/docs/architecture/00-boundaries.md`
- `/docs/architecture/01-system-architecture.md`
- `/docs/architecture/02-database-model.md`
- `/docs/architecture/03-validation.md`
- relevantní normativní pravidla v `/docs/rules/`
- relevantní otevřená GitHub Issues.

## Zásada

Kód nevyplňuje mezery v pravidlech vlastním odhadem.

Pokud chybí produktové rozhodnutí:
1. vytvořit nebo odkázat `[DECISION]` issue,
2. navrhnout technické varianty,
3. počkat na rozhodnutí Josefa Bukovského pro spornou funkcionalitu.

## Předběžně zvolený stack

- PHP 8.x
- PostgreSQL
- HTML5
- CSS
- vanilla JavaScript

Framework není zatím normativně vybrán; preferovaným principem je KISS.

## Co sem nepatří

- pravidla hry,
- normativní tabulky kvazitaháku,
- rozhodovací historie,
- interní auditní zprávy.

Ty patří do `/docs/` a GitHub Issues.
