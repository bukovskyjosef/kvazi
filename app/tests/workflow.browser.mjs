import assert from 'node:assert/strict';
import {workflowFixtures, BASE, db} from './workflow-fixtures.mjs';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const f = await workflowFixtures();
let browser;
let scenes = 0;
try {
  browser = await chromium.launch({headless:true,...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})});
  const user = await browser.newPage();
  const admin = await browser.newPage();
  const errors = [];
  for (const page of [user,admin]) page.on('pageerror', e => errors.push(e.message));
  const nav = page => page.getByRole('navigation',{name:'Hlavní navigace'});
  const footer = page => page.locator('footer');
  async function accountInFooter(page, name) {
    assert.equal(await nav(page).getByRole('link',{name:'Moje věty',exact:true}).count(),0);
    assert.equal(await nav(page).getByRole('button',{name:'Odhlásit se',exact:true}).count(),0);
    assert.ok(!(await nav(page).innerText()).includes(name));
    assert.equal(await footer(page).getByRole('link',{name:'Moje věty',exact:true}).count(),1);
    assert.equal(await footer(page).getByRole('button',{name:'Odhlásit se',exact:true}).count(),1);
    assert.ok((await footer(page).innerText()).includes(name));
    assert.equal(await footer(page).locator('form').getAttribute('method'),'post');
    assert.ok(await footer(page).locator('input[name=csrf]').inputValue());
  }
  async function viewport(page,width) {
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),`no horizontal overflow at ${width}`);
    for (const link of await nav(page).locator('a,button').all()) {
      assert.ok(await link.isVisible());
      const bounds = await link.boundingBox(); assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1);
    }
  }
  await user.goto(BASE + '/vety.php');
  for (const width of [1440,390]) {
    await viewport(user,width);
    assert.equal(await nav(user).getByRole('link',{name:'Přihlásit se',exact:true}).count(),0);
    assert.equal(await nav(user).getByRole('link',{name:'Registrace',exact:true}).count(),0);
    assert.equal(await footer(user).getByRole('link',{name:'Přihlásit se',exact:true}).count(),1);
    assert.equal(await footer(user).getByRole('link',{name:'Zaregistrovat se',exact:true}).count(),1);
    assert.equal(await nav(user).getByRole('link',{name:'Přidat kvazivětu',exact:true}).getAttribute('href'),'/login.php?return=%2Fkonfigurator.php');
    assert.equal(await nav(user).getByRole('link',{name:'Moje věty',exact:true}).count(),0);
    assert.equal(await nav(user).getByRole('link',{name:'Ke schválení',exact:true}).count(),0);
    scenes++;
  }
  await footer(user).getByRole('link',{name:'Zaregistrovat se',exact:true}).click();
  assert.ok(user.url().endsWith('/register.php')); scenes++;
  async function login(page,name,viaReturn=false) {
    if (!viaReturn) await page.goto(BASE + '/login.php');
    await page.locator('#identifier').fill(name); await page.locator('#password').fill(f.password);
    await Promise.all([page.waitForURL(url => !url.pathname.endsWith('/login.php')),page.locator('main button[type="submit"]').click()]);
  }
  await user.goto(BASE + '/vety.php');
  await nav(user).getByRole('link',{name:'Přidat kvazivětu',exact:true}).click();
  assert.equal(new URL(user.url()).pathname,'/login.php');
  assert.equal(new URL(user.url()).searchParams.get('return'),'/konfigurator.php');
  await login(user,f.username,true);
  assert.equal(new URL(user.url()).pathname,'/konfigurator.php');
  for (const width of [1440,390]) {
    await viewport(user,width);
    await accountInFooter(user,f.username);
    assert.equal(await nav(user).getByRole('link',{name:'Přidat kvazivětu',exact:true}).count(),1);
    assert.equal(await nav(user).getByRole('link',{name:'Ke schválení',exact:true}).count(),0); scenes++;
  }
  await nav(user).getByRole('link',{name:'Přidat kvazivětu',exact:true}).click();
  assert.equal(await user.getByRole('link',{name:'veta@kvazi.cz',exact:true}).getAttribute('href'),'mailto:veta@kvazi.cz');
  assert.ok((await user.locator('main').innerText()).includes('Omezení formuláře samo o sobě neznamená')); scenes++;
  await user.getByLabel('Rozkazovací',{exact:true}).check();
  await user.getByLabel('Podmět není vyjádřen',{exact:true}).check();
  await user.locator('#newSurface').fill('kvazi'); await user.locator('#newSurface').press('Enter');
  await user.locator('#token-t1').click();
  await user.getByLabel('Slovní druh',{exact:true}).selectOption('verb');
  await user.getByLabel('Neurčitek / základní tvar',{exact:true}).fill('kvaziit');
  await user.getByLabel('Deklarovaná identita').selectOption('quasi');
  await user.getByLabel('Soutěžní časovací typ').selectOption('V-IT');
  await user.getByLabel('Druh slovesného tvaru').selectOption('imperative');
  await user.locator('#word-form-verbPerson').selectOption('2sg');
  await user.getByLabel('Vid').selectOption('biaspectual');
  await user.getByLabel('Větná funkce',{exact:true}).selectOption('predicate');
  await user.getByLabel('Valenční obhajoba').fill('Bez obligatorního doplnění, V-IT.');
  await user.getByLabel('Morfologická obhajoba a odkaz na model').fill('Imperativ V-IT, 2. sg. PRIVATE_BROWSER_EVIDENCE');
  assert.ok(await user.locator('#submitButton').isEnabled());
  async function submit() {
    const [response] = await Promise.all([user.waitForResponse(r => r.url().endsWith('/api/submit.php')),user.locator('#submitButton').click()]);
    assert.equal(response.status(),200);
    const body = await response.json(); assert.equal(body.ok,true);
    return {...f.context(body.revisionId),sentenceId:body.id};
  }
  const first = await submit();
  await footer(user).getByRole('link',{name:'Moje věty',exact:true}).click();
  await user.locator(`a[href="/moje-veta.php?revisionId=${first.revisionId}"]`).click();
  assert.equal(await user.locator('[data-action="pending"]').count(),1);
  assert.equal(await user.getByRole('link',{name:'Upravit a znovu odeslat',exact:true}).count(),0); scenes++;
  await login(admin,f.adminName);
  for (const width of [1440,390]) {
    await viewport(admin,width);
    await accountInFooter(admin,f.adminName);
    assert.equal(await nav(admin).getByRole('link',{name:'Přidat kvazivětu',exact:true}).count(),1);
    assert.equal(await nav(admin).getByRole('link',{name:'Ke schválení',exact:true}).count(),1); scenes++;
  }
  await nav(admin).getByRole('link',{name:'Ke schválení',exact:true}).click();
  await admin.locator(`a[href="/admin/veta.php?revisionId=${first.revisionId}"]`).click();
  await viewport(admin,390);
  assert.equal(await admin.locator('[data-field="revision_id"]').innerText(),String(first.revisionId));
  assert.equal(await admin.getByRole('button',{name:'Schválit',exact:true}).isDisabled(),true);
  async function mutation(button,path) {
    const [response] = await Promise.all([admin.waitForResponse(r => r.url().endsWith(path)),admin.waitForNavigation({waitUntil:'domcontentloaded'}),button.click()]);
    assert.equal(response.status(),200);
  }
  const sentenceForm = () => admin.locator('form[data-endpoint="/api/admin/sentence-decision.php"]');
  await sentenceForm().locator('textarea').fill('<b>PRIVATE_BROWSER_REASON</b>\nPřepracujte.');
  await mutation(admin.getByRole('button',{name:'Vrátit k přepracování',exact:true}),'/api/admin/sentence-decision.php');
  await admin.locator('[data-action="return"]').waitFor();
  assert.equal(await admin.getByRole('button',{name:'Vrátit k přepracování',exact:true}).count(),0); scenes++;
  await user.reload();
  assert.equal(await user.locator('.admin-reason').innerText(),'<b>PRIVATE_BROWSER_REASON</b>\nPřepracujte.');
  assert.equal(await user.locator('.admin-reason b').count(),0);
  await user.getByRole('link',{name:'Upravit a znovu odeslat',exact:true}).click();
  assert.equal(await user.locator('#token-t1').count(),1); assert.ok(await user.locator('#submitButton').isEnabled());
  assert.equal(await user.locator('#newSurface').getAttribute('placeholder'),null);
  await user.locator('#token-t1').click();
  assert.equal(await user.locator('#word-surface, #insertPlace').count(),0);
  await user.getByRole('button',{name:'Smazat kvazi',exact:true}).click();
  assert.equal(await user.locator('#newSurface').getAttribute('placeholder'),'Kvazivětu zadejte zde…');
  await user.locator('#newSurface').fill('kvazi'); await user.locator('#newSurface').press('Enter');
  await user.locator('#token-t2').click();
  await user.getByLabel('Slovní druh',{exact:true}).selectOption('verb');
  await user.getByLabel('Neurčitek / základní tvar',{exact:true}).fill('kvaziit');
  await user.getByLabel('Deklarovaná identita').selectOption('quasi');
  await user.getByLabel('Soutěžní časovací typ').selectOption('V-IT');
  await user.getByLabel('Druh slovesného tvaru').selectOption('imperative');
  await user.locator('#word-form-verbPerson').selectOption('2sg');
  await user.getByLabel('Vid').selectOption('biaspectual');
  await user.getByLabel('Větná funkce',{exact:true}).selectOption('predicate');
  await user.getByLabel('Valenční obhajoba').fill('Opravená deklarace bez obligatorního doplnění, V-IT.');
  await user.getByLabel('Morfologická obhajoba a odkaz na model').fill('Imperativ V-IT, 2. sg. PRIVATE_BROWSER_EVIDENCE');
  const second = await submit();
  assert.equal(db(`SELECT draft_json::jsonb->'tokens'->0->>'id' FROM kvazi.sentence_revision WHERE id=${second.revisionId}`),'t2');
  assert.equal(second.sentenceId,first.sentenceId);
  assert.equal(db(`SELECT revision_no FROM kvazi.sentence_revision WHERE id=${second.revisionId}`),'2'); scenes++;
  await nav(admin).getByRole('link',{name:'Ke schválení',exact:true}).click();
  assert.equal(await admin.locator(`a[href="/admin/veta.php?revisionId=${first.revisionId}"]`).count(),0);
  await admin.locator(`a[href="/admin/veta.php?revisionId=${second.revisionId}"]`).click();
  if (await admin.getByRole('button',{name:'Schválit morfologický případ',exact:true}).count()) {
    await mutation(admin.getByRole('button',{name:'Schválit morfologický případ',exact:true}),'/api/admin/morphology-review.php');
    await admin.locator('.morphology-status').filter({hasText:'APPROVED'}).waitFor();
  }
  assert.equal(await admin.locator('.morphology-status').innerText(),'APPROVED');
  f.backupCatalog(second,'t2');
  await mutation(admin.getByRole('button',{name:'Potvrdit jako neskutečné slovo',exact:true}),'/api/admin/real-word-catalog.php');
  await admin.locator('.catalog-status').filter({hasText:'is_approved=false'}).waitFor();
  await admin.getByRole('button',{name:'Schválit',exact:true}).waitFor();
  assert.ok(await admin.getByRole('button',{name:'Schválit',exact:true}).isEnabled());
  await mutation(admin.getByRole('button',{name:'Schválit',exact:true}),'/api/admin/sentence-decision.php');
  await admin.locator('[data-action="approve"]').waitFor(); scenes++;
  await user.goto(BASE + '/vety.php');
  assert.equal(await user.locator(`a[href="/veta.php?revisionId=${first.revisionId}"]`).count(),0);
  await user.locator(`a[href="/veta.php?revisionId=${second.revisionId}"]`).click();
  await viewport(user,390);
  assert.equal(await user.locator('[data-field="revision_id"]').innerText(),String(second.revisionId));
  assert.ok(!(await user.locator('main').innerText()).includes('PRIVATE_BROWSER_EVIDENCE'));
  assert.ok(!(await user.locator('main').innerText()).includes('PRIVATE_BROWSER_REASON')); scenes++;
  // Reject a different submission via the same actual browser decision controls.
  const rejected = await f.submit();
  await admin.goto(BASE + `/admin/veta.php?revisionId=${rejected.revisionId}`);
  await admin.getByRole('button',{name:'Zamítnout',exact:true}).click();
  assert.ok((await admin.locator('#reviewMessage').innerText()).includes('neprázdný důvod'));
  await sentenceForm().locator('textarea').fill('Finální zamítnutí.');
  await mutation(admin.getByRole('button',{name:'Zamítnout',exact:true}),'/api/admin/sentence-decision.php');
  await admin.locator('[data-action="reject"]').waitFor();
  await user.goto(BASE + `/moje-veta.php?revisionId=${rejected.revisionId}`);
  assert.equal(await user.locator('.admin-reason').innerText(),'Finální zamítnutí.');
  assert.equal(await user.getByRole('link',{name:'Upravit a znovu odeslat',exact:true}).count(),0); scenes++;
  await footer(user).getByRole('button',{name:'Odhlásit se',exact:true}).click();
  await footer(user).getByRole('link',{name:'Přihlásit se',exact:true}).waitFor();
  assert.equal(await nav(user).getByRole('link',{name:'Přihlásit se',exact:true}).count(),0);
  assert.equal(await nav(user).getByRole('link',{name:'Moje věty',exact:true}).count(),0); scenes++;
  assert.deepEqual(errors,[]);
  console.log(`Playwright M3 workflow: ${scenes}/${scenes} PASS; desktop 1440px, mobile 390px; real UI submit/return/resubmit/review/approve/reject/public/logout.`);
} finally {if (browser) await browser.close(); f.cleanup();}
