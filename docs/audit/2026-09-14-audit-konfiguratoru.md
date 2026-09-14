# Hloubkový audit `konfigurator.html` – 2026-09-14

> **Status:** nenormativní auditní zpráva. Nemění pravidla ani neuzavírá otevřená rozhodnutí. Slouží jako podklad pro revizi `konfigurator.html`, issue #5/#7/#10 a navazující implementaci formuláře.

## 1. Cíl auditu

Cílem bylo posoudit, zda současný prototyp `konfigurator.html`:

1. vhodně reprezentuje soutěžní podání po jednotlivých tokenech,
2. na frontendu kontroluje vše, co lze bezpečně a deterministicky zkontrolovat **bez interního BE katalogu a bez jazykového rozhodování**,
3. naopak neposuzuje nebo nenavrhuje něco, co podle aktuálních pravidel patří až do neveřejného admin review,
4. odpovídá již přijatým dílčím rozhodnutím o formuláři,
5. nepředjímá dosud otevřená rozhodnutí #1–#5,
6. je vhodným základem pro veřejný submission flow.

Audit porovnal aktuální `konfigurator.html` s kompletním současným repozitářem, zejména:

- `AGENTS.md`,
- `docs/rules/01-jak-hrat.md`,
- `docs/rules/02-rozhodcovska-specifikace.md`,
- `docs/rules/03-ai-policy.md`,
- `docs/rules/04-verzovani-a-sprava.md`,
- celý `docs/kvazitahak/`,
- `docs/architecture/00-boundaries.md`,
- `docs/architecture/01-system-architecture.md`,
- `docs/architecture/02-database-model.md`,
- `docs/architecture/03-validation.md`,
- governance a decision workflow,
- `db/schema-draft.sql`,
- otevřená decision issues #1–#10 a jejich relevantní komentáře,
- již uzavřené auditní nálezy, které upravily požadavky na formulář a validátor.

---

# 2. Celkový verdikt

`konfigurator.html` je **dobrý UX a technický prototyp editoru tokenů a znakové validace**, ale **není zatím vhodný jako zdroj pravdy pro produkční submission formulář**.

Nejlépe navržené části jsou:

- zadávání věty po samostatných tokenech v pevném pořadí,
- stabilní interní ID tokenů,
- automaticky generované mezery,
- oddělení tokenového editoru, konfigurace, validační tabulky a submit stavu,
- DFA kontrola KVAZI motivů včetně možnosti začít/skončit uvnitř motivu,
- kontrola, že běžný token nepřekročí vnitřní hranici motivu,
- specializovaná struktura pro doplněk a koordinaci,
- lokální escapování dynamicky vkládaného textu,
- žádné napojení na interní katalog ani pre-submit katalogový oracle.

Největší problémy jsou naopak čtyři:

1. **stav podání je příliš slabě strukturovaný** – chybí většina údajů, které už dnes musí token podle přijatého rozhodnutí obsahovat;
2. **morfologická část je koncepčně obrácená** – hráč ručně vyplňuje celé paradigma a kliknutím je „potvrzuje“, místo aby deklaroval konkrétní použitý tvar a jeho soutěžní identifikaci;
3. **submit gate není konzistentní se samotnou validací** a může zůstat falešně zelený;
4. **prototyp hardcoduje otevřená TODO jako hotové enumy a tabulky**, čímž hrozí, že UI začne předjímat pravidla.

Doporučený směr proto není „zahodit konfigurátor“, ale použít jej jako **UX skeleton** a přepsat state/schema/validation vrstvu na datově řízený model odvozený od aktuální rules verze.

---

# 3. Hranice frontendu: co smí a nesmí živě validovat

Nejdůležitější zásada z aktuální architektury je:

> Frontend smí před odesláním kontrolovat zveřejněnou mechanickou a strukturální podobu deklarace. Nesmí z ní dělat jazykový verdikt ani dotazovat interní katalog.

Tuto hranici je vhodné implementovat explicitně v několika validačních vrstvách.

## 3.1 FE má kontrolovat okamžitě

### A. Znakový a tokenový řetězec

Bez BE lze jednoznačně ověřit:

