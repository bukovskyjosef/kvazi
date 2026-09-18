import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {workflowFixtures, BASE, db, pg, post, active, idsForApi} from './workflow-fixtures.mjs';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const f = await workflowFixtures({deferUser:true});
let browser;
let scenes = 0;
const acceptance = new Set();
const xss = '<img src=x onerror="window.__kvaziXss=1">';
const returnReason = xss + '\nPRIVATE_BROWSER_REASON\nPřepracujte.';
const fingerprint = ids => db(`SELECT md5(row_to_json(r)::text || row_to_json(v)::text) FROM kvazi.sentence_revision r JOIN kvazi.validation_result v ON v.revision_id=r.id WHERE r.id=${ids.revisionId}`);
let renderingChecks = 0;
try {
  browser = await chromium.launch({headless:true,...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})});
  const user = await browser.newPage();
  const admin = await browser.newPage();
  const errors = [];
  for (const page of [user,admin]) page.on('pageerror', e => errors.push(e.message));
  const nav = page => page.getByRole('navigation',{name:'Hlavní navigace'});
  const footer = page => page.locator('footer');
  async function safeRendering(page, visible) {
    assert.equal(await page.locator('main img, #editor img, #tokens img').count(),0);
    assert.equal(await page.evaluate(() => window.__kvaziXss),undefined);
    assert.equal((await page.locator('main').innerText()).includes(xss),visible);
    renderingChecks++;
  }
  async function session(page) {
    const token = page.locator('meta[name="csrf"], input[name="csrf"]').first();
    return {cookie:(await page.context().cookies(BASE)).map(c=>c.name+'='+c.value).join('; '),
      csrf:await token.getAttribute('content') ?? await token.getAttribute('value')};
  }
  async function declareVerb(id) {
    await user.locator('#token-'+id).click();
    await user.getByLabel('Slovní druh',{exact:true}).selectOption('verb');
    await user.getByLabel('Neurčitek / základní tvar',{exact:true}).fill('kvaziit');
    await user.getByLabel('Deklarovaná identita').selectOption('quasi');
    await user.getByLabel('Soutěžní časovací typ').selectOption('V-IT');
    await user.getByLabel('Druh slovesného tvaru').selectOption('imperative');
    await user.locator('#word-form-verbPerson').selectOption('2sg');
    await user.getByLabel('Vid').selectOption('biaspectual');
    await user.getByLabel('Větná funkce',{exact:true}).selectOption('predicate');
    await user.getByLabel('Valenční obhajoba').fill('Bez obligatorního doplnění, V-IT.');
    await user.getByLabel('Morfologická obhajoba a odkaz na model').fill(xss+' PRIVATE_BROWSER_EVIDENCE');
  }
  async function build() {
    await user.goto(BASE+'/konfigurator.php');
    await user.getByLabel('Rozkazovací',{exact:true}).check();
    await user.getByLabel('Podmět není vyjádřen',{exact:true}).check();
    await user.locator('#newSurface').fill('kvazi'); await user.locator('#newSurface').press('Enter');
    await declareVerb('t1');
  }
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
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),`no horizontal overflow at ${width}: ${JSON.stringify(await page.locator('body *').evaluateAll(nodes => nodes.filter(n => n.getBoundingClientRect().right > innerWidth).map(n => ({tag:n.tagName,id:n.id,cls:n.className,text:n.textContent.slice(0,80),width:n.getBoundingClientRect().width}))))}`);
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
  assert.ok(user.url().endsWith('/register.php'));
  await user.locator('#username').fill(f.username); await user.locator('#email').fill(f.username+'@kvazi.int');
  await user.locator('#password').fill(f.password); await user.locator('#password2').fill(f.password);
  await Promise.all([user.waitForURL(BASE+'/'),user.getByRole('button',{name:'Vytvořit účet',exact:true}).click()]);
  f.registerUser(Number(db(`SELECT id FROM kvazi.user_account WHERE username=${pg(f.username)}`)));
  assert.equal(db(`SELECT role FROM kvazi.user_account WHERE id=${f.user}`),'USER'); scenes++;
  await footer(user).getByRole('button',{name:'Odhlásit se',exact:true}).click();
  await footer(user).getByRole('link',{name:'Přihlásit se',exact:true}).waitFor(); scenes++;
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
  f.sessions.user = await session(user);
  for (const width of [1440,390]) {
    await viewport(user,width);
    await accountInFooter(user,f.username);
    assert.equal(await nav(user).getByRole('link',{name:'Přidat kvazivětu',exact:true}).count(),1);
    assert.equal(await nav(user).getByRole('link',{name:'Ke schválení',exact:true}).count(),0); scenes++;
  }
  await nav(user).getByRole('link',{name:'Přidat kvazivětu',exact:true}).click();
  assert.equal(await user.getByRole('link',{name:'veta@kvazi.cz',exact:true}).getAttribute('href'),'mailto:veta@kvazi.cz');
  assert.ok((await user.locator('main').innerText()).includes('Omezení formuláře samo o sobě neznamená')); scenes++;
  await build();
  await user.locator('#sentenceFields summary').click();
  await user.locator('#sentence-meaning').fill(xss);
  await user.locator('#sentence-defense').fill(xss);
  await user.locator('#word-evidence-needsAnalogy').check();
  await user.locator('#word-evidence-explanation').fill(xss);
  await user.locator('#word-evidence-analogy').fill(xss);
  await user.getByLabel('Deklarovaná identita').selectOption('real');
  await user.locator('#word-evidence-source').selectOption('IJP');
  await user.locator('#word-evidence-reference').fill(xss);
  await user.getByLabel('Deklarovaná identita').selectOption('quasi');
  assert.ok(await user.locator('#submitButton').isEnabled());
  async function submit() {
    const [response] = await Promise.all([user.waitForResponse(r => r.url().endsWith('/api/submit.php')),user.locator('#submitButton').click()]);
    assert.equal(response.status(),200);
    const body = await response.json(); assert.equal(body.ok,true);
    return {...f.context(body.revisionId),sentenceId:body.id};
  }
  const first = await submit();
  const rev1Fingerprint = fingerprint(first);
  const manifest = JSON.parse(db(`SELECT row_to_json(v) FROM kvazi.validation_result v WHERE id=${first.validationResultId}`));
  assert.equal(manifest.rules_version,active); assert.equal(manifest.validator_version,JSON.parse(readFileSync(new URL(`../data/rules/${active}/manifest.json`,import.meta.url))).validator_version);
  assert.equal(manifest.is_valid,true); assert.equal(manifest.word_score,1); assert.equal(manifest.char_score,5);
  assert.equal(db(`SELECT user_id FROM kvazi.sentence WHERE id=${first.sentenceId}`),String(f.user));
  assert.equal(db(`SELECT submitted_by FROM kvazi.sentence_revision WHERE id=${first.revisionId}`),String(f.user));
  assert.equal((await f.get(`/konfigurator.php?sentenceId=${first.sentenceId}`,f.sessions.user)).status,409);
  assert.equal((await post('/api/submit.php',f.sessions.user,{draft:JSON.parse(db(`SELECT draft_json FROM kvazi.sentence_revision WHERE id=${first.revisionId}`)),sentenceId:first.sentenceId})).status,409);
  assert.equal((await f.get(`/veta.php?revisionId=${first.revisionId}`)).status,404);
  await footer(user).getByRole('link',{name:'Moje věty',exact:true}).click();
  await user.locator(`a[href="/moje-veta.php?revisionId=${first.revisionId}"]`).click();
  assert.equal(await user.locator('[data-action="pending"]').count(),1);
  assert.equal(await user.getByRole('link',{name:'Upravit a znovu odeslat',exact:true}).count(),0); scenes++;
  await safeRendering(user,true);
  await login(admin,f.adminName);
  f.sessions.admin = await session(admin);
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
  await safeRendering(admin,true);
  async function mutation(button,path) {
    const [response] = await Promise.all([admin.waitForResponse(r => r.url().endsWith(path)),admin.waitForNavigation({waitUntil:'domcontentloaded'}),button.click()]);
    assert.equal(response.status(),200);
  }
  const sentenceForm = () => admin.locator('form[data-endpoint="/api/admin/sentence-decision.php"]');
  // A: explicit production review, even if a shared case was already known.
  async function morphology(ids,tokenId,verdict='APPROVED') {
    const current = Number(db(`SELECT coalesce(max(d.decision_no),0) FROM kvazi.morphology_review_case c LEFT JOIN kvazi.morphology_review_decision d ON d.case_id=c.id
      WHERE c.rules_version=${pg(active)} AND c.identity_json='{"pos":"verb","lemma":"kvaziit","model":"V-IT"}'::jsonb
      AND c.form_json='{"verbFormType":"imperative","aspect":"biaspectual","verbPerson":"2sg"}'::jsonb AND c.surface_form='kvazi'`));
    const r = await post('/api/admin/morphology-review.php',f.sessions.admin,{...idsForApi(ids),tokenId,expectedDecisionNo:current,verdict,reason:'M4 acceptance production review '+verdict});
    assert.equal(r.status,200,JSON.stringify(r.body)); return r.body;
  }
  await morphology(first,'t1');
  f.backupCatalog(first,'t1');
  await mutation(admin.getByRole('button',{name:'Potvrdit jako neskutečné slovo',exact:true}),'/api/admin/real-word-catalog.php');
  await sentenceForm().locator('textarea').fill(returnReason);
  await mutation(admin.getByRole('button',{name:'Vrátit k přepracování',exact:true}),'/api/admin/sentence-decision.php');
  await admin.locator('[data-action="return"]').waitFor();
  assert.equal(await admin.getByRole('button',{name:'Vrátit k přepracování',exact:true}).count(),0); scenes++;
  await user.reload();
  assert.equal(await user.locator('.admin-reason').innerText(),returnReason);
  await safeRendering(user,true);
  assert.equal((await f.get(`/veta.php?revisionId=${first.revisionId}`)).status,404);
  assert.equal(await user.locator('.admin-reason b').count(),0);
  await user.getByRole('link',{name:'Upravit a znovu odeslat',exact:true}).click();
  assert.equal(await user.locator('#token-t1').count(),1); assert.ok(await user.locator('#submitButton').isEnabled());
  assert.equal(await user.locator('#newSurface').getAttribute('placeholder'),null);
  await user.locator('#token-t1').click();
  assert.equal(await user.locator('#insertPlace').count(),0);
  assert.equal(await user.locator('#word-surface').inputValue(),'kvazi');
  await user.locator('#word-surface').fill('qazi');
  assert.equal(await user.locator('#submitButton').isDisabled(),true);
  await user.locator('#word-surface').fill('kvazi');
  assert.equal(await user.locator('#submitButton').isEnabled(),true);
  await user.getByRole('button',{name:'Smazat kvazi',exact:true}).click();
  assert.equal(await user.locator('#newSurface').getAttribute('placeholder'),'Kvazivětu zadejte zde…');
  await user.locator('#newSurface').fill('kvazi'); await user.locator('#newSurface').press('Enter');
  await declareVerb('t2');
  await user.getByLabel('Valenční obhajoba').fill('Opravená deklarace bez obligatorního doplnění, V-IT.');
  const second = await submit();
  assert.equal(db(`SELECT draft_json::jsonb->'tokens'->0->>'id' FROM kvazi.sentence_revision WHERE id=${second.revisionId}`),'t2');
  assert.equal(second.sentenceId,first.sentenceId);
  assert.equal(fingerprint(first),rev1Fingerprint);
  assert.equal((await f.get(`/konfigurator.php?sentenceId=${second.sentenceId}`,f.sessions.user)).status,409);
  assert.equal(db(`SELECT revision_no FROM kvazi.sentence_revision WHERE id=${second.revisionId}`),'2'); scenes++;
  await nav(admin).getByRole('link',{name:'Ke schválení',exact:true}).click();
  assert.equal(await admin.locator(`a[href="/admin/veta.php?revisionId=${first.revisionId}"]`).count(),0);
  await admin.locator(`a[href="/admin/veta.php?revisionId=${second.revisionId}"]`).click();
  const usedReview = await morphology(second,'t2');
  await admin.reload();
  assert.equal(await admin.locator('.morphology-status').innerText(),'APPROVED');
  // D: exact true and false through the real catalog UI; incomplete/unknown API has no metadata.
  await mutation(admin.getByRole('button',{name:'Potvrdit skutečné slovo',exact:true}),'/api/admin/real-word-catalog.php');
  async function catalogCheck(expected) {
    const [response] = await Promise.all([user.waitForResponse(r=>r.url().endsWith('/api/real-word-catalog.php')),user.locator('#catalogCheck').click()]);
    assert.equal(response.status(),200); assert.deepEqual(await response.json(),{ok:true,exactMatch:expected});
    await user.locator('#catalogResult').filter({hasText:expected ? 'je v katalogu potvrzena' : 'zatím v katalogu potvrzena není'}).waitFor();
  }
  await catalogCheck(true);
  await mutation(admin.getByRole('button',{name:'Potvrdit jako neskutečné slovo',exact:true}),'/api/admin/real-word-catalog.php');
  await catalogCheck(false); assert.ok(await user.locator('#submitButton').isEnabled());
  const draftToken = JSON.parse(db(`SELECT draft_json->'tokens'->0 FROM kvazi.sentence_revision WHERE id=${second.revisionId}`));
  const absent = await post('/api/real-word-catalog.php',f.sessions.user,{token:{...draftToken,lemma:f.tag+'unknownit'}});
  assert.equal(absent.status,200); assert.deepEqual(absent.body,{ok:true,exactMatch:false});
  const incomplete = await post('/api/real-word-catalog.php',f.sessions.user,{token:{pos:'verb',lemma:'kvaziit'}});
  assert.equal(incomplete.status,422); assert.deepEqual(Object.keys(incomplete.body).sort(),['error','ok']);
  acceptance.add('D'); scenes++;
  await admin.getByRole('button',{name:'Schválit',exact:true}).waitFor();
  assert.ok(await admin.getByRole('button',{name:'Schválit',exact:true}).isEnabled());
  await mutation(admin.getByRole('button',{name:'Schválit',exact:true}),'/api/admin/sentence-decision.php');
  await admin.locator('[data-action="approve"]').waitFor(); scenes++;
  await user.goto(BASE+`/moje-veta.php?revisionId=${second.revisionId}`);
  assert.equal(await user.locator('[data-action="approve"]').count(),1);
  assert.equal(await user.getByRole('link',{name:'Upravit a znovu odeslat',exact:true}).count(),0);
  await safeRendering(user,true);
  await user.goto(BASE + '/vety.php');
  assert.equal(await user.locator(`a[href="/veta.php?revisionId=${first.revisionId}"]`).count(),0);
  await user.locator(`a[href="/veta.php?revisionId=${second.revisionId}"]`).click();
  await viewport(user,390);
  assert.equal(await user.locator('[data-field="revision_id"]').innerText(),String(second.revisionId));
  assert.ok(!(await user.locator('main').innerText()).includes('PRIVATE_BROWSER_EVIDENCE'));
  assert.ok(!(await user.locator('main').innerText()).includes('PRIVATE_BROWSER_REASON'));
  await safeRendering(user,false); acceptance.add('A'); scenes++;
  // Reject a different submission via the same actual browser decision controls.
  // B: second genuine browser submission, with nonblocking exactMatch=false.
  await build(); await catalogCheck(false);
  assert.ok(await user.locator('#submitButton').isEnabled());
  const rejected = await submit();
  await nav(admin).getByRole('link',{name:'Ke schválení',exact:true}).click();
  assert.equal(await admin.locator(`a[href="/admin/veta.php?revisionId=${rejected.revisionId}"]`).count(),1);
  await admin.goto(BASE + `/admin/veta.php?revisionId=${rejected.revisionId}`);
  await admin.getByRole('button',{name:'Zamítnout',exact:true}).click();
  assert.ok((await admin.locator('#reviewMessage').innerText()).includes('neprázdný důvod'));
  await sentenceForm().locator('textarea').fill('Finální zamítnutí.');
  await mutation(admin.getByRole('button',{name:'Zamítnout',exact:true}),'/api/admin/sentence-decision.php');
  await admin.locator('[data-action="reject"]').waitFor();
  await user.goto(BASE + `/moje-veta.php?revisionId=${rejected.revisionId}`);
  assert.equal(await user.locator('.admin-reason').innerText(),'Finální zamítnutí.');
  assert.equal(await user.getByRole('link',{name:'Upravit a znovu odeslat',exact:true}).count(),0);
  assert.equal((await f.get(`/veta.php?revisionId=${rejected.revisionId}`)).status,404);
  acceptance.add('B'); scenes++;
  await footer(user).getByRole('button',{name:'Odhlásit se',exact:true}).click();
  await footer(user).getByRole('link',{name:'Přihlásit se',exact:true}).waitFor();
  assert.equal(await nav(user).getByRole('link',{name:'Přihlásit se',exact:true}).count(),0);
  assert.equal(await nav(user).getByRole('link',{name:'Moje věty',exact:true}).count(),0); scenes++;
  // C: direct HTTP requests, never relying on links being hidden.
  for (const path of ['/moje-vety.php',`/moje-veta.php?revisionId=${second.revisionId}`,'/admin/vety.php',`/admin/veta.php?revisionId=${second.revisionId}`]) {
    assert.equal((await f.get(path)).status,302);
  }
  for (const path of ['/admin/vety.php',`/admin/veta.php?revisionId=${second.revisionId}`]) assert.equal((await f.get(path,f.sessions.foreign)).status,403);
  assert.equal((await post('/api/admin/sentence-decision.php',f.sessions.foreign,{...idsForApi(second),action:'approve'})).status,403);
  for (const ids of [first,second,rejected]) {
    assert.equal((await f.get(`/moje-veta.php?revisionId=${ids.revisionId}`,f.sessions.foreign)).status,404);
    assert.equal((await f.get(`/moje-veta.php?revisionId=${ids.revisionId}`,f.sessions.admin)).status,404);
  }
  const foreign = await post('/api/submit.php',f.sessions.foreign,{draft:JSON.parse(db(`SELECT draft_json FROM kvazi.sentence_revision WHERE id=${second.revisionId}`))});
  assert.equal(foreign.status,200);
  // Fresh standard owner login after the browser logout.
  await login(user,f.username); f.sessions.user = await session(user);
  assert.equal((await f.get(`/moje-veta.php?revisionId=${foreign.body.revisionId}`,f.sessions.user)).status,404);
  assert.equal((await f.get(`/konfigurator.php?sentenceId=${foreign.body.id}`,f.sessions.user)).status,404);
  assert.equal((await post('/api/submit.php',f.sessions.user,{draft:JSON.parse(db(`SELECT draft_json FROM kvazi.sentence_revision WHERE id=${second.revisionId}`)),sentenceId:foreign.body.id})).status,403);
  for (const ids of [second,rejected]) {
    assert.equal((await f.get(`/konfigurator.php?sentenceId=${ids.sentenceId}`,f.sessions.user)).status,409);
    assert.equal((await post('/api/submit.php',f.sessions.user,{draft:JSON.parse(db(`SELECT draft_json FROM kvazi.sentence_revision WHERE id=${second.revisionId}`)),sentenceId:ids.sentenceId})).status,409);
  }
  assert.equal((await f.decide(second,'reject','duplicate')).status,409);
  for (const path of ['/api/admin/morphology-review.php','/api/admin/real-word-catalog.php','/api/admin/sentence-decision.php']) {
    for (const token of [undefined,'incorrect']) assert.equal((await post(path,f.sessions.admin,{...idsForApi(second),csrf:token})).status,403);
  }
  acceptance.add('C'); scenes++;
  // E: DB is an assertion layer; every lifecycle decision above used production APIs/UI.
  assert.equal(fingerprint(first),rev1Fingerprint);
  assert.equal(db(`SELECT string_agg(revision_no::text,',' ORDER BY revision_no) FROM kvazi.sentence_revision WHERE sentence_id=${first.sentenceId}`),'1,2');
  const decisions = JSON.parse(db(`SELECT json_agg(a ORDER BY revision_id) FROM kvazi.administrative_decision a WHERE revision_id IN (${first.revisionId},${second.revisionId},${rejected.revisionId})`));
  assert.equal(decisions.length,3);
  for (const [ids,action,reason] of [[first,'return',returnReason],[second,'approve',''],[rejected,'reject','Finální zamítnutí.']]) {
    const decision = decisions.find(d=>d.revision_id===ids.revisionId);
    assert.equal(decision.action,action); assert.equal(decision.reason,reason); assert.equal(decision.sentence_id,ids.sentenceId); assert.equal(decision.admin_id,f.admin);
  }
  const bindings = () => db(`SELECT review_decision_id FROM kvazi.validation_result_review WHERE validation_result_id=${second.validationResultId} AND token_id='t2'`);
  assert.equal(bindings(),String(usedReview.usedDecisionId));
  const approvedFingerprint = fingerprint(second), oldBinding = bindings();
  const corrected = await morphology(second,'t2','REJECTED');
  assert.equal(corrected.status,'REJECTED'); assert.equal(corrected.usedStatus,'APPROVED');
  assert.equal(bindings(),oldBinding); assert.equal(fingerprint(second),approvedFingerprint);
  assert.equal((await f.get(`/veta.php?revisionId=${second.revisionId}`)).status,200);
  for (const table of ['process_compliance','audit_log']) assert.equal(db(`SELECT to_regclass(${pg('kvazi.'+table)}) IS NULL`),'t');
  for (const sql of [`UPDATE kvazi.sentence_revision SET created_at=now() WHERE id=${first.revisionId}`,
    `UPDATE kvazi.validation_result SET created_at=now() WHERE id=${first.validationResultId}`,
    `UPDATE kvazi.administrative_decision SET reason='tampered' WHERE revision_id=${first.revisionId}`,
    `UPDATE kvazi.validation_result_review SET review_decision_id=${corrected.decision.id} WHERE validation_result_id=${second.validationResultId}`]) assert.throws(()=>db(sql));
  assert.equal(fingerprint(first),rev1Fingerprint); assert.equal(bindings(),oldBinding);
  acceptance.add('E'); scenes++;
  assert.deepEqual([...acceptance].sort(),['A','B','C','D','E']);
  assert.ok(renderingChecks>=3); scenes++;
  assert.deepEqual(errors,[]);
  console.log(`Playwright M4 workflow: ${scenes}/${scenes} PASS; desktop 1440px, mobile 390px; real UI registration/login/submit/return/resubmit/review/approve/reject/public/logout.`);
  console.log('M4 LIFECYCLE ACCEPTANCE: 5/5 PASS (A, B, C, D, E); stored XSS owner/admin/public PASS; immutable bindings after production cache correction PASS.');
} finally {if (browser) await browser.close(); f.cleanup();}
