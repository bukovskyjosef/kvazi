# Uživatelské účty, komentáře a administrace

## Uživatelské účty

Pro MVP se používá lehká klasická registrace uživatele.

Povinné údaje:
- `username` – globálně unikátní a veřejně používaný pro atribuci,
- `email` – globálně unikátní a neveřejný,
- heslo – aplikace ukládá pouze bezpečný jednosměrný password hash, nikdy plaintext heslo.

Soutěžní podání se váže na stabilní interní `user_id` autora.

Magic-link přihlašování se pro MVP nepoužívá.

## Přihlášení a zapomenuté heslo

Uživatel se přihlašuje klasicky svými přihlašovacími údaji.

Aplikace musí podporovat zapomenuté heslo:

1. uživatel zadá registrovaný e-mail,
2. systém vytvoří kryptograficky náhodný, časově omezený a jednorázový resetovací token,
3. na e-mail odešle odkaz pro změnu hesla,
4. databáze neukládá reset token v otevřené podobě,
5. po úspěšné změně hesla se token zneplatní.

Resetovací odkaz není magic-link login; slouží pouze ke změně hesla.

Konkrétní algoritmus password hashování, parametry session/cookies, délka a expirace reset tokenu, rate limiting a další bezpečnostní ochrany patří do implementační security baseline a musí být uzavřeny před produkčním nasazením.

## Komentáře

Produktový scope komentářů ještě není uzavřen. Starší návrh anonymních komentářů přes magic link se nepovažuje za platný auth směr.

Pokud komentáře v MVP zůstanou, musí být jejich identita a oprávnění navrženy nad aktuálním modelem registrovaných uživatelů, nikoli nad HMAC pseudonymem odvozeným z e-mailu.

## Moderace komentářů

Pokud budou komentáře součástí produktu, mohou používat například stavy:
- `VISIBLE`,
- `HIDDEN`,
- `DELETED`.

Přesný scope, limity a retenční pravidla komentářů budou rozhodnuty samostatně.

## Admin

KISS rozhraní:

### Dashboard
- čekající věty,
- případné nové komentáře,
- schválené věty,
- námitky proti katalogu.

### Věty
- detail,
- schválit,
- odmítnout,
- vrátit k doplnění,
- archivovat,
- vytvořit novou revizi.

### Katalog
- navrhnout lexém/tvar,
- schválit,
- odmítnout,
- deaktivovat,
- připojit zdroj.

Přesná reprezentace admin oprávnění a vztah admina k běžnému uživatelskému účtu zůstává otevřená.

## Audit administrace

Důležité administrátorské zásahy se auditují minimálně údaji:
- admin,
- akce,
- typ entity,
- ID entity,
- stav před/po změně,
- čas.