- Unicode NFC normalizaci pro UX,
- příslušnost znaků k soutěžní abecedě,
- délku běžného tokenu 3–5 znaků,
- jednopísmenné výjimky `k/v/z/a/i`,
- maximálně jedno použití každé jednopísmenné identity,
- pořadí tokenů,
- umístění celého řetězce do souvislé posloupnosti motivů,
- existenci rozkladu, při kterém žádný token nepřekračuje vnitřní hranici motivu,
- počet slov,
- počet soutěžních znaků,
- povolené závěrečné `.`, `?`, `!`.

Současný DFA je pro tento účel koncepčně dobrý základ. Má ale být přesunut do čisté testovatelné funkce a pokryt referenčními testy.

### B. Formální úplnost formuláře

Jakmile #1–#5 definují přesné field schema, FE může kontrolovat:

- zda jsou vyplněna všechna povinná pole,
- zda zvolený slovní druh/model/hodnota patří do veřejného seznamu aktuální rules verze,
- zda zvolená ID syntaktických vazeb existují ve stejném draftu,
- zda není self-reference tam, kde je zakázána,
- zda je vložen požadovaný počet vztahů,
- zda jsou vloženy povinné zdroje/obhajoba tam, kde to veřejné schema vyžaduje,
- zda deklarovaná soutěžní identita není v téže větě podruhé **stejně deklarována**.

Poslední kontrola neříká, že identita je jazykově platná. Pouze říká: „uživatel deklaroval dvakrát stejný identity key“.

### C. Explicitní cross-field invarianty

FE může odmítnout kombinaci, která je v rozporu s jasným veřejným pravidlem a nevyžaduje lingvistické rozhodnutí.

Typický příklad:

- jednoznakový `k/v/z` může používat délkovou výjimku jen jako povolená předložka,
- jednoznakový `a/i` jen jako povolená spojka,
- POS `prep` nesmí být přiřazen víceznakovému tokenu,
- POS `conj` nesmí být přiřazen jinému povrchu než `a/i`.

Frontend má chybu označit, ale **nemá za hráče automaticky zvolit správnou analýzu**.

## 3.2 FE může kontrolovat až po uzavření veřejných modelů

Po dokončení #1–#5 bude možné živě kontrolovat například:

- zda jsou všechny soutěžně povinné morfologické kategorie konkrétního tokenu deklarované,
- zda zvolená hodnota patří do povoleného enumu daného modelu,
- zda je uveden slovesný časovací typ,
- zda je uveden povolený vid,
- zda je uveden valenční rámec a požadovaný slot,
- zda jsou vložena pole pro possessive model, pronoun model nebo jiné schválené mechanismy,
- zda je deklarován typ skutečné slovo / kvazislovo podle finálního field schematu,
- zda je zadán požadovaný zdroj pro skutečné slovo.

Pozor: i zde musí být rozlišeno **„deklarace je strukturálně úplná“** od **„deklarace je jazykově správná“**.

## 3.3 FE nemá před odesláním rozhodovat

Bez interního katalogu/admin review nemá frontend tvrdit zejména:

- že skutečné české slovo opravdu existuje v IJP/ASSČ,
- že uvedený zdroj dokládá právě deklarovanou reálnou identitu,
- že konkrétní skloňování nebo časování je jazykově správné,
- že kvazislovo skutečně splňuje celý normativní model, pokud to vyžaduje jazykový/katalogový výklad nad rámec mechanického veřejného testu,
- že zvolená běžná syntaktická vazba je významově správná,
- že předmět skutečně naplňuje valenci použitého slovesa,
- že příslovečné určení/přívlastek/doplněk je sémanticky obhajitelný,
- že fiktivní význam a česká analogie jsou přesvědčivé,
- že interní katalog dané slovo/tvar/identitu zná,
- že autor dodržel tool/AI policy.

Frontend rovněž nesmí:

- navrhovat jiné kandidátní slovo,
- navrhovat správný tvar,
- generovat celé paradigma hráčova kvazislova,
- automaticky hledat „lepší“ syntaktický target,
- filtrovat kandidáty způsobem, který by fungoval jako řešitelská nápověda,
- poskytovat rozhraní vhodné pro batch/oracle testování.

---

# 4. Co je v `konfigurator.html` navrženo dobře

## 4.1 Token jako základní jednotka

Architektura požaduje samostatná slova v pevném pořadí a mezery generované aplikací. Prototyp toto dodržuje.

