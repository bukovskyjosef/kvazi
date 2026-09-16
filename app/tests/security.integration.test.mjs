import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, symlinkSync, rmSync, readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
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
  assert.doesNotMatch(text, /SQLSTATE|Stack trace|Fatal error|\/var\/www|\/Users\/|DB_PASSWORD|PDOException/);
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
  const spoof = await fetch(BASE+'/login.php',{method:'POST',headers:{Cookie:cookie(page),'Content-Type':'application/x-www-form-urlencoded','X-Forwarded-For':'203.0.113.73','CF-Connecting-IP':'203.0.113.74'},
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

test('trusted proxy CIDR matcher: IPv4/IPv6 boundaries, exact hosts and malformed entries fail safely', () => {
  const cases = [
    ['172.20.1.2','172.20.0.0/16',true], ['172.21.1.2','172.20.0.0/16',false],
    ['192.0.2.7','192.0.2.7/32',true], ['192.0.2.8','192.0.2.7/32',false],
    ['192.0.2.127','192.0.2.0/25',true], ['192.0.2.128','192.0.2.0/25',false],
    ['2001:db8::7','2001:db8::/32',true], ['2001:db9::7','2001:db8::/32',false],
    ['2001:db8::7','2001:db8::7/128',true], ['2001:db8::8','2001:db8::7/128',false],
    ['2001:db8::7fff','2001:db8::/113',true], ['2001:db8::8000','2001:db8::/113',false],
    ['192.0.2.7','::/0',false], ['::ffff:192.0.2.7','192.0.2.0/24',false],
    ...['','unknown','192.0.2.7','192.0.2.0/33','192.0.2.0/-1','192.0.2.0/abc',
      '192.0.2.0/','192.0.2.0/24/0','2001:db8::/129','evil/0'].map(c=>['192.0.2.7',c,false]),
  ];
  const results = JSON.parse(execFileSync('php',['-r',
    'require "app/public/includes/auth.php"; $cases=json_decode($argv[1],true); echo json_encode(array_map(fn($c)=>auth_ip_in_cidr($c[0],$c[1]),$cases));',
    JSON.stringify(cases)],{encoding:'utf8'}));
  assert.deepEqual(results,cases.map(c=>c[2]));
});

test('client IP: trust nobody default, trusted/untrusted boundary, invalid headers/config and IPv6 normalization', () => {
  const cases = [
    ['', '172.20.1.2','198.51.100.7','172.20.1.2'],
    ['172.20.0.0/16','172.20.1.2','198.51.100.7','198.51.100.7'],
    ['172.20.0.0/16','172.20.1.2','198.51.100.8','198.51.100.8'],
    ['172.20.1.2/32','172.20.1.2','198.51.100.7','198.51.100.7'],
    ['172.20.0.0/16','172.21.1.2','198.51.100.7','172.21.1.2'],
    ['unknown,172.20.0.0/33,evil/0','172.20.1.2','198.51.100.7','172.20.1.2'],
    ['unknown, 172.20.0.0/16','172.20.1.2','198.51.100.7','198.51.100.7'],
    ['2001:db8::/32','2001:db8::7','2001:db8:1:0:0:0:0:8','2001:db8:1::8'],
    ...[null,'unknown','abc','1.2.3.4<script>','1.2.3.4,evil','198.51.100.7, 198.51.100.8',
      ' 198.51.100.7'].map(v=>['172.20.0.0/16','172.20.1.2',v,'172.20.1.2']),
  ];
  const results = JSON.parse(execFileSync('php',['-r',
    'require "app/public/includes/auth.php"; $out=[]; foreach(json_decode($argv[1],true) as $c){ putenv("TRUSTED_PROXY_CIDRS=".$c[0]); $_SERVER=["REMOTE_ADDR"=>$c[1],"HTTP_X_FORWARDED_FOR"=>"203.0.113.99"]; if($c[2]!==null) $_SERVER["HTTP_CF_CONNECTING_IP"]=$c[2]; $out[]=auth_client_ip(); } echo json_encode($out);',
    JSON.stringify(cases)],{encoding:'utf8'}));
  assert.deepEqual(results,cases.map(c=>c[3]));
});

test('actual HTTP trusted proxy: two clients share a proxy but not throttle; invalid client falls back', () => {
  const suffix = randomBytes(6).toString('hex').match(/.{4}/g).map(v=>(Number.parseInt(v,16) | 0x1000).toString(16)).join(':');
  const clients = [`2001:db8:${suffix}::1`,`2001:db8:${suffix}::2`];
  const addresses = [...clients,'127.0.0.1'];
  const backups = JSON.parse(db(`SELECT coalesce(json_agg(t),'[]') FROM kvazi.login_throttle t WHERE remote_address IN (${addresses.map(pg).join(',')})`));
  db(`DELETE FROM kvazi.login_throttle WHERE remote_address IN (${addresses.map(pg).join(',')})`);
  const php = `
function attempt($client,$username,$password) {
  $headers="CF-Connecting-IP: ".$client."\\r\\nX-Forwarded-For: 203.0.113.99\\r\\n";
  $page=file_get_contents("http://127.0.0.1:18085/login.php",false,stream_context_create(["http"=>["header"=>$headers]]));
  preg_match('/name="csrf"\\s+value="([^"]+)"/',$page,$csrf);
  foreach($http_response_header as $h) if(str_starts_with(strtolower($h),"set-cookie:")) $cookie=explode(";",substr($h,12))[0];
  $result=file_get_contents("http://127.0.0.1:18085/login.php",false,stream_context_create(["http"=>[
    "method"=>"POST","follow_location"=>0,"ignore_errors"=>true,
    "header"=>$headers."Content-Type: application/x-www-form-urlencoded\\r\\nCookie: ".$cookie."\\r\\n",
    "content"=>http_build_query(["csrf"=>$csrf[1],"identifier"=>$username,"password"=>$password])]]));
  return ["status"=>$http_response_header[0],"throttled"=>str_contains($result,"Příliš mnoho"),"failed"=>str_contains($result,"Nesprávný e-mail")];
}
for($i=0;$i<50;$i++){ if(@file_get_contents("http://127.0.0.1:18085/login.php")!==false) break; usleep(100000); }
$clients=json_decode($argv[1],true); $out=[];
for($i=0;$i<10;$i++) $out[]=attempt($clients[0],$argv[2],"incorrect");
$out[]=attempt($clients[0],$argv[2],$argv[3]);
$out[]=attempt($clients[1],$argv[2],"incorrect");
$out[]=attempt($clients[1],$argv[2],$argv[3]);
$out[]=attempt("1.2.3.4,evil",$argv[2],"incorrect");
echo json_encode($out);
`;
  const script = `set -eu
TRUSTED_PROXY_CIDRS=127.0.0.1/32 AUTH_COOKIE_SECURE=0 php -S 127.0.0.1:18085 -t /var/www/html >/tmp/kvazi-proxy-http.log 2>&1 &
test_proxy_pid=$!
trap 'kill "$test_proxy_pid"; rm -f /tmp/kvazi-proxy-http.log' EXIT
php -r "$1" "$2" "$3" "$4"
`;
  try {
    const result = JSON.parse(execFileSync('docker',['exec',process.env.KVAZI_PHP_CONTAINER || 'kvazi_php','sh','-c',script,
      'proxy-test',php,JSON.stringify(clients),f.username,f.password],{encoding:'utf8',timeout:20000}));
    assert.ok(result.slice(0,10).every(r=>r.failed && !r.throttled));
    assert.equal(result[10].throttled,true);
    assert.equal(result[11].failed,true); assert.equal(result[11].throttled,false);
    assert.match(result[12].status,/302/); assert.equal(result[13].failed,true);
    assert.equal(db(`SELECT failures FROM kvazi.login_throttle WHERE remote_address=${pg(clients[0])}`),'11');
    assert.equal(db(`SELECT count(*) FROM kvazi.login_throttle WHERE remote_address=${pg(clients[1])}`),'0');
    assert.equal(db("SELECT failures FROM kvazi.login_throttle WHERE remote_address='127.0.0.1'"),'1');
  } finally {
    db(`DELETE FROM kvazi.login_throttle WHERE remote_address IN (${addresses.map(pg).join(',')})`);
    for (const row of backups) db(`INSERT INTO kvazi.login_throttle SELECT * FROM json_populate_record(NULL::kvazi.login_throttle,${pg(JSON.stringify(row))})`);
  }
});

test('env contract: real env files ignored, example safe/versionable, Compose default and explicit override render', () => {
  for (const path of ['.env','.env.production']) {
    assert.equal(execFileSync('git',['check-ignore','--no-index',path],{encoding:'utf8'}).trim(),path);
  }
  assert.throws(()=>execFileSync('git',['check-ignore','--no-index','.env.example'],{stdio:'pipe'}),e=>e.status===1);
  const example = readFileSync('.env.example','utf8');
  assert.doesNotMatch(example,/BEGIN .*PRIVATE KEY|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9]{30,}|SMTP|ADMIN_PASSWORD/i);
  const values = Object.fromEntries(example.split('\n').filter(v=>v && !v.startsWith('#')).map(v=>v.split('=')));
  assert.deepEqual(Object.keys(values).sort(),['APP_ENV','DB_HOST','DB_PORT','DB_NAME','DB_USER','DB_PASSWORD','AUTH_COOKIE_SECURE','TRUSTED_PROXY_CIDRS'].sort());
  assert.equal(values.DB_PASSWORD,'change-me'); assert.equal(values.TRUSTED_PROXY_CIDRS,'');
  const defaults = {APP_ENV:'development',DB_HOST:'db',DB_PORT:'5432',DB_NAME:'kvazi',DB_USER:'kvazi',DB_PASSWORD:'kvazi',AUTH_COOKIE_SECURE:'0',TRUSTED_PROXY_CIDRS:''};
  const render = overrides => JSON.parse(execFileSync('docker',['compose','--env-file','/dev/null','config','--format','json'],
    {env:{...process.env,...overrides},encoding:'utf8',stdio:'pipe',timeout:15000}));
  // Empty values exercise Compose's documented local fallback substitutions.
  const local = render(Object.fromEntries(Object.keys(defaults).map(k=>[k,''])));
  assert.deepEqual(local.services.php.environment,defaults);
  const override = {...defaults,APP_ENV:'production',DB_HOST:'testdb',DB_PORT:'5444',DB_NAME:'testname',DB_USER:'testuser',
    DB_PASSWORD:'testpassword',AUTH_COOKIE_SECURE:'1',TRUSTED_PROXY_CIDRS:'192.0.2.7/32'};
  const rendered = render(override);
  assert.deepEqual(rendered.services.php.environment,override);
  assert.deepEqual(rendered.services.db.environment,{POSTGRES_DB:'testname',POSTGRES_USER:'testuser',POSTGRES_PASSWORD:'testpassword'});
  assert.match(rendered.services.db.healthcheck.test[1],/POSTGRES_USER/);
  assert.match(rendered.services.db.healthcheck.test[1],/POSTGRES_DB/);
});
