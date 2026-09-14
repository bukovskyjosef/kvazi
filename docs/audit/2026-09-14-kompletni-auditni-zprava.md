# Kompletní auditní zpráva – 2026-09-14

> **Status:** nenormativní auditní zpráva. Neprovádí produktová ani pravidlová rozhodnutí. Slouží jako podklad pro revizi otevřených `[DECISION]` issues, auditních nálezů a následný plán řešení.

## 1. Účel zprávy

Tato zpráva konsoliduje nezávislý audit provedený podle:

- `/AGENTS.md`,
- `docs/audit/README.md`,
- `docs/kvazitahak/00-audit-brief.md`,
- umbrella issue #11,
- otevřených `[DECISION]` issues #1–#10,
- celého aktuálního repozitáře včetně pravidel, kvazitaháku, governance, architektury a `db/schema-draft.sql`.

Audit vytvořil 34 samostatných nálezů #12–#45:

- **1 critical**,
- **21 high**,
- **12 medium**.

Zpráva nemá nahradit jednotlivá auditní issues. Jejím cílem je vysvětlit, **které nálezy mají společnou příčinu, které jsou blokující, do kterých existujících rozhodnutí patří a v jakém pořadí má smysl problémy revidovat**.

---

# 2. Celkový verdikt

Repozitář má nadprůměrně dobře nastavenou procesní architekturu:

- jasný source of truth,
- explicitního decision ownera,
- oddělení normativních pravidel, vysvětlující vrstvy, architektury a implementace,
- zákaz skrytých pravidel v UI/DB/kódu,
- samostatný auditní workflow,
- vědomě otevřené TODO a `[DECISION]` backlogy.

To je silný základ a zásadně snižuje riziko, že vývojový agent začne produktová pravidla domýšlet.

**Repozitář ale ještě není připraven na plnou implementaci soutěžního MVP.**

Bezpečně lze implementovat pouze technický skeleton, který nepředjímá otevřené volby. Před uzavřením submission flow, produkčního DB modelu, morfologického katalogu, revalidace a veřejného soutěžního provozu je nutné vyřešit několik základních produktových a datových otázek.

Největší rizika nejsou jednotlivé SQL detaily, ale čtyři systémové oblasti:

1. **co přesně znamená férové lidské řešení a jaké nástroje jsou dovoleny,**
2. **zda jsou jazykové modely skutečně uzavřené, konečné a předvídatelné pro běžného hráče,**
3. **zda je každé historické rozhodnutí reprodukovatelné podle konkrétní verze pravidel, katalogu a validátoru,**
4. **zda datový model zachovává rozdíl mezi podáním hráče, systémovou pravdou, konkrétní immutable revizí a administrativním rozhodnutím.**

---

# 3. Co audit nepovažuje za chybu

Některé důležité části jsou záměrně nedokončené. Samotná jejich nedokončenost není auditním nálezem, protože je již transparentně pokryta rozhodovacím backlogem.

Patří sem zejména:

- kompletní normativní paradigmata substantiv a adjektiv – #1,
- uzavřené slovesné časovací typy – #2,
- valenční rámce a vid – #3,
- reachability a rozdělení hlavních/hraničních pravidel – #4,
- úplný morfologický formulář a soutěžní identita – #5,
- interní morfologický katalog – #6,
- finální znakový validátor – #7,
- finální architektura a DB – #8,
- release proces – #9,
- finální scope MVP – #10.

Auditní nálezy vznikly tam, kde:

- současný text obsahuje skutečnou mezeru nebo rozpor,
- otevřené rozhodnutí nemá zachycený důležitý invariant,
- technický návrh už dnes předpokládá něco, co pravidla neurčila,
- dvě vrstvy repozitáře nejsou kompatibilní,
- nebo budoucí implementace může vytvořit skryté pravidlo či bezpečnostní problém.

---

# 4. Rozhodovací balík A – férovost, lidské řešení a expert advantage

## Nálezy

- **#12 critical** – normativní pravidla nezakazují ne-AI automatické řešení,
- **#13 medium** – AI policy má nejasnou hranici pro obecné jazykové dotazy,
- **#39 medium** – otevřený inventář skutečných slov zachovává lexikální expert advantage,
- **#31 high** – veřejná morfologická validace může vytvořit vyhledávací oracle nad neveřejným katalogem,
- **#32 medium** – zveřejňování čekajících vět může ovlivňovat další soutěžící.

