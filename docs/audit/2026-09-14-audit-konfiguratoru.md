# Hloubkový audit `konfigurator.html` – 2026-09-14

> **HISTORICKÝ / SUPERSEDED SNAPSHOT — 2026-09-14.** Tato zpráva zachycuje stav projektu a závěry auditu k 14. 9. 2026. **Není zdrojem aktuálního backlogu, aktuálního stavu issues ani současného celkového verdiktu projektu.** Aktuální práci vždy ověřuj přímo v GitHub Issues a aktuální soutěžní pravidla v současném normativním balíku podle `docs/README.md`. Historický obsah níže se záměrně nepřepisuje podle pozdějšího vývoje.

> **Status:** nenormativní auditní zpráva po rozhodnutí decision ownera o morfologickém panelu. Nemění soutěžní pravidla. Slouží jako podklad pro revizi `konfigurator.html`, issue #5/#7/#10 a navazující implementaci formuláře.

## 1. Cíl auditu

Cílem je posoudit, zda současný prototyp `konfigurator.html`:

1. vhodně reprezentuje soutěžní podání po jednotlivých tokenech,
2. na frontendu kontroluje vše, co lze bezpečně a deterministicky zkontrolovat **bez interního BE katalogu a bez jazykového rozhodování**,
3. neposuzuje nebo nenavrhuje něco, co patří až do neveřejného admin/jazykového review,
4. odpovídá přijatým dílčím rozhodnutím o formuláři,
5. nepředjímá dosud otevřená rozhodnutí #1–#5,
6. je vhodným základem pro veřejný submission flow.

Audit porovnává `konfigurator.html` s aktuálními pravidly, kvazitahákem, architekturou, governance, DB návrhem a relevantními issues.

---

# 2. Důležité produktové rozhodnutí po auditu

Decision owner Josef Bukovský rozhodl, že **celé editovatelné paradigma zůstává záměrnou součástí formuláře**.

Morfologický panel má fungovat takto:

1. uživatel zadá token,
2. formulář může všechny relevantní buňky paradigmatu předvyplnit aktuálním povrchovým tvarem tokenu,
3. uživatel předvyplněné hodnoty zkontroluje a podle svého názoru upraví,
4. uživatel explicitně potvrdí, že aktuálně vyplněné paradigma je **jeho vlastní morfologický návrh**.

Toto rozhodnutí je pro další audit zásadní.

## 2.1 Co znamená předvyplnění

Předvyplnění stejného textu do více buněk:

- je pouze UX zkratka,
- šetří opakované psaní,
- není tvrzením, že takové paradigma je správné,
- není automatickou jazykovou analýzou,
- není generováním „správných“ morfologických forem.

Uživatel může předvyplněné hodnoty ponechat beze změny a potvrdit je. Tím pouze deklaruje, že právě takové paradigma navrhuje.

## 2.2 Co znamená potvrzení

`morfoConfirmed` má význam:

> Uživatel potvrzuje, že aktuální obsah morfologického panelu je jeho vlastní deklarovaný morfologický návrh.

Neznamená:

- „frontend paradigma ověřil“,
- „slovo je morfologicky správné“,
- „interní katalog tento návrh zná“,
- „řešení je jazykově platné“.

Jazyková správnost se řeší až po odeslání.

## 2.3 Dopad na původní auditní nález #47

Původní #47 doporučoval editor celého paradigmatu odstranit. Toto doporučení bylo decision ownerem odmítnuto.

Issue #47 bylo proto uzavřeno jako `not planned` a bylo v něm zaznamenáno výše uvedené cílové chování.

Samostatný nález #53 však zůstává platný: potvrzení musí odpovídat konkrétnímu snapshotu uživatelova návrhu a po změně potvrzovaných dat se musí zneplatnit.

---

# 3. Celkový verdikt

`konfigurator.html` je **dobrý UX a technický prototyp**, který stojí za další rozvoj.

Silné části:

- zadávání věty po samostatných tokenech,
- stabilní interní ID tokenů,
- automaticky generované mezery,
- DFA kontrola KVAZI motivů,
- kontrola hranic tokenů vůči motivům,
- specializovaná reprezentace doplňku a koordinace,
- žádný pre-submit lookup do interního katalogu,
- morfologický panel umožňující uživateli explicitně deklarovat vlastní paradigma.

