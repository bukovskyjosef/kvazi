# Verzování a správa soutěže

> **Status:** normativní procesní pravidla.

## Verze pravidel
Každé zveřejněné znění pravidel má jednoznačnou `rules_version`. Společně se verzují rozhodcovská specifikace, AI/tool policy, výslovně normativní části kvazitaháku a další pravidlové artefakty.

Každá vydaná `rules_version` má neměnný manifest normativního balíku. Manifest uvádí minimálně identifikátor/cestu každé normativní součásti a její kryptografický hash; může mít také vlastní souhrnný hash. Git commit nebo tag se může ukládat jako doplňková reference, ale sám neurčuje normativní rozsah verze.

Normativní číselníky, paradigmata a jiné strojově čitelné definice pravidel musí být součástí stejného verzovaného normativního balíku. Nesmějí se pod stejnou `rules_version` tiše změnit pouze v DB nebo kódu.

Výjimkou je **spravovaný katalog skutečných slov** popsaný níže. Ten je záměrně provozní a průběžně opravitelnou autoritou, nikoli neměnnou součástí `rules_version`.

## Výklad vs. změna
Bez nové verze jsou v pravidlových artefaktech přípustné pouze čistě redakční nebo vysvětlující úpravy, které nemění soutěžní pravidlo.

Změna soutěžního pravidla nebo autoritativního výkladu, který mění význam pravidel, vyžaduje novou `rules_version`.

Průběžná oprava nebo doplnění katalogu skutečných slov se za změnu pravidla nepovažuje a novou `rules_version` sama o sobě nevyžaduje.

Je-li neočekávaný exploit podle aktuální verze platný, řešení se uzná; exploit lze uzavřít až novou verzí pravidel.

## Podání, revize a historie
Pracovní draft je editovatelný. Každé odeslání vytváří neměnnou `sentence_revision`, která zachycuje přesný obsah a strukturovanou deklaraci v okamžiku submitu. Administrativní rozhodnutí, validační výsledky, katalogová kontrola a skóre se vážou ke konkrétní immutable revizi, nikoli k později změněnému draftu.

Je-li podání vráceno k doplnění, původní revize se nepřepisuje. Další odeslání vytvoří novou revizi.

Řešení se historicky váže k verzi pravidel platné při jeho podání. Již schválené řešení je historický fakt; běžná průběžná správa katalogu skutečných slov není důvodem k jeho bezdůvodnému zpětnému rušení.

## Revalidace
Stejná immutable revize může být bez nového podání znovu posouzena podle novější verze pravidel. Nové posouzení vytváří nový validační výsledek; nepřepisuje starý verdikt.

Aktuální žebříček používá pouze řešení platná a uznaná podle aktuální `rules_version`. Historické výsledky podle starších verzí zůstávají zachované.

Při revalidaci se znovu posuzuje obsah řešení podle nové jazykové/pravidlové verze. Způsob, jakým hráč řešení vytvořil, se zpětně nevyšetřuje ani nerevaliduje; fair-play pravidla stojí na důvěře.

Pokud se mezi verzemi změní scoring semantics, skóre je výsledkem validace konkrétní revize vůči konkrétní `rules_version`; nesmí se přepsat historické skóre jiné verze.

## Katalog skutečných slov

Pro soutěžní status **skutečného slova** je autoritou ručně spravovaný katalog skutečných slov a tvarů.

- Je-li odpovídající soutěžní identita a konkrétní použitý tvar v katalogu schválený, považuje se pro soutěž za skutečné slovo.
- Není-li v katalogu, může hráč požádat o přezkoumání nebo vznést námitku.
- Kvaziautorita může po jazykovém ověření katalog doplnit, opravit nebo zpřesnit.
- IJP, ASSČ, další jazykové příručky a odborné zdroje mohou sloužit jako podklady pro takové rozhodnutí, ale nejsou samy přímým soutěžním whitelistem.
- Katalog se může měnit průběžně a jeho jednotlivé změny nevyžadují novou `rules_version`.

Projekt tím vědomě upřednostňuje jednoduchou správu recesní hry před úplnou historickou reprodukovatelností každého externího jazykového stavu.

### Zpřístupnění katalogu hráči

Katalog se veřejně nezveřejňuje jako taxativní nebo procházetelný seznam a neposkytuje prefixové hledání, autocomplete, podobné položky ani jiný způsob objevování kandidátů.

Hráč může požádat pouze o kontrolu **vlastního kompletního návrhu**. Před kontrolou musí uvést úplnou morfologickou identitu podle příslušného soutěžního modelu a konkrétní použitý tvar. Katalog pak vrátí pouze informaci, zda tato přesná kombinace již je schválena jako skutečné slovo.

Částečné údaje se proti katalogu nevyhodnocují způsobem, který by hráči napovídal možnou identitu nebo jiný kandidát. Není-li přesná kombinace potvrzena, neznamená to samo o sobě zamítnutí; hráč ji může předložit k ručnímu posouzení a případnému doplnění katalogu.

## Interní morfologický katalog
Interní morfologický katalog je provozní znalostní báze a paměť předchozích morfologických posouzení, nikoli vyšší autorita než pravidla. Je vyhodnocován ve vztahu ke konkrétní `rules_version`.

