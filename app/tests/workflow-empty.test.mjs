// Isolated real HTTP/DB empty state. Never clears the application's shared DB.
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
import {readdirSync,readFileSync} from 'node:fs';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {randomBytes} from 'node:crypto';
test('public empty DB has no fake approved sentence; actual list/detail boundary',async () => {
  const container = process.env.KVAZI_DB_CONTAINER || 'kvazi_db';
  const database = 'kvazi_m3_empty_' + randomBytes(6).toString('hex');
  const docker = args => execFileSync('docker',args,{encoding:'utf8',stdio:['pipe','pipe','pipe']});
  docker(['exec',container,'createdb','-U','kvazi',database]);
  let php, exited;
  try {
    for (const file of readdirSync('docker/db/init').filter(f => f.endsWith('.sql')).sort()) {
      execFileSync('docker',['exec','-i',container,'psql','-U','kvazi','-d',database,'-v','ON_ERROR_STOP=1'],{input:readFileSync('docker/db/init/'+file),stdio:['pipe','pipe','pipe']});
    }
    const dbPort = docker(['port',container,'5432']).split('\n')[0].match(/:(\d+)$/)[1];
    const socket = createServer(); socket.listen(0,'127.0.0.1'); await once(socket,'listening');
    const port = socket.address().port; await new Promise(resolve => socket.close(resolve));
    php = spawn('php',['-S',`127.0.0.1:${port}`,'-t',new URL('../public/',import.meta.url).pathname],{stdio:'ignore',
      env:{...process.env,DB_HOST:'127.0.0.1',DB_PORT:dbPort,DB_NAME:database,DB_USER:'kvazi',DB_PASSWORD:'kvazi'}});
    exited = once(php,'exit');
    const base = `http://127.0.0.1:${port}`;
    const deadline = Date.now()+5000;
    while (true) {
      try {await fetch(base+'/vety.php',{signal:AbortSignal.timeout(500)}); break;}
      catch (e) {if (Date.now()>deadline || php.exitCode !== null) throw e; await new Promise(resolve => setTimeout(resolve,25));}
    }
    const list = await fetch(base+'/vety.php'); const html = await list.text();
    assert.equal(list.status,200); assert.match(html,/Zatím nejsou žádné schválené věty\./);
    assert.doesNotMatch(html,/data-revision-id|href="\/veta.php\?|Čekající|demo/i);
    assert.equal((await fetch(base+'/veta.php?revisionId=1')).status,404);
  } finally {
    if (php) {php.kill(); await exited;}
    docker(['exec',container,'dropdb','-U','kvazi',database]);
  }
});