Největší zbývající problémy jsou:

1. **submit gate není konzistentní se stavem validace**,
2. **token zatím neobsahuje všechny povinné části soutěžní deklarace**,
3. **některé otevřené TODO jsou v prototypu hardcodované jako hotová pravidla**,
4. **potvrzení morfologického návrhu se po změně dat nezneplatní**,
5. chybí některé strukturální a UX mechanismy potřebné pro skutečný submission flow.

Morfologické předvyplnění ani existence celého editovatelného paradigmatu už **nejsou auditním problémem**.

---

# 4. Hranice frontendu: co má validovat

Základní princip zůstává:

> Frontend před submittem kontroluje mechanickou a strukturální podobu uživatelovy deklarace. Neposuzuje její jazykovou pravdivost.

## 4.1 FE má okamžitě kontrolovat

### Znakový řetězec

- Unicode NFC normalizaci,
- soutěžní abecedu,
- délku tokenu,
- jednopísmenné výjimky `k/v/z/a/i`,
- maximálně jedno použití každé z nich,
- pořadí tokenů,
- souvislou posloupnost motivů,
- že token nepřekračuje vnitřní hranici motivu,
- počet slov,
- počet znaků,
- povolenou závěrečnou interpunkci.

Současný DFA je dobrý základ, ale má být oddělen od DOM a pokryt testy.

### Úplnost veřejného formuláře

FE smí kontrolovat:

- zda jsou vyplněna všechna povinná pole,
- zda zvolená hodnota patří do veřejného seznamu aktuální rules verze,
- zda požadované morfologické buňky uživatelského návrhu nejsou prázdné,
- zda uživatel morfologický návrh explicitně potvrdil,
- zda syntaktické reference ukazují na existující tokeny stejného draftu,
- zda je vložen požadovaný počet vazeb,
- zda jsou vloženy povinné zdroje/obhajoba tam, kde je veřejné schema vyžaduje,
- zda není dvakrát stejně deklarována tatáž soutěžní identita, až bude identity schema dokončeno.

Kontrola úplnosti morfologického paradigmatu znamená pouze například:

> „V povinné buňce chybí hodnota.“

Nikoli:

> „Tato hodnota je chybný tvar.“

## 4.2 FE smí předvyplňovat morfologické buňky

Explicitně povolené cílové UX:

- po vytvoření tokenu nebo zvolení modelu lze relevantní morfologické buňky předvyplnit povrchovým tvarem tokenu,
- uživatel je může ponechat nebo změnit,
- předvyplněný obsah musí být editovatelný,
- předvyplnění nesmí být vizuálně komunikováno jako ověřený výsledek,
- systém nemá na základě češtiny dopočítávat „správné“ alternativní tvary.

Je vhodné předvyplněný stav vizuálně odlišit od uživatelem explicitně potvrzeného návrhu.

## 4.3 FE nemá posuzovat jazykovou správnost

Před submittem nemá rozhodovat zejména:

- zda skutečné české slovo existuje v IJP/ASSČ,
- zda zdroj skutečně dokládá deklarovanou identitu,
- zda jednotlivé tvary uživatelského paradigmatu jsou správné,
- zda skloňování nebo časování odpovídá češtině,
- zda kvazislovo skutečně splňuje celý normativní model,
- zda běžná syntaktická vazba je významově správná,
- zda předmět opravdu naplňuje valenci slovesa,
- zda fiktivní význam nebo analogie obstojí,
- zda interní katalog dané slovo/tvar/identitu zná,
- zda autor dodržel tool/AI policy.

FE také nesmí hráči navrhovat:

- jiné kandidátní slovo,
- jiný „správný“ tvar,
- opravené paradigma,
- lepší syntaktický target,
- jiné řešení.

Rozdíl je důležitý:

- **předvyplnit tutéž uživatelem zadanou hodnotu** do buněk = povolená UX zkratka,
- **odvodit z ní jiné morfologické tvary** = už jazykový návrh systému, který před submittem nechceme.

---

# 5. Auditní nálezy #46–#59 po revizi

