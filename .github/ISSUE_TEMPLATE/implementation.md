---
name: Implementation task
about: Technický úkol s již uzavřenými produktovými předpoklady
title: "[IMPLEMENTATION] "
labels: "enhancement"
---

## Cíl

## Produktový základ
Odkazy na platná pravidla a související issues:
- 

## Rozsah

## Mimo rozsah

## Závislosti
- 

## Akceptační kritéria
- [ ] 

## Testy
- [ ] 

## Reachability / validační flow
Vyplň, pokud se úkol týká konfigurátoru, validátoru nebo jejich testů:
- [ ] normativně povolené modely/hlavní volby zůstávají v UI úplně nabízené; reachability je nefiltruje
- [ ] surface/motiv short-circuit nastává pouze po konkrétním deterministickém failure, který už sám rozhoduje INVALID
- [ ] surface-valid direct request dál prochází dostatečnou backend kontrolou deklarace
- [ ] hotová funkční deep implementace se nemaže ani hromadně nezakomentovává jen kvůli současné nedosažitelnosti; pokud se nevolá, zůstává jako udržovatelný dormant/reusable kód
- [ ] testy rozlišují aktivní flow od levné dormant regression a nevytvářejí zbytečnou exhaustive dead-path E2E matici
- [ ] nevzniká reachability/candidate solver ani nápověda hráči

Canonical technický kontrakt je `docs/architecture/03-validation.md`; UX projekce je `docs/architecture/05-konfigurator-ux.md`.

## Rizika / otevřené technické otázky

## Gate
Pokud se během implementace objeví nové produktové nebo pravidlové rozhodnutí, nevymýšlej jej v kódu. Založ nebo aktualizuj issue s labelem `question` a spornou část zastav nebo parametrizuj.

Po dokončení zapiš výsledek a relevantní vazby přímo do tohoto issue; nevytvářej paralelní TODO/backlog v dokumentaci.