To je správný základ pro:

- stabilní token ID,
- syntaktické reference,
- přesný word count,
- immutable budoucí submission revision,
- editaci bez závislosti na textových pozicích.

## 4.2 Znakový DFA

DFA modeluje stavy uvnitř motivu a zkouší všechny možné počáteční pozice. Při zpracování tokenu kontroluje, že se běžný token nevrátí na začátek dalšího motivu před svým posledním znakem.

Tím pokrývá dříve nalezený problém #29: nestačí validovat jen concatenated string; musí existovat společný rozklad respektující token boundaries.

Na statickém průchodu nebyla v samotné DFA logice nalezena zjevná chyba. Přesto nejde o produkčně uzavřený validátor, dokud nebude:

- oddělen od UI,
- normalizovat NFC vstup,
- pokryt pozitivními/negativními regresními testy,
- porovnán s referenčním modelem/property testy.

Konkrétní poznatky byly doplněny do issue #7.

## 4.3 Doplněk a koordinace

Prototyp už má oddělené relation fields:

- doplněk → přísudek + podmět/předmět,
- koordinace → dvě spojované části.

To odpovídá dílčímu rozhodnutí v #5 a uzavřenému nálezu #25.

## 4.4 Interní katalog není dostupný

Prototyp nemá žádný live lookup do interního katalogu. To je správně a musí to tak zůstat i po napojení na BE.

---

# 5. Hlavní auditní nálezy konfigurátoru

Audit vytvořil nové issues **#46–#59**.

## #46 HIGH – submit gate může být falešně zelený

`ready` ignoruje `syntaxOk`; některé handlery po změně stavu nepřekreslí submit; samotný submit znovu nevaliduje.

**Priorita:** okamžitá technická oprava ještě v prototypu.

## #47 HIGH – ručně potvrzované celé paradigma je nevhodný model formuláře

Hráč dnes ručně edituje desítky forem a kliká „morfologická identifikace potvrzena“. To není cílová strukturovaná deklarace tokenu.

Správný směr:

- deklarovat základní tvar/lemma,
- vybrat veřejný soutěžní model,
- deklarovat morfologické hodnoty právě použitého tvaru,
- obecný model/paradigma zobrazovat případně jako normativní nápovědu,
- **negenerovat konkrétní kandidátní tvary hráčova slova**.

## #48 HIGH – config completeness je podstatně slabší než již přijaté požadavky

`configMissing()` dnes kontroluje jen POS, syntax role, pattern a aspect.

Chybí zejména:

- úplná soutěžní identifikace,
- skutečné vs. kvazi podle celé identity,
- morfologické hodnoty konkrétního tokenu,
- zdroje a obhajoba,
- slovesný typ/valence,
- valenční slot objektu,
- další model-specific data.

Toto není jen budoucí přání; issue #5 už má závazná dílčí rozhodnutí, že token tyto skupiny údajů strukturovaně obsahuje.

## #49 HIGH – chybí právě jeden plnovýznamový slovesný token

Prototyp kontroluje jeden `vf=prisudek`, nikoli oddělené pravidlo jednoho full lexical verb tokenu.

Přesné řešení závisí na #4, protože případná pomocná slovesná větev je stále předmětem reachability.

## #50 HIGH – jednopísmenné výjimky nejsou svázány s deklarovaným POS

Délková výjimka je dnes čistě podle surface stringu. Token `k` může uživatel deklarovat jako jiný POS a víceznakový token může deklarovat jako `prep`.

FE má takový rozpor odmítnout jako explicitní cross-field chybu, ale nemá za hráče POS automaticky vybrat.

## #51 HIGH – chybí datová reprezentace samotné předložky

Předložka `k/v/z` je token, ale současný model jí nutí přiřadit jednu z hlavních větných funkcí. Repo dosud výslovně neřeší, zda má mít vlastní technickou relation role, nebo být členem prepositional group navázané na jmenný token.

Jde o skutečný otevřený designový problém #5/#8, který prototyp dnes maskuje generickým `headId`.

## #52 HIGH – prototyp hardcoduje otevřená TODO

Konkrétní vidy, verb morphology, pronouns a hraniční mechanismy jsou zobrazeny jako hotové, i když #1–#4 nejsou uzavřené.