## Společná příčina

Projekt má jasnou filozofii „řešení vlastní hlavou“ a chce omezit výhodu těžby odborných databází, ale tato filozofie zatím není plně přeložena do objektivních soutěžních pravidel a provozního designu.

Nejdůležitější mezera je #12: zákaz je formulován technologicky jako zákaz AI, nikoli funkčně jako zákaz automatického generování, enumerace, hledání a optimalizace řešení.

Současně není rozhodnuto, **jaký druh expert advantage je ještě legitimní**. Uzavřená gramatika omezuje syntaktickou/morfologickou expertizu, ale otevřený lexikon skutečných slov nadále zvýhodňuje znalost okrajových slovníkových položek.

## Co musí být produktově rozhodnuto

1. Definovat povolené a zakázané chování nástrojů technologicky neutrálně.
2. Rozhodnout, zda je lexikální expert advantage legitimní součást hry.
3. Rozhodnout, zda katalog smí fungovat jako interaktivní pre-submission validátor.
4. Rozhodnout, zda jsou čekající podání veřejná, nebo neveřejná do uzavření review.
5. Sjednotit veřejnou a normativní formulaci AI/tool policy.

## Doporučené zařazení do backlogu

- #12 a #13: **samostatné produktové rozhodnutí nebo explicitní rozšíření normativní policy**, ne pouze technická část #7.
- #39: explicitně zahrnout do revize #1/#6; pokud má být lexikální expert advantage vědomá volba, zaznamenat ji do `decisions.md`.
- #31: #6 + #10.
- #32: #10.

## Gate

**#12 musí být vyřešeno před veřejnou soutěžní verzí pravidel.**

#31 a #32 musí být vyřešeny před zapnutím příslušných veřejných funkcí.

---

# 5. Rozhodovací balík B – uzavřenost jazykového systému a soutěžní identita

## Nálezy

- **#14 high** – není jasné, zda soutěžní analýza skutečného slova musí odpovídat jeho reálné morfologii,
- **#15 high** – uzavřený seznam syntaxe je příliš hrubý,
- **#42 high** – chybí invariant konečného počtu identit pro jeden povrchový tvar,
- **#30 medium** – model neukládá typ věty potřebný pro imperativní výjimku,
- **#29 high** – validátor nemá explicitní token/motif alignment kontrolu.

## Společná příčina

Repo se správně posunulo od otevřené češtiny k uzavřeným soutěžním modelům, ale „uzavřenost“ musí být definována nejen seznamem názvů vzorů či syntaktických kategorií, nýbrž **rozhodnutelnými podmínkami přípustnosti**.

Největší riziko je, že nový model nebo reinterpretace skutečného slova umožní vytvářet neomezeně mnoho formálně odlišných soutěžních identit nad stejným povrchovým materiálem.

## Co musí být rozhodnuto

1. U skutečných slov jasně definovat vztah mezi doloženým reálným lexémem a deklarovanou soutěžní morfologií.
2. Uzavřít syntaxi na úrovni, která je rozhodnutelná běžným hráčem i formulářem.
3. Přidat globální invariant: každý povrchový tvar má v jednom soutěžním modelu konečný a rozhodnutelný prostor identit.
4. Při návrhu #2/#3 tento invariant explicitně ověřit u každého slovesného typu a valenčního modelu.
5. Rozhodnout strukturovanou reprezentaci typu věty / imperativní výjimky.
6. U #7 explicitně kontrolovat i hranice jednotlivých tokenů vůči motivům.

## Doporučené zařazení

- #14 → #1, #5, #6,
- #15 → #1, #5,
- #42 → akceptační kritérium #1, #2, #3 a #5,
- #30 → #5 a #8,
- #29 → #7 a #8.

## Gate

Tento balík musí být vyřešen **před finalizací normativního kvazitaháku a morfologického formuláře**.

---

# 6. Rozhodovací balík C – reachability a hratelnost kvazitaháku

Reachability je již správně vyčleněna v #4 a audit nevytvářel duplicitní `[AUDIT]` issue jen proto, že některé větve jsou dosud TODO.

Do #4 byl během auditu vložen předběžný reachability rozbor.

## Co je potřeba při revizi #4 kontrolovat

U každého mechanismu musí být výsledek:

- **hlavní / běžně dosažitelný,**
- **hraniční / vzácně dosažitelný,**
- **prokazatelně nedosažitelný.**

