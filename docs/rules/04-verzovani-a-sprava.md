# Verzování a správa soutěže

> **Status:** normativní procesní pravidla.

## Místo v normativním balíku

Tento dokument je autoritativní **pro verzování, revalidaci a správu normativního balíku a soutěžních výsledků**. Obecnou soutěžní platnost řeší `02-rozhodcovska-specifikace.md`, práci s AI a nástroji `03-ai-policy.md` a přesnou mechaniku jednotlivých oblastí NORMATIVNÍ moduly `../kvazitahak/01-07`. Žádný jednotlivý soubor není „úplná pravidla“; úplnou mapu autority udržuje pouze `../README.md`.

## Verze pravidel
Každé zveřejněné znění pravidel má jednoznačnou `rules_version`. Společně se verzují rozhodcovská specifikace, AI/tool policy, výslovně normativní části kvazitaháku a další pravidlové artefakty.

Každá vydaná `rules_version` má neměnný machine-readable runtime dataset a jednoduchý manifest s verzí pravidel, identifikací validátoru a kryptografickým hashem runtime dat. Frontend a backend používají stejný dataset; backend je autorita. Vydané runtime releases se nepřepisují. Pro MVP se nepožaduje hashování každého Markdown dokumentu, registry enginů ani obecný provenance systém. Úplný normativní balík nadále určuje rozsah soutěžních pravidel podle `../README.md`.

Normativní číselníky, paradigmata a jiné strojově čitelné definice pravidel musí být součástí stejného verzovaného normativního balíku. Nesmějí se pod stejnou `rules_version` tiše změnit pouze v DB nebo kódu.

Výjimkou je **spravovaný katalog skutečných slov** popsaný níže. Ten je záměrně provozní a průběžně opravitelnou lexikální autoritou, nikoli neměnnou součástí `rules_version`.

## Výklad vs. změna
Bez nové verze jsou v pravidlových artefaktech přípustné pouze čistě redakční nebo vysvětlující úpravy, které nemění soutěžní pravidlo.

Změna soutěžního pravidla nebo autoritativního výkladu, který mění význam pravidel, vyžaduje novou `rules_version`.

Průběžná oprava nebo doplnění katalogu skutečných slov se za změnu pravidla nepovažuje a novou `rules_version` sama o sobě nevyžaduje.

Je-li neočekávaný exploit podle aktuální verze platný, řešení se uzná; exploit lze uzavřít až novou verzí pravidel.

## Podání, revize a historie
Pracovní draft je editovatelný. Každé odeslání vytváří neměnnou `sentence_revision`, která zachycuje přesný obsah a strukturovanou deklaraci v okamžiku submitu. Administrativní rozhodnutí, validační výsledky, katalogová kontrola a skóre se vážou ke konkrétní immutable revizi, nikoli k později změněnému draftu.

Je-li podání vráceno k doplnění, původní revize se nepřepisuje. Další odeslání vytvoří novou revizi.

Řešení se historicky váže k verzi pravidel platné při jeho podání. Již schválené řešení je historický fakt; běžná průběžná správa katalogu skutečných slov není důvodem k jeho bezdůvodnému zpětnému rušení.

### Administrativní uznání a lexikální posouzení

Podle přijatého workflow M3 musí být před schválením konkrétní revize vyřešeny deterministická validace, nezbytné morfologické review a samostatné lexikální posouzení. U skutečného slova a zájmena musí být přesná katalogová položka potvrzená jako skutečná; u kvazislova musí být přesná položka výslovně posouzená jako nepotvrzená skutečná identita. Samotná absence katalogového záznamu před schválením nestačí. U normativního prefixu kvazi- je předmětem katalogového posouzení skutečný neprefixovaný základ; pomocné být a funkční jednopísmenné tokeny mají normativní výjimku. Nepotvrzený hráčský lookup přitom nadále neblokuje odevzdání návrhu k review.

Vrácení a zamítnutí vyžadují neprázdný plain-text důvod pro autora a mohou proběhnout i při nevyřešeném review. Jedna revize má pouze jedno standardní rozhodnutí. Vrácení poslední revize umožní autorovi nové odeslání; schválená nebo zamítnutá revize se touto cestou nepřepracovává. Historické revize, výsledky a stabilně použitá morfologická rozhodnutí se nepřepisují.

## Revalidace
Automatická revalidace starých podání není součástí MVP ani povinným krokem vydání release. Případné budoucí explicitní posouzení stejné immutable revize podle novější verze pravidel se řeší samostatně. Nové posouzení vytváří nový validační výsledek; nepřepisuje starý verdikt.

Aktuální žebříček používá pouze řešení platná a uznaná podle aktuální `rules_version`. Historické výsledky podle starších verzí zůstávají zachované.

Při revalidaci se znovu posuzuje obsah řešení podle nové jazykové/pravidlové verze. Způsob, jakým hráč řešení vytvořil, se zpětně nevyšetřuje ani nerevaliduje; fair-play pravidla stojí na důvěře.

Pokud se mezi verzemi změní scoring semantics, skóre je výsledkem validace konkrétní revize vůči konkrétní `rules_version`; nesmí se přepsat historické skóre jiné verze.

## Dvě oddělené katalogové vrstvy

Projekt používá dvě **výslovně oddělené** katalogové vrstvy:

1. **Spravovaný katalog skutečných slov** je lexikální autorita pro otázku, zda je konkrétní úplná soutěžní identita a konkrétní použitý tvar uznaným skutečným slovem. Není obecně vázán na `rules_version` a hráč k němu smí použít pouze exact-match kontrolu kompletního vlastního návrhu.
2. **Interní morfologická review cache** je neveřejná provozní paměť předchozích morfologických posouzení. Je vyhodnocována ve vztahu ke konkrétní `rules_version` a slouží ke zrychlení rozhodcovského review. Hráč k ní nemá membership lookup.