Pro UX experiment je mock data v pořádku, ale musí mít explicitní status `draft/experimental` a nesmí určovat submit readiness.

Produkční formulář má hodnoty získávat z verzované veřejné rules specifikace, ne z ručně duplikovaných JS arrays.

## #53 HIGH – morfologické potvrzení je stale

Po potvrzení lze změnit morph cells, lemma nebo aspect, ale `morfoConfirmed` zůstává true.

Doporučení: boolean potvrzení úplně odstranit z validačního mechanismu. Pokud někdy bude potřeba čestné prohlášení, má se vztahovat na celou uzamčenou submission revision, ne na jednu dynamickou tabulku.

## #54 MEDIUM – nelze editovat/vkládat token uprostřed věty

Pro soutěž o co nejdelší větu je destruktivní suffix re-entry nevhodný.

MVP by mělo alespoň umět:

- editovat surface token,
- vložit token před/za existující token,
- zachovat stabilní token IDs,
- cíleně zneplatnit odvozená data závislá na změněném povrchu.

## #55 MEDIUM – přístupnost

Klikací `div`/`span`, nepropojené labely a chybějící live regiony jsou nevhodné pro veřejný formulář.

Refaktor má preferovat nativní controls před ARIA simulací.

## #56 MEDIUM – chybí fallback pro případ, který UI neumí zaznamenat

Normativní pravidla říkají, že omezení aplikace nesmí změnit soutěžní platnost. Cílový flow musí mít jasnou cestu k ručnímu posouzení, pokud formulář legitimní případ neumí strukturovat.

## #57 LOW – default je odborná terminologie

Výchozí `Substantivum / Singulár / Predikát` jde proti cíli běžné veřejnosti. Doporučení: default školní/uživatelská terminologie, expert mode volitelně.

## #58 MEDIUM – stav UI zaměňuje formální připravenost s jazykovou platností

Před admin review má UI používat pojmy typu:

- znaková kontrola OK,
- strukturované údaje úplné,
- připraveno k odeslání,
- čeká na jazykové posouzení.

Obecné „věta je platná“ patří až za jazykový/admin verdict.

## #59 MEDIUM – chybí FE NFC normalizace

Stejný vizuální znak s diakritikou může mít předkomponovanou a decomposed podobu. FE má před validací normalizovat do NFC; BE normalizaci samozřejmě zopakuje autoritativně.

---

# 6. Doplňující zjištění k již existujícím issues

## Issue #30 – sentence mode a koncová interpunkce

Prototyp:

- vždy připojí `.`,
- z inputu stripuje pouze trailing `.`,
- `?` a `!` spadnou do tokenového whitelist erroru,
- vždy požaduje právě jeden explicitní podmět,
- neumí tedy povolený imperativ s nevyjádřeným podmětem.

Do #30 byl doplněn konkrétní důkaz z prototypu.

Cílový model má mít sentence-level:

- deklarovaný režim potřebný pro imperativní výjimku,
- finální punctuation `. / ? / !`.

Interpunkce není část tokenového inputu.

## Issue #7 – znakový validátor

DFA prototypu je dobrý implementační kandidát, ale #7 musí ještě uzavřít:

- NFC,
- FE/BE whitelist behavior,
- čisté validator API,
- regresní/property test model,
- přesný error taxonomy,
- vztah znakové kontroly k ostatním strukturálním validatorům.

---

# 7. Doporučený cílový FE datový model

Toto není finální rozhodnutí #5, ale doporučená **architektonická kostra**, která umožňuje #5 později doplnit bez přepisu celé aplikace.

## 7.1 Sentence draft

Konceptuálně:

```text
SentenceDraft
- rulesVersion
- sentenceMode / subjectMode   (až po rozhodnutí #30)
- finalPunctuation
- orderedTokenIds[]
- uiStatus
```

Samotný preview text je odvozený z tokenů; není samostatný zdroj pravdy.

## 7.2 Token draft

```text
TokenDraft
- id
- surfaceForm
- partOfSpeech
- modelId
- identityFields {...}
- formMorphValues {...}
- syntaxRole
- syntaxRelations[]
- evidence[]
- justification fields {...}
- ui metadata / dirty state
```

Konkrétní `identityFields`, `formMorphValues` a evidence schema musí pocházet z #1–#5, ne být znovu rozhodnuté v JavaScriptu.

