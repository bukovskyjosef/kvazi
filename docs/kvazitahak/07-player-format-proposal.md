# Návrh výsledné podoby kvazitaháku pro hráče

> **Status:** nenormativní návrh informačního designu k samostatnému auditu. Nevyplňuje otevřená rozhodnutí.

Cílem je, aby hráč po přečtení `Jak hrát` mohl otevřít jeden praktický materiál a během hry v něm rychle najít potřebnou soutěžní možnost.

## Navržená forma

Kvazitahák by měl mít dvě úrovně:

### A. Jednostránkový rychlý přehled
Obsahuje jen:
- znakovou mechaniku,
- délku slov a jednopísmenné výjimky,
- povolené slovní druhy,
- krátký přehled soutěžních vzorů,
- názvy slovesných typů,
- názvy valenčních rámců,
- uzavřený seznam syntaktických vztahů,
- krátké pravidlo identity,
- skóre.

Bez odborných odstavců a bez dlouhých konkrétních seznamů slov.

### B. Detailní tabulky
Pod rychlým přehledem nebo na samostatných podstránkách:
- přesná substantivní paradigmata,
- přesná adjektivní paradigmata,
- přesné slovesné typy,
- valenční rámce,
- jednoduché syntaktické analogie,
- hraniční pravidla.

## 1. Rychlý panel „Znaky“

```text
Motiv: KVAZI
KV -> Q
A  -> A / Á
Z  -> Z
I  -> I / Í / Y / Ý
```

Doplnit pouze stručnou poznámku:
- Q = jeden znak, výslovnost /kv/
- běžné slovo = 3–5 znaků
- jednopísmenné výjimky = k, v, z, a, i

## 2. Panel „Co může být slovo“

Krátké karty:

### Podstatné jméno
Vyber jeden soutěžní vzor.

### Přídavné jméno
Vyber jeden soutěžní model.

### Sloveso
Vyber:
1. časovací typ,
2. vid,
3. valenční rámec.

### Zájmeno / funkční slovo
Jen v rozsahu výslovně povoleném tahákem.

## 3. Substantivní přehled

Na jedné kompaktní tabulce zobrazit pouze názvy vzorů a vstupní podmínky.

Detailní pády dát do rozbalovacích tabulek / druhé úrovně.

Cíl: hráč při běžném přemýšlení vidí možnosti, ale není zaplaven 14 pádovými buňkami pro každý vzor.

## 4. Adjektivní přehled

Stejný princip:
- základní modely na jedné malé tabulce,
- konkrétní paradigmata zvlášť,
- hraniční mechanismy až v dodatku.

## 5. Slovesný přehled

Po uzavření issues #2 a #3 vytvořit tři malé normativní tabulky:

### Časovací typ
Název | vstupní podmínka | rychlá charakteristika

### Vid
Povolené hodnoty.

### Valence
Kód | obligatorní sloty | běžná ilustrační konstrukce

Hráč nemá hledat modelová slovesa v externích slovnících.

## 6. Syntax jako vizuální toolbox

Každý povolený vztah zobrazit stejně:

```text
NÁZEV
Co spojuje / k čemu slouží
Jedna obyčejná česká ukázka
Jedna krátká kontrolní otázka
```

Příklad formátu, nikoli soutěžního obsahu:

```text
PŘÍVLASTEK SHODNÝ
Rozvíjí jméno a shoduje se s ním.
Běžná analogie: [obyčejný český příklad mimo soutěžní abecedu]
Kontrola: Shoduje se tvar s řídícím jménem?
```

Příklady mají používat běžná česká slova mimo soutěžní kandidátní prostor, aby nenapovídaly konkrétní tahy.

Karta pojmenovává hlavní syntaktickou funkci a její rozhodovací test. Nevyžaduje po hráči odborné určení významového podtypu a uvedený příklad není vyčerpávajícím seznamem povolených realizací.

## 7. Identita jako krátký checklist

Ne vysvětlovat dlouhým prose textem, ale tabulkou:

| Slovní druh | Co tvoří identitu | Co ji nevytváří |
|---|---|---|
| substantivum | lemma + rod + životnost + vzor | pád, číslo, význam |
| adjektivum | základní tvar + vzor | rod tvaru, pád, číslo, stupeň |
| sloveso | infinitiv + časovací typ + valenční rámec | vid, osoba, číslo |

Přesné znění musí odpovídat rozhodcovské specifikaci.

## 8. Barevné / vizuální označení statusu

Ve finálním webu doporučeno odlišit:
- **závazné pravidlo**,
- **vysvětlení**,
- **příklad**,
- **hraniční případ**.

Není nutné používat konkrétní barvy; důležitá je jednoznačná vizuální hierarchie a přístupnost.

## 9. Co na hlavní tahák nedávat

- interní morfologický katalog,
- seznam všech skutečných použitelných slov,
- auditní diskuse,
- DB identifikátory,
- historii verzí,
- odborné zdůvodnění každého rozhodnutí,
- mechanismy, které reachability audit přesune do hraničního dodatku.

## 10. Otázky pro auditora

1. Dokáže nováček z tohoto formátu začít hrát bez rozhodcovské specifikace?
2. Je snadné během hry něco dohledat do několika sekund?
3. Je jasné, která informace je závazná?
4. Nevede layout hráče příliš za ruku k hotovým kandidátům?
5. Je nějaká normativní informace, která by v taháku chyběla?
6. Je některá část zbytečně odborná a měla by zůstat jen rozhodčím?