## #46 HIGH – submit gate může být falešně zelený

Stále platí beze změny.

`ready` ignoruje `syntaxOk`; některé handlery nepřepočítají submit stav a samotný submit nedělá poslední synchronní revalidaci.

**Doporučení:** jeden centrální validační snapshot a submit vždy znovu ověřit.

## #47 – původní doporučení zamítnuto

Původní nález „celé paradigma je nevhodný model“ se po rozhodnutí decision ownera nepoužije.

Cílový stav je:

- celé paradigma editovatelné,
- předvyplnění povrchovým tvarem povoleno,
- explicitní potvrzení uživatelského návrhu zachováno,
- FE jazykovou správnost nehodnotí.

Issue #47 je uzavřeno jako `not planned`.

## #48 HIGH – config completeness je stále příliš slabší než úplné podání

Tento nález zůstává platný, ale **neznamená odstranění morfologické tabulky**.

Vedle uživatelsky navrženého paradigmatu musí token podle finálního field schematu umět zachytit všechny soutěžně požadované údaje, například podle POS/modelu:

- základní tvar/lemma,
- soutěžní model,
- vlastnosti tvořící soutěžní identitu,
- skutečné slovo vs. kvazislovo,
- syntaktickou funkci a vztahy,
- zdroje/obhajobu,
- slovesný typ/valenci po jejich schválení,
- další model-specific data.

Současný `configMissing()` toto nepokrývá.

## #49 HIGH – chybí právě jeden plnovýznamový slovesný token

Platí. Přesná podoba závisí na #4/#5 kvůli případným pomocným slovesům.

## #50 HIGH – jednopísmenné výjimky nejsou svázány s deklarovaným POS

Platí.

FE může deterministicky kontrolovat, že `k/v/z` jsou v soutěžním mechanismu předložky a `a/i` spojky. Nemá však automaticky doplňovat další jazykovou analýzu.

## #51 HIGH – chybí datová reprezentace samotné předložky

Platí jako otevřený designový problém #5/#8.

## #52 HIGH – prototyp hardcoduje otevřená TODO

Platí.

Mock data jsou pro UX prototyp přípustná, ale draft enumy nesmějí být zaměněny za definitivní veřejná pravidla.

## #53 HIGH – potvrzení morfologického návrhu je stale

Nález zůstává, ale jeho cílové řešení bylo změněno.

**`morfoConfirmed` se nemá odstranit.**

Má se zajistit, že potvrzení platí právě pro aktuální obsah návrhu. Jakákoli změna hodnoty, která do potvrzeného morfologického návrhu patří, musí:

- automaticky nastavit potvrzení zpět na `false`, nebo
- způsobit neshodu s uloženým confirmation hash/revision.

Předvyplněné hodnoty lze potvrdit i beze změny.

## #54 MEDIUM – editor neumí editovat/vkládat token uprostřed věty

Platí.

## #55 MEDIUM – přístupnost

Platí.

## #56 MEDIUM – fallback pro případ, který UI neumí zaznamenat

Platí.

## #57 LOW – výchozí odborná terminologie

Platí jako UX doporučení.

## #58 MEDIUM – UI zaměňuje připravenost s jazykovou platností

Platí a po rozhodnutí o morfologickém potvrzení je ještě důležitější.

Text tlačítka/hlášky by měl být například:

> „Potvrzuji, že toto je můj morfologický návrh.“

Nikoli formulace, která by mohla znamenat:

> „Morfologická správnost byla potvrzena.“

## #59 MEDIUM – chybí FE NFC normalizace

Platí.

---

# 6. Doporučený cílový datový model formuláře

Toto není finální rozhodnutí #5, ale architektonická kostra.

## SentenceDraft

```text
SentenceDraft
- rulesVersion
- sentenceMode / subjectMode
- finalPunctuation
- orderedTokenIds[]
```

## TokenDraft

```text
TokenDraft
- id
- surfaceForm
- partOfSpeech
- modelId
- identityFields {...}
- proposedParadigm {...}
- morphologyConfirmation {...}
- syntaxRole
- syntaxRelations[]
- evidence[]
- justification fields {...}
```

Důležitý rozdíl oproti původnímu auditu:

