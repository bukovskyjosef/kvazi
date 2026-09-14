# Kvazitahák – valence

> **Status:** princip valence je rozhodnutý; otevřená zůstává přesná technická reprezentace ve formuláři a datovém modelu.

## NORMATIVNÍ princip

Kvazisloveso deklaruje právě jeden valenční rámec.

Valenční rámec není omezen předem danou malou soutěžní sadou typu `ACC`, `DAT`, `GEN`, `INS` apod. Hráč může navrhnout relativně volný rámec, pokud jej jednoznačně popíše a obhájí v rámci současné spisovné češtiny.

Deklarovaný rámec musí být doložen konkrétním současným českým slovesem, které používá stejný valenční rámec. Modelové sloveso pro valenci nemusí být stejné jako model pro časování nebo jiné morfologické vlastnosti.

Každý obligatorní slot deklarovaného rámce musí být ve větě výslovně realizován.

Valence nesmí obejít jiné syntaktické nebo morfologické pravidlo soutěže.

V jedné kvazivětě je právě jeden token plnovýznamového slovesa. Odevzdaný návrh valence ani celé kvazisloveso se samotným podáním automaticky nestávají globálně schváleným kvazislovem ani závaznou položkou lexikonu.

## Formulář a validace

Frontend před odesláním neposuzuje jazykovou správnost valence ani správnost analogie s modelovým slovesem.

Kontroluje pouze veřejně deterministické věci, zejména:

- že je valenční rámec vyplněn v požadované struktuře,
- že je uvedeno modelové české sloveso pro obhajobu rámce,
- že odkazy na obligatorní členy míří na existující tokeny stejného podání,
- že jsou vyplněny údaje nutné pro následné posouzení.

Jazyková správnost a obhajitelnost valenčního rámce se posuzují až při review.

## UX předvolby

Formulář může nabídnout běžné rámce jako nenormativní zkratky, například:

- bez obligatorního předmětu,
- `ACC`,
- `DAT`,
- `GEN`,
- `INS`,
- `DAT + ACC`.

Takový seznam není normativní whitelist a musí existovat možnost zapsat i jiný obhajitelný rámec.

## Otevřená technická práce

Zbývá dořešit zejména:

- strukturovanou reprezentaci obecnějšího rámce,
- reprezentaci obligatorních slotů a jejich vazeb na tokeny,
- podobu evidence modelového slovesa a doplňujících podkladů,
- konkrétní UX předvolby.

Aktuální stav této práce se vždy zjišťuje z GitHub Issues.