Nestačí „nenašli jsme příklad“.

Každá ponechaná hlavní mechanika musí zároveň splnit:

1. hráč ji dokáže pochopit z kvazitaháku,
2. nepředpokládá neveřejnou odbornou znalost,
3. je reprezentovatelná ve formuláři,
4. nepřidává neomezený identitní prostor (#42),
5. existuje realistická cesta, jak ji vůbec zapsat v soutěžním znakovém systému.

## Gate

Reachability má být uzavřena **před finální redakcí veřejného kvazitaháku**, ale technický skeleton na ni čekat nemusí.

---

# 7. Rozhodovací balík D – verzování, výklad a historická reprodukovatelnost

## Nálezy

- **#16 high** – výklad pravidla může změnit platnost bez změny rules verze,
- **#17 high** – revalidace nerozlišuje jazykovou platnost a soutěžní proces,
- **#18 high** – normativní číselníky nejsou svázané s rules verzí,
- **#19 high** – catalog version nehistoruje kompletní validační znalost,
- **#20 high** – validační výsledek nemá úplnou provenance rules/catalog/validator,
- **#40 high** – skóre revize není verzované podle rules verze,
- **#44 medium** – rules verze nemá jednoznačný manifest normativního balíku.

## Společná příčina

Projekt chce současně:

- immutable historická podání,
- nové verze pravidel,
- nové verze katalogu,
- revalidaci starého podání podle nových pravidel,
- zachování historického výsledku.

To funguje jen tehdy, pokud každé rozhodnutí lze později přesně reprodukovat.

Aktuální model zatím neříká dostatečně přesně:

> „Tato konkrétní immutable revize byla posouzena podle přesně tohoto normativního balíku, tohoto stavu katalogu, této verze validátoru a této interpretace pravidel a dostala tento výsledek a toto skóre.“

## Doporučený cílový invariant

Každé rozhodující validační rozhodnutí musí být schopné určit minimálně:

- `sentence_revision`,
- `rule_version`,
- přesný manifest normativního balíku,
- `catalog_version`, pokud katalog vstoupil do rozhodnutí,
- `validator_version`, pokud automatická validace vstoupila do rozhodnutí,
- typ rozhodnutí: automatické / ruční / kombinované,
- výsledek jazykové platnosti,
- procesní compliance původního podání,
- soutěžní skóre pro danou rules verzi,
- čas a případně rozhodující autoritu/admina.

## Důležité produktové rozhodnutí

Je nutné oddělit:

1. **obsahovou/jazykovou platnost věty,**
2. **procesní způsobilost podání** (např. dodržení tool/AI policy),
3. **administrativní stav/publikaci.**

Bez tohoto oddělení bude revalidace nejasná.

## Doporučené zařazení

Tento balík má být hlavním vstupem do #9 a zároveň architektonickým vstupem do #8.

#16 a #17 jsou nejprve **produktová rozhodnutí**; #18–#20, #40 a #44 jsou následná datová/release implementace těchto rozhodnutí.

## Gate

Musí být uzavřen **před produkčními DB migracemi a před první veřejně publikovanou rules verzí, která má podporovat historickou revalidaci**.

---

# 8. Rozhodovací balík E – revize, podání a zdroj pravdy

## Nálezy

- **#21 high** – stav podání a rules verze nejsou svázané s konkrétní revizí,
- **#22 high** – text a skóre lze uložit v rozporu s tokeny,
- **#35 high** – chybí identita autora soutěžního podání.

## Společná příčina

Architektura správně říká, že `sentence_revision` je immutable, ale současný SQL návrh stále používá `sentence` jako nositele stavů, které ve skutečnosti patří ke konkrétní revizi.

Současně není explicitně určen zdroj pravdy pro text věty: tokeny nebo denormalizovaný `sentence_text`.

## Doporučený cílový model

- `sentence` = dlouhodobý kontejner / identita díla,
- `sentence_revision` = neměnná konkrétní podoba podání,
- tokeny = kanonický strukturovaný obsah revize,
- odvozený text/skóre = serverově vypočtená data,
- submission/review/validation rozhodnutí vždy odkazuje na konkrétní revizi,
- autor/submitter je explicitní entita nebo explicitní atribut submission.

## Doporučené zařazení

- produktová identita submittera → #10,
- revizní model → #8,
- formulářová vazba → #5,
- scoring provenance → #9/#40.

## Gate

Musí být uzavřen **před implementací ostrého submission workflow**.

---

# 9. Rozhodovací balík F – strukturovaná morfologie, syntax a katalog

## Nálezy

- **#23 high** – morph value může být pod nesprávnou kategorií,
- **#24 high** – `token_analysis` může kombinovat nekompatibilní katalogové entity,
- **#25 high** – DB syntaxe neumí všechny povolené vztahy,
- **#26 medium** – chybí vazba důkazů/zdrojů na konkrétní tvrzení,
- **#27 medium** – SQL nemá vrstvu povolených morfologických kombinací/paradigmat,
- **#28 high** – FK dovolují cross-revision/cross-sentence vazby,
- **#30 medium** – chybí strukturovaný typ věty.

## Společná příčina

Logický architektonický model je v několika místech bohatší než pracovní SQL draft a některé redundantní sloupce nemají databázově vynucenou konzistenci.

Zároveň `token_analysis` směšuje dvě různé věci:

- **to, co hráč deklaruje,**
- **to, co systém/katalog uznal jako známou pravdu.**

To je v rozporu s jinak správně formulovanou architektonickou zásadou jejich oddělení.

## Doporučený cílový princip

Datový model má rozlišit minimálně:

1. user-declared analysis,
2. katalogové/resolved tvrzení,
3. validační porovnání mezi nimi.

Žádný volný text nesmí být jediným nositelem informace, která je nutná k určení soutěžní platnosti.

## Doporučené zařazení

- #23–#27, #30 → #5 + #8,
- #24 a #26 zároveň → #6,
- #28 → čistě architektonická oprava v #8 po rozhodnutí cílového modelu.

## Gate

Musí být uzavřen **před finalizací produkčního DB schématu a dynamického morfologického formuláře**.

---

# 10. Rozhodovací balík G – validátor a skrytá pravidla implementace

## Nálezy

- **#29 high** – chybí explicitní token/motif alignment kontrola,
- **#31 high** – katalogový validátor může vytvořit oracle,
- **#43 medium** – provozní limity formuláře mohou vytvořit skryté maximum délky.

## Klíčová zásada

Aplikace může:

- odmítnout technicky nebezpečný request,
- omezit běžné UI,
- mít resource limits,
- mít deterministický znakový validátor.

Nesmí ale z technického omezení odvodit:

> „řešení je soutěžně neplatné“

pokud normativní pravidla takový limit neobsahují.

## Doporučené zařazení

- #29 → #7,
- #31 → #6 + #10,
- #43 → #10 + #8.

## Gate

#29 před nasazením znakového validátoru; #31 před veřejnou morfologickou kontrolou; #43 před veřejným submission formulářem.

---

# 11. Rozhodovací balík H – bezpečnost, komentáře a privacy

## Nálezy

- **#33 high** – magic link nemá atomicky uzavřené single-use chování,
- **#34 high** – není definována bezpečná renderovací policy pro uživatelský obsah,
- **#36 high** – admin auth nemá minimální security baseline,
- **#37 medium** – email normalization a kalendářní den nejsou deterministicky definovány,
- **#38 medium** – pseudonym nemá collision/key-rotation strategii,
- **#41 medium** – chybí retenční/mazací lifecycle.

## Závěr auditora

Komentáře mají na první MVP relativně vysoký bezpečnostní a privacy cost vzhledem k jejich významu pro základní soutěžní funkci.

Nejjednodušší způsob, jak výrazně zmenšit riziko a rozsah první verze, je:

- komentáře z MVP odložit,
- nebo je zapnout až po vyřešení #33, #34, #37, #38 a #41.

Admin rozhraní je jiné: pokud existuje, #34 a #36 jsou **production blockers**.

## Doporučené zařazení

- rozhodnutí „comments in/out MVP“ → #10,
- bezpečnostní baseline → #8/#10,
- následné čistě technické řešení → `[IMPLEMENTATION]` issues po uzavření rozhodnutí.

---

# 12. Rozhodovací balík I – výkon a provozní připravenost

## Nález

- **#45 medium** – chybí index plan pro hlavní query paths.

Tento nález není důvodem blokovat návrh pravidel ani technický skeleton.

Má se vyřešit až poté, co budou známy skutečné MVP dotazy a kardinality.

## Gate

Před produkčními migracemi a load/performance review, ne před produktovým návrhem.

---

# 13. Jak revidovat existující `[DECISION]` issues #1–#10

Níže je doporučená mapa, co do každého existujícího rozhodnutí při revizi doplnit.

| Decision issue | Auditní vstupy, které má explicitně pokrýt |
|---|---|
| **#1 Kvazitahák** | #14, #15, #39, #42 + výstup #4 |
| **#2 Slovesné typy** | #42; každý typ musí mít konečný a rozhodnutelný identitní prostor |
| **#3 Valence a vid** | #15, #42; uzavřenost a rozhodnutelnost |
| **#4 Reachability** | předběžný auditní komentář + pravidla z kapitoly 6 této zprávy |
| **#5 Formulář a identita** | #14, #15, #23–#27, #30; nepředjímat katalogovou pravdu |
| **#6 Interní katalog** | #14, #19, #20, #24, #26, #31, #39 |
| **#7 Znakový validátor** | #12, #22, #29; validátor ověřuje, negeneruje |
| **#8 Architektura a DB** | #17–#30, #33–#38, #40–#45 podle relevantního scope |
| **#9 Release proces** | #12, #16–#20, #40, #44 |
| **#10 MVP scope** | #31–#38, #41, #43, #45; zejména comments/pending/catalog validation |

## Důležitá poznámka

Existující #1–#10 jsou záměrně široké. Při revizi není vhodné do jejich textu pouze přidat seznam odkazů.

Každý z nich má dostat **konkrétní akceptační kritéria odvozená z auditních nálezů**. Například #8 není hotové jen tím, že vznikne nové SQL schéma; musí být doloženo, že jsou vyřešeny revize, provenance, strukturální integrita a oddělení deklarace od systémové pravdy.

---

# 14. Které auditní nálezy potřebují nové explicitní produktové rozhodnutí

Některé nálezy nelze bezpečně rozpustit pouze jako technickou opravu v existujícím širokém issue.

Audit doporučuje při tvorbě plánu zvážit samostatné `[DECISION]` položky minimálně pro:

1. **tool policy / lidské řešení** – #12 + #13,
2. **lexikální expert advantage** – #39,
3. **výklad pravidel a význam rules verze** – #16,
4. **semantiku revalidace a procesní compliance** – #17,
5. **publikaci čekajících řešení / soutěžní prioritu** – #32,
6. **identitu autora/submittera** – #35, pokud není vědomě absorbována do #10.

Důvodem není množení issues, ale skutečnost, že jde o produktová rozhodnutí, která technický agent nesmí učinit jako implementační detail.

---

# 15. Auditní priority podle gate, nikoli pouze severity

## Gate A – před uzavřením pravidel v1

Musí být rozhodnuto:

- #12,
- #13,
- #14,
- #15,
- #16,
- #17,
- #39,
- #42,
- decision issues #1–#4.

Bez toho není soutěžní systém dostatečně uzavřený a reprodukovatelný.

## Gate B – před finalizací formuláře a doménového modelu

Musí být rozhodnuto:

- #5–#7,
- #23–#30,
- vztah #14/#15/#42 k formuláři.

## Gate C – před produkční DB architekturou

Musí být vyřešeno:

- #18–#28,
- #35,
- #40,
- #44.

## Gate D – před veřejným soutěžním MVP

Musí být vyřešeno podle skutečného MVP scope:

- #29,
- #31,
- #32,
- #34,
- #36,
- #43,
- submitter/revision workflow.

Pokud jsou komentáře součástí MVP, navíc:

- #33,
- #37,
- #38,
- #41.

## Gate E – před production hardening / růstem

- #45,
- load/query review,
- další provozní tuning podle skutečného systému.

---

# 16. Doporučená redukce MVP z pohledu auditu

Nejde o finální produktové rozhodnutí, ale o nejsnazší bezpečnou cestu, kterou audit identifikoval.

První veřejné MVP lze výrazně zjednodušit takto:

1. publikovaná pravidla + kvazitahák,
2. strukturované podání po tokenech,
3. deterministický znakový validátor,
4. identita autora/submittera,
5. ruční jazykové posouzení adminem,
6. immutable revize a auditní stopa,
7. veřejné až schválené výsledky.

Do druhé fáze lze bez poškození základní hry odložit:

- veřejné komentáře,
- veřejná čekající podání,
- automatickou morfologickou validaci přes interní katalog,
- sofistikovaný námitkový/catalog workflow nad rámec minimálního ručního procesu,
- performance optimalizace, které závisejí na reálných query patterns.

Takový scope eliminuje značnou část bezpečnostních a oracle rizik, aniž by technická omezení měnila soutěžní pravidla.

---

# 17. Pravidla pro následnou triáž auditních issues

Při tvorbě plánu řešení doporučuje audit používat následující postup:

### 1. Auditní issue není automaticky implementační task

Nejdřív určit, zda nález vyžaduje:

- produktové rozhodnutí,
- změnu normativních pravidel,
- změnu architektury,
- čistě technickou opravu,
- nebo vědomé odložení mimo MVP.

### 2. Jedno rozhodnutí může vyřešit více nálezů

Například dobře navržený model validační provenance může společně řešit #18, #19, #20, #40 a část #44.

Není nutné implementovat 34 izolovaných oprav.

### 3. Samostatné nálezy zůstávají dohledatelné

I když se řeší jedním rozhodovacím balíkem, každý `[AUDIT]` issue se zavře až tehdy, když je doloženo, **jak přesně byl jeho problém vyřešen nebo vědomě přijat**.

### 4. Produktové rozhodnutí před technickým řešením

Například:

- nejdřív rozhodnout semantiku revalidace (#17),
- teprve potom navrhovat tabulky (#18–#20, #40).

### 5. Odložení je legitimní výsledek

Nález lze uzavřít i tím, že se dotčená funkcionalita vědomě vyřadí z MVP. Typicky komentáře nebo veřejný katalogový validator.

### 6. Normativní změny musí projít verzováním

Pokud řešení auditního nálezu změní soutěžní podmínku, musí následovat pravidla z `04-verzovani-a-sprava.md` a release rozhodnutí #9.

---

# 18. Doporučené pořadí revize backlogu

Zpráva doporučuje při přípravě následného plánu pracovat v tomto pořadí:

1. **férovost a tool policy**,
2. **jazykové invarianty a expert advantage**,
3. **dokončení kvazitaháku + reachability + slovesa/valence**,
4. **semantika verzování a revalidace**,
5. **formulář a soutěžní identita**,
6. **interní katalog a jeho role**,
7. **revize/doménový model a validační provenance**,
8. **produkční DB architektura**,
9. **scope veřejného MVP**,
10. **bezpečnostní hardening funkcí, které v MVP skutečně zůstanou**,
11. **produkční migrace, indexy a provozní tuning**.

Toto pořadí minimalizuje přepracování. Opačný postup – například nejprve opravit SQL a až potom rozhodnout revalidaci – by vedl k opakovaným změnám schématu.

---

# 19. Kritéria, kdy je audit vypořádaný

Umbrella audit #11 lze z pohledu této zprávy považovat za procesně vypořádaný, až když:

- každý nález #12–#45 má jednoznačný disposition,
- každý produktový nález je navázán na `[DECISION]` issue,
- každý technický nález je buď navázán na následný `[IMPLEMENTATION]` úkol, nebo explicitně odložen mimo scope,
- široká issues #1–#10 mají doplněná auditní akceptační kritéria,
- je vytvořen pořadový plán řešení se závislostmi,
- není žádný high/critical nález, který by byl pouze „vzán na vědomí“ bez vlastníka a cílového rozhodnutí.

Samotné vytvoření této zprávy není uzavřením nálezů.

---

# 20. Hlavní doporučení auditora

Neřešit 34 nálezů jako 34 paralelních úkolů.

Nejprve z nich vytvořit přibližně **6–10 rozhodovacích balíků**, uzavřít jejich produktové předpoklady a teprve poté generovat technické implementation tasks.

Nejvyšší prioritu mají:

1. #12 – definice lidského řešení a povolených nástrojů,
2. #14/#15/#42 – uzavřenost jazyka a soutěžní identity,
3. #16/#17 – význam verze a semantika revalidace,
4. #18–#20/#40/#44 – reprodukovatelná validační provenance,
5. #21–#25/#28 – správný model immutable revize, deklarace a strukturované analýzy,
6. až následně finální DB, veřejné UX a doplňkové komunitní funkce.

**Největší hodnotou dalšího kroku není psát kód, ale převést tento audit do explicitního rozhodovacího a implementačního plánu s dependency pořadím.**
