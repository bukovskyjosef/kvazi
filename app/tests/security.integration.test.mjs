import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, symlinkSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {workflowFixtures, BASE, db, pg, post, validDraft, idsForApi} from './workflow-fixtures.mjs';
import {login} from './review-fixtures.mjs';

let f;
const createdUsers = [];
let throttleRemote, throttleBackup;
const cookie = r => r.headers.getSetCookie().map(v => v.split(';')[0]).join('; ');
const csrf = html => html.match(/name="csrf"\s+(?:value|content)="([^"]+)"/)[1];
async function form(path, values, session) {
  const page = session ? null : await fetch(BASE + path);
  const token = session?.csrf ?? csrf(await page.text());
  const response = await fetch(BASE + path, {method:'POST', redirect:'manual',
    headers:{'Content-Type':'application/x-www-form-urlencoded',Cookie:session?.cookie ?? cookie(page)},
    body:new URLSearchParams({csrf:token,...values}), signal:AbortSignal.timeout(10000)});
  return {response, html:await response.text()};
}
function privateResponse(text) {
  assert.doesNotMatch(text, /SQLSTATE|Stack trace|Fatal error|\/var\/www|\/Users\/|DB_PASS|PDOException/);
}
function business() {
  return db(`SELECT (SELECT count(*) FROM kvazi.sentence_revision),
    (SELECT count(*) FROM kvazi.morphology_review_case), (SELECT count(*) FROM kvazi.morphology_review_decision),
    (SELECT count(*) FROM kvazi.validation_result_review), (SELECT count(*) FROM kvazi.real_word_catalog),
    (SELECT count(*) FROM kvazi.administrative_decision), (SELECT count(*) FROM kvazi.user_account)`);
}
before(async () => {f = await workflowFixtures();});
after(() => {
  if (throttleRemote) {
    db(`DELETE FROM kvazi.login_throttle WHERE remote_address=${pg(throttleRemote)}`);
    if (throttleBackup) db(`INSERT INTO kvazi.login_throttle SELECT * FROM json_populate_record(NULL::kvazi.login_throttle,${pg(JSON.stringify(throttleBackup))})`);
  }
  for (const name of createdUsers) db(`DELETE FROM kvazi.user_account WHERE username=${pg(name)}`);
  f?.cleanup();
});

test('login return: local path/query preserved; schemes, authorities, controls and encodings rejected over HTTP', async () => {
  const paths = ['/konfigurator.php','/moje-veta.php?revisionId=123', '//evil.example', 'https://evil.example',
    'http://evil.example','\\\\evil.example','javascript:alert(1)','data:text/html,evil',
    '/%2fevil.example','/%252fevil.example','/%5cevil.example','/%255cevil.example',
    '/good%0d%0aLocation:%20https://evil.example','/good\r\nLocation: evil','/good%00','/%09/evil.example'];
  for (const [index, value] of paths.entries()) {
    const {response,html} = await form('/login.php?return=' + encodeURIComponent(value), {identifier:f.username,password:f.password});
    assert.equal(response.status,302,html);
    assert.equal(response.headers.get('location'), index < 2 ? value : '/moje.php');
    privateResponse(html);
  }
  const {response} = await form('/login.php?return[]=//evil.example',{identifier:f.username,password:f.password});
  assert.equal(response.headers.get('location'),'/moje.php');
});

test('production cookie: actual HTTP AUTH_COOKIE_SECURE=1 has Secure, HttpOnly, SameSite=Lax', () => {
  // Disposable PHP HTTP runtime in the existing container, isolated from the app port.
  const script = `set -eu
AUTH_COOKIE_SECURE=1 php -S 127.0.0.1:18084 -t /var/www/html >/tmp/kvazi-secure-http.log 2>&1 &
test_server_pid=$!
trap 'kill "$test_server_pid"; rm -f /tmp/kvazi-secure-http.log' EXIT
php -r '$r=false; for($i=0;$i<50;$i++){ $r=@file_get_contents("http://127.0.0.1:18084/login.php"); if($r!==false) break; usleep(100000); } if($r===false) exit(1); echo json_encode($http_response_header);'
`;
  const headers = JSON.parse(execFileSync('docker',['exec',process.env.KVAZI_PHP_CONTAINER || 'kvazi_php','sh','-c',script],{encoding:'utf8',timeout:15000}));
  const setCookie = headers.find(h => /^Set-Cookie:/i.test(h));
  assert.match(setCookie,/; secure/i); assert.match(setCookie,/; HttpOnly/i); assert.match(setCookie,/; SameSite=Lax/i);
});

