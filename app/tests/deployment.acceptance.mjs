// Mandatory production packaging gate: own image/network/volume/PG18, no source mounts.
import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomBytes, createHash} from 'node:crypto';
import {readFileSync, readdirSync} from 'node:fs';
import {HEALTHCHECK_COMMAND} from '../tools/deploy-production.mjs';

const tag = 'kvazi_m45_' + randomBytes(8).toString('hex');
const image = 'kvazi-m45-test:' + tag;
const network = tag + '_net', volume = tag + '_data', database = tag + '_db', application = tag + '_app';
const password = randomBytes(24).toString('hex');
const dbHost = 'external-pg-resource', dbName = 'external_m45', dbUser = 'm45user', dbPort = '5544';
let base, built = false, marker;
const docker = (args, options = {}) => execFileSync('docker',args,{encoding:'utf8',stdio:'pipe',timeout:30000,...options}).trim();
const sql = statement => docker(['exec',database,'psql','-p',dbPort,'-U',dbUser,'-d',dbName,'-v','ON_ERROR_STOP=1','-t','-A','-c',statement]);
const inspect = name => JSON.parse(docker(['inspect',name]))[0];
async function readyDB() {
  for (let i=0;i<100;i++) {
    try {docker(['exec',database,'pg_isready','-p',dbPort,'-U',dbUser,'-d',dbName]); return;}
    catch {await new Promise(resolve=>setTimeout(resolve,100));}
  }
  throw new Error('Disposable external PostgreSQL 18 did not become ready');
}
async function startApp() {
  docker(['run','-d','--name',application,'--network',network,'-p','127.0.0.1::80',
    '-e','APP_ENV=production','-e',`DB_HOST=${dbHost}`,'-e',`DB_PORT=${dbPort}`,'-e',`DB_NAME=${dbName}`,
    '-e',`DB_USER=${dbUser}`,'-e',`DB_PASSWORD=${password}`,'-e','AUTH_COOKIE_SECURE=1',
    '-e','TRUSTED_PROXY_CIDRS=192.0.2.7/32',image]);
  base = 'http://' + docker(['port',application,'80/tcp']).split('\n')[0];
  for (let i=0;i<100;i++) {
    try {if ((await fetch(base+'/healthz',{redirect:'manual',signal:AbortSignal.timeout(500)})).status===200) return;}
    catch {}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  throw new Error('Self-contained application did not become ready');
}
async function health(expected) {
  const response = await fetch(base+'/healthz',{redirect:'manual',signal:AbortSignal.timeout(5000)});
  assert.equal(response.status,expected);
  assert.match(response.headers.get('content-type'),/^application\/json/);
  assert.equal(response.headers.get('set-cookie'),null);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.deepEqual(await response.json(),{status:expected===200 ? 'ok' : 'unavailable'});
  // Execute the exact Coolify CMD probe inside the production image, including DB outage.
  if (expected === 200) docker(['exec',application,'sh','-c',HEALTHCHECK_COMMAND]);
  else assert.throws(() => docker(['exec',application,'sh','-c',HEALTHCHECK_COMMAND]), error => error.status === 1);
}
const snapshot = () => sql("SELECT md5(row_to_json(u)::text) FROM kvazi.user_account u WHERE username='m45_marker'")
  + '|' + sql("SELECT md5(string_agg(row_to_json(r)::text,'|' ORDER BY version)) FROM kvazi.rules_release r");
before(async () => {
  docker(['compose','config','--quiet']);
  docker(['build','-f','docker/php/Dockerfile','-t',image,'.'],{timeout:600000}); built=true;
  docker(['network','create',network]); docker(['volume','create',volume]);
  docker(['run','-d','--name',database,'--network',network,'--network-alias',dbHost,
    '--mount',`type=volume,source=${volume},target=/var/lib/postgresql`,
    '-e',`POSTGRES_DB=${dbName}`,'-e',`POSTGRES_USER=${dbUser}`,'-e',`POSTGRES_PASSWORD=${password}`,
    'postgres:18-alpine','-p',dbPort]);
  await readyDB(); await startApp();
});
after(() => {
  const errors=[];
  for (const args of [['rm','-f',application],['rm','-f',database],['volume','rm',volume],['network','rm',network],
    ...(built ? [['image','rm',image]] : [])]) {
    try {docker(args);} catch (e) {
      // Partial setup may not have created a resource; all names belong to this run.
      if (!/No such|not found/i.test(e.stderr?.toString() ?? '')) errors.push(e);
    }
  }
  if (errors.length) throw new AggregateError(errors,'M4.5 disposable resource cleanup failed');
});

test('production root build: PHP8.3/extensions/layout/port, no DB/secrets/source mounts; startup leaves empty DB untouched',async () => {
  const app = inspect(application);
  assert.deepEqual(app.Mounts,[]);
  assert.ok(app.Config.ExposedPorts['80/tcp']);
  assert.equal(app.Config.Image,image);
  const layout=JSON.parse(docker(['exec',application,'php','-r',
    'echo json_encode([PHP_MAJOR_VERSION,PHP_MINOR_VERSION,array_map("extension_loaded",["pdo","pdo_pgsql","intl","mbstring"]),is_file("/var/www/html/index.php"),is_file("/var/www/data/active-release.json"),hash_file("sha256","/var/www/html/index.php"),hash_file("sha256","/var/www/data/active-release.json"),hash_file("sha256","/usr/local/bin/kvazi-healthcheck.php")]);']));
  assert.deepEqual(layout.slice(0,5),[8,3,[true,true,true,true],true,true]);
  for (const [index,path] of [[5,'app/public/index.php'],[6,'app/data/active-release.json'],[7,'docker/php/healthcheck.php']]) {
    assert.equal(layout[index],createHash('sha256').update(readFileSync(path)).digest('hex'));
  }
  const imageConfig=JSON.parse(docker(['image','inspect',image]))[0].Config;
  assert.ok(!(imageConfig.Env ?? []).some(v=>/^(DB_|POSTGRES_|TRUSTED_PROXY_CIDRS|AUTH_COOKIE_SECURE)/.test(v)));
  docker(['exec',application,'sh','-c',
    'test ! -e /var/www/html/.env && test ! -e /var/www/html/.git && test ! -e /var/www/html/node_modules && test ! -e /var/www/tests && ! command -v postgres']);
  assert.equal(sql("SELECT current_setting('server_version_num')::int / 10000"),'18');
  assert.equal(sql("SELECT count(*) FROM information_schema.tables WHERE table_schema='kvazi'"),'0');
  await health(200);
  assert.equal(sql("SELECT count(*) FROM information_schema.tables WHERE table_schema='kvazi'"),'0');
});

test('external PG18 explicit ordered bootstrap: normal public pages and private data layout, runtime env only',async () => {
  const files=readdirSync('docker/db/init').filter(f=>f.endsWith('.sql')).sort();
  assert.deepEqual(files.map(f=>f.slice(0,2)),['01','02','03','04','05','06','07']);
  for (const file of files) docker(['exec','-i',database,'psql','-p',dbPort,'-U',dbUser,'-d',dbName,'-v','ON_ERROR_STOP=1'],
    {input:readFileSync('docker/db/init/'+file),timeout:30000});
  assert.equal(sql('SELECT count(*) FROM kvazi.user_account'),'0');
  sql("INSERT INTO kvazi.user_account(username,email,password_hash) VALUES ('m45_marker','m45_marker@kvazi.test','not-a-login-credential')");
  marker=snapshot();
  const home=await fetch(base+'/'); assert.equal(home.status,200); assert.match(await home.text(),/Nejdelší kvazivěta/);
  assert.match(home.headers.get('set-cookie'),/; secure/i);
  const list=await fetch(base+'/vety.php'); assert.equal(list.status,200); assert.match(await list.text(),/Zatím nejsou žádné schválené věty/);
  const normative=await fetch(base+'/api/normative.php'); assert.equal(normative.status,200); assert.equal((await normative.json()).version,'public-1.3');
  for (const path of ['/data/active-release.json','/data/rules/public-1.3/normative.json','/.env','/.git/config']) {
    assert.equal((await fetch(base+path)).status,404,path);
  }
  const post=await fetch(base+'/healthz',{method:'POST'}); assert.equal(post.status,405); assert.equal(post.headers.get('allow'),'GET');
  await health(200); assert.equal(snapshot(),marker);
});

test('same-image application remove/redeploy without mounts preserves external DB marker and immutable releases',async () => {
  const oldId=inspect(application).Id;
  docker(['rm','-f',application]); await startApp();
  assert.notEqual(inspect(application).Id,oldId); assert.deepEqual(inspect(application).Mounts,[]);
  await health(200); assert.equal(snapshot(),marker);
  assert.equal(sql('SELECT count(*) FROM kvazi.user_account'),'1');
  assert.equal((await fetch(base+'/vety.php')).status,200);
});

test('DB unavailable healthz is safe/sessionless 503; external PG18 volume restores 200 and data',async () => {
  docker(['stop',database]);
  await health(503);
  docker(['start',database]); await readyDB(); await health(200);
  assert.equal(snapshot(),marker);
  console.log('M4.5 external DB image acceptance: PASS; PostgreSQL 18, root docker build, no application mounts, runtime env external endpoint/port/user/password, healthz 200/503, redeploy persistence PASS.');
});
