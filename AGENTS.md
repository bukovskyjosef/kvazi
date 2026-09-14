# AGENTS.md

Tento repozitář používá více agentů s oddělenými rolemi. **Josef Bukovský je jediný decision owner pro produktová, pravidlová a sporná architektonická rozhodnutí.**

## 1. Source of truth

Normativní zdroje jsou:

1. `docs/rules/02-rozhodcovska-specifikace.md`
2. výslovně označené NORMATIVNÍ části `docs/kvazitahak/`
3. `docs/rules/03-ai-policy.md`
4. `docs/rules/04-verzovani-a-sprava.md`

`docs/rules/01-jak-hrat.md` je veřejná stručná vrstva a nesmí vytvářet nové pravidlo.

Architektura a SQL návrhy nejsou normativními pravidly hry. Implementace musí pravidla implementovat, nikoli je měnit.

## 2. GitHub Issues jsou jediný backlog

Veškerá otevřená práce se eviduje v GitHub Issues. Dokumentace nesmí udržovat paralelní seznam otevřených bodů, jejich stavů ani priorit.

Platí:
- každý významný otevřený problém nebo úkol má vlastní issue,
- stav práce určuje GitHub `open/closed`, nikoli seznam v Markdownu,
- každé issue musí mít alespoň jeden smysluplný label,
- závislosti, rozhodnutí, změny scope a důvody uzavření se zapisují do issue,
- rozhodnutí vzniklé v chatu se musí stručně přenést do příslušného issue,
- dokumenty mohou odkazovat na konkrétní issue, ale nesmějí zrcadlit celý aktuální backlog,
- `TODO` v dokumentu není náhradou za issue, pokud představuje skutečnou samostatnou práci.

### Label taxonomy

Používají se zejména tyto existující labely:
- `question` – otevřené pravidlové, produktové, specifikační nebo auditní téma vyžadující vyjasnění,
- `enhancement` – plánovaná implementace, feature nebo technické rozšíření,
- `bug` – rozpor implementace s již přijatým chováním,
- `documentation` – hlavní výstup je změna pravidel, specifikace nebo dokumentace; může být kombinován s `question`,
- `duplicate` – detail byl absorbován do jiného master issue; před uzavřením musí být požadavek v cílovém issue skutečně zachycen.

Prefixy v názvu (`[SPEC]`, `[DECISION]`, `[AUDIT]`, `[IMPLEMENTATION]`, `[FEATURE]`, `[META]`) jsou pomocné pro čitelnost. Autoritativní backlogová klasifikace je stav issue + labely + jeho obsah.

## 3. Role agentů

### Auditor / oponent

Musí:
- přečíst celý relevantní repozitář, ne pouze pravidla,
- hledat rozpory, mezery, exploity, expert advantage a skryté předpoklady,
- auditovat také kvazitahák, architekturu, DB model, validaci, správu verzí a bezpečnostní/provozní návrhy,
- každý samostatný akční nález založit jako vlastní GitHub Issue,
- přidělit mu label a uvést závažnost, dotčené artefakty, problém, dopad, varianty a doporučení.

Nesmí:
- bez explicitního rozhodnutí Josefa měnit normativní pravidla,
- autonomně uzavírat otázku vyžadující produktové rozhodnutí,
- proměnit vlastní doporučení v hotové produktové rozhodnutí,
- vést paralelní auditní backlog v textovém souboru.

### Návrhový / produktový agent

Smí:
- analyzovat auditní nálezy,
- připravovat varianty a argumenty,
- navrhovat změny dokumentů,
- po explicitním rozhodnutí Josefa zapracovat výsledek do source of truth.

Musí:
- zachytit rozhodnutí a jeho důsledky v příslušném issue,
- aktualizovat všechny dotčené artefakty před uzavřením issue.

Nesmí autonomně rozhodnout otevřený produktový problém.

### Vývojový agent

Musí:
- před implementací přečíst `AGENTS.md`, pravidla, kvazitahák, architekturu a relevantní otevřená issues,
- pracovat z GitHub Issues, ne z ručně udržovaného seznamu úkolů v dokumentaci,
- držet implementaci oddělenou od normativních pravidel,
- při nové nejasnosti založit issue místo domýšlení pravidla,
- technické kompromisy s dopadem na produktovou platnost předložit Josefovi k rozhodnutí.

Nesmí:
- měnit význam pravidel kvůli jednodušší implementaci,
- považovat DB schéma nebo UI za vyšší autoritu než pravidla,
- potichu doplňovat chybějící soutěžní model.

## 4. Životní cyklus issue

1. problém nebo práce je identifikována,
2. vznikne nebo se najde odpovídající issue,
3. issue dostane správné labely a vazby,
4. připraví se varianty / technický plán,
5. pokud je třeba produktové rozhodnutí, rozhodne Josef,
6. výsledek se zapíše do issue,
7. aktualizují se normativní a/nebo technické artefakty,
8. provede se kontrola konzistence a akceptačních kritérií,
9. issue se zavře s odpovídajícím důvodem.

Issue se nezavírá jen proto, že bylo rozhodnuto; zavírá se až po zapracování. Pokud se detail sloučí do master issue, nejdřív se přenese jeho podstata a až potom se původní issue zavře jako `duplicate`.

Podrobný proces je v `docs/governance/decision-workflow.md`.

## 5. Zásada proti skrytým pravidlům

Žádný z následujících artefaktů nesmí nepozorovaně změnit soutěžní platnost:
- UI,
- databázové constrainty,
- regex,
- interní katalog,
- validační kód,
- příklady,
- README,
- komentáře v kódu.

Pokud technický artefakt odporuje pravidlům, je vadný technický artefakt.

## 6. Auditor: povinný rozsah

Nezávislý audit musí zahrnout minimálně:
- konzistenci mezi vrstvami pravidel,
- úplnost a hratelnost kvazitaháku,
- soutěžní identitu,
- morfologické modely,
- syntaxi a valenci,
- AI policy,
- verzování a revalidaci,
- interní katalog,
- architekturu,
- databázový model,
- validátor,
- oddělení dokumentace a implementace,
- autentizaci/admin/security,
- rizika budoucího vývoje.

Viz také `docs/audit/README.md`.

## 7. Stav nedokončených specifikací

Dokumenty s `TODO` jsou záměrně nedokončené. Agent nesmí jejich chybějící obsah považovat za implicitně rozhodnutý.

**Aktuální backlog se vždy zjišťuje přímo z GitHub Issues. Žádný textový soubor v repozitáři není indexem aktuálně otevřené práce.**