test('HTTP session rotation, pre-login CSRF separation, two-hour expiry and old-cookie logout invalidation', async () => {
  const page = await fetch(BASE + '/login.php'); const preCookie = cookie(page), preCsrf = csrf(await page.text());
  const {response} = await form('/login.php',{identifier:f.username,password:f.password},{cookie:preCookie,csrf:preCsrf});
  assert.equal(response.status,302); const authenticated = cookie(response); assert.notEqual(authenticated,preCookie);
  const editor = await fetch(BASE + '/konfigurator.php',{headers:{Cookie:authenticated}}); const postCsrf = csrf(await editor.text());
  assert.notEqual(postCsrf,preCsrf);
  assert.equal((await post('/api/submit.php',{cookie:authenticated,csrf:preCsrf},{draft:validDraft()})).status,403);
  const sid = authenticated.match(/PHPSESSID=([A-Za-z0-9,-]+)/)[1];
  execFileSync('docker',['exec',process.env.KVAZI_PHP_CONTAINER || 'kvazi_php','php','-r',
    'session_id($argv[1]); session_start(); $_SESSION["started_at"]=time()-7200; session_write_close();',sid],{timeout:10000});
  const expired = await f.get('/moje-vety.php',{cookie:authenticated}); assert.equal(expired.status,302);
  assert.equal((await post('/api/submit.php',{cookie:authenticated,csrf:postCsrf},{draft:validDraft()})).status,401);
  const session = await login(f.username,f.password);
  for (const bad of ['', 'wrong']) assert.equal((await form('/logout.php',{csrf:bad},session)).response.status,403);
  assert.equal((await form('/logout.php',{},session)).response.status,302);
  assert.equal((await post('/api/submit.php',session,{draft:validDraft()})).status,401);
});

test('every JSON POST: missing/wrong CSRF causes no business writes; authorized valid requests work', async () => {
  const ids = f.revision();
  const cases = [
    ['/api/submit.php',f.sessions.user,{draft:validDraft()}],
    ['/api/admin/morphology-review.php',f.sessions.admin,{...idsForApi(ids),tokenId:'t1',verdict:'APPROVED',expectedDecisionNo:0}],
    ['/api/admin/real-word-catalog.php',f.sessions.admin,{...idsForApi(ids),tokenId:'t1',isApproved:true}],
    ['/api/admin/review-status.php',f.sessions.admin,idsForApi(ids)],
    ['/api/admin/sentence-decision.php',f.sessions.admin,{...idsForApi(ids),action:'return',reason:'Security fixture return'}],
    ['/api/real-word-catalog.php',f.sessions.user,{token:f.token}],
  ];
  for (const [path,session,payload] of cases) {
    const before = business();
    for (const bad of [undefined,'wrong']) {
      const r = await post(path,session,{...payload,csrf:bad}); assert.equal(r.status,403,path); privateResponse(JSON.stringify(r.body));
    }
    assert.equal(business(),before,path);
    assert.equal((await post(path,session,payload)).status,200,path);
  }
});

test('login/register form CSRF and malformed field types fail safely, without accounts or authenticated sessions', async () => {
  for (const path of ['/login.php','/register.php']) {
    const before = business();
    for (const bad of ['', 'wrong']) {
      const {response,html} = await form(path,{csrf:bad,identifier:f.username,username:f.tag+'bad',email:f.tag+'bad@kvazi.int',password:f.password,password2:f.password});
      assert.equal(response.status,200); assert.match(html,/bezpečnostní token/); privateResponse(html);
      assert.equal((await f.get('/moje-vety.php',{cookie:cookie(response)})).status,302);
    }
    const {response,html} = await form(path,{'identifier[]':'x','username[]':'x','email[]':'x','password[]':'x'});
    assert.equal(response.status,400); privateResponse(html); assert.equal(business(),before);
  }
});

