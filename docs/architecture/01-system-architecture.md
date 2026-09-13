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
3. **Mechanický validátor** – deterministická znaková kontrola.
4. **Morfologický katalog** – neveřejná interní znalostní báze pro budoucí deterministickou morfologickou validaci.
5. **Administrace** – schvalování, revize, moderace, správa katalogu.

## Veřejné stránky

### `/`
- stručná pravidla,
- aktuální rekord,
- poslední schválené věty,
- čekající věty,
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
- čekající,
- historické,
- filtrování podle verze.

### `/veta/{slug}`
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

Po zadání slov následuje strukturovaná analýza slovo po slově. Podle zvoleného slovního druhu se zobrazí relevantní pole.

## Oddělení tvrzení hráče a systémové pravdy

> **Podaná analýza není zdrojem morfologické pravdy.**

Hráč deklaruje analýzu; oddělený interní katalog může říci, zda ji systém zná jako přípustnou.

## Interní katalog

Veřejný katalog všech slov se nezveřejňuje.

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
token z věty
  -> deklarovaná analýza
  -> lookup v accepted_word_form
  -> lexeme_identity
  -> morph values
  -> výsledek validace
```

AI se nepoužívá při produkčním rozhodnutí o konkrétním soutěžním kandidátovi.

## Historie a revize

Podané věty se po podání nepřepisují na místě. Editace vytváří novou revizi. Evidují se revize, stavové změny, rozhodnutí admina a revalidace vůči novým verzím pravidel.