## 7.3 Public rules schema

Produkční FE by ideálně pracoval s verzovaným veřejným manifestem, například konceptuálně:

```text
PublicRuleSchema
- rulesVersion
- partOfSpeech definitions
- public models
- model field schema
- public enum values
- syntax relation cardinalities
- character validation config/version
- status: approved only
```

Tento manifest **neobsahuje interní katalog slov**.

Výhoda: stejná specifikace může řídit:

- render formuláře,
- completeness validation,
- public enum membership,
- serialization submission,
- admin detail,
- test fixtures.

Tím se odstraní dnešní problém, kdy stejné pravidlo existuje zvlášť v dokumentaci, arrays v HTML a ručních `if` podmínkách.

---

# 8. Doporučená validační pipeline FE

## Vrstva 0 – normalizace

- NFC,
- interní case normalization jen tam, kde pravidla ignorují case,
- žádné automatické opravy kandidátního obsahu.

## Vrstva 1 – character/token validation

Čistá funkce:

```text
validateTokenSequence(tokens)
```

Vrací pouze:

- pass/fail,
- konkrétní porušení,
- token ID/position,
- mechanický metadata detail.

Nevrací návrh opravy.

## Vrstva 2 – schema completeness

Kontroluje:

- required fields,
- public enums,
- public model IDs,
- relation cardinality,
- existence referenced IDs,
- evidence presence where required.

## Vrstva 3 – cross-field structural invariants

Např.:

- one-char exception ↔ declared POS,
- právě jeden deklarovaný subject podle sentence mode,
- právě jeden predicate,
- právě jeden full lexical verb podle schváleného verb modelu,
- supplement relation shape,
- coordination relation shape,
- duplicate declared identity key.

Tato vrstva nesmí sklouznout k hodnocení běžné jazykové správnosti.

## Vrstva 4 – submit readiness

`readyForSubmit` musí být jediná čistá funkce aktuálního stavu a nesmí být ručně udržovaný stale boolean.

Každá mutace draftu vede k:

1. invalidaci závislých odvozených stavů,
2. novému validačnímu výsledku,
3. novému renderu.

Při kliknutí na submit se validace provede znovu synchronně nad aktuálním snapshotem.

## Vrstva 5 – server

BE opakuje všechny mechanické kontroly. FE není bezpečnostní ani soutěžní autorita.

Teprve po vytvoření immutable revision může interní katalog/admin review posoudit katalogovou a jazykovou část.

---

# 9. Invalidation model

Současný `morfoConfirmed` ukazuje, proč je potřeba explicitní dependency model.

Příklady:

- změna `surfaceForm` zneplatní character validation a všechny identity/morph tvrzení závislé na tvaru,
- změna POS zneplatní model, identity schema, morph values a POS-specific relations,
- změna modelu zneplatní model-specific identity/morph fields,
- změna syntax role zneplatní předchozí syntax relations,
- smazání tokenu zneplatní všechny refs na jeho ID,
- změna rules version musí přerenderovat schema a znovu vyhodnotit celý draft.

Doporučení: nepoužívat jednotlivé ruční `renderX()` volané z různých handlerů. Místo toho:

```text
mutateDraft(action)
 -> normalize dependent state
 -> validate all public layers
 -> render from current state
```

To přímo řeší #46 a #53.

---

# 10. UX doporučení

## 10.1 Formulář tokenu má být krátký a progresivní

Hlavní obrazovka nemá zobrazovat celé paradigma. Vhodnější tok:

1. surface token,
2. POS,
3. model,
4. konkrétní morfologická identifikace použitého tvaru,
5. syntax role + potřebné relations,
6. evidence/justification podle podmínek.

Pokročilé vysvětlení veřejného modelu lze rozbalit bokem.

## 10.2 Nepoužívat zelenou jako „jazykově správné“

Zelená může znamenat:

- `technicky v pořádku`,
- `povinná pole vyplněna`,
- `připraveno k odeslání`.

Jazykové schválení musí mít jiný, až post-submit stav.

## 10.3 Chyba má popsat porušení, ne řešení

Dobré:

> Token 4 má dvě vazby, tato role vyžaduje právě jednu.

Nevhodné:

> Vyber jako řídící slovo token 2.

