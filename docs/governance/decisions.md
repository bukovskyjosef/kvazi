# Přijatá rozhodnutí

Tento dokument je stručný decision log. Není náhradou normativních pravidel.

## Znakový systém

- motiv `KVAZI`,
- `KV` lze nahradit `Q`,
- `A/Á`,
- `I/Í/Y/Ý`,
- `Z` pevné,
- `Q` je samostatný znak a počítá se jako jeden,
- velikost písmen se ignoruje, diakritika nikoli,
- věta smí začínat a končit uvnitř motivu,
- slovo nesmí překročit hranici motivu.

## Délka slov

- běžně 3–5 znaků,
- výjimky `k,v,z,a,i`,
- každá jednopísmenná identita nejvýše jednou,
- `k,v,z` se soutěžně nevokalizují; `ke,ve,ze` se nepoužívají.

## Syntax

- jedna jednoduchá hlavní predikační osa,
- jeden podmět s imperativní výjimkou,
- jeden přísudek,
- právě jeden token plnovýznamového slovesa,
- doplněk není další hlavní predikace,
- přístavek ne,
- elipsa obligatorních členů ne,
- syntax je uzavřená normativním seznamem,
- lexikální rekce substantiv/adjektiv se nepoužívá.

## Morfologie

- kvazislova používají uzavřené soutěžní modely,
- skutečný použitý tvar musí být reálně spisovný a současně spadat do soutěžního modelu,
- nepravidelné/defektivní/nesklonné zvláštnosti mimo modely se nepoužívají,
- veřejný úplný katalog slov se nezveřejňuje,
- interní katalog může existovat.

## Substantiva

Povolené vzory:
- pán,
- muž,
- předseda,
- soudce,
- hrad,
- stroj,
- žena,
- růže,
- píseň,
- kost,
- město,
- moře,
- kuře,
- stavení.

## Adjektiva

Aktuální modely:
- mladý,
- jarní,
- otcův,
- matčin.

Reachability rozhodne, co zůstane v hlavní vrstvě.

## Slovesa

- uzavřené soutěžní časovací typy,
- uzavřená sada vidu,
- uzavřená sada valenčních rámců,
- konkrétní tabulky jsou TODO kvazitaháku.

## Identita

- jednou použitá identita je vyčerpaná,
- význam ani syntaktická funkce samy identitu nevytvářejí,
- substantivum: lemma + rod + životnost + vzor,
- adjektivum: základní tvar + vzor,
- sloveso: infinitiv + časovací typ + valenční rámec,
- vid slovesa není součást identity.

## Fiktivní význam

- povolen,
- může obhájit jen povolenou syntaktickou konstrukci,
- nesmí měnit morfologii/identitu/valenci,
- při významově citlivé syntaxi musí odpovídat běžné české analogii.

## Nástroje a AI

- soutěžní řešení vytváří člověk vlastní hlavou,
- pravidlo je technologicky neutrální a posuzuje funkci nástroje,
- povolena je ruční práce s dovolenými veřejnými zdroji a mechanické ověření konkrétního lidského nápadu,
- zakázáno je automatické generování, enumerace, hromadné filtrování, skládání, porovnávání a optimalizace kandidátů,
- ověřovací nástroj nesmí navrhovat alternativu ani být používán k systematickému testování variant,
- AI smí soutěžícímu vysvětlovat pouze obecnou současnou spisovnou češtinu bez jakéhokoli kvazikontextu,
- přípustnost obecného dotazu se posuzuje podle předaného obsahu a kontextu, ne podle nepozorovatelné motivace soutěžícího,
- AI nesmí komunikovat o soutěžním obsahu,
- správa, vývoj a audit pravidel AI používat mohou,
- AI může připravovat kandidátní interní data, ale ne je sama schvalovat ani vydávat za lidské soutěžní řešení.

## Platnost a autorita

- platné + řádně podané + bez porušení procesu = musí být uznáno,
- žádné estetické veto nad platným výsledkem,
- exploit se uzná ve své verzi a případně uzavře v nové,
- kvaziautorita rozhoduje platnost a procesní porušení.

## Verzování

- normativní balík má verzi,
- staré výsledky zůstávají historické,
- mohou být revalidovány vůči nové verzi bez nového podání.

## Dokumentační vrstvy

- Jak hrát,
- kvazitahák,
- rozhodcovská specifikace.

## Aplikace

- slova se zadávají jednotlivě v pevném pořadí,
- uživatel nevkládá mezery,
- technická implementace nesmí měnit platnost,
- morfologický katalog je provozní autorita, nikoli vyšší pravidlo.

## Rozsah prvního veřejného MVP – částečně uzavřeno

- veřejná prezentace projektu, jeho smyslu, vysvětlení a pravidel,
- interaktivní a vizuálně propracovaný formulář pro strukturované vložení věty,
- povinné admin rozhraní pro posouzení a schválení podání,
- čekající a zamítnutá podání nejsou veřejná,
- veřejný seznam obsahuje pouze schválené věty,
- veřejný detail schválené věty obsahuje její obhájení a morfologickou identifikaci jednotlivých slov,
- veřejné peer review čekajících vět není součástí MVP.

Zbývající rozsah, zejména komentáře, automatická morfologická validace, autentizace autora a přesný admin security model, zůstává k rozhodnutí v #10 a souvisejících nálezech.

## Multi-agent governance repozitáře

- Josef Bukovský je finální decision owner pro produktová a pravidlová rozhodnutí,
- nezávislý auditor zakládá samostatná `[AUDIT]` issues a sám nemění normativní výsledek,
- otevřené produktové otázky jsou `[DECISION]` issues,
- vývojový agent smí implementovat jen uzavřená rozhodnutí nebo parametrický základ, který výsledek nepředjímá,
- po rozhodnutí se issue zavírá až po zapracování a kontrole konzistence,
- `AGENTS.md` a `docs/governance/decision-workflow.md` jsou hlavní procesní instrukce pro další agenty.

## Oddělení dokumentace a implementace

- normativní pravidla určují soutěžní platnost,
- vysvětlující materiály pravidla pouze interpretují,
- architektura a DB je implementují,
- interní katalog je provozní znalostní báze,
- uživatelská deklarace je tvrzení soutěžícího, nikoli zdroj pravdy,
- žádný technický constraint, regex, UI nebo katalog nesmí potichu vytvořit nové soutěžní pravidlo.
