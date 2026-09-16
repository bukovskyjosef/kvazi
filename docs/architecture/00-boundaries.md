# Hranice mezi pravidly, daty a implementací

Tento dokument určuje technické hranice projektu. Není pravidlem hry.

## Normativní vrstva

Soutěžní platnost určují normativní pravidla a výslovně normativní části kvazitaháku. Implementace jejich význam nemění.

## Vysvětlující vrstva

`Jak hrát`, příklady a vysvětlivky pomáhají s pochopením, ale samy nevytvářejí nové pravidlo.

## Technická vrstva

Architektura, formuláře, API, databáze, validátory, autentizace a admin workflow reprezentují přijatá rozhodnutí. Neuzavírají samy otevřenou produktovou nebo jazykovou otázku.

## Reachability není technický filtr nabídky

Technická implementace musí zachovat rozdíl mezi **nabídkou normativního herního prostoru** a **hloubkou validačního výpočtu**.

- všechny normativně povolené modely a hlavní varianty zůstávají v konfigurátoru dostupné,
- reachability nesmí model z roletky skrýt ani hráči označit jako slepý,
- obecná surface/motiv validace může být časný rozhodující gate,
- po definitivním surface failure není nutné spouštět deep-validaci, která už nemůže změnit konečný verdikt,
- již existující funkční deep-validace takové větve se kvůli současné nedosažitelnosti přednostně zachová jako dormant kód odpojený od aktivního flow,
- dormant kód není komentovaný archiv; má zůstat syntakticky a strukturálně udržovatelný pro možné budoucí znovuzapojení,
- surface-valid request musí dál projít dostatečnou serverovou kontrolou a nesmí získat platnost podstrčením modelu nebo jiné klientské deklarace.

Tento princip je implementační optimalizace, nikoli změna pravidel ani reachability solver.

## Interní katalog

Interní katalog je provozní znalostní báze podřízená pravidlům. Rozpor katalogu s pravidly je chyba katalogu.

## Uživatelská deklarace

Odevzdaná analýza je tvrzení soutěžícího. Sama nevytváří autoritativní jazykovou pravdu ani nerozšiřuje katalog.

## Odvozená data

Počty, normalizovaný text, validační výsledky a žebříčky musí být reprodukovatelné ze zdrojových dat a příslušné provenance pravidel a validátoru.

## Vývojový gate

Implementovat lze již rozhodnuté chování nebo technický základ, který skutečně nepředjímá otevřenou otázku. Nevyřešená produktová otázka se řeší podle `/docs/governance/decision-workflow.md` a v GitHub Issues.

`/db/schema-draft.sql` je pracovní návrh, nikoli produkční migrační historie.
