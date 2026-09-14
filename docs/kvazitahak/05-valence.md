# Kvazitahák – valence

> **Status:** rozhodnuto, že valence nebude omezena malým normativním whitelistem; otevřená zůstává přesná strukturovaná reprezentace a způsob obhajoby.

## NORMATIVNÍ princip

Kvazisloveso deklaruje právě jeden valenční rámec.

Valenční rámec není omezen předem danou malou soutěžní sadou typu `ACC`, `DAT`, `GEN`, `INS` apod. Hráč může navrhnout relativně volný rámec, pokud jej dokáže jednoznačně popsat a obhájit v rámci pravidel současné spisovné češtiny.

Každý obligatorní slot deklarovaného rámce musí být ve větě výslovně realizován.

Valence nesmí obejít jiné syntaktické nebo morfologické pravidlo soutěže.

V jedné kvazivětě je právě jeden token plnovýznamového slovesa. Odevzdaný návrh valence ani celé kvazisloveso se samotným podáním automaticky nestávají globálně schváleným kvazislovem ani závaznou položkou lexikonu.

## Formulář a validace

FE před odesláním neposuzuje jazykovou správnost valence.

FE smí kontrolovat zejména:

- že je valenční rámec vyplněn ve vyžadované struktuře,
- že odkazy na obligatorní členy míří na existující tokeny stejného podání,
- že hráč deklaroval všechny údaje nutné pro následné posouzení.

Jazyková správnost a obhajitelnost valenčního rámce se posuzují až při review.

## Pracovní UX předvolby

Formulář může nabídnout běžné rámce jako UX zkratky, například:

- bez obligatorního předmětu,
- `ACC`,
- `DAT`,
- `GEN`,
- `INS`,
- `DAT + ACC`.

Takový seznam není normativní whitelist. Musí existovat možnost zapsat i jiný obhajitelný rámec, pokud jej pravidla připouštějí.

## TODO

Je nutné rozhodnout:

- přesnou strukturovanou reprezentaci obecnějšího valenčního rámce ve formuláři/datovém modelu,
- jakým způsobem hráč valenci obhajuje,
- jaké podklady jsou pro rozhodčího dostačující,
- zda a jaké běžné rámce budou ve formuláři nabízeny jako předvolby.