test('all admin surfaces deny anonymous and USER; DB role revocation denies the existing ADMIN cookie immediately', async () => {
  const ids = f.revision();
  const pages = ['/admin/vety.php',`/admin/veta.php?revisionId=${ids.revisionId}`];
  const endpoints = ['/api/admin/morphology-review.php','/api/admin/real-word-catalog.php','/api/admin/review-status.php','/api/admin/sentence-decision.php'];
  for (const path of pages) {
    assert.equal((await f.get(path)).status,302); assert.equal((await f.get(path,f.sessions.user)).status,403);
    assert.equal((await f.get(path,f.sessions.admin)).status,200);
  }
  for (const path of endpoints) {
    assert.equal((await post(path,null)).status,401); assert.equal((await post(path,f.sessions.user)).status,403);
  }
  db(`UPDATE kvazi.user_account SET role='USER' WHERE id=${f.admin}`);
  try {
    const before = business();
    for (const path of pages) assert.equal((await f.get(path,f.sessions.admin)).status,403);
    for (const path of endpoints) assert.equal((await post(path,f.sessions.admin,{...idsForApi(ids),action:'approve'})).status,403);
    assert.equal(business(),before);
  } finally {db(`UPDATE kvazi.user_account SET role='ADMIN' WHERE id=${f.admin}`);}
});

test('mutation methods: GET/PUT/PATCH/DELETE cannot change business data or log out', async () => {
  const paths = ['/logout.php','/api/submit.php','/api/real-word-catalog.php','/api/admin/morphology-review.php',
    '/api/admin/real-word-catalog.php','/api/admin/review-status.php','/api/admin/sentence-decision.php'];
  const before = business();
  for (const path of paths) for (const method of ['GET','PUT','PATCH','DELETE']) {
    const r = await fetch(BASE + path + '?action=approve',{method,headers:{Cookie:f.sessions.admin.cookie},redirect:'manual'});
    assert.equal(r.status,405,`${method} ${path}`); privateResponse(await r.text());
  }
  assert.equal(business(),before); assert.equal((await f.get('/admin/vety.php',f.sessions.admin)).status,200);
});

test('registration canonical email, username uniqueness and concurrent requests rely on DB without SQL disclosure', async () => {
  const name = f.tag+'reg'; createdUsers.push(name);
  const email = name+'@example.com';
  assert.equal((await form('/register.php',{username:name,email:'  '+email.toUpperCase()+'  ',password:f.password,password2:f.password})).response.status,302);
  assert.equal(db(`SELECT email || '|' || role FROM kvazi.user_account WHERE username=${pg(name)}`),email+'|USER');
  for (const values of [{username:f.tag+'dup',email},{username:name.toUpperCase(),email:f.tag+'other@example.com'},
    {username:f.tag+'badmail',email:'not-email'}]) {
    const {response,html} = await form('/register.php',{...values,password:f.password,password2:f.password});
    assert.equal(response.status,200); privateResponse(html);
  }
  const concurrentEmail = f.tag+'race@example.com';
  const names = [f.tag+'racea',f.tag+'raceb']; createdUsers.push(...names);
  const results = await Promise.all(names.map(username => form('/register.php',{username,email:concurrentEmail,password:f.password,password2:f.password})));
  assert.deepEqual(results.map(r=>r.response.status).sort(),[200,302]);
  for (const r of results) privateResponse(r.html);
  assert.equal(db(`SELECT count(*) FROM kvazi.user_account WHERE lower(btrim(email))=${pg(concurrentEmail)}`),'1');
});

test('HTTP login throttle: neutral failures, exact limit, parallel reservations, expiry and success reset; XFF cannot bypass', async () => {
  const initial = JSON.parse(db("SELECT coalesce(json_agg(t),'[]') FROM kvazi.login_throttle t"));
  const failure = await form('/login.php',{identifier:f.username,password:'incorrect'});
  const after = JSON.parse(db("SELECT coalesce(json_agg(t),'[]') FROM kvazi.login_throttle t"));
  const changed = after.filter(row => JSON.stringify(row) !== JSON.stringify(initial.find(old => old.remote_address===row.remote_address)));
  assert.equal(changed.length,1); throttleRemote=changed[0].remote_address; throttleBackup=initial.find(row=>row.remote_address===throttleRemote);
  db(`DELETE FROM kvazi.login_throttle WHERE remote_address=${pg(throttleRemote)}`);
  assert.match(failure.html,/Nesprávný e-mail/);
  for (let i=0;i<10;i++) {
    const r = await form('/login.php',{identifier:i%2 ? f.username : f.tag+'missing',password:'incorrect'});
    assert.equal(r.response.status,200); assert.match(r.html,/Nesprávný e-mail\/uživatelské jméno nebo heslo/);
  }
  const blocked = await form('/login.php',{identifier:f.username,password:f.password}); assert.match(blocked.html,/Příliš mnoho/);
  const page = await fetch(BASE+'/login.php'); const token = csrf(await page.text());
  const spoof = await fetch(BASE+'/login.php',{method:'POST',headers:{Cookie:cookie(page),'Content-Type':'application/x-www-form-urlencoded','X-Forwarded-For':'203.0.113.73'},
    body:new URLSearchParams({csrf:token,identifier:f.username,password:f.password}),redirect:'manual'});
  assert.match(await spoof.text(),/Příliš mnoho/);
  db(`UPDATE kvazi.login_throttle SET window_started_at=now()-interval '16 minutes' WHERE remote_address=${pg(throttleRemote)}`);
  assert.equal((await form('/login.php',{identifier:f.username,password:f.password})).response.status,302);
  assert.equal(db(`SELECT count(*) FROM kvazi.login_throttle WHERE remote_address=${pg(throttleRemote)}`),'0');
  const requests = await Promise.all(Array.from({length:12}, async () => {
    const page = await fetch(BASE+'/login.php'); return {cookie:cookie(page),csrf:csrf(await page.text())};
  }));
  const responses = await Promise.all(requests.map(session=>form('/login.php',{identifier:f.username,password:'incorrect'},session)));
  assert.equal(responses.filter(r=>r.html.includes('Nesprávný e-mail')).length,10);
  assert.equal(responses.filter(r=>r.html.includes('Příliš mnoho')).length,2);
  db(`UPDATE kvazi.login_throttle SET window_started_at=now()-interval '16 minutes' WHERE remote_address=${pg(throttleRemote)}`);
  assert.equal((await form('/login.php',{identifier:f.username,password:f.password})).response.status,302);
});