`proposedParadigm` je **prvotřídní uživatelská deklarace**, nikoli něco, co má FE nahradit pouze několika hodnotami konkrétního použitého tvaru.

Formulář přesto potřebuje strukturovaně zachytit i soutěžní identitu a další atributy vyžadované #5.

## MorphologyConfirmation

Doporučeně konceptuálně:

```text
MorphologyConfirmation
- confirmed: boolean
- confirmedAgainstRevision/hash
```

nebo ekvivalentní jednoduchý mechanismus.

Potvrzení se vztahuje k celému definovanému morfologickému návrhu tokenu. Jakmile se návrh změní, potvrzení už neplatí.

---

# 7. Doporučená FE validační pipeline

## Vrstva 0 – normalizace

- NFC,
- bezpečná textová normalizace,
- žádné jazykové opravy.

## Vrstva 1 – character/token validation

Čistá deterministická funkce pro KVAZI, délky, výjimky, motiv boundaries a score.

## Vrstva 2 – schema completeness

Kontroluje:

- povinná pole,
- veřejné enumy,
- existující reference,
- relation cardinality,
- povinné evidence fields,
- vyplnění požadovaných buněk uživatelského morfologického návrhu,
- existence aktuálního potvrzení morfologického návrhu.

## Vrstva 3 – cross-field structural invariants

Například:

- one-char exception ↔ POS,
- právě jeden subject podle sentence mode,
- právě jeden predicate,
- právě jeden full lexical verb podle schváleného modelu,
- doplněk relation shape,
- coordination relation shape,
- duplicate declared identity key.

Neověřuje jazykovou správnost obsahu paradigmatu.

## Vrstva 4 – submit readiness

`readyForSubmit` musí být čistě odvozen z aktuálního snapshotu.

Při každé změně:

1. invalidovat závislé confirmation/derived states,
2. znovu validovat,
3. renderovat aktuální stav.

Před samotným submittem validaci zopakovat.

## Vrstva 5 – post-submit review

Teprve zde přichází:

- interní katalog,
- kontrola existence reálného slova,
- kontrola skutečné správnosti morfologického návrhu,
- jazyková syntax/valence,
- admin rozhodnutí.

---

# 8. Invalidation model

Po novém rozhodnutí je invalidace `morfoConfirmed` žádoucí, nikoli odstranění potvrzení.

Příklady:

- změna libovolné buňky `proposedParadigm` → `morfoConfirmed = false`,
- změna lemma, pokud je součástí potvrzované morfologické deklarace → false,
- změna modelu/vzoru → nové předvyplnění nebo zachování podle UX rozhodnutí + confirmation false,
- změna POS → reset nekompatibilních morph fields + confirmation false,
- změna vidu nebo jiného morphology-relevant atributu → confirmation false,
- samotná změna čistě syntaktické vazby nemusí morfologické potvrzení rušit.

Doporučení je mít centrální dependency model namísto ručního resetu v jednotlivých handlerech.

---

# 9. UX morfologického panelu

Cílový tok může zůstat velmi blízko současnému prototypu:

1. uživatel vytvoří token,
2. zvolí POS/model,
3. FE připraví příslušnou tabulku,
4. buňky předvyplní povrchovým tvarem tokenu,
5. uživatel mění jen to, co chce navrhnout jinak,
6. klikne na jasně formulované potvrzení svého návrhu.

Doporučený text tlačítka:

> **Potvrzuji, že toto je můj morfologický návrh**

Po změně kterékoliv potvrzované hodnoty se tlačítko vrátí do nepotvrzeného stavu.

Lze vizuálně rozlišit:

- předvyplněná hodnota,
- uživatelem změněná hodnota,
- celý potvrzený snapshot.

Toto rozlišení je UX metadata; **nemá vliv na jazykovou platnost**. Předvyplněná a uživatelem ručně přepsaná stejná hodnota jsou z hlediska obsahu návrhu rovnocenné.

---

# 10. Testovací strategie

Vedle původních character/syntax testů doplnit testy specifické pro přijaté morphology UX:

