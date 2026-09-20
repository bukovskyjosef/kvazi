# Shrnutí

## Typ změny
- [ ] pravidla / normativní dokumentace
- [ ] kvazitahák
- [ ] architektura / databáze
- [ ] implementace
- [ ] audit / governance
- [ ] redakční změna bez změny významu

## Související GitHub Issue

Každá netriviální změna musí vycházet z issue. Uveď např. `Closes #123` nebo `Relates to #123`.

- Issue: #
- [ ] issue má správné labely
- [ ] PR neřeší skrytou práci mimo scope issue

## Rozhodnutí
Pokud změna obsahuje produktové nebo pravidlové rozhodnutí:
- [ ] explicitní výsledek rozhodnutí je zachycen v příslušném issue
- [ ] rozhodnutí provedl Josef Bukovský

## Dopad na normativní chování
- [ ] žádný
- [ ] mění soutěžní pravidla a vyžaduje nový rules release
- [ ] mění pouze implementaci existujícího pravidla

## Kontrola konzistence
- [ ] `Jak hrát` odpovídá normativním pravidlům
- [ ] kvazitahák odpovídá rozhodcovské specifikaci
- [ ] architektura/DB nepřidává skryté soutěžní pravidlo
- [ ] související issue obsahuje aktuální výsledek, závislosti a případnou navazující práci
- [ ] nevznikl paralelní Markdown backlog nebo ruční seznam otevřených bodů
- [ ] TODO nebylo omylem proměněno v implicitní rozhodnutí

## Reachability a validační flow
Pokud změna sahá do konfigurátoru, validátoru nebo testovací matice:
- [ ] normativně povolené modely/hlavní volby zůstávají v UI nabízené bez reachability filtru
- [ ] UI hráči neprozrazuje slepé cesty ani nefiltruje analýzu podle konkrétního surface kandidáta
- [ ] short-circuit nastává pouze po dřívějším deterministickém failure, který už sám stačí k INVALID verdiktu
- [ ] surface-valid direct request stále prochází dostatečnou serverovou kontrolou deklarace
- [ ] funkční deep-validace dnes nedosažitelné větve nebyla bez samostatného důvodu smazána; je-li odpojena, zůstává udržovatelná jako dormant/reusable kód
- [ ] povinné integrační testy pokrývají aktivní flow a server authority, nikoli uměle exhaustive dead-path matici

## Testy / ověření

- [ ] změny byly před pushem commitnuté a pracovní strom byl čistý
- [ ] `bash app/tests/pre-push.sh` prošel PASS pro exact commit určený k pushi
- Pre-push base: `<origin/main | origin/develop | jiný explicitní target>`
- Pre-push risk class: `<low | full>`
- Pre-push exact HEAD SHA: `<exact SHA>`
- Pre-push evidence / finální marker:
- [ ] finální diff a scope byly zkontrolovány
- [ ] pokud diff mění verdict code, byl explicitně vyhodnocen rules-release invariant
- [ ] pokud diff mění env/runtime kontrakt, jsou sladěné runtime / Compose / CI / fixtures / docs podle dopadu
- [ ] všechny změny určené k review jsou pushnuté
- Review target HEAD SHA: `<exact SHA>`
- Required GitHub PR gate: [ ] PASS  [ ] pending

## Poznámky pro review
