# Common invariants for role-bound sessions

Tento soubor obsahuje pouze pravidla společná všem role-bound agentním sessions. Kanonický seznam rolí a lifecycle je v `ROLES.md`; detail aktivní role je v `roles/<ROLE>.md`.

## 1. Explicitní role

Role-bound session musí mít právě jednu roli explicitně aktivovanou Humanem.

- Role se neodvozuje z Issue, PR, statusu ani handoffu.
- Agent se sám nepřepíná do jiné role a nekombinuje authority více rolí.
- Nový Human assignment může roli změnit pouze pro další práci a nesmí obejít independence invariant.
- Autor candidate nesmí být jeho independent R ani po pozdějším reassignmentu.

Pokud Human neaktivoval kanonickou agentní roli nebo použil nekanonickou roli, agent neprovádí materiální role-bound práci. Kanonický registry je v `ROLES.md`.

## 2. Durable state má přednost

Human prompt určuje aktivní roli a work item, ale není důkazem, že požadovaný krok je stále legitimní.

Repository/GitHub durable state má přednost před:
- private-chat historií,
- starým handoff promptem,
- starou auditní zprávou,
- ručně udržovaným seznamem práce.

GitHub Issues jsou jediný živý backlog. Current-next-authority status je lifecycle informace, nikoli role activation.

Historické artefakty (`docs/history/`, datované auditní reporty, historical decision summaries) jsou kontext, ne current backlog ani náhrada současných canonical sources.

## 3. Generic pre-run authority guard

Po načtení vlastního role contractu agent fresh-readne assigned Issue a current comments; linked/current PR načte tehdy, pokud existuje nebo je pro daný lifecycle krok relevantní.

Před první materiální prací ověří:

1. aktivní roli,
2. assigned work item,
3. current lifecycle / next authority,
4. že work item skutečně čeká na jeho roli,
5. required dependencies a gates,
6. exact candidate/head binding, pokud je pro krok relevantní,
7. že work item není blocked, completed, superseded nebo waiting for jinou authority,
8. že od handoffu nenastal drift, který požadovaný krok zneplatnil.

Pokud guard neprojde, agent práci neprovádí. Stručně durable/current stav popíše Humanovi a zakončí odpověď jediným správným handoff promptem.

**Stale handoff není authority.**

## 4. Role boundary a Human override

Agent smí vykonávat pouze kompetence své aktivní role.

Pokud Human požádá o úkon mimo aktivní roli:
1. agent identifikuje konflikt,
2. úkon neprovede,
3. uvede správnou roli nebo potřebnou governance změnu.

Pokud Human instrukce odporuje current work contractu, required gate nebo governance:
1. konflikt se explicitně popíše,
2. konfliktní akce se neprovede,
3. compliant path se uvede,
4. případné Human rozhodnutí o změně se musí nejprve durable zapsat do správného Issue nebo governance artefaktu,
5. agent fresh-readne nový stav a teprve potom pokračuje.

Soukromé chatové „tentokrát to ignoruj“ samo repository contract nemění.

Pokud si dva relevantní autoritativní artefakty odporují:
1. neurčuj vítěze odhadem,
2. ověř current Issue a explicitní H decision,
3. pokud rozhodnutí existuje, stale derived artifact se má opravit,
4. pokud rozhodnutí chybí, konflikt durable routuj a spornou část neprováděj.

Technický nebo odvozený artefakt (UI, DB constraint, regex, katalog, validator, příklad, README či komentář) nesmí potichu vytvořit nebo změnit soutěžní pravidlo. Pokud task může měnit soutěžní platnost, agent musí následovat applicable canonical normative references.

## 5. Minimum complete context

Cold start je relevance-driven:

1. `AGENTS.md`,
2. tento `COMMON.md`,
3. pouze detail aktivní role,
4. assigned Issue + current comments (+ relevantní PR),
5. pre-run authority guard,
6. task-specific canonical references a affected surfaces z durable work itemu,
7. pouze minimum **úplného** dalšího kontextu nutného pro bezpečnou práci.

Další dokument nebo soubor se načítá jen kvůli konkrétní nezodpovězené otázce, dependency, contractu nebo changed surface. Preventivně se neskenuje celý repozitář ani adresáře.

Token economy nikdy neospravedlňuje vynechání aplikovatelného autoritativního contractu.

Nežádej Humana o branch, base, SHA, status nebo jiný stav, který lze bezpečně rekonstruovat z Issue/PR/repozitáře.

## 6. Phase-aware fresh reconstruction

Fresh session neznamená povinný replay celého původního task contextu.

Každá nová role-bound session:
- fresh ověří drift-prone durable state potřebný pro svou aktuální fázi,
- smí znovu použít durable závěry/evidence z předchozích fází,
- nenačítá znovu stabilní nezměněný kontext jen proto, že je session nová.

Mezi drift-prone state patří podle fáze zejména:
- current Issue state,
- current PR state,
- exact HEAD/candidate,
- unresolved review findings,
- required gates,
- current base/target, pokud je materiální,
- Canonical reference, která se změnila nebo jejíž předpoklad byl zpochybněn.

Rozsah startupu dále zpřesňuje phase profile uvnitř aktivního role contractu. Fáze nevytváří novou roli ani novou authority.

## 7. Fallback authority routing

`docs/README.md` je úplná autoritativní mapa dokumentace, ale není univerzální pre-Issue read.

Načti ji, když:
- task-specific canonical references chybí, jsou nejednoznačné nebo nekonzistentní,
- práce překročí doménu, kterou Issue dostatečně neroutuje,
- objeví se konkrétní authority konflikt,
- je nutné zjistit owner/currentness dalšího truth-bearing artefaktu.

`docs/00-project-context.md` je stabilní product context. Načti jej jen tehdy, když je potřeba k výkladu product intent/scope nebo na něj role/task explicitně routuje.

## 8. Human-proxy handoff

K/A/D/R/P po dokončení svého kroku:

1. fresh-readnou relevantní durable state,
2. určí jediný legitimní další krok,
3. durable zanechají vše potřebné pro další roli,
4. Humanovi vrátí stručný výsledek,
5. zakončí jedním přesným copy-paste promptem.

Výchozí formát:

`Jsi <ROLE>. Pracuj na Issue #N v repozitáři bukovskyjosef/kvazi. Řiď se repozitářem.`

Pokud je pro další krok nutný konkrétní PR:

`Jsi <ROLE>. Pracuj na Issue #N / PR #M v repozitáři bukovskyjosef/kvazi. Řiď se repozitářem.`

Prompt neduplikuje report ani scope, pokud jsou bezpečně rekonstruovatelné z durable state.
