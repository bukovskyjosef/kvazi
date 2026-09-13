# Nejdelší kvazivěta

Repozitář projektu **Nejdelší kvazivěta**.

Jde o jazykovou soutěž / kvaziproblém založený na skládání co nejdelší české věty z omezeného znakového systému odvozeného od motivu `KVAZI`. Hra je záměrně navržena tak, aby ji řešil člověk vlastní hlavou; technika smí vykonávat jen přesně vymezené deterministické kontroly a AI nesmí pracovat se soutěžním obsahem.

## Stav

Dokumentace zachycuje dosud přijatá rozhodnutí z návrhu pravidel, dvou kol auditu a návrhu deterministické aplikace.

Některé části jsou záměrně označené `TODO`, zejména:

- úplná normativní podoba **kvazitaháku**,
- uzavřené slovesné časovací typy,
- uzavřená sada slovesných valenčních rámců,
- interní reachability audit,
- přesný datový model morfologického formuláře,
- naplnění interního morfologického katalogu.

## Dokumentace

```text
docs/
  rules/
    01-jak-hrat.md
    02-rozhodcovska-specifikace.md
    03-ai-policy.md
    04-verzovani-a-sprava.md
  kvazitahak/
    README.md
    01-syntax.md
    02-substantiva.md
    03-adjektiva.md
    04-slovesa.md
    05-valence.md
    06-hranicni-pravidla.md
  architecture/
    01-system-architecture.md
    02-database-model.md
    03-validation.md
    04-comments-auth-admin.md
  governance/
    decisions.md
    open-issues.md
  history/
    README.md
db/
  schema-draft.sql
```

## Normativní vrstvy

Pravidla budou zveřejněna ve třech vrstvách:

1. **Jak hrát** – krátká vstupní vrstva pro veřejnost.
2. **Kvazitahák** – praktická vrstva; pouze výslovně označené tabulky a seznamy jsou normativní.
3. **Rozhodcovská specifikace** – úplná normativní pravidla pro platnost, spory, identitu, proces a verzování.

Všechny vrstvy se verzují společně.

## Autorství

Autorem této podoby kvaziproblému, konceptu **Nejdelší kvazivěty** a jejích pravidel je **Josef Bukovský**, který je zároveň první a nejvyšší kvaziautoritou.
