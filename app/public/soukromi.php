<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
auth_session_start();
$activePage = '';
?>
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ochrana soukromí — Nejdelší kvazivěta</title>
  <link rel="stylesheet" href="/css/site.css">
</head>
<body>

<?php include __DIR__ . '/includes/nav.php'; ?>

<main class="container-sm page-body">

  <div class="page-header">
    <h1>Ochrana soukromí</h1>
  </div>

  <section>
    <h2>Správce a kontakt</h2>
    <p>Správcem osobních údajů je <strong>Josef Bukovský, soukromá fyzická osoba</strong>. Kvazi je nekomerční hobby projekt mimo podnikatelskou činnost.</p>
    <p>Kontakt pro otázky týkající se ochrany osobních údajů: <a href="mailto:veta@kvazi.cz">veta@kvazi.cz</a></p>
  </section>

  <section>
    <h2>Jaké údaje zpracováváme a proč</h2>

    <table class="privacy-table">
      <thead>
        <tr><th>Oblast</th><th>Údaje a účel</th><th>Právní základ</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Účet a přihlášení</td>
          <td>Uživatelské jméno, e-mail, hash hesla, metadata účtu a ověření, stav relace a zabezpečení. Vytvoření a zabezpečení účtu, přihlášení, ověření a obnova hesla.</td>
          <td>Oprávněný zájem, čl.&nbsp;6 odst.&nbsp;1 písm.&nbsp;f) GDPR — provoz a zabezpečení dobrovolné hobby soutěže a požadovaných funkcí účtu</td>
        </tr>
        <tr>
          <td>Soutěžní podání a review</td>
          <td>Odeslaná věta, lingvistické deklarace, volný text evidence/zdroje, verze, metadata validace/review/rozhodnutí. Příjem a posouzení soutěžního příspěvku.</td>
          <td>Oprávněný zájem, čl.&nbsp;6 odst.&nbsp;1 písm.&nbsp;f) GDPR — provoz, posuzování a zachování integrity soutěže</td>
        </tr>
        <tr>
          <td>Veřejná atribuce schválených výsledků</td>
          <td>Zvolené uživatelské jméno a schválený výsledek ve veřejném žebříčku.</td>
          <td>Oprávněný zájem, čl.&nbsp;6 odst.&nbsp;1 písm.&nbsp;f) GDPR — transparentní žebříček, autorská atribuce a soutěžní historie. Máte právo vznést námitku (viz níže).</td>
        </tr>
        <tr>
          <td>Bezpečnost a provoz</td>
          <td>IP adresy, požadavky, chybové a bezpečnostní záznamy, zálohy.</td>
          <td>Oprávněný zájem, čl.&nbsp;6 odst.&nbsp;1 písm.&nbsp;f) GDPR — bezpečnost, prevence zneužití, dostupnost a obnova</td>
        </tr>
        <tr>
          <td>Analytika</td>
          <td>Stav souhlasu; po udělení souhlasu identifikátory GA4, informace o zařízení/prohlížeči a aktivitě na webu; Cloudflare Web Analytics.</td>
          <td>Souhlas, čl.&nbsp;6 odst.&nbsp;1 písm.&nbsp;a) GDPR. Analytika je ve výchozím stavu vypnuta a aktivuje se až po udělení souhlasu. Souhlas lze odvolat v nastavení Analytika v zápatí.</td>
        </tr>
        <tr>
          <td>Běžná korespondence</td>
          <td>Adresa odesílatele, obsah zprávy, metadata e-mailu.</td>
          <td>Oprávněný zájem, čl.&nbsp;6 odst.&nbsp;1 písm.&nbsp;f) GDPR — vyřizování korespondence</td>
        </tr>
        <tr>
          <td>Žádosti subjektů údajů (GDPR)</td>
          <td>Žádost, doklady o ověření identity v nezbytném rozsahu, odpověď a historie vyřízení.</td>
          <td>Právní povinnost, čl.&nbsp;6 odst.&nbsp;1 písm.&nbsp;c) GDPR — plnění povinností vyplývajících z GDPR</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section>
    <h2>Povinnost a dobrovolnost poskytování údajů</h2>
    <p>Poskytnutí uživatelského jména, e-mailu a hesla není zákonnou povinností, ale je nezbytné pro vytvoření a používání účtu — bez nich nelze účet založit ani používat.</p>
    <p>Odeslání soutěžní věty je dobrovolné. Pokud je věta odeslána, její deklarační a review data jsou nezbytná pro vyhodnocení a správu daného soutěžního příspěvku.</p>
    <p>Analytika je volitelná a její odmítnutí nebrání běžnému používání webu.</p>
  </section>

  <section>
    <h2>Veřejná soutěžní historie a zrušení účtu</h2>
    <p>Dokud je účet aktivní, schválené soutěžní příspěvky jsou veřejně přiřazeny ke zvolenému uživatelskému jménu.</p>
    <p>Aktivní účty nemají automatické vypršení z důvodu neaktivity.</p>
    <p>Při zrušení účtu jsou identifikační údaje účtu odstraněny nebo anonymizovány bez zbytečného prodlení. Čekající, vrácená a zamítnutá podání a jejich neveřejná data se odstraní.</p>
    <p>Schválená soutěžní historie zůstává součástí soutěžního archivu, ale veřejná atribuce je anonymizována (neutrální označení bývalého uživatele). Zrušení účtu neznamená odstranění schválených soutěžních záznamů.</p>
    <p>Proti zpracování založenému na oprávněném zájmu můžete vznést námitku. Námitky jsou posuzovány individuálně.</p>
  </section>

  <section>
    <h2>Doba uchovávání</h2>
    <ul>
      <li>Aktivní účet: po celou dobu existence účtu</li>
      <li>PHP/přihlašovací relace: maximálně 2 hodiny</li>
      <li>Počítadla omezení přihlášení (IP): nejvýše 1 den</li>
      <li>Záznamy auth tokenů v databázi: 7 dní po použití nebo vypršení</li>
      <li>Běžné provozní logy serveru/proxy: 30 dní (s výjimkou konkrétního incidentu nebo právního důvodu)</li>
      <li>Zálohy produkční databáze: 7 dní</li>
      <li>SMTP2GO běžná historie aktivity: 5 dní; archivace e-mailů vypnuta</li>
      <li>Kontaktní a privacy korespondence v cílovém Gmailu: 3 roky od uzavření komunikace (není-li konkrétní důvod pro delší uchovávání)</li>
      <li>Preference souhlasu s analytikou: přibližně 365 dní</li>
      <li>GA4 identifikátor prohlížeče: 12 měsíců, neobnovující se</li>
      <li>GA4 retence uživatelských a událostních dat: 14 měsíců, bez resetu při nové aktivitě</li>
      <li>Po zrušení účtu: schválená soutěžní historie zůstává anonymizována, neschválená podání se odstraní</li>
    </ul>
  </section>

  <section id="analytika">
    <h2>Cookies, úložiště prohlížeče a analytika</h2>
    <p><strong>Technické/relační úložiště:</strong> PHP relační cookie je nezbytná pro přihlášení a zabezpečení. Žádné sledovací cookies se bez souhlasu neukládají.</p>
    <p><strong>Preferovaný motiv:</strong> Uložený v localStorage prohlížeče jako místní preference; nemá serverový účel.</p>
    <p><strong>Preference souhlasu s analytikou:</strong> Hodnota <code>kvazi_analytics_consent</code> v localStorage a first-party cookie slouží k zapamatování volby analytiky; platnost přibližně 365 dní.</p>
    <p><strong>Google Analytics 4 (GA4):</strong> Analytické identifikátory first-party se ukládají pouze po udělení souhlasu. Cílová doba životnosti identifikátoru je 12 měsíců (neobnovující se). GA4 data nejsou anonymní — Google je zpracovává v rámci svého analytického systému.</p>
    <p><strong>Cloudflare Web Analytics:</strong> Aktivuje se po udělení souhlasu společně s GA4.</p>
    <p>Souhlas s analytikou lze odmítnout i dodatečně odvolat prostřednictvím ovládacího prvku <strong>Analytika</strong> v zápatí stránky.</p>
  </section>

  <section>
    <h2>Příjemci a zpracovatelé</h2>
    <ul>
      <li><strong>Hetzner</strong> — hosting aplikace a databáze (zpracovatel; DPA uzavřena). Produkční lokace: Norimberk, Německo (EU/EHP).</li>
      <li><strong>Cloudflare</strong> — reverzní proxy, zabezpečení, infrastruktura, zálohování do R2, Email Routing a Web Analytics v rámci standardního smluvního/DPA frameworku. Zpracování nemusí být omezeno pouze na Německo či EU.</li>
      <li><strong>SMTP2GO</strong> — transakční e-mailový zpracovatel (DPA uzavřena). Účet hostován v EU. Archivace e-mailů vypnuta; běžná historie aktivity 5 dní.</li>
      <li><strong>Google Analytics</strong> — zpracování analytiky dle přijatých Google Data Processing Terms; sdílení s Google produkty/službami vypnuto; žádné další propojení Google produktů. Google může využívat globální infrastrukturu a aplikovatelné mezinárodní záruky předávání.</li>
      <li><strong>Cloudflare Email Routing a spotřebitelský Gmail</strong> — e-mailová adresa <code>veta@kvazi.cz</code> je směrována přes Cloudflare Email Routing do spotřebitelského Gmailu (@gmail.com). Spotřebitelský Gmail <strong>není</strong> zpracovatel podle čl.&nbsp;28 GDPR a neexistuje k němu smlouva o zpracování osobních údajů (DPA). Google/Gmail je externí služba/příjemce podle spotřebitelských podmínek a zásad ochrany soukromí Google; mezinárodní zpracování může probíhat.</li>
    </ul>
  </section>

  <section>
    <h2>Práva subjektů údajů</h2>
    <p>V rozsahu stanoveném GDPR máte právo na:</p>
    <ul>
      <li>přístup ke svým osobním údajům,</li>
      <li>opravu nepřesných údajů,</li>
      <li>výmaz nebo anonymizaci tam, kde je to aplikovatelné,</li>
      <li>omezení zpracování,</li>
      <li>námitku proti zpracování založenému na oprávněném zájmu,</li>
      <li>odvolání souhlasu s analytikou — přímo přes ovládací prvek v zápatí stránky,</li>
      <li>další práva, pokud jsou splněny zákonné podmínky.</li>
    </ul>
    <p>Žádosti přijímáme na <a href="mailto:veta@kvazi.cz">veta@kvazi.cz</a>. Samoobslužný portál pro žádosti o údaje není v současné době k dispozici.</p>
    <p>Stížnost můžete podat u <strong>Úřadu pro ochranu osobních údajů (ÚOOÚ)</strong>, <a href="https://uoou.gov.cz" rel="noopener">uoou.gov.cz</a>.</p>
  </section>

  <section>
    <h2>Automatizované rozhodování</h2>
    <p>Kvazi používá deterministickou technickou validaci pro ověření soutěžních pravidel, ale <strong>neprovádí</strong> automatizované rozhodování s právními nebo obdobně závažnými důsledky ve smyslu čl.&nbsp;22 GDPR.</p>
  </section>

</main>

<?php include __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
