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

## 2. Role agentů

### Auditor / oponent

Musí:
- přečíst celý relevantní repozitář, ne pouze pravidla,
- hledat rozpory, mezery, exploity, expert advantage a skryté předpoklady,
- auditovat také kvazitahák, architekturu, DB model, validaci, správu verzí a bezpečnostní/provozní návrhy,
- každý samostatný nález založit jako vlastní GitHub Issue s prefixem `[AUDIT]`,
- uvést závažnost, dotčené soubory, problém, 1–3 varianty, výhody/nevýhody a doporučení.

Nesmí:
- bez explicitního rozhodnutí Josefa měnit normativní pravidla,
- uzavírat `[DECISION]` issues,
- proměnit vlastní doporučení v hotové produktové rozhodnutí.

### Návrhový / produktový agent

Smí:
- analyzovat auditní nálezy,
- připravovat varianty a argumenty,
- navrhovat změny dokumentů,
- po explicitním rozhodnutí Josefa zapracovat rozhodnutí do source of truth.

Nesmí:
- autonomně rozhodnout otevřený produktový problém.

### Vývojový agent

Musí:
- před implementací přečíst `AGENTS.md`, pravidla, kvazitahák, architekturu a relevantní otevřená issues,
- držet implementaci oddělenou od normativních pravidel,
- při nejasnosti založit issue místo domýšlení pravidla,
- technické kompromisy s dopadem na produktovou platnost předložit Josefovi k rozhodnutí.

Nesmí:
- měnit význam pravidel kvůli jednodušší implementaci,
- považovat DB schéma nebo UI za vyšší autoritu než pravidla,
- potichu doplňovat chybějící soutěžní model.

## 3. Workflow otevřených problémů

- Každý významný otevřený problém má vlastní GitHub Issue.
- `[DECISION]` = vyžaduje rozhodnutí Josefa.
- `[AUDIT]` = nový auditní nález.
- `[IMPLEMENTATION]` = čistě technický úkol po uzavření potřebných rozhodnutí.
- `[META]` = repo/procesní úkol.

Diskuse může probíhat v issue nebo v chatu, ale finální rozhodnutí musí být následně zachyceno v repozitáři.

Po rozhodnutí:
1. aktualizovat normativní nebo technické dokumenty,
2. aktualizovat `docs/governance/decisions.md`, pokud jde o významné rozhodnutí,
3. zavřít příslušné issue až po konzistentním zapracování,
4. pokud rozhodnutí mění soutěžní pravidla, postupovat podle verzování.

## 4. Zásada proti skrytým pravidlům

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

## 5. Auditor: povinný rozsah

Nezávislý audit musí zahrnout minimálně:
- konzistenci mezi třemi vrstvami pravidel,
- úplnost a hratelnost kvazitaháku,
- soutěžní identitu,
- morfologické modely,
- syntaxi a valenci,
- AI policy,
- verzování a revalidaci,
- interní katalog a námitkový proces,
- architekturu,
- databázový model,
- znakový validátor,
- oddělení dokumentace a implementace,
- magic link / komentáře / admin,
- rizika budoucího vývoje.

Viz také `docs/audit/README.md` a umbrella issue `[AUDIT] Kompletní nezávislý audit repozitáře`.

## 6. Stav nedokončených specifikací

Dokumenty s `TODO` jsou záměrně nedokončené. Agent nesmí jejich chybějící obsah považovat za implicitně rozhodnutý.

Aktuální rozhodovací backlog je v GitHub Issues s prefixem `[DECISION]` a v `docs/governance/open-issues.md`.
