import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateForm, _NOUN_MODELS, _ADJ_MODELS, _VERB_MODELS, nounStem } from '../public/js/konfigurator/morpho.mjs';

// Initialise normative data from the active rules release before any morpho calls.
const _appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const { version: _ndVersion } = JSON.parse(readFileSync(join(_appRoot, 'data/active-release.json'), 'utf8'));
global.__normative = JSON.parse(readFileSync(join(_appRoot, `data/rules/${_ndVersion}/normative.json`), 'utf8'));

// ── helpers ────────────────────────────────────────────────────────────────

function noun(lemma, model, caseNum, number, surface, extra = {}) {
  return { pos: 'noun', lemma, model, form: { case: String(caseNum), number }, surface, identity: {}, ...extra };
}
function adj(lemma, model, gender, caseNum, number, surface, extra = {}) {
  return { pos: 'adjective', lemma, model, form: { gender, case: String(caseNum), number, ...extra.form }, surface, identity: extra.identity || {} };
}
function verb(lemma, model, vft, surface, formExtra = {}) {
  return { pos: 'verb', lemma, model, form: { verbFormType: vft, ...formExtra }, surface };
}

// ── exports ────────────────────────────────────────────────────────────────

test('_NOUN_MODELS contains all 14 expected models', () => {
  const expected = ['pán','muž','předseda','soudce','hrad','stroj','žena','růže','píseň','kost','město','moře','kuře','stavení'];
  assert.deepEqual(_NOUN_MODELS.sort(), expected.sort());
});
test('_ADJ_MODELS contains all 4 adjective models', () => {
  assert.deepEqual(_ADJ_MODELS.sort(), ['jarní','matčin','mladý','otcův']);
});
test('_VERB_MODELS contains all 5 verb types', () => {
  assert.deepEqual(_VERB_MODELS.sort(), ['V-AT','V-IT','V-NOUT','V-OVAT','V-ÝT']);
});
test('nounStem returns null for unknown model or failing condition', () => {
  assert.equal(nounStem('kvaz', 'hrad'), 'kvaz');  // endsConsonant ok
  assert.equal(nounStem('kvaza', 'hrad'), null);    // ends vowel — fails hrad condition
  assert.equal(nounStem('kvaz', 'UNKNOWN'), null);
});

// ── functional words and unknown POS ──────────────────────────────────────

test('prepositions and conjunctions always return ok:true', () => {
  assert.equal(validateForm({ pos: 'preposition', surface: 'k' }).ok, true);
  assert.equal(validateForm({ pos: 'conjunction', surface: 'a' }).ok, true);
});
test('pronoun and unknown POS return ok:true', () => {
  assert.equal(validateForm({ pos: 'pronoun', surface: 'azi' }).ok, true);
  assert.equal(validateForm({ pos: 'unknown', surface: 'azi' }).ok, true);
  assert.equal(validateForm(null).ok, true);
});

// ── noun models ────────────────────────────────────────────────────────────

