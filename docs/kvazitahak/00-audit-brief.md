# Audit brief: Kvazitahák

Tento dokument není pravidlo hry. Je to zadání pro nezávislého auditora.

## Účel
Kvazitahák má běžnému hráči vysvětlit povolené herní mechanismy bez nutnosti studovat odborné jazykové databáze.

Nemá být úplnou mluvnicí ani seznamem hotových soutěžních slov.

## Co má auditor prověřit

1. **Úplnost** – obsahuje tahák vše, co běžný hráč potřebuje pro standardní hru?
2. **Uzavřenost** – jsou povolené seznamy opravdu uzavřené?
3. **Normativnost** – je jasně odlišeno NORMATIVNÍ / vysvětlující / TODO / příklad?
4. **Hratelnost** – je text srozumitelný člověku se školní znalostí češtiny?
5. **Výhoda expertů** – dává znalost neobvyklého jevu mimo tahák soutěžní výhodu?
6. **Příklady** – nevytvářejí příklady zbytečný seznam konkrétních použitelných tahů?
7. **Reachability** – jsou mechanismy v hlavní části skutečně použitelné v aktuálním znakovém systému?
8. **Konzistence** – odpovídají normativní tabulky rozhodcovské specifikaci?
9. **Datová reprezentace** – lze každou normativní volbu přirozeně uložit ve strukturovaném formuláři a DB?

Hraniční nebo málo pravděpodobné mechanismy mají být odděleny v `06-hranicni-pravidla.md`.

## Výstup
Každý samostatný problém založ jako vlastní GitHub Issue s prefixem `[AUDIT]` a uveď:
- závažnost,
- dotčený soubor,
- problém,
- varianty řešení,
- výhody a nevýhody,
- doporučení auditora.

Auditor nesmí bez rozhodnutí Josefa Bukovského měnit normativní obsah kvazitaháku.