- nový token → relevantní buňky jsou předvyplněny surface form,
- předvyplněné paradigma lze potvrdit beze změny,
- potvrzení samo nevyvolá žádný jazykový pass/fail,
- změna morph cell po potvrzení → potvrzení se zneplatní,
- změna lemma/modelu/vidu, pokud patří do confirmation scope → potvrzení se zneplatní,
- změna čistě syntaktické relation → morfologické potvrzení zůstane,
- re-confirm po změně → nový snapshot je potvrzen,
- prázdná povinná morph cell → completeness blocker,
- neobvyklá, ale neprázdná hodnota → FE ji nesmí označit jako jazykově chybnou pouze na základě vlastního odhadu,
- FE nesmí automaticky přepsat uživatelský návrh jinými tvary.

Nadále testovat:

- motif transitions a boundary cases,
- one-char exceptions,
- NFC,
- stale submit state,
- broken refs po delete,
- koordinaci a doplněk,
- insert/edit tokenu,
- keyboard/accessibility flow.

---

# 11. Revidované pořadí řešení

## P0 – čisté technické chyby

1. **#46** – centralizovat submit gate + final revalidation.
2. **#53** – zachovat confirmation, ale navázat jej na aktuální morph snapshot.
3. **#59** – NFC normalizace.
4. **#58** – upravit terminologii potvrzení a stavů, aby nebyla zaměněna deklarace za jazykový verdikt.

## P1 – form schema a struktura podání

5. **#48 + #5** – doplnit všechny povinné části soutěžní deklarace vedle celého navrhovaného paradigmatu.
6. **#51** – rozhodnout reprezentaci předložky.
7. #30 – sentence mode + terminal punctuation.
8. #4/#5 + **#49** – full lexical verb vs. případný helper.
9. **#50** – explicitní one-char/POS cross-field invariants.

## P2 – datově řízený FE

10. **#52** – oddělit schválené public rules values od mock/draft dat.
11. Renderovat formulář/completeness z veřejného schematu, ale zachovat produktové UX editovatelného paradigmatu a jeho předvyplnění.
12. Přidat local duplicate declared identity check po dokončení identity schema.
13. **#56** – explicitní manual-review fallback.

## P3 – UX/public quality

14. **#54** edit/insert tokenů.
15. **#55** accessibility.
16. **#57** jednoduchá terminologie jako default.

---

# 12. Pokyny pro vývojáře po revizi auditu

Vývojář **nemá odstranit morfologické tabulky ani předvyplnění**.

Má naopak zachovat tento produktový princip:

> Hráč předkládá svůj vlastní úplný morfologický návrh. Formulář mu jeho zápis zjednodušuje předvyplněním, ale neříká mu, zda je návrh správný.

Konkrétně:

- zachovat editovatelné celé paradigma,
- zachovat předvyplnění buňek surface formou,
- zachovat explicitní uživatelské potvrzení,
- přejmenovat/komunikovat jej jako potvrzení **návrhu**, ne správnosti,
- při každé změně confirmation scope potvrzení invalidovat,
- kontrolovat pouze úplnost morfologického návrhu, nikoli jeho lingvistickou správnost,
- neposkytovat automatické opravy či alternativní tvary,
- vedle paradigmatu doplnit ostatní strukturované údaje požadované #5.

---

# 13. Závěr

Po produktovém rozhodnutí se hodnocení morfologické části konfigurátoru významně mění.

**Samotná existence editovatelného celého paradigmatu je vhodná a odpovídá zamýšlenému submission procesu.** Stejně tak je vhodné předvyplnění všech relevantních buněk uživatelem zadaným slovem jako mechanismus snižující množství ručního psaní.

Auditní problém není „FE se ptá na celé paradigma“.

Auditní problém by vznikl až tehdy, kdyby FE:

- předvyplněné hodnoty vydával za správné,
- automaticky dopočítával jiné jazykové tvary jako návrh řešení,
- odmítal uživatelův morfologický návrh na základě vlastní jazykové interpretace,
- nebo považoval staré potvrzení za platné i po změně návrhu.

Celkový doporučený směr tedy je:

**zachovat současný interaktivní morfologický UX koncept, opravit jeho stavový model a jasně oddělit „uživatel tento návrh deklaruje“ od „systém tento návrh jazykově schválil“.**