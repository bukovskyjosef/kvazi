import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from 'node:net';
const active=JSON.parse(readFileSync(new URL('../data/active-release.json',import.meta.url))).version;
const data=readFileSync(new URL(`../data/rules/${active}/normative.json`,import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL(`../data/rules/${active}/manifest.json`,import.meta.url)));
const source=new URL('../public/includes/validator.php',import.meta.url).pathname;
const invalidImplicitRules = {
  'missing implicit subject': undefined,
  'null implicit subject': null,
  'scalar implicit subject': 'imperative',
  'missing sentence type': { verb_form_type: 'imperative' },
  'missing verb form type': { sentence_type: 'imperative' },
  'non-string sentence type': { sentence_type: 1, verb_form_type: 'imperative' },
  'unknown sentence type': { sentence_type: 'unknown', verb_form_type: 'imperative' },
  'non-string verb form type': { sentence_type: 'imperative', verb_form_type: [] },
  'unknown verb form type': { sentence_type: 'imperative', verb_form_type: 'unknown' },
};
const invalidPronounRules = {
  'missing pronoun signature contract': undefined,
  'null pronoun signature contract': null,
  'scalar pronoun signature contract': 'notApplicable',
  'incomplete pronoun signature contract': {case:['1','notApplicable']},
  'invalid pronoun signature enum': {...JSON.parse(data).pronoun_form_signature, person:['4','notApplicable']},
};
const scenarios = ['correct release', 'corrupt data', 'wrong manifest version',
  'wrong validator version', 'wrong dataset identity', 'unsafe active path',
  ...Object.keys(invalidImplicitRules), ...Object.keys(invalidPronounRules)];

function writeRelease(root, scenario) {
  mkdirSync(join(root, 'data', 'rules', active), { recursive: true });
  const m = structuredClone(manifest);
  let raw = data;
  if (scenario === 'corrupt data') raw += ' ';
  if (scenario === 'wrong manifest version') m.version = 'another-release';
  if (scenario === 'wrong validator version') m.validator_version = 'unidentified-engine';
  if (scenario === 'wrong dataset identity' || Object.hasOwn(invalidImplicitRules, scenario) || Object.hasOwn(invalidPronounRules, scenario)) {
    const nd = JSON.parse(raw);
    if (scenario === 'wrong dataset identity') nd.version = 'another-release';
    else if (Object.hasOwn(invalidImplicitRules, scenario)) nd.implicit_subject = invalidImplicitRules[scenario];
    else nd.pronoun_form_signature = invalidPronounRules[scenario];
    raw = JSON.stringify(nd);
    // Keep integrity valid so these cases exercise identity/structure checks.
    m.normative_hash = createHash('sha256').update(raw).digest('hex');
  }
  writeFileSync(join(root, 'data', 'active-release.json'), JSON.stringify({
    version: scenario === 'unsafe active path' ? '../outside' : active,
  }));
  writeFileSync(join(root, 'data', 'rules', active, 'normative.json'), raw);
  writeFileSync(join(root, 'data', 'rules', active, 'manifest.json'), JSON.stringify(m));
}

for(const scenario of scenarios) {
  test(`release loader: ${scenario}`,()=>{
    const root=mkdtempSync(join(tmpdir(),'kvazi-release-'));
    try {
      writeRelease(root, scenario);
      const run=()=>execFileSync('php',['-r',`require $argv[1]; $v=kvazi_load_validator($argv[2]); echo $v->getRulesVersion().'|'.$v->getValidatorVersion();`,source,root],{encoding:'utf8',stdio:'pipe'});
      if(scenario==='correct release') assert.equal(run(),`${active}|${manifest.validator_version}`);
      else if (Object.hasOwn(invalidImplicitRules, scenario)) {
        assert.throws(run, error => /Invalid release implicit_subject rule/.test(error.stderr.toString()));
      } else if (Object.hasOwn(invalidPronounRules, scenario)) {
        assert.throws(run, error => /Invalid release pronoun_form_signature/.test(error.stderr.toString()));
      } else assert.throws(run);
    } finally {rmSync(root,{recursive:true,force:true});}
  });
}

test('configurator HTTP: valid active release renders; every invalid release fails closed', async () => {
  const root = mkdtempSync(join(tmpdir(), 'kvazi-configurator-release-'));
  let php;
  let exited;
  try {
    cpSync(new URL('../public/', import.meta.url), join(root, 'public'), { recursive: true });
    writeRelease(root, 'correct release');
    // Reserve an available loopback port for an isolated PHP HTTP fixture.
    const socket = createServer();
    socket.listen(0, '127.0.0.1');
    await once(socket, 'listening');
    const port = socket.address().port;
    await new Promise((resolve, reject) => socket.close(error => error ? reject(error) : resolve()));
    php = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', join(root, 'public')], { stdio: 'ignore' });
    exited = once(php, 'exit');
    const url = `http://127.0.0.1:${port}/konfigurator.php`;
    const deadline = Date.now() + 5000;
    while (true) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(500) });
        await response.text();
        break;
      } catch (error) {
        if (Date.now() >= deadline || php.exitCode !== null) throw error;
        await new Promise(resolve => setTimeout(resolve, 25));
      }
    }
    for (const scenario of scenarios) {
      writeRelease(root, scenario);
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      const html = await response.text();
      if (scenario === 'correct release') {
        assert.equal(response.status, 200);
        assert.equal(active, manifest.version);
        assert.deepEqual(JSON.parse(html.match(/window\.__normative = (.*);<\/script>/)[1]), JSON.parse(data));
        assert.match(html, /src="\/js\/konfigurator\/editor\.mjs"/);
        assert.match(html, /id="submitButton"/);
      } else {
        assert.equal(response.status, 503, scenario);
        assert.match(response.headers.get('content-type'), /text\/html; charset=UTF-8/i);
        assert.match(html, /Pravidla soutěže se nyní nepodařilo načíst\./, scenario);
        assert.doesNotMatch(html, /<script|<form|<button|window\.__normative|id="editor"|Integrita|implicit_subject|kvazi-configurator-release-/i, scenario);
      }
    }
  } finally {
    if (php) {
      php.kill();
      await exited;
    }
    rmSync(root, { recursive: true, force: true });
  }
});

test('corrective release: historical bytes unchanged and normative mechanics identical to public-1.3', () => {
  for (const version of ['public-1','public-1.1','public-1.2']) for (const file of ['normative.json','manifest.json']) {
    const path = `app/data/rules/${version}/${file}`;
    const old = execFileSync('git',['show',`26bf3affbafbbf70cf646d83012e4c3eba199df3:${path}`]);
    assert.ok(readFileSync(path).equals(old),`${version}/${file} immutable`);
  }
  assert.equal(active,'public-1.3.1'); assert.equal(manifest.validator_version,'1.3.1');
  for (const file of ['normative.json','manifest.json']) {
    const path = `app/data/rules/public-1.3/${file}`;
    assert.ok(readFileSync(path).equals(execFileSync('git',['show',`153ecb2:${path}`])));
  }
  const previous = JSON.parse(readFileSync('app/data/rules/public-1.3/normative.json'));
  assert.deepEqual({...JSON.parse(data), version:previous.version}, previous, 'only release identity changes');
  assert.equal(manifest.normative_hash,createHash('sha256').update(data).digest('hex'));
  assert.deepEqual(Object.keys(JSON.parse(data).pronoun_form_signature),['case','number','gender','person']);
});