test('pán: animate masculine, stem = lemma', () => {
  // sg-1: stem+'' = 'kvaz'
  assert.deepEqual(validateForm(noun('kvaz', 'pán', 1, 'singular', 'kvaz')), { ok: true, expected: 'kvaz', message: null });
  // sg-2: stem+'a' = 'kvaza'
  assert.deepEqual(validateForm(noun('kvaz', 'pán', 2, 'singular', 'kvaza')), { ok: true, expected: 'kvaza', message: null });
  // pl-1: stem+'i' = 'kvazi'
  assert.deepEqual(validateForm(noun('kvaz', 'pán', 1, 'plural', 'kvazi')), { ok: true, expected: 'kvazi', message: null });
  // wrong surface
  assert.equal(validateForm(noun('kvaz', 'pán', 1, 'singular', 'kvazi')).ok, false);
  // lemma fails condition (must end consonant)
  assert.equal(validateForm(noun('kvaza', 'pán', 1, 'singular', 'kvaza')).ok, false);
});
test('muž: animate masculine, sg-2 ends -e', () => {
  assert.deepEqual(validateForm(noun('kvaz', 'muž', 2, 'singular', 'kvaze')), { ok: true, expected: 'kvaze', message: null });
  assert.deepEqual(validateForm(noun('kvaz', 'muž', 1, 'singular', 'kvaz')), { ok: true, expected: 'kvaz', message: null });
});
test('předseda: animate masculine, stem drops trailing -a', () => {
  // lemma='kvaza', stem='kvaz', sg-1: stem+'a'='kvaza'
  assert.deepEqual(validateForm(noun('kvaza', 'předseda', 1, 'singular', 'kvaza')), { ok: true, expected: 'kvaza', message: null });
  // pl-1: stem+'ové'='kvazové'
  assert.deepEqual(validateForm(noun('kvaza', 'předseda', 1, 'plural', 'kvazové')), { ok: true, expected: 'kvazové', message: null });
  // lemma must end -a
  assert.equal(validateForm(noun('kvaz', 'předseda', 1, 'singular', 'kvaz')).ok, false);
});
test('soudce: animate masculine, stem drops trailing -e', () => {
  assert.deepEqual(validateForm(noun('kvaze', 'soudce', 1, 'singular', 'kvaze')), { ok: true, expected: 'kvaze', message: null });
  assert.deepEqual(validateForm(noun('kvaze', 'soudce', 7, 'singular', 'kvazem')), { ok: true, expected: 'kvazem', message: null });
});
test('hrad: inanimate masculine, sg-1/4 bare stem, sg-5 -e', () => {
  assert.deepEqual(validateForm(noun('kvaz', 'hrad', 1, 'singular', 'kvaz')), { ok: true, expected: 'kvaz', message: null });
  assert.deepEqual(validateForm(noun('kvaz', 'hrad', 5, 'singular', 'kvaze')), { ok: true, expected: 'kvaze', message: null });
  assert.deepEqual(validateForm(noun('kvaz', 'hrad', 1, 'plural', 'kvazy')), { ok: true, expected: 'kvazy', message: null });
});
test('stroj: inanimate masculine, sg-1/4 bare stem, sg-2 -e', () => {
  assert.deepEqual(validateForm(noun('kvaz', 'stroj', 1, 'singular', 'kvaz')), { ok: true, expected: 'kvaz', message: null });
  assert.deepEqual(validateForm(noun('kvaz', 'stroj', 2, 'singular', 'kvaze')), { ok: true, expected: 'kvaze', message: null });
});
test('žena: feminine, stem drops -a', () => {
  assert.deepEqual(validateForm(noun('kvaza', 'žena', 1, 'singular', 'kvaza')), { ok: true, expected: 'kvaza', message: null });
  assert.deepEqual(validateForm(noun('kvaza', 'žena', 2, 'singular', 'kvazy')), { ok: true, expected: 'kvazy', message: null });
  // pl-2 ending is '' (bare stem): stem='kvaz', expected='kvaz'
  assert.deepEqual(validateForm(noun('kvaza', 'žena', 2, 'plural', 'kvaz')), { ok: true, expected: 'kvaz', message: null });
});
test('růže: feminine, stem drops -e, sg-4 ends -i', () => {
  assert.deepEqual(validateForm(noun('kvaze', 'růže', 1, 'singular', 'kvaze')), { ok: true, expected: 'kvaze', message: null });
  assert.deepEqual(validateForm(noun('kvaze', 'růže', 4, 'singular', 'kvazi')), { ok: true, expected: 'kvazi', message: null });
});
test('píseň: feminine consonant stem', () => {
  assert.deepEqual(validateForm(noun('kvaz', 'píseň', 1, 'singular', 'kvaz')), { ok: true, expected: 'kvaz', message: null });
  assert.deepEqual(validateForm(noun('kvaz', 'píseň', 7, 'singular', 'kvazí')), { ok: true, expected: 'kvazí', message: null });
});
test('kost: feminine consonant stem, sg-2 -i', () => {
  assert.deepEqual(validateForm(noun('kvaz', 'kost', 1, 'singular', 'kvaz')), { ok: true, expected: 'kvaz', message: null });
  assert.deepEqual(validateForm(noun('kvaz', 'kost', 2, 'singular', 'kvazi')), { ok: true, expected: 'kvazi', message: null });
  assert.deepEqual(validateForm(noun('kvaz', 'kost', 3, 'plural', 'kvazem')), { ok: true, expected: 'kvazem', message: null });
});
test('město: neuter, stem drops -o', () => {
  assert.deepEqual(validateForm(noun('kvazo', 'město', 1, 'singular', 'kvazo')), { ok: true, expected: 'kvazo', message: null });
  // pl-2 ending is '' (bare stem): stem='kvaz', expected='kvaz'
  assert.deepEqual(validateForm(noun('kvazo', 'město', 2, 'plural', 'kvaz')), { ok: true, expected: 'kvaz', message: null });
});
test('moře: neuter, stem drops -e, sg-1=e ending', () => {
  assert.deepEqual(validateForm(noun('kvaze', 'moře', 1, 'singular', 'kvaze')), { ok: true, expected: 'kvaze', message: null });
  assert.deepEqual(validateForm(noun('kvaze', 'moře', 2, 'plural', 'kvazí')), { ok: true, expected: 'kvazí', message: null });
});
test('kuře: neuter two-stem, sg uses -et extension, pl uses -at extension', () => {
  // stem = 'kvaz', sg-1: 'kvaz'+'e'='kvaze', sg-2: 'kvaz'+'ete'='kvazete'
  assert.deepEqual(validateForm(noun('kvaze', 'kuře', 1, 'singular', 'kvaze')), { ok: true, expected: 'kvaze', message: null });
  assert.deepEqual(validateForm(noun('kvaze', 'kuře', 2, 'singular', 'kvazete')), { ok: true, expected: 'kvazete', message: null });
  // pl-1: 'kvaz'+'ata'='kvazata'
  assert.deepEqual(validateForm(noun('kvaze', 'kuře', 1, 'plural', 'kvazata')), { ok: true, expected: 'kvazata', message: null });
  assert.deepEqual(validateForm(noun('kvaze', 'kuře', 2, 'plural', 'kvazat')), { ok: true, expected: 'kvazat', message: null });
});
test('stavení: neuter, stem drops -í, all cases -í', () => {
  assert.deepEqual(validateForm(noun('kvazí', 'stavení', 1, 'singular', 'kvazí')), { ok: true, expected: 'kvazí', message: null });
  assert.deepEqual(validateForm(noun('kvazí', 'stavení', 7, 'plural', 'kvazími')), { ok: true, expected: 'kvazími', message: null });
});
test('unknown noun model returns ok:true', () => {
  assert.equal(validateForm(noun('kvaz', 'UNKNOWN', 1, 'singular', 'kvaz')).ok, true);
});
test('noun with kvaziPrefix strips prefix before validation', () => {
  // lemma='kvazikvaz', hasPrefix=true → base lemma='kvaz', hrad sg-1: stem+'kvaz'='' → expected='kvazkvaz'? No: lemma is stored as 'kvazikvaz'
  // kvazi- prefix: w.kvaziPrefix='true', lemma='kvazikvaz'
  // strips 'kvazi' → lemma='kvaz', stem='kvaz', ending='', expected='kvaz', + prefix → 'kvazikvaz'
  const w = noun('kvazikvaz', 'hrad', 1, 'singular', 'kvazikvaz');
  w.kvaziPrefix = 'true';
  assert.deepEqual(validateForm(w), { ok: true, expected: 'kvazikvaz', message: null });
  // wrong surface
  const w2 = noun('kvazikvaz', 'hrad', 1, 'singular', 'kvaz');
  w2.kvaziPrefix = 'true';
  assert.equal(validateForm(w2).ok, false);
  // surface carries kvazi prefix but lemma does not start with 'kvazi' → validation fails
  // (kvaziPrefix field is ignored; prefix is always inferred from surface)
  const w3 = noun('kvaz', 'hrad', 1, 'singular', 'kvazikvaz');
  assert.equal(validateForm(w3).ok, false);
});

