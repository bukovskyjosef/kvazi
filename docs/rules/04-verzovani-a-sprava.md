# Verzování a správa soutěže

> **Status:** normativní procesní pravidla.

## Verze pravidel
Každé zveřejněné znění pravidel má jednoznačnou `rules_version`. Společně se verzují rozhodcovská specifikace, AI/tool policy, výslovně normativní části kvazitaháku a všechny další artefakty, jejichž obsah může změnit soutěžní verdikt.

Každá vydaná `rules_version` má neměnný manifest normativního balíku. Manifest uvádí minimálně identifikátor/cestu každé normativní součásti a její kryptografický hash; může mít také vlastní souhrnný hash. Git commit nebo tag se může ukládat jako doplňková reference, ale sám neurčuje normativní rozsah verze.

Normativní číselníky, paradigmata a jiné strojově čitelné definice, které mohou změnit verdikt, musí být součástí stejného verzovaného normativního balíku. Nesmějí se pod stejnou `rules_version` tiše změnit pouze v DB nebo kódu.

## Výklad vs. změna
Bez nové verze jsou přípustné pouze čistě redakční nebo vysvětlující úpravy, které nemohou změnit výsledek žádného soutěžního řešení.

Jakákoli změna, doplnění, odstranění nebo autoritativní výklad, který může změnit platnost alespoň jednoho řešení, vyžaduje novou `rules_version` (typicky patch release).

Je-li neočekávaný exploit podle aktuální verze platný, řešení se uzná; exploit lze uzavřít až novou verzí pravidel.

## Podání, revize a historie
Pracovní draft je editovatelný. Každé odeslání vytváří neměnnou `sentence_revision`, která zachycuje přesný obsah a strukturovanou deklaraci v okamžiku submitu. Administrativní rozhodnutí, validační výsledky, katalogová kontrola a skóre se vážou ke konkrétní immutable revizi, nikoli k později změněnému draftu.

Je-li podání vráceno k doplnění, původní revize se nepřepisuje. Další odeslání vytvoří novou revizi.

Řešení se historicky váže k verzi pravidel platné při jeho podání. Schválení podle starší verze je neměnný historický fakt a pozdější změna pravidel jej zpětně nemaže.

## Revalidace
Stejná immutable revize může být bez nového podání znovu posouzena podle novější verze pravidel. Nové posouzení vytváří nový validační výsledek; nepřepisuje starý verdikt.

Aktuální žebříček používá pouze řešení platná a uznaná podle aktuální `rules_version`. Historické výsledky podle starších verzí zůstávají zachované.

Při revalidaci se znovu posuzuje obsah řešení podle nové jazykové/pravidlové verze. Historická compliance soutěžního procesu (například dodržení tehdy platné AI/tool policy při vytvoření podání) je fakt svázaný s původním podáním a zpětně se podle nové procesní policy nepřehodnocuje.

Pokud se mezi verzemi změní scoring semantics, skóre je výsledkem validace konkrétní revize vůči konkrétní `rules_version`; nesmí se přepsat historické skóre jiné verze.

## Interní morfologický katalog
Interní katalog je provozní znalostní báze a paměť předchozích posouzení, nikoli vyšší autorita než pravidla. Je vždy vyhodnocován ve vztahu ke konkrétní `rules_version`.

Pro novou `rules_version` začíná automatické schvalování katalogem prázdné. Historické katalogové znalosti starších verzí se nemažou, ale automaticky se nepřenášejí jako schválení do nové verze.

Po uzamčení podání má konkrétní soutěžní identita/tvar vůči dané verzi jednu z těchto semantik:

- `APPROVED` — přesná identita/tvar už byly podle této `rules_version` schváleny a další shodný výskyt lze automaticky uznat,
- `REJECTED` — přesná identita/tvar už byly podle této `rules_version` zamítnuty; interně se uchovává důvod a provenance rozhodnutí,
- `UNKNOWN` — neexistuje rozhodný záznam a je nutné ruční posouzení.

`UNKNOWN` nemusí být samostatný databázový řádek; může být reprezentován absencí rozhodného záznamu. Pracovní stavy mohou existovat, nesmějí však být zaměněny za finální soutěžní verdikt.

Schválení dosud neznámé identity vytváří znalost použitelnou pro další shodné výskyty v téže `rules_version`. Zamítnutí kteréhokoli slova/identity nezbytné pro deklarovanou analýzu vede k zamítnutí dané revize věty.

Katalogové rozhodnutí musí uchovat auditní stopu minimálně: kdo rozhodl, kdy, podle které `rules_version`, co přesně bylo rozhodnuto a s jakým odůvodněním/zdroji.

Existenci skutečného soutěžního slova lze doložit pouze slovníkovou částí IJP nebo zveřejněným heslem ASSČ. Změna této sady zdrojů je změnou soutěžního pravidla a vyžaduje novou verzi.

Veřejný formulář ani API před konečným odesláním nesdělují, zda interní katalog konkrétní slovo, tvar, identitu nebo analýzu zná. Hráč vždy předkládá úplnou požadovanou deklaraci a minimální obhajobu. Katalogová kontrola probíhá až nad uzamčenou revizí a její interní výsledek je před administrativním rozhodnutím neveřejný.

Veřejný úplný seznam přípustných českých slov, tvarů a schválených kvaziidentit se nezveřejňuje.

## Technická specifikace a omezení aplikace
Technická specifikace, databázový model ani UI nesmějí změnit jazykovou platnost řešení.

Pokud aplikace neumí zaznamenat případ, který pravidla dovolují, veřejný formulář na tuto možnost viditelně upozorní a odkáže hráče na kontakt s rozhodčím e-mailem. Pro MVP se kvůli tomu nezavádí samostatné fallback workflow ani nový stav podání.

Provozní limity aplikace jsou nenormativní a samy o sobě nesmějí vytvořit soutěžní maximální délku věty.

## Kvaziautorita
Kvaziautorita rozhoduje platnost podle pravidel, interpretační spory a porušení soutěžního procesu. Nemůže odmítnout řádné, platné řešení pouze proto, že se jí způsob využití pravidel nelíbí.

## Kvazicena
Kvazicena je subjektivní ocenění oddělené od objektivního rekordu.
