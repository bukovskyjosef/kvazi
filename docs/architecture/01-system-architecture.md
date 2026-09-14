# Systémová architektura aplikace

> **Status:** návrh. Technická implementace nesmí měnit jazykovou platnost pravidel.

## Technologie

### Frontend
- HTML5
- CSS
- vanilla JavaScript

### Backend
- PHP 8.x
- PostgreSQL
- PDO
- server-rendered HTML
- malé JSON endpointy pro dynamický formulář

Preferovaný princip: **Keep It Simple**.

## Logické vrstvy

1. **Veřejný obsah** – pravidla, kvazitahák, seznam vět, detail věty, komentáře.
2. **Soutěžní podání** – věta po slovech, strukturovaná morfologie, syntax, zdroje a obhajoba.
3. **Mechanický validátor** – živá deterministická kontrola veřejných znakových a strukturálních pravidel; neveřejná katalogová kontrola až po uzamčení podání.
4. **Morfologický katalog** – neveřejná interní znalostní báze pro budoucí deterministickou morfologickou validaci.
5. **Administrace** – schvalování, revize, moderace, správa katalogu.

## Veřejné stránky

### `/`
- stručná pravidla,
- aktuální rekord,
- poslední schválené věty,
- vstup k podání.

### `/pravidla`
- Jak hrát,
- úplná specifikace,
- verze.

### `/kvazitahak`
- normativní tabulky,
- vysvětlující příklady.

### `/vety`
- schválené,
- historické schválené věty,
- filtrování podle verze.

### `/veta/{slug}`

Veřejně je dostupný pouze detail schválené věty. Admin může v neveřejném rozhraní otevřít také čekající podání.

Zobrazí:
- text věty,
- skóre,
- stav,
- verzi pravidel,
- datum,
- analýzu každého slova,
- soutěžní identitu,
- morfologii,
- syntaxi,
- obhajobu a zdroje,
- fiktivní význam / kvazietymologii,
- komentáře.

## Formulář podání

Kvazivěta se **nezadává jako jeden volný text**.

Formulář pracuje s jednotlivými slovy:
- každé slovo je samostatný řetězec,
- má pevné pořadí,
- uživatel nevkládá mezery,
- UI dovolí jen povolené soutěžní znaky,
- backend provede vlastní whitelist kontrolu a Unicode NFC normalizaci.

Mezery ve výsledném zobrazení generuje aplikace sama.

Po zadání slov následuje povinná strukturovaná analýza slovo po slově. U každého tokenu formulář vyžaduje:

- slovní druh,
- úplnou morfologickou identifikaci požadovanou aktuální verzí pravidel pro daný slovní druh a soutěžní model,
- soutěžní identitu a konkrétní použitý tvar,
- větnou funkci,
- jeden nebo více strukturovaných vztahů ke konkrétním dalším tokenům, pokud je zvolená konstrukce vyžaduje,
- obhajobu a zdroje v rozsahu požadovaném pravidly.

Podle zvoleného slovního druhu a modelu se zobrazí odpovídající povinná pole. Údaje, které pravidla vyžadují strukturovaně, nelze nahradit jediným obecným textovým polem.

Během editace formulář živě kontroluje veřejná formální a strukturální pravidla: znaky a motivy, úplnost povinných polí, příslušnost zvolených hodnot k veřejným seznamům aktuální verze a existenci požadovaných odkazů na tokeny v témže návrhu.

Před konečným odesláním formulář nekontroluje členství slova nebo analýzy v interním katalogu a nesděluje katalogový výsledek. Živá strukturální kontrola proto není jazykovým schválením podání.

## MVP schvalovací workflow

Admin rozhraní pro posouzení vět je povinnou součástí prvního veřejného MVP.

1. Konečné odeslání uzamkne konkrétní neměnnou revizi ve stavu čekajícím na posouzení.
2. Teprve nad touto uzamčenou revizí může proběhnout neveřejná kontrola proti internímu katalogu.
3. Čekající ani zamítnutá věta se nezobrazuje ve veřejném seznamu ani na veřejném detailu.
4. Admin v neveřejné frontě vidí větu, úplnou deklarovanou analýzu, morfologickou identifikaci jednotlivých slov, obhajobu, zdroje a případný katalogový výsledek.
5. Admin může větu schválit, zamítnout nebo vrátit k doplnění; přesná revizní a stavová reprezentace se uzavře v decisions #8 a #10.
6. Autor před rozhodnutím admina nedostává okamžitou odpověď o členství jednotlivých slov či analýz v katalogu.
7. Teprve schválená věta se zveřejní v seznamu a na detailu.

Veřejné peer review čekajících vět není součástí MVP.

## Oddělení tvrzení hráče a systémové pravdy

> **Podaná analýza není zdrojem morfologické pravdy.**

Hráč deklaruje analýzu; oddělený interní katalog může říci, zda ji systém zná jako přípustnou.

## Interní katalog

Veřejný katalog všech slov se nezveřejňuje. Veřejné UI ani API neposkytuje před odesláním endpoint pro dotaz na členství libovolného slova nebo analýzy v katalogu.

Interní katalog může obsahovat:
- lexémy,
- soutěžní identity,
- schválené tvary,
- morfologické hodnoty,
- zdroje,
- stav návrhu/schválení.

Katalog je provozní autorita, ale pravidla jsou nad ním. Je-li katalog chybný nebo neúplný, existuje proces námitky.

## Budoucí deterministická morfologická validace

Tok:

```text
uzamčená revize podání
  -> token z věty
  -> deklarovaná analýza
  -> lookup v accepted_word_form
  -> lexeme_identity
  -> morph values
  -> neveřejný výsledek pro admin review
```

AI se nepoužívá při produkčním rozhodnutí o konkrétním soutěžním kandidátovi.

## Historie a revize

Podané věty se po podání nepřepisují na místě. Editace vytváří novou revizi. Evidují se revize, stavové změny, rozhodnutí admina a revalidace vůči novým verzím pravidel.