// ── adjective models ───────────────────────────────────────────────────────

test('mladý degree 1: stem = lemma minus -ý', () => {
  // lemma='kvazý', stem='kvaz', masculineAnimate sg-1: 'kvaz'+'ý'='kvazý'
  assert.deepEqual(validateForm(adj('kvazý', 'mladý', 'masculineAnimate', 1, 'singular', 'kvazý')), { ok: true, expected: 'kvazý', message: null });
  // feminine sg-1: 'kvaz'+'á'='kvazá'
  assert.deepEqual(validateForm(adj('kvazý', 'mladý', 'feminine', 1, 'singular', 'kvazá')), { ok: true, expected: 'kvazá', message: null });
  // neuter sg-1: 'kvaz'+'é'='kvazé'
  assert.deepEqual(validateForm(adj('kvazý', 'mladý', 'neuter', 1, 'singular', 'kvazé')), { ok: true, expected: 'kvazé', message: null });
  // masculineAnimate pl-1: 'kvaz'+'í'='kvazí'
  assert.deepEqual(validateForm(adj('kvazý', 'mladý', 'masculineAnimate', 1, 'plural', 'kvazí')), { ok: true, expected: 'kvazí', message: null });
  // wrong surface
  assert.equal(validateForm(adj('kvazý', 'mladý', 'feminine', 1, 'singular', 'kvazy')).ok, false);
  // lemma must end -ý
  assert.equal(validateForm(adj('kvazi', 'mladý', 'feminine', 1, 'singular', 'kvazia')).ok, false);
});
test('jarní degree 1: stem = lemma minus -í, all forms use -í table', () => {
  // lemma='kvazí', stem='kvaz', masculineAnimate sg-1: 'kvaz'+'í'='kvazí'
  assert.deepEqual(validateForm(adj('kvazí', 'jarní', 'masculineAnimate', 1, 'singular', 'kvazí')), { ok: true, expected: 'kvazí', message: null });
  // feminine sg-1: 'kvaz'+'í'='kvazí'
  assert.deepEqual(validateForm(adj('kvazí', 'jarní', 'feminine', 1, 'singular', 'kvazí')), { ok: true, expected: 'kvazí', message: null });
  // pl-7: 'kvaz'+'ími'='kvazími'
  assert.deepEqual(validateForm(adj('kvazí', 'jarní', 'neuter', 7, 'plural', 'kvazími')), { ok: true, expected: 'kvazími', message: null });
});
test('degree preserves base identity and declines comparative stem', () => {
  for (const [degree,surface] of [['2','kvazější'],['3','nejkvazější']]) {
    assert.deepEqual(validateForm(adj('kvazý','mladý','neuter',1,'singular',surface,{form:{degree,case:'1',number:'singular',gender:'neuter'}})),{ok:true,expected:surface,message:null});
    assert.equal(validateForm(adj('kvazý','mladý','neuter',1,'singular','kvazí',{form:{degree,case:'1',number:'singular',gender:'neuter'}})).ok,false);
  }
});

test('otcův: derived from masculine noun, stem from source noun + ův ending', () => {
  // source noun 'kvaz' model 'hrad' (masculine, cond=endsConsonant ok), stem='kvaz'
  // adj lemma='kvazův', stem='kvaz', masculineAnimate sg-1: 'kvaz'+'ův'='kvazův'
  const w = adj('kvazův', 'otcův', 'masculineAnimate', 1, 'singular', 'kvazův');
  w.identity = { sourceNounLemma: 'kvaz', sourceNounModel: 'hrad' };
  assert.deepEqual(validateForm(w), { ok: true, expected: 'kvazův', message: null });
  // neuter sg-1: 'kvaz'+'ovo'='kvazovo'
  const w2 = adj('kvazův', 'otcův', 'neuter', 1, 'singular', 'kvazovo');
  w2.identity = { sourceNounLemma: 'kvaz', sourceNounModel: 'hrad' };
  assert.deepEqual(validateForm(w2), { ok: true, expected: 'kvazovo', message: null });
  // wrong adj lemma (should be kvazův not kvazuv)
  const w3 = adj('kvazuv', 'otcův', 'masculineAnimate', 1, 'singular', 'kvazuv');
  w3.identity = { sourceNounLemma: 'kvaz', sourceNounModel: 'hrad' };
  assert.equal(validateForm(w3).ok, false);
  // source noun must be masculine
  const w4 = adj('kvazův', 'otcův', 'masculineAnimate', 1, 'singular', 'kvazův');
  w4.identity = { sourceNounLemma: 'kvaza', sourceNounModel: 'žena' };
  assert.equal(validateForm(w4).ok, false);
});
test('matčin: derived from feminine noun', () => {
  // source noun 'kvaza' model 'žena' (feminine, stem='kvaz')
  // adj lemma='kvazin', stem='kvaz', masculineAnimate sg-1: 'kvaz'+'in'='kvazin'
  const w = adj('kvazin', 'matčin', 'masculineAnimate', 1, 'singular', 'kvazin');
  w.identity = { sourceNounLemma: 'kvaza', sourceNounModel: 'žena' };
  assert.deepEqual(validateForm(w), { ok: true, expected: 'kvazin', message: null });
  // source noun must be feminine
  const w2 = adj('kvazin', 'matčin', 'masculineAnimate', 1, 'singular', 'kvazin');
  w2.identity = { sourceNounLemma: 'kvaz', sourceNounModel: 'hrad' };
  assert.equal(validateForm(w2).ok, false);
});

// ── verb models ────────────────────────────────────────────────────────────

