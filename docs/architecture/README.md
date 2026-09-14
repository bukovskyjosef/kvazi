# Architektura – index

Tato složka obsahuje technický návrh. **Není zdrojem soutěžních pravidel.**

## Pořadí čtení pro vývojáře

1. `00-boundaries.md` – co smí a nesmí implementace rozhodovat
2. `01-system-architecture.md` – systémové vrstvy a veřejné stránky
3. `02-database-model.md` – logický datový model
4. `03-validation.md` – deterministická validace a její hranice
5. `04-comments-auth-admin.md` – magic link, komentáře a administrace
6. `/db/schema-draft.sql` – pracovní SQL návrh

## Status

Architektura je stále návrh a musí projít nezávislým auditem před implementací MVP.

Související issues:
- #5 morfologický formulář
- #6 interní katalog
- #7 znakový validátor
- #8 architektura a DB model
- #10 scope MVP
- #11 kompletní audit

## Zásada

Když technický návrh narazí na nedořešené pravidlo, správný výstup není „zvolit rozumný default“, ale otevřít nebo odkázat `[DECISION]` issue.