Pro novou `rules_version` začíná automatické schvalování morfologickým katalogem prázdné. Historické katalogové znalosti starších verzí se nemažou, ale automaticky se nepřenášejí jako schválení do nové verze.

Po uzamčení podání má konkrétní soutěžní identita/tvar vůči dané verzi jednu z těchto semantik:

- `APPROVED` — přesná identita/tvar už byly podle této `rules_version` morfologicky schváleny a další shodný výskyt lze automaticky uznat,
- `REJECTED` — přesná identita/tvar už byly podle této `rules_version` zamítnuty; interně se uchovává důvod a provenance rozhodnutí,
- `UNKNOWN` — neexistuje rozhodný záznam a je nutné ruční posouzení.

`UNKNOWN` nemusí být samostatný databázový řádek; může být reprezentován absencí rozhodného záznamu. Pracovní stavy mohou existovat, nesmějí však být zaměněny za finální soutěžní verdikt.

Schválení dosud neznámé identity vytváří znalost použitelnou pro další shodné výskyty v téže `rules_version`. Zamítnutí slova/identity nezbytné pro deklarovanou analýzu vede k zamítnutí dané revize věty.

Katalogové rozhodnutí má uchovat dostatečnou auditní stopu, aby bylo zřejmé, co bylo rozhodnuto a proč; projekt však z této evidence nedělá samostatný formální jazykový právní systém.

## Autorství, spolupráce a navazování

Kvazi je otevřený kumulativní problém. Zveřejněné schválené řešení se stává legitimní součástí společné znalosti hry.

- Na zveřejněné řešení lze navázat, upravit je nebo je prodloužit.
- Lze převzít jednotlivé slovo, kvazislovo, morfologický nápad, syntaktickou konstrukci nebo jinou část zveřejněného řešení.
- Jednotlivé herní nápady nejsou předmětem výhradního soutěžního vlastnictví.
- Na jednom podání může spolupracovat více lidí a mohou být uvedeni jako spoluautoři; podíl zásluh se nevyčísluje.
- Autory konkrétního podání jsou osoby uvedené u tohoto podání. Převzetí staršího zveřejněného řešení samo o sobě nepřenáší autorství původního podání na nové.
- Přesně shodné řešení může podat více autorů. Při shodném skóre jde o společný rekord a pořadí podání nerozhoduje.

Projekt nezkoumá, zda byl zveřejněný herní nápad později znovu objeven nezávisle nebo převzat. Smyslem soutěže je posouvat nejdelší známou platnou kvazivětu, nikoli forenzně určovat původ každého dílčího nápadu.

## Veřejná prezentace schválených vět

Veřejná prezentace má ukazovat výsledek a srozumitelně vysvětlit základní stavbu věty; nemá publikovat kompletní validační spis.

Ve výsledkovém přehledu se zveřejňuje zejména samotná věta, skóre (počet slov a soutěžních znaků) a autor nebo spoluautoři.

V detailu věty se u jednotlivých slov veřejně uvádí zejména:

- použitý tvar,
- status skutečné slovo / kvazislovo,
- slovní druh,
- lemma nebo základní tvar,
- soutěžní vzor nebo model,
- základní morfologické vlastnosti konkrétního použitého tvaru,
- hlavní syntaktická role a podle potřeby jednoduché vazby na další slova.

Veřejně se standardně nezveřejňuje:

- celé paradigma,
- úplná morfologická obhajoba,
- detailní zdrojové a důkazní podklady,
- interní katalogové stavy,
- úplný záznam administrativního nebo rozhodcovského review.

Tyto neveřejné podklady mohou být zachovány pro posouzení, audit a případnou námitku. Omezený veřejný detail nemění pravidlo, že zveřejněné řešení lze jako celek i po částech legitimně použít při dalším hledání.

## Fair play a důvěra

Pravidla práce s nástroji a AI jsou čestná dohoda mezi hráči. Soutěž nebude vyžadovat pracovní logy, historii promptů ani jiné důkazy a nebude vést řízení o tom, zda hráč při hledání řešení použil zakázaný nástroj.

Odesláním řešení hráč jednoduše potvrzuje, že hrál fér a řešení vzniklo v duchu pravidel. Toto potvrzení není podkladem pro následné vyšetřování; je vyjádřením vzájemné důvěry, bez níž recesní charakter soutěže nedává smysl.

## Technická specifikace a omezení aplikace
Technická specifikace, databázový model ani UI nesmějí změnit jazykovou platnost řešení.

Pokud aplikace neumí zaznamenat případ, který pravidla dovolují, veřejný formulář na tuto možnost viditelně upozorní a odkáže hráče na kontakt s rozhodčím e-mailem. Pro MVP se kvůli tomu nezavádí samostatné fallback workflow ani nový stav podání.

Provozní limity aplikace jsou nenormativní a samy o sobě nesmějí vytvořit soutěžní maximální délku věty.

## Kvaziautorita
Kvaziautorita rozhoduje jazykovou a pravidlovou platnost řešení, interpretační spory a námitky proti katalogu skutečných slov. Nevede disciplinární řízení o tom, jak hráč řešení vytvořil.

Nemůže odmítnout řádné, platné řešení pouze proto, že se jí způsob využití pravidel nelíbí.

## Kvazicena
Kvazicena je subjektivní ocenění oddělené od objektivního rekordu.