test('V-AT present: stem = lemma minus -at, endings ám/áš/á/áme/áte/ají', () => {
  // lemma='kvazat', stem='kvaz'
  const cases = [['1','singular','kvazám'],['2','singular','kvazáš'],['3','singular','kvazá'],['1','plural','kvazáme'],['2','plural','kvazáte'],['3','plural','kvazají']];
  for (const [p, n, surface] of cases) {
    assert.deepEqual(validateForm(verb('kvazat','V-AT','present',surface,{verbPerson:p,number:n})), { ok: true, expected: surface, message: null }, `${p}.${n}`);
  }
  // wrong surface
  assert.equal(validateForm(verb('kvazat','V-AT','present','kvazi',{verbPerson:'1',number:'singular'})).ok, false);
  // lemma must end -at
  assert.equal(validateForm(verb('kvazi','V-AT','present','kvazi',{verbPerson:'1',number:'singular'})).ok, false);
});
test('V-IT present: stem = lemma minus -it, endings ím/íš/í/íme/íte/í', () => {
  const cases = [['1','singular','kvazím'],['3','singular','kvazí'],['2','plural','kvazíte']];
  for (const [p, n, surface] of cases) {
    assert.deepEqual(validateForm(verb('kvazit','V-IT','present',surface,{verbPerson:p,number:n})), { ok: true, expected: surface, message: null });
  }
});
test('V-NOUT present: stem = lemma minus -nout, endings nu/neš/ne/neme/nete/nou', () => {
  assert.deepEqual(validateForm(verb('kvaznout','V-NOUT','present','kvaznu',{verbPerson:'1',number:'singular'})), { ok: true, expected: 'kvaznu', message: null });
  assert.deepEqual(validateForm(verb('kvaznout','V-NOUT','present','kvaznou',{verbPerson:'3',number:'plural'})), { ok: true, expected: 'kvaznou', message: null });
});
test('V-ÝT present: stem = lemma minus -ýt, endings yji/yješ/yje/yjeme/yjete/yjí', () => {
  assert.deepEqual(validateForm(verb('kvazýt','V-ÝT','present','kvazyji',{verbPerson:'1',number:'singular'})), { ok: true, expected: 'kvazyji', message: null });
  assert.deepEqual(validateForm(verb('kvazýt','V-ÝT','present','kvazyjí',{verbPerson:'3',number:'plural'})), { ok: true, expected: 'kvazyjí', message: null });
});
test('V-OVAT present: stem = lemma minus -ovat, endings uji/uješ/uje/ujeme/ujete/ují', () => {
  assert.deepEqual(validateForm(verb('kvazovat','V-OVAT','present','kvazuji',{verbPerson:'1',number:'singular'})), { ok: true, expected: 'kvazuji', message: null });
  assert.deepEqual(validateForm(verb('kvazovat','V-OVAT','present','kvazují',{verbPerson:'3',number:'plural'})), { ok: true, expected: 'kvazují', message: null });
});
test('V-AT imperative: 2sg/1pl/2pl → ej/ejme/ejte', () => {
  assert.deepEqual(validateForm(verb('kvazat','V-AT','imperative','kvazej',{verbPerson:'2sg'})), { ok: true, expected: 'kvazej', message: null });
  assert.deepEqual(validateForm(verb('kvazat','V-AT','imperative','kvazejme',{verbPerson:'1pl'})), { ok: true, expected: 'kvazejme', message: null });
  assert.deepEqual(validateForm(verb('kvazat','V-AT','imperative','kvazejte',{verbPerson:'2pl'})), { ok: true, expected: 'kvazejte', message: null });
  // invalid person key
  assert.equal(validateForm(verb('kvazat','V-AT','imperative','kvazej',{verbPerson:'1sg'})).ok, false);
});
test('V-IT imperative: bare stem / +me / +te', () => {
  assert.deepEqual(validateForm(verb('kvazit','V-IT','imperative','kvaz',{verbPerson:'2sg'})), { ok: true, expected: 'kvaz', message: null });
  assert.deepEqual(validateForm(verb('kvazit','V-IT','imperative','kvazme',{verbPerson:'1pl'})), { ok: true, expected: 'kvazme', message: null });
  assert.deepEqual(validateForm(verb('kvazit','V-IT','imperative','kvazte',{verbPerson:'2pl'})), { ok: true, expected: 'kvazte', message: null });
});
test('V-NOUT imperative: ni/nime/nite', () => {
  assert.deepEqual(validateForm(verb('kvaznout','V-NOUT','imperative','kvazni',{verbPerson:'2sg'})), { ok: true, expected: 'kvazni', message: null });
  assert.deepEqual(validateForm(verb('kvaznout','V-NOUT','imperative','kvaznime',{verbPerson:'1pl'})), { ok: true, expected: 'kvaznime', message: null });
});
test('V-AT l-participle: al/ala/alo/ali/aly/ala', () => {
  assert.deepEqual(validateForm(verb('kvazat','V-AT','lParticiple','kvazal',{verbGender:'masculine',number:'singular'})), { ok: true, expected: 'kvazal', message: null });
  assert.deepEqual(validateForm(verb('kvazat','V-AT','lParticiple','kvazala',{verbGender:'feminine',number:'singular'})), { ok: true, expected: 'kvazala', message: null });
  assert.deepEqual(validateForm(verb('kvazat','V-AT','lParticiple','kvazalo',{verbGender:'neuter',number:'singular'})), { ok: true, expected: 'kvazalo', message: null });
  // pl masculine animate
  assert.deepEqual(validateForm(verb('kvazat','V-AT','lParticiple','kvazali',{verbGender:'masculine',number:'plural',verbAnimacy:'animate'})), { ok: true, expected: 'kvazali', message: null });
  // pl masculine inanimate
  assert.deepEqual(validateForm(verb('kvazat','V-AT','lParticiple','kvazaly',{verbGender:'masculine',number:'plural',verbAnimacy:'inanimate'})), { ok: true, expected: 'kvazaly', message: null });
  // pl feminine
  assert.deepEqual(validateForm(verb('kvazat','V-AT','lParticiple','kvazaly',{verbGender:'feminine',number:'plural'})), { ok: true, expected: 'kvazaly', message: null });
  // pl neuter
  assert.deepEqual(validateForm(verb('kvazat','V-AT','lParticiple','kvazala',{verbGender:'neuter',number:'plural'})), { ok: true, expected: 'kvazala', message: null });
  // missing animacy for masculine plural
  assert.equal(validateForm(verb('kvazat','V-AT','lParticiple','kvazali',{verbGender:'masculine',number:'plural'})).ok, false);
});
test('V-IT l-participle: il/ila/ilo/ili/ily/ila', () => {
  assert.deepEqual(validateForm(verb('kvazit','V-IT','lParticiple','kvazil',{verbGender:'masculine',number:'singular'})), { ok: true, expected: 'kvazil', message: null });
  assert.deepEqual(validateForm(verb('kvazit','V-IT','lParticiple','kvazila',{verbGender:'feminine',number:'singular'})), { ok: true, expected: 'kvazila', message: null });
});
test('V-NOUT l-participle: nul/nula/nulo/nuli/nuly/nula', () => {
  assert.deepEqual(validateForm(verb('kvaznout','V-NOUT','lParticiple','kvaznul',{verbGender:'masculine',number:'singular'})), { ok: true, expected: 'kvaznul', message: null });
  assert.deepEqual(validateForm(verb('kvaznout','V-NOUT','lParticiple','kvaznuly',{verbGender:'feminine',number:'plural'})), { ok: true, expected: 'kvaznuly', message: null });
});
test('V-ÝT l-participle: yl/yla/ylo/yli/yly/yla', () => {
  assert.deepEqual(validateForm(verb('kvazýt','V-ÝT','lParticiple','kvazyl',{verbGender:'masculine',number:'singular'})), { ok: true, expected: 'kvazyl', message: null });
});
test('V-OVAT l-participle: oval/ovala/ovalo/ovali/ovaly/ovala', () => {
  assert.deepEqual(validateForm(verb('kvazovat','V-OVAT','lParticiple','kvazoval',{verbGender:'masculine',number:'singular'})), { ok: true, expected: 'kvazoval', message: null });
  assert.deepEqual(validateForm(verb('kvazovat','V-OVAT','lParticiple','kvazovala',{verbGender:'neuter',number:'plural'})), { ok: true, expected: 'kvazovala', message: null });
});
test('unknown verb model returns ok:true', () => {
  assert.equal(validateForm(verb('testverb','UNKNOWN','present','testverb',{verbPerson:'1',number:'singular'})).ok, true);
});
test('missing verbFormType returns ok:false', () => {
  assert.equal(validateForm(verb('kvazat','V-AT',null,'kvazám',{verbPerson:'1',number:'singular'})).ok, false);
});