Tyto dvě vrstvy mají odlišný účel, lifecycle, viditelnost i pravidla verzování. Technická implementace je nesmí slít do jedné autority nebo jednoho významově nejasného katalogového stavu.

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

## Interní morfologická review cache
Interní morfologická review cache je provozní znalostní báze a paměť předchozích morfologických posouzení, nikoli vyšší autorita než pravidla ani katalog skutečných slov. Je vyhodnocována ve vztahu ke konkrétní `rules_version`.

Pro novou `rules_version` začíná automatické schvalování z review cache prázdné. Historické znalosti starších verzí se nemažou, ale automaticky se nepřenášejí jako schválení do nové verze.

Po uzamčení podání má konkrétní soutěžní identita/tvar vůči dané verzi jednu z těchto semantik:

- `APPROVED` — přesná identita/tvar už byly podle této `rules_version` morfologicky schváleny a další shodný výskyt lze automaticky uznat,
- `REJECTED` — přesná identita/tvar už byly podle této `rules_version` zamítnuty; interně se uchovává důvod a provenance rozhodnutí,
- `UNKNOWN` — neexistuje rozhodný záznam a je nutné ruční posouzení.

`UNKNOWN` nemusí být samostatný databázový řádek; může být reprezentován absencí rozhodného záznamu. Pracovní stavy mohou existovat, nesmějí však být zaměněny za finální soutěžní verdikt.

Schválení dosud neznámé identity vytváří znalost použitelnou pro další shodné výskyty v téže `rules_version`. Zamítnutí slova/identity nezbytné pro deklarovanou analýzu vede k zamítnutí dané revize věty.

Rozhodnutí review cache má uchovat dostatečnou auditní stopu, aby bylo zřejmé, co bylo rozhodnuto a proč; projekt však z této evidence nedělá samostatný formální jazykový právní systém.

## Autorství, spolupráce a navazování

Kvazi je otevřený kumulativní problém. Zveřejněné schválené řešení se stává legitimní součástí společné znalosti hry.

- Na zveřejněné řešení lze navázat, upravit je nebo je prodloužit.
- Lze převzít jednotlivé slovo, kvazislovo, morfologický nápad, syntaktickou konstrukci nebo jinou část zveřejněného řešení.
- Jednotlivé herní nápady nejsou předmětem výhradního soutěžního vlastnictví.
- Na řešení může fakticky spolupracovat libovolný počet lidí; soutěž jejich počet ani identity nesleduje.
- Každé podání vlastní a odevzdává právě jeden registrovaný účet.
- Registrovaný účet může reprezentovat jednotlivce i libovolný kolektiv. Registrační e-mail může patřit jednotlivci nebo skupině.
- Systém neeviduje samostatné spoluautory, jejich identity, podíly ani vztah jednotlivých osob k podání.
- Veřejná atribuce používá pouze veřejnou identitu / `username` registrovaného účtu.
- Přesně shodné řešení může podat více účtů. Při shodném primárním i sekundárním skóre jde o společný rekord a pořadí podání nerozhoduje.

Projekt nezkoumá, zda byl zveřejněný herní nápad později znovu objeven nezávisle nebo převzat ani jaké osoby stojí za registrovaným účtem. Smyslem soutěže je posouvat nejdelší známou platnou kvazivětu, nikoli forenzně určovat původ nebo personální složení týmu.

## Veřejná prezentace schválených vět

Veřejná prezentace má ukazovat výsledek a srozumitelně vysvětlit základní stavbu věty; nemá publikovat kompletní validační spis.

Ve výsledkovém přehledu se zveřejňuje zejména samotná věta, skóre (počet slov a soutěžních znaků) a veřejná identita (`username`) jednoho registrovaného účtu, který podání vlastní a odevzdal.

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
- úplný záznam administrativního nebo rozhodcovského review,
- identita jednotlivých osob stojících za registrovaným účtem; systém ji ani nemá požadovat.

Tyto neveřejné podklady mohou být zachovány pro posouzení, audit a případnou námitku. Omezený veřejný detail nemění pravidlo, že zveřejněné řešení lze jako celek i po částech legitimně použít při dalším hledání.

## Fair play a důvěra

Pravidla práce s nástroji a AI jsou čestná dohoda mezi hráči. Soutěž nebude vyžadovat pracovní logy, historii promptů ani jiné důkazy a nebude vést řízení o tom, zda hráč při hledání řešení použil zakázaný nástroj.

Submit neobsahuje potvrzení fair play ani čestné prohlášení. Dodržování pravidel pro AI a nástroje se technicky ani procesně neeviduje; zůstává věcí důvěry mezi hráči.

## Technická specifikace a omezení aplikace
Technická specifikace, databázový model ani UI nesmějí změnit jazykovou platnost řešení.

Pokud aplikace neumí zaznamenat případ, který pravidla dovolují, veřejný formulář na tuto možnost viditelně upozorní a odkáže hráče na kontakt s rozhodčím e-mailem. Pro MVP se kvůli tomu nezavádí samostatné fallback workflow ani nový stav podání.

Provozní limity aplikace jsou nenormativní a samy o sobě nesmějí vytvořit soutěžní maximální délku věty.

## Kvaziautorita
Kvaziautorita rozhoduje jazykovou a pravidlovou platnost řešení, interpretační spory a námitky proti katalogu skutečných slov. Nevede disciplinární řízení o tom, jak hráč řešení vytvořil.

Nemůže odmítnout řádné, platné řešení pouze proto, že se jí způsob využití pravidel nelíbí. Pokud platné řešení odhalí nežádoucí důsledek pravidel, změna se provede až v budoucí verzi pravidel.
