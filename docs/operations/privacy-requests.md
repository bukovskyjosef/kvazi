# Vyřizování žádostí subjektů údajů

Operátorský postup pro manuální vyřízení žádostí podle GDPR. Rozhodovací základna: Issue #150.

## Příjem a evidence

1. Žádost přijata na `veta@kvazi.cz`.
2. Zaznamenat datum přijetí a požadované právo.
3. Sledovat základní lhůtu 1 měsíc dle GDPR; pokud je nutné zákonné prodloužení, sdělit jej a zaznamenat v původní lhůtě.

## Ověření identity

- Preferovat žádost z e-mailu registrovaného k účtu.
- Pokud je to nedostatečné, vyžádat pouze minimální dodatečný doklad potřebný k propojení žadatele s účtem.
- Doklad totožnosti nevyžadovat automaticky.

## Vyřízení podle typu práva

### Přístup

Shromáždit údaje účtu a vlastněná podání/relevantní review metadata.

### Oprava

Opravit věcně nesprávné údaje účtu tam, kde je to vhodné.

### Výmaz / zrušení účtu

Použít schválený operátorský mechanismus z #162:

```
docker exec <app_container> php /usr/local/bin/kvazi-cli/delete-account.php <user_id>          # preflight
docker exec <app_container> php /usr/local/bin/kvazi-cli/delete-account.php <user_id> --confirm  # destruktivní
```

Preflight zobrazí souhrn účtu a plánovaný výsledek (tombstone vs. úplný výmaz). Destructive provede v jedné transakci.

Pokud nelze žádost bezpečně vykonat dostupným nástrojem, neimprovizovat destruktivní DB edity — vytvořit bounded work item a dodržet zákonnou lhůtu.

### Námitka proti veřejné atribuci / oprávněnému zájmu

Posoudit individuálně. Námitku neodmítat automaticky s odůvodněním „soutěžní historie".

### Omezení zpracování

Aplikovat manuálně tam, kde je to právně přiměřené.

### Odvolání souhlasu s analytikou

Odkázat na ovládací prvek Analytika v zápatí stránky, pokud souhlas nebyl již odvolán.

## Evidence vyřízení

Zaznamenat pouze minimální doklad o tom, že žádost byla vyřízena. Nevytvářet paralelní backlog.

## Retenční pravidla

- Aktivní účet: po dobu existence účtu
- Auth tokeny: 7 dní po použití nebo vypršení
- Provozní logy: 30 dní
- Zálohy DB: 7 dní
- SMTP2GO aktivita: 5 dní; archivace OFF
- Kontaktní/privacy korespondence v Gmailu: 3 roky od uzavření komunikace
- GA4 identifikátor prohlížeče: 12 měsíců (neobnovující se)
- GA4 uživatelská/událostní retence: 14 měsíců (bez resetu)
- Po zrušení účtu: schválená soutěžní historie anonymizována, neschválená podání odstraněna
