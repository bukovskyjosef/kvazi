# Hranice mezi pravidly, daty a implementací

Tento dokument určuje architektonické hranice projektu. Není pravidlem hry, ale implementace se jím má řídit.

## 1. Normativní pravidla

Určují, co je soutěžně platné.

Patří sem:
- rozhodcovská specifikace,
- normativní části kvazitaháku,
- politika použití nástrojů a AI,
- verzování a procesní pravidla.

Implementace je nesmí měnit.

## 2. Veřejná vysvětlující dokumentace

`Jak hrát`, příklady a vysvětlivky:
- mají usnadnit pochopení,
- nesmějí zavést nové pravidlo,
- při rozporu se opravují podle normativního zdroje.

## 3. Technická specifikace

Určuje, jak se pravidla reprezentují a obsluhují:
- API,
- formuláře,
- DB tabulky,
- validační algoritmy,
- autentizace,
- admin workflow.

Nesmí rozhodnout jazykovou otázku, která není rozhodnutá v pravidlech.

## 4. Interní morfologický katalog

Je neveřejná provozní znalostní báze.

Jeho role:
- rychlá deterministická kontrola,
- evidence schválených analýz,
- zdroje a historie oprav.

Není vyšší autoritou než pravidla.

Pokud je katalog v rozporu s pravidly, opravuje se katalog.

## 5. Uživatelská deklarace

Autor kvazivěty ve formuláři deklaruje:
- vlastní analýzu,
- soutěžní identitu,
- morfologické hodnoty,
- syntaktické vazby,
- zdroje.

Tato deklarace je tvrzení soutěžícího. Sama nevytváří novou morfologickou pravdu ani nerozšiřuje katalog.

## 6. Odvozená data

Aplikace může odvozovat například:
- počet slov,
- počet znaků,
- normalizovaný zápis,
- mechanický validační výsledek,
- žebříček.

Odvozené hodnoty musí být znovu vypočitatelné ze zdrojových dat a verze pravidel/validátoru.

## 7. Budoucí implementační prostor

Aplikační kód má žít odděleně od normativní dokumentace.

Doporučená budoucí struktura:

```text
app/                 aplikační PHP kód
public/              veřejný web root a statické assety
tests/               automatické testy
db/migrations/       produkční DB migrace
db/seed/             normativně schválené číselníky / provozní seed data
docs/                produktová a technická dokumentace
```

Aktuální `db/schema-draft.sql` je návrhový artefakt, ne produkční migrační historie.

## 8. Vývojový gate

Vývojář může implementovat pouze to, co:
- je již rozhodnuté,
- nebo lze implementovat parametricky bez předjímání otevřeného rozhodnutí.

Pokud narazí na otevřenou produktovou otázku, založí `[DECISION]` issue a spornou logiku nehardcoduje.

## 9. Příklad správné hranice

Pravidlo řekne:
> sloveso vybírá jeden z normativních časovacích typů.

Kvazitahák definuje:
> seznam a paradigmata typů.

DB uloží:
> `verb_conjugation_type_id`.

UI zobrazí:
> select s povolenými typy.

Vývojář nesmí do selectu přidat nebo odebrat typ jen proto, že se mu implementačně hodí.

## 10. Příklad chybné hranice

Pokud pravidla dovolují kombinaci X, ale databázový constraint ji zakáže, nejde o nové pravidlo hry. Je to chyba implementace.
