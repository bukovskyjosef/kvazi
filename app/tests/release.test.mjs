import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const active=JSON.parse(readFileSync(new URL('../data/active-release.json',import.meta.url))).version;
const data=readFileSync(new URL(`../data/rules/${active}/normative.json`,import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL(`../data/rules/${active}/manifest.json`,import.meta.url)));
const source=new URL('../public/includes/validator.php',import.meta.url).pathname;
for(const scenario of ['correct release','corrupt data','wrong manifest version','wrong validator version','wrong dataset identity','unsafe active path']) {
  test(`release loader: ${scenario}`,()=>{
    const root=mkdtempSync(join(tmpdir(),'kvazi-release-'));
    try {
      mkdirSync(join(root,'data','rules',active),{recursive:true});
      const m=structuredClone(manifest);
      let raw=data;
      if(scenario==='corrupt data') raw+=' ';
      if(scenario==='wrong manifest version') m.version='another-release';
      if(scenario==='wrong validator version') m.validator_version='unidentified-engine';
      if(scenario==='wrong dataset identity') {const nd=JSON.parse(raw);nd.version='another-release';raw=JSON.stringify(nd);m.normative_hash=createHash('sha256').update(raw).digest('hex');}
      writeFileSync(join(root,'data','active-release.json'),JSON.stringify({version:scenario==='unsafe active path'?'../outside':active}));
      writeFileSync(join(root,'data','rules',active,'normative.json'),raw);
      writeFileSync(join(root,'data','rules',active,'manifest.json'),JSON.stringify(m));
      const run=()=>execFileSync('php',['-r',`require $argv[1]; $v=kvazi_load_validator($argv[2]); echo $v->getRulesVersion().'|'.$v->getValidatorVersion();`,source,root],{encoding:'utf8',stdio:'pipe'});
      if(scenario==='correct release') assert.equal(run(),`${active}|${manifest.validator_version}`);
      else assert.throws(run);
    } finally {rmSync(root,{recursive:true,force:true});}
  });
}
