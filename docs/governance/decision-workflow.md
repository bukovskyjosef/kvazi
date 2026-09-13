# Decision workflow

## Princip

Josef Bukovský je jediný vlastník finálních produktových a pravidlových rozhodnutí.

Agenti mohou:
- hledat problémy,
- připravovat varianty,
- argumentovat,
- navrhovat text změny,
- upozorňovat na závislosti.

Agenti nesmějí považovat vlastní doporučení za přijaté rozhodnutí.

## Typy issues

### `[DECISION]`
Otevřený problém, který vyžaduje rozhodnutí Josefa.

Issue má obsahovat:
- kontext,
- přesně položenou otázku,
- varianty nebo alespoň prostor pro jejich doplnění,
- dopady,
- závislosti.

### `[AUDIT]`
Nezávislý nález auditora.

Nález není automaticky změnou pravidel. Nejprve se prodiskutuje a případně se převede na rozhodnutí.

### `[IMPLEMENTATION]`
Technický úkol, jehož produktové předpoklady už jsou uzavřené.

Pokud vývojář zjistí, že technický úkol vyžaduje nové produktové rozhodnutí, musí:
1. zastavit danou spornou část,
2. založit nebo odkázat `[DECISION]` issue,
3. nepřekrýt problém vlastním implicitním řešením.

### `[META]`
Proces, repozitář, release workflow nebo jiné podpůrné téma.

## Životní cyklus rozhodnutí

1. **Problem discovered**
2. **Issue opened**
3. **Options prepared**
4. **Discussion**
5. **Josef decides**
6. **Decision recorded**
7. **Affected artifacts updated**
8. **Consistency checked**
9. **Issue closed**

Issue se nemá zavřít už v kroku 5. Zavře se až po kroku 8.

## Co znamená „Josef decides“

Přijaté rozhodnutí může vzniknout:
- přímo v GitHub issue,
- v chatu s agentem,
- jiným explicitním způsobem.

Pokud vznikne mimo GitHub, agent, který rozhodnutí zapracovává, musí jeho výsledek stručně zapsat do příslušného issue nebo do `decisions.md` tak, aby další agent nepotřeboval předchozí chatový kontext.

## Decision log

`docs/governance/decisions.md` obsahuje stabilní shrnutí významných přijatých rozhodnutí.

Nemá kopírovat všechny diskuse. Má umožnit novému agentovi rychle zjistit:
- co je už rozhodnuté,
- co bylo překonáno pozdějším rozhodnutím,
- jaký princip dnes platí.

## Konflikty mezi artefakty

Při nalezení rozporu:
1. neměň oba dokumenty podle vlastního odhadu,
2. zjisti, zda existuje přijaté rozhodnutí,
3. pokud ano, oprav odvozený artefakt,
4. pokud ne, založ `[AUDIT]` nebo `[DECISION]` issue.

## Definice hotového rozhodnutí

Decision issue je hotové, když:
- otázka má explicitní odpověď,
- jsou upraveny všechny dotčené normativní dokumenty,
- jsou upraveny relevantní odvozené technické návrhy,
- není znám rozpor s ostatním source of truth,
- je jasné, zda změna vyžaduje novou verzi pravidel.

## Vývojový gate

Do implementace funkcionality závislé na otevřeném decision issue se nemá jít, pokud nelze bezpečně vytvořit technický základ bez předjímání výsledku.

Příklad:
- lze připravit obecný framework formuláře,
- nelze natvrdo implementovat finální slovesné typy, dokud nejsou schválené.