Dobré:

> Jednopísmenný token `k` používá soutěžní výjimku, ale jeho deklarovaný slovní druh není povolená předložka.

Nevhodné:

> Nastavuji slovní druh na předložku.

## 10.4 Editor musí počítat s dlouhou větou

Minimální MVP operace:

- edit token,
- insert before/after,
- delete,
- stabilní ID,
- jasné zvýraznění broken references,
- rychlé přeskočení na token s blockerem.

---

# 11. Testovací strategie

## 11.1 Character validator

Povinné unit/regression testy:

- všechny varianty motif transition,
- každý možný start state,
- ukončení uvnitř motivu,
- `Q` vs. `KV`,
- diakritické varianty,
- invalid char,
- délky 1/2/3/5/6,
- každá one-char exception,
- duplicate one-char exception,
- joined sequence valid, ale token překračuje motif boundary,
- více tokenizací stejného concat stringu s rozdílným výsledkem.

Property test: porovnat DFA s jednoduchým referenčním enumerátorem krátkých kombinací 16 úplných motivů a všech možných povolených začátků/konců.

## 11.2 Form state

Testovat sekvence akcí, ne jen výsledný objekt:

- valid → change syntax role → submit must lock,
- valid → delete referenced token → dependent relation blocker,
- valid → change surface → dependent identity/morph state invalidated,
- confirm/complete → edit data → completion recalculated,
- insert token in middle → IDs and refs preserved,
- switch rules version → stale schema cannot remain approved.

## 11.3 Structural schema

Pro každý schválený syntax role/model fixture:

- chybějící required field,
- extra/invalid public enum,
- nonexistent ref,
- duplicate relation target where forbidden,
- supplement/coordination relation cardinality.

## 11.4 Accessibility

- keyboard-only flow,
- focus order after insert/delete,
- screen reader labels,
- live blocker announcement,
- no state communicated only by color.

---

# 12. Doporučené pořadí řešení

## P0 – opravit i v prototypu ihned

1. **#46** – sjednotit submit gate a final revalidation.
2. **#53** – odstranit stale `morfoConfirmed` logiku nebo ji dočasně vyřadit ze submit gate.
3. **#59** – NFC normalization.
4. Doplnit jasné označení prototypu/draft polí podle **#52**.

Tyto kroky nevyžadují nové jazykové rozhodnutí.

## P1 – uzavřít form schema

5. #5 + **#48** – definovat povinné skupiny/fields per POS/model.
6. **#47** – nahradit full-paradigm editor structured used-form analysis.
7. **#51** – rozhodnout reprezentaci předložky.
8. #30 – sentence mode + terminal punctuation.
9. #4/#5 + **#49** – explicitní model full lexical verb vs. případný helper.

## P2 – datově řízený FE

10. Převést schválené public modely z hardcoded JS arrays do versioned public rules schema.
11. Vygenerovat UI i completeness validator z téhož schema.
12. Přidat local duplicate declared identity check.
13. Přidat explicitní fallback **#56**.

## P3 – UX/public quality

14. **#54** edit/insert tokenů.
15. **#55** accessibility.
16. **#57** default jednoduchá terminologie.
17. **#58** přesná terminologie stavů.

---

# 13. Závěr

Současný `konfigurator.html` je užitečný a několik jeho architektonických nápadů stojí za zachování:

- tokenový editor,
- stable IDs,
- DFA,
- samostatný syntax relation state,
- validační přehled.

Neměl by se ale dále rozvíjet tak, že se do něj ručně přidávají další tabulky a `if` podmínky podle postupně vznikajících pravidel.

**Doporučený zlomový krok je přejít od „HTML prototypu, který obsahuje pravidla“ k „formuláři, který renderuje zveřejněné schema aktuální rules verze“.**

Frontend pak může velmi dobře dělat to, co po něm projekt požaduje:

- okamžitě odhalit technické a strukturální chyby,
- zabránit neúplnému podání,
- dát hráči přesnou nenápovědnou zpětnou vazbu,
- neprozradit interní katalog,
- a hlavně **nepředstírat jazykového rozhodčího**.

Tento směr zároveň minimalizuje riziko, že se budoucí změna pravidel bude muset ručně synchronizovat mezi dokumentací, JavaScriptem, backendem a databází.