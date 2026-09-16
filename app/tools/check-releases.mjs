// Reject edits/removal of published runtime releases relative to a Git base.
// Verdict code changes also require a new active rules/validator version.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const base=process.env.KVAZI_RELEASE_BASE || 'origin/main';
const prefix='app/data/rules/';
const published=git('ls-tree','-r','--name-only',base,'--',prefix).split('\n').filter(Boolean);
for(const file of published) {
  const old=execFileSync('git',['show',`${base}:${file}`]);
  assert.ok(readFileSync(file).equals(old),`Published release must not be changed or removed: ${file}`);
}
const active=JSON.parse(readFileSync('app/data/active-release.json')).version;
for(const version of readdirSync(prefix)) {
  const manifest=JSON.parse(readFileSync(`${prefix}${version}/manifest.json`));
  const raw=readFileSync(`${prefix}${version}/normative.json`);
  assert.equal(manifest.version,version);
  assert.equal(JSON.parse(raw).version,version);
  assert.equal(manifest.normative_hash,createHash('sha256').update(raw).digest('hex'));
  assert.ok(manifest.validator_version);
}
const oldActive=JSON.parse(git('show',`${base}:app/data/active-release.json`)).version;
const verdictFiles=['app/public/includes/validator.php', ...['validation','morpho','schema','rules-data'].map(n=>`app/public/js/konfigurator/${n}.mjs`)];
const changed=verdictFiles.some(file=> !readFileSync(file).equals(execFileSync('git',['show',`${base}:${file}`])));
if(changed) {
  assert.notEqual(active,oldActive,'Verdict code changes require a new active release');
  assert.ok(!published.some(f=>f.startsWith(`${prefix}${active}/`)),'Active release must be new');
  const oldManifest=JSON.parse(git('show',`${base}:${prefix}${oldActive}/manifest.json`));
  const manifest=JSON.parse(readFileSync(`${prefix}${active}/manifest.json`));
  assert.notEqual(manifest.validator_version,oldManifest.validator_version,'Identify changed validator with a new version');
}
console.log(`Release integrity OK: ${readdirSync(prefix).length} immutable datasets; active ${active}; base ${base}`);
