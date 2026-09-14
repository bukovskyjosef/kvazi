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
7. **Slepé cesty** – nefiltruje nebo neoznačuje tahák normativně povolené modely podle jejich reachability? Známá nedosažitelnost nemá být hráči předem prozrazena jen proto, že ji auditor zjistil.
8. **Konzistence** – odpovídají normativní tabulky rozhodcovské specifikaci?
9. **Datová reprezentace** – lze každou normativní volbu přirozeně uložit ve strukturovaném formuláři a DB?

Interní reachability analýza je užitečný auditní nástroj pro pochopení herního prostoru a odhalování důsledků pravidel. **Není však kritériem pro odstranění, skrytí ani přesun normativně povoleného modelu.**

Hraniční nebo výjimečné mechanismy mohou být odděleny v `06-hranicni-pravidla.md` podle složitosti a struktury pravidla, nikoli podle toho, zda auditor našel použitelný soutěžní tvar.

## Výstup
Každý samostatný problém založ jako vlastní GitHub Issue s prefixem `[AUDIT]` a uveď:
- závažnost,
- dotčený soubor,
- problém,
- varianty řešení,
- výhody a nevýhody,
- doporučení auditora.

Auditor nesmí bez rozhodnutí Josefa Bukovského měnit normativní obsah kvazitaháku.