test('safe errors and exact player contract: malformed structures and unsupported lookup never expose internals', async () => {
  for (const draft of [{tokens:[null]}, {tokens:[{surface:{private:'value'}}]}]) {
    const r = await post('/api/submit.php',f.sessions.user,{draft}); assert.equal(r.status,422); privateResponse(JSON.stringify(r.body));
  }
  const r = await post('/api/real-word-catalog.php',f.sessions.user,{token:{pos:'pronoun',lemma:f.tag}});
  assert.equal(r.status,422); assert.deepEqual(Object.keys(r.body).sort(),['error','ok']); privateResponse(JSON.stringify(r.body));
});

test('HTTP minimum headers apply consistently to pages, JSON and denied responses', async () => {
  for (const path of ['/','/login.php','/register.php','/konfigurator.php','/vety.php','/veta.php?revisionId=0',
    '/moje-vety.php','/admin/vety.php','/api/normative.php','/api/submit.php','/api/admin/review-status.php']) {
    const r = await fetch(BASE+path,{redirect:'manual'});
    assert.equal(r.headers.get('x-content-type-options'),'nosniff',path);
    assert.equal(r.headers.get('referrer-policy'),'same-origin',path);
    assert.equal(r.headers.get('x-frame-options'),'DENY',path);
  }
});

test('release runner fails before fixtures with missing Docker/PHP/DB/HTTP/Playwright/browser and prints FAIL', () => {
  const dir = mkdtempSync(join(tmpdir(),'kvazi-m4-preflight-'));
  try {
    const bash = execFileSync('/usr/bin/which',['bash'],{encoding:'utf8'}).trim();
    for (const omitted of ['docker','php']) {
      const shim = join(dir,omitted); execFileSync('/bin/mkdir',[shim]);
      for (const tool of ['docker','php','node','dirname'].filter(v=>v!==omitted)) {
        symlinkSync(execFileSync('/usr/bin/which',[tool],{encoding:'utf8'}).trim(),join(shim,tool));
      }
      assert.throws(()=>execFileSync(bash,['app/tests/run-integration.sh'],{env:{...process.env,PATH:shim},stdio:'pipe',timeout:15000}), error => {
        assert.ok(error.status!==0); assert.match(error.stderr.toString(),/RELEASE GATE: FAIL/); return true;
      });
    }
    for (const override of [{KVAZI_DB_CONTAINER:'kvazi_m4_missing_database'}, {KVAZI_TEST_BASE_URL:'http://127.0.0.1:1'},
      {PLAYWRIGHT_MODULE:join(dir,'missing-playwright.mjs')}, {CHROME_PATH:join(dir,'missing-browser')}]) {
      assert.throws(()=>execFileSync(bash,['app/tests/run-integration.sh'],{env:{...process.env,...override},stdio:'pipe',timeout:15000}), error => {
        assert.ok(error.status!==0); assert.match(error.stderr.toString(),/RELEASE GATE: FAIL/); return true;
      });
    }
  } finally {rmSync(dir,{recursive:true,force:true});}
});
