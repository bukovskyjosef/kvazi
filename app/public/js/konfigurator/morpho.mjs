// morpho.mjs — Deterministický morfologický validátor
// Source: docs/kvazitahak/02-substantiva.md, 03-adjektiva.md, 04-slovesa.md
// Normativní paradigmata první rules verze jsou zmrazena.
// Jedna buňka = právě jedna kanonická realizace; dublety se nepovolují.

// ═══════════════════════════════════════════════════════════
// SUBSTANTIVA
// ═══════════════════════════════════════════════════════════

const isVowel = c => /[aeiouyáéíóúůýě]/i.test(c);
const endsConsonant = l => l.length > 0 && !isVowel(l.slice(-1));

// Table key: `${number}-${caseNum}` where number = singular|plural, caseNum = 1..7
const NOUN = {
  pán: {
    gender: 'masculine', animacy: 'animate',
    cond: endsConsonant, condHint: 'musí zakončit souhláskou',
    stem: l => l,
    t: {
      'singular-1':'', 'singular-2':'a', 'singular-3':'ovi', 'singular-4':'a', 'singular-5':'e', 'singular-6':'ovi', 'singular-7':'em',
      'plural-1':'i', 'plural-2':'ů', 'plural-3':'ům', 'plural-4':'y', 'plural-5':'i', 'plural-6':'ech', 'plural-7':'y',
    },
  },
  muž: {
    gender: 'masculine', animacy: 'animate',
    cond: endsConsonant, condHint: 'musí zakončit souhláskou',
    stem: l => l,
    t: {
      'singular-1':'', 'singular-2':'e', 'singular-3':'i', 'singular-4':'e', 'singular-5':'i', 'singular-6':'i', 'singular-7':'em',
      'plural-1':'i', 'plural-2':'ů', 'plural-3':'ům', 'plural-4':'e', 'plural-5':'i', 'plural-6':'ích', 'plural-7':'i',
    },
  },
  předseda: {
    gender: 'masculine', animacy: 'animate',
    cond: l => /a$/i.test(l), condHint: 'musí zakončit na -a',
    stem: l => l.slice(0, -1),
    t: {
      'singular-1':'a', 'singular-2':'y', 'singular-3':'ovi', 'singular-4':'u', 'singular-5':'o', 'singular-6':'ovi', 'singular-7':'ou',
      'plural-1':'ové', 'plural-2':'ů', 'plural-3':'ům', 'plural-4':'y', 'plural-5':'ové', 'plural-6':'ech', 'plural-7':'y',
    },
  },
  soudce: {
    gender: 'masculine', animacy: 'animate',
    cond: l => /e$/i.test(l), condHint: 'musí zakončit na -e',
    stem: l => l.slice(0, -1),
    t: {
      'singular-1':'e', 'singular-2':'e', 'singular-3':'i', 'singular-4':'e', 'singular-5':'e', 'singular-6':'i', 'singular-7':'em',
      'plural-1':'i', 'plural-2':'ů', 'plural-3':'ům', 'plural-4':'e', 'plural-5':'i', 'plural-6':'ích', 'plural-7':'i',
    },
  },
  hrad: {
    gender: 'masculine', animacy: 'inanimate',
    cond: endsConsonant, condHint: 'musí zakončit souhláskou',
    stem: l => l,
    t: {
      'singular-1':'', 'singular-2':'u', 'singular-3':'u', 'singular-4':'', 'singular-5':'e', 'singular-6':'u', 'singular-7':'em',
      'plural-1':'y', 'plural-2':'ů', 'plural-3':'ům', 'plural-4':'y', 'plural-5':'y', 'plural-6':'ech', 'plural-7':'y',
    },
  },
  stroj: {
    gender: 'masculine', animacy: 'inanimate',
    cond: endsConsonant, condHint: 'musí zakončit souhláskou',
    stem: l => l,
    t: {
      'singular-1':'', 'singular-2':'e', 'singular-3':'i', 'singular-4':'', 'singular-5':'i', 'singular-6':'i', 'singular-7':'em',
      'plural-1':'e', 'plural-2':'ů', 'plural-3':'ům', 'plural-4':'e', 'plural-5':'e', 'plural-6':'ích', 'plural-7':'i',
    },
  },
  žena: {
    gender: 'feminine', animacy: '',
    cond: l => /a$/i.test(l), condHint: 'musí zakončit na -a',
    stem: l => l.slice(0, -1),
    t: {
      'singular-1':'a', 'singular-2':'y', 'singular-3':'ě', 'singular-4':'u', 'singular-5':'o', 'singular-6':'ě', 'singular-7':'ou',
      'plural-1':'y', 'plural-2':'', 'plural-3':'ám', 'plural-4':'y', 'plural-5':'y', 'plural-6':'ách', 'plural-7':'ami',
    },
  },
  růže: {
    gender: 'feminine', animacy: '',
    cond: l => /e$/i.test(l), condHint: 'musí zakončit na -e',
    stem: l => l.slice(0, -1),
    t: {
      'singular-1':'e', 'singular-2':'e', 'singular-3':'i', 'singular-4':'i', 'singular-5':'e', 'singular-6':'i', 'singular-7':'í',
      'plural-1':'e', 'plural-2':'í', 'plural-3':'ím', 'plural-4':'e', 'plural-5':'e', 'plural-6':'ích', 'plural-7':'emi',
    },
  },
  píseň: {
    gender: 'feminine', animacy: '',
    cond: endsConsonant, condHint: 'musí zakončit souhláskou',
    stem: l => l,
    t: {
      'singular-1':'', 'singular-2':'e', 'singular-3':'i', 'singular-4':'', 'singular-5':'i', 'singular-6':'i', 'singular-7':'í',
      'plural-1':'e', 'plural-2':'í', 'plural-3':'ím', 'plural-4':'e', 'plural-5':'e', 'plural-6':'ích', 'plural-7':'emi',
    },
  },
  kost: {
    gender: 'feminine', animacy: '',
    cond: endsConsonant, condHint: 'musí zakončit souhláskou',
    stem: l => l,
    t: {
      'singular-1':'', 'singular-2':'i', 'singular-3':'i', 'singular-4':'', 'singular-5':'i', 'singular-6':'i', 'singular-7':'í',
      'plural-1':'i', 'plural-2':'í', 'plural-3':'em', 'plural-4':'i', 'plural-5':'i', 'plural-6':'ech', 'plural-7':'mi',
    },
  },
  město: {
    gender: 'neuter', animacy: '',
    cond: l => /o$/i.test(l), condHint: 'musí zakončit na -o',
    stem: l => l.slice(0, -1),
    t: {
      'singular-1':'o', 'singular-2':'a', 'singular-3':'u', 'singular-4':'o', 'singular-5':'o', 'singular-6':'ě', 'singular-7':'em',
      'plural-1':'a', 'plural-2':'', 'plural-3':'ům', 'plural-4':'a', 'plural-5':'a', 'plural-6':'ech', 'plural-7':'y',
    },
  },
  moře: {
    gender: 'neuter', animacy: '',
    cond: l => /e$/i.test(l), condHint: 'musí zakončit na -e',
    stem: l => l.slice(0, -1),
    t: {
      'singular-1':'e', 'singular-2':'e', 'singular-3':'i', 'singular-4':'e', 'singular-5':'e', 'singular-6':'i', 'singular-7':'em',
      'plural-1':'e', 'plural-2':'í', 'plural-3':'ím', 'plural-4':'e', 'plural-5':'e', 'plural-6':'ích', 'plural-7':'i',
    },
  },
  kuře: {
    // Explicitní výjimka: základ S, sg rozšíření S+et, pl rozšíření S+at
    gender: 'neuter', animacy: '',
    cond: l => /e$/i.test(l), condHint: 'musí zakončit na -e',
    stem: l => l.slice(0, -1),
    t: {
      'singular-1':'e', 'singular-2':'ete', 'singular-3':'eti', 'singular-4':'e', 'singular-5':'e', 'singular-6':'eti', 'singular-7':'etem',
      'plural-1':'ata', 'plural-2':'at', 'plural-3':'atům', 'plural-4':'ata', 'plural-5':'ata', 'plural-6':'atech', 'plural-7':'aty',
    },
  },
  stavení: {
    gender: 'neuter', animacy: '',
    cond: l => /í$/i.test(l), condHint: 'musí zakončit na -í',
    stem: l => l.slice(0, -1),
    t: {
      'singular-1':'í', 'singular-2':'í', 'singular-3':'í', 'singular-4':'í', 'singular-5':'í', 'singular-6':'í', 'singular-7':'ím',
      'plural-1':'í', 'plural-2':'í', 'plural-3':'ím', 'plural-4':'í', 'plural-5':'í', 'plural-6':'ích', 'plural-7':'ími',
    },
  },
};

// ═══════════════════════════════════════════════════════════
// ADJEKTIVA
// ═══════════════════════════════════════════════════════════

// Table key: `${gender}-${number}-${case}`
// gender: masculineAnimate | masculineInanimate | feminine | neuter
const ADJ_MLADY = {
  'masculineAnimate-singular-1':'ý', 'masculineAnimate-singular-2':'ého', 'masculineAnimate-singular-3':'ému', 'masculineAnimate-singular-4':'ého', 'masculineAnimate-singular-5':'ý', 'masculineAnimate-singular-6':'ém', 'masculineAnimate-singular-7':'ým',
  'masculineInanimate-singular-1':'ý', 'masculineInanimate-singular-2':'ého', 'masculineInanimate-singular-3':'ému', 'masculineInanimate-singular-4':'ý', 'masculineInanimate-singular-5':'ý', 'masculineInanimate-singular-6':'ém', 'masculineInanimate-singular-7':'ým',
  'feminine-singular-1':'á', 'feminine-singular-2':'é', 'feminine-singular-3':'é', 'feminine-singular-4':'ou', 'feminine-singular-5':'á', 'feminine-singular-6':'é', 'feminine-singular-7':'ou',
  'neuter-singular-1':'é', 'neuter-singular-2':'ého', 'neuter-singular-3':'ému', 'neuter-singular-4':'é', 'neuter-singular-5':'é', 'neuter-singular-6':'ém', 'neuter-singular-7':'ým',
  'masculineAnimate-plural-1':'í', 'masculineAnimate-plural-2':'ých', 'masculineAnimate-plural-3':'ým', 'masculineAnimate-plural-4':'é', 'masculineAnimate-plural-5':'í', 'masculineAnimate-plural-6':'ých', 'masculineAnimate-plural-7':'ými',
  'masculineInanimate-plural-1':'é', 'masculineInanimate-plural-2':'ých', 'masculineInanimate-plural-3':'ým', 'masculineInanimate-plural-4':'é', 'masculineInanimate-plural-5':'é', 'masculineInanimate-plural-6':'ých', 'masculineInanimate-plural-7':'ými',
  'feminine-plural-1':'é', 'feminine-plural-2':'ých', 'feminine-plural-3':'ým', 'feminine-plural-4':'é', 'feminine-plural-5':'é', 'feminine-plural-6':'ých', 'feminine-plural-7':'ými',
  'neuter-plural-1':'á', 'neuter-plural-2':'ých', 'neuter-plural-3':'ým', 'neuter-plural-4':'á', 'neuter-plural-5':'á', 'neuter-plural-6':'ých', 'neuter-plural-7':'ými',
};

const ADJ_JARNI = {
  'masculineAnimate-singular-1':'í', 'masculineAnimate-singular-2':'ího', 'masculineAnimate-singular-3':'ímu', 'masculineAnimate-singular-4':'ího', 'masculineAnimate-singular-5':'í', 'masculineAnimate-singular-6':'ím', 'masculineAnimate-singular-7':'ím',
  'masculineInanimate-singular-1':'í', 'masculineInanimate-singular-2':'ího', 'masculineInanimate-singular-3':'ímu', 'masculineInanimate-singular-4':'í', 'masculineInanimate-singular-5':'í', 'masculineInanimate-singular-6':'ím', 'masculineInanimate-singular-7':'ím',
  'feminine-singular-1':'í', 'feminine-singular-2':'í', 'feminine-singular-3':'í', 'feminine-singular-4':'í', 'feminine-singular-5':'í', 'feminine-singular-6':'í', 'feminine-singular-7':'í',
  'neuter-singular-1':'í', 'neuter-singular-2':'ího', 'neuter-singular-3':'ímu', 'neuter-singular-4':'í', 'neuter-singular-5':'í', 'neuter-singular-6':'ím', 'neuter-singular-7':'ím',
  'masculineAnimate-plural-1':'í', 'masculineAnimate-plural-2':'ích', 'masculineAnimate-plural-3':'ím', 'masculineAnimate-plural-4':'í', 'masculineAnimate-plural-5':'í', 'masculineAnimate-plural-6':'ích', 'masculineAnimate-plural-7':'ími',
  'masculineInanimate-plural-1':'í', 'masculineInanimate-plural-2':'ích', 'masculineInanimate-plural-3':'ím', 'masculineInanimate-plural-4':'í', 'masculineInanimate-plural-5':'í', 'masculineInanimate-plural-6':'ích', 'masculineInanimate-plural-7':'ími',
  'feminine-plural-1':'í', 'feminine-plural-2':'ích', 'feminine-plural-3':'ím', 'feminine-plural-4':'í', 'feminine-plural-5':'í', 'feminine-plural-6':'ích', 'feminine-plural-7':'ími',
  'neuter-plural-1':'í', 'neuter-plural-2':'ích', 'neuter-plural-3':'ím', 'neuter-plural-4':'í', 'neuter-plural-5':'í', 'neuter-plural-6':'ích', 'neuter-plural-7':'ími',
};

const ADJ_OTCUV = {
  'masculineAnimate-singular-1':'ův', 'masculineAnimate-singular-2':'ova', 'masculineAnimate-singular-3':'ovu', 'masculineAnimate-singular-4':'ova', 'masculineAnimate-singular-5':'ův', 'masculineAnimate-singular-6':'ově', 'masculineAnimate-singular-7':'ovým',
  'masculineInanimate-singular-1':'ův', 'masculineInanimate-singular-2':'ova', 'masculineInanimate-singular-3':'ovu', 'masculineInanimate-singular-4':'ův', 'masculineInanimate-singular-5':'ův', 'masculineInanimate-singular-6':'ově', 'masculineInanimate-singular-7':'ovým',
  'feminine-singular-1':'ova', 'feminine-singular-2':'ovy', 'feminine-singular-3':'ově', 'feminine-singular-4':'ovu', 'feminine-singular-5':'ova', 'feminine-singular-6':'ově', 'feminine-singular-7':'ovou',
  'neuter-singular-1':'ovo', 'neuter-singular-2':'ova', 'neuter-singular-3':'ovu', 'neuter-singular-4':'ovo', 'neuter-singular-5':'ovo', 'neuter-singular-6':'ově', 'neuter-singular-7':'ovým',
  'masculineAnimate-plural-1':'ovi', 'masculineAnimate-plural-2':'ových', 'masculineAnimate-plural-3':'ovým', 'masculineAnimate-plural-4':'ovy', 'masculineAnimate-plural-5':'ovi', 'masculineAnimate-plural-6':'ových', 'masculineAnimate-plural-7':'ovými',
  'masculineInanimate-plural-1':'ovy', 'masculineInanimate-plural-2':'ových', 'masculineInanimate-plural-3':'ovým', 'masculineInanimate-plural-4':'ovy', 'masculineInanimate-plural-5':'ovy', 'masculineInanimate-plural-6':'ových', 'masculineInanimate-plural-7':'ovými',
  'feminine-plural-1':'ovy', 'feminine-plural-2':'ových', 'feminine-plural-3':'ovým', 'feminine-plural-4':'ovy', 'feminine-plural-5':'ovy', 'feminine-plural-6':'ových', 'feminine-plural-7':'ovými',
  'neuter-plural-1':'ova', 'neuter-plural-2':'ových', 'neuter-plural-3':'ovým', 'neuter-plural-4':'ova', 'neuter-plural-5':'ova', 'neuter-plural-6':'ových', 'neuter-plural-7':'ovými',
};

const ADJ_MATCIN = {
  'masculineAnimate-singular-1':'in', 'masculineAnimate-singular-2':'ina', 'masculineAnimate-singular-3':'inu', 'masculineAnimate-singular-4':'ina', 'masculineAnimate-singular-5':'in', 'masculineAnimate-singular-6':'ině', 'masculineAnimate-singular-7':'iným',
  'masculineInanimate-singular-1':'in', 'masculineInanimate-singular-2':'ina', 'masculineInanimate-singular-3':'inu', 'masculineInanimate-singular-4':'in', 'masculineInanimate-singular-5':'in', 'masculineInanimate-singular-6':'ině', 'masculineInanimate-singular-7':'iným',
  'feminine-singular-1':'ina', 'feminine-singular-2':'iny', 'feminine-singular-3':'ině', 'feminine-singular-4':'inu', 'feminine-singular-5':'ina', 'feminine-singular-6':'ině', 'feminine-singular-7':'inou',
  'neuter-singular-1':'ino', 'neuter-singular-2':'ina', 'neuter-singular-3':'inu', 'neuter-singular-4':'ino', 'neuter-singular-5':'ino', 'neuter-singular-6':'ině', 'neuter-singular-7':'iným',
  'masculineAnimate-plural-1':'ini', 'masculineAnimate-plural-2':'iných', 'masculineAnimate-plural-3':'iným', 'masculineAnimate-plural-4':'iny', 'masculineAnimate-plural-5':'ini', 'masculineAnimate-plural-6':'iných', 'masculineAnimate-plural-7':'inými',
  'masculineInanimate-plural-1':'iny', 'masculineInanimate-plural-2':'iných', 'masculineInanimate-plural-3':'iným', 'masculineInanimate-plural-4':'iny', 'masculineInanimate-plural-5':'iny', 'masculineInanimate-plural-6':'iných', 'masculineInanimate-plural-7':'inými',
  'feminine-plural-1':'iny', 'feminine-plural-2':'iných', 'feminine-plural-3':'iným', 'feminine-plural-4':'iny', 'feminine-plural-5':'iny', 'feminine-plural-6':'iných', 'feminine-plural-7':'inými',
  'neuter-plural-1':'ina', 'neuter-plural-2':'iných', 'neuter-plural-3':'iným', 'neuter-plural-4':'ina', 'neuter-plural-5':'ina', 'neuter-plural-6':'iných', 'neuter-plural-7':'inými',
};

// ═══════════════════════════════════════════════════════════
// SLOVESA
// ═══════════════════════════════════════════════════════════

// Přítomné tvary: index = (person-1) + (number=plural ? 3 : 0)
// 0=1.sg, 1=2.sg, 2=3.sg, 3=1.pl, 4=2.pl, 5=3.pl
const VERB_PRESENT = {
  'V-AT':   ['ám','áš','á','áme','áte','ají'],
  'V-IT':   ['ím','íš','í','íme','íte','í'],
  'V-NOUT': ['nu','neš','ne','neme','nete','nou'],
  'V-ÝT':   ['yji','yješ','yje','yjeme','yjete','yjí'],
  'V-OVAT': ['uji','uješ','uje','ujeme','ujete','ují'],
};

// Imperativ: 0=2.sg, 1=1.pl, 2=2.pl
const VERB_IMPERATIVE = {
  'V-AT':   ['ej','ejme','ejte'],
  'V-IT':   ['','me','te'],
  'V-NOUT': ['ni','nime','nite'],
  'V-ÝT':   ['yj','yjme','yjte'],
  'V-OVAT': ['uj','ujme','ujte'],
};

// L-příčestí: 0=m.sg, 1=f.sg, 2=n.sg, 3=m.anim.pl, 4=m.inanim/f.pl, 5=n.pl
const VERB_LPART = {
  'V-AT':   ['al','ala','alo','ali','aly','ala'],
  'V-IT':   ['il','ila','ilo','ili','ily','ila'],
  'V-NOUT': ['nul','nula','nulo','nuli','nuly','nula'],
  'V-ÝT':   ['yl','yla','ylo','yli','yly','yla'],
  'V-OVAT': ['oval','ovala','ovalo','ovali','ovaly','ovala'],
};

const VERB_INFINITIVE_SUFFIX = { 'V-AT':'at', 'V-IT':'it', 'V-NOUT':'nout', 'V-ÝT':'ýt', 'V-OVAT':'ovat' };

// ═══════════════════════════════════════════════════════════
// NOUN STEM HELPER (used by possessive adj validator)
// ═══════════════════════════════════════════════════════════

function nounStem(lemma, model) {
  const m = NOUN[model];
  if (!m) return null;
  if (!m.cond(lemma)) return null;
  return m.stem(lemma);
}

// ═══════════════════════════════════════════════════════════
// VALIDATE NOUN
// ═══════════════════════════════════════════════════════════

function validateNoun(w) {
  const modelName = w.model;
  const m = NOUN[modelName];
  if (!m) return { ok: true, expected: null, message: null }; // unknown model — nevalidujeme

  let lemma = String(w.lemma || '').toLowerCase();
  let surface = String(w.surface || '').toLowerCase();
  const hasPrefix = !!w.kvaziPrefix;

  if (hasPrefix) {
    if (!lemma.startsWith('kvazi')) return { ok: false, expected: null, message: 'Lemma s prefixem kvazi- musí začínat na kvazi.' };
    lemma = lemma.slice(5);
  }

  if (!lemma) return { ok: false, expected: null, message: 'Chybí základní tvar.' };
  if (!m.cond(lemma)) return { ok: false, expected: null, message: `Lemma „${lemma}" nesplňuje podmínku modelu ${modelName}: ${m.condHint}.` };

  const { number, case: caseNum } = (w.form || {});
  if (!number || !caseNum) return { ok: false, expected: null, message: 'Chybí číslo nebo pád použitého tvaru.' };

  const key = `${number}-${caseNum}`;
  const ending = m.t[key];
  if (ending === undefined) return { ok: false, expected: null, message: `Kombinace číslo/pád „${key}" není v tabulce modelu ${modelName}.` };

  const stem = m.stem(lemma);
  const expectedBase = stem + ending;
  const expected = hasPrefix ? 'kvazi' + expectedBase : expectedBase;

  return expected === surface
    ? { ok: true, expected, message: null }
    : { ok: false, expected, message: `Použitý tvar „${surface}" neodpovídá modelu ${modelName} a deklarovaným morfologickým hodnotám (očekáváno „${expected}").` };
}

// ═══════════════════════════════════════════════════════════
// VALIDATE ADJECTIVE
// ═══════════════════════════════════════════════════════════

function validateAdjective(w) {
  const modelName = w.model;
  const form = w.form || {};
  const identity = w.identity || {};
  const surface = String(w.surface || '').toLowerCase();
  const lemma = String(w.lemma || '').toLowerCase();
  const degree = form.degree || '1';

  if (!['mladý', 'jarní', 'otcův', 'matčin'].includes(modelName)) return { ok: true, expected: null, message: null };

  const { case: caseNum, number } = form;
  // gender comes from form.gender for adjectives
  const gender = form.gender;
  if (!caseNum || !number || !gender) return { ok: false, expected: null, message: 'Chybí rod, číslo nebo pád použitého tvaru.' };

  const tableKey = `${gender}-${number}-${caseNum}`;

  if (modelName === 'otcův' || modelName === 'matčin') {
    // Přivlastňovací adjektivum
    const srcLemma = String(identity.sourceNounLemma || '').toLowerCase();
    const srcModel = identity.sourceNounModel;
    if (!srcLemma || !srcModel) return { ok: false, expected: null, message: 'Chybí lemma nebo vzor zdrojového substantiva.' };

    const srcM = NOUN[srcModel];
    if (!srcM) return { ok: false, expected: null, message: `Zdrojový substantivní model „${srcModel}" není v normativní sadě.` };
    if (!srcM.cond(srcLemma)) return { ok: false, expected: null, message: `Lemma zdrojového substantiva „${srcLemma}" nesplňuje podmínku vzoru ${srcModel}.` };

    const srcStem = srcM.stem(srcLemma);
    if (modelName === 'otcův') {
      if (srcM.gender !== 'masculine') return { ok: false, expected: null, message: 'Model otcův se odvozuje pouze z mužského substantiva.' };
      const expectedLemma = srcStem + 'ův';
      if (lemma !== expectedLemma) return { ok: false, expected: null, message: `Lemma adjektiva musí být „${expectedLemma}" (zdrojový kmen + ův).` };
      const adjStem = srcStem;
      const ending = ADJ_OTCUV[tableKey];
      if (ending === undefined) return { ok: false, expected: null, message: `Kombinace rod/číslo/pád „${tableKey}" není v tabulce modelu otcův.` };
      const expected = adjStem + ending;
      return expected === surface ? { ok: true, expected, message: null }
        : { ok: false, expected, message: `Použitý tvar „${surface}" neodpovídá modelu otcův (očekáváno „${expected}").` };
    } else {
      if (srcM.gender !== 'feminine') return { ok: false, expected: null, message: 'Model matčin se odvozuje pouze z ženského substantiva.' };
      const expectedLemma = srcStem + 'in';
      if (lemma !== expectedLemma) return { ok: false, expected: null, message: `Lemma adjektiva musí být „${expectedLemma}" (zdrojový kmen + in).` };
      const adjStem = srcStem;
      const ending = ADJ_MATCIN[tableKey];
      if (ending === undefined) return { ok: false, expected: null, message: `Kombinace rod/číslo/pád „${tableKey}" není v tabulce modelu matčin.` };
      const expected = adjStem + ending;
      return expected === surface ? { ok: true, expected, message: null }
        : { ok: false, expected, message: `Použitý tvar „${surface}" neodpovídá modelu matčin (očekáváno „${expected}").` };
    }
  }

  // Produktivní modely mladý a jarní (+ stupňování)
  let adjStem, table;

  if (degree === '1') {
    if (modelName === 'mladý') {
      if (!/ý$/i.test(lemma)) return { ok: false, expected: null, message: 'Lemma modelu mladý (1. stupeň) musí zakončit na -ý.' };
      adjStem = lemma.slice(0, -1);
      table = ADJ_MLADY;
    } else { // jarní
      if (!/í$/i.test(lemma)) return { ok: false, expected: null, message: 'Lemma modelu jarní (1. stupeň) musí zakončit na -í.' };
      adjStem = lemma.slice(0, -1);
      table = ADJ_JARNI;
    }
  } else if (degree === '2') {
    if (!/ější$/i.test(lemma)) return { ok: false, expected: null, message: '2. stupeň: lemma musí zakončit na -ější.' };
    adjStem = lemma.slice(0, -4); // strip 'ější'
    table = ADJ_JARNI;
  } else if (degree === '3') {
    if (!lemma.startsWith('nej') || !/ější$/i.test(lemma)) return { ok: false, expected: null, message: '3. stupeň: lemma musí začínat na nej- a zakončit na -ější.' };
    adjStem = 'nej' + lemma.slice(3, -4); // preserve 'nej', strip 'ější'
    table = ADJ_JARNI;
  } else {
    return { ok: false, expected: null, message: `Neznámý stupeň „${degree}".` };
  }

  const ending = table[tableKey];
  if (ending === undefined) return { ok: false, expected: null, message: `Kombinace rod/číslo/pád „${tableKey}" není v tabulce modelu ${modelName}.` };
  const expected = adjStem + ending;
  return expected === surface ? { ok: true, expected, message: null }
    : { ok: false, expected, message: `Použitý tvar „${surface}" neodpovídá modelu ${modelName} stupeň ${degree} (očekáváno „${expected}").` };
}

// ═══════════════════════════════════════════════════════════
// VALIDATE VERB
// ═══════════════════════════════════════════════════════════

function validateVerb(w) {
  const modelName = w.model;
  if (!VERB_INFINITIVE_SUFFIX[modelName]) return { ok: true, expected: null, message: null }; // neznámý model

  const lemma = String(w.lemma || '').toLowerCase();
  const surface = String(w.surface || '').toLowerCase();
  const form = w.form || {};
  const suffix = VERB_INFINITIVE_SUFFIX[modelName];

  if (!lemma.endsWith(suffix)) return { ok: false, expected: null, message: `Neurčitek modelu ${modelName} musí zakončit na -${suffix}.` };
  const stem = lemma.slice(0, -suffix.length);

  const vft = form.verbFormType;
  if (!vft) return { ok: false, expected: null, message: 'Chybí druh slovesného tvaru (přítomný/budoucí, rozkazovací, l-příčestí).' };

  if (vft === 'present') {
    const person = form.verbPerson, number = form.number;
    if (!person || !number) return { ok: false, expected: null, message: 'Chybí osoba nebo číslo přítomného/budoucího tvaru.' };
    const p = parseInt(person) - 1;
    const n = number === 'plural' ? 3 : 0;
    const idx = p + n;
    if (idx < 0 || idx > 5) return { ok: false, expected: null, message: 'Neplatná kombinace osoby a čísla.' };
    const ending = VERB_PRESENT[modelName][idx];
    const expected = stem + ending;
    return expected === surface ? { ok: true, expected, message: null }
      : { ok: false, expected, message: `Použitý tvar „${surface}" neodpovídá modelu ${modelName} přítomný/budoucí (očekáváno „${expected}").` };
  }

  if (vft === 'imperative') {
    const vp = form.verbPerson; // '2sg' | '1pl' | '2pl'
    if (!vp) return { ok: false, expected: null, message: 'Chybí osoba/číslo rozkazovacího způsobu.' };
    const impIdx = { '2sg': 0, '1pl': 1, '2pl': 2 };
    const idx = impIdx[vp];
    if (idx === undefined) return { ok: false, expected: null, message: 'Rozkazovací způsob dovoluje jen 2.sg, 1.pl, 2.pl.' };
    const ending = VERB_IMPERATIVE[modelName][idx];
    const expected = stem + ending;
    return expected === surface ? { ok: true, expected, message: null }
      : { ok: false, expected, message: `Použitý tvar „${surface}" neodpovídá modelu ${modelName} imperativ (očekáváno „${expected}").` };
  }

  if (vft === 'lParticiple') {
    const gender = form.verbGender, number = form.number, animacy = form.verbAnimacy;
    if (!gender || !number) return { ok: false, expected: null, message: 'Chybí rod nebo číslo l-příčestí.' };
    let idx;
    if (number === 'singular') {
      if (gender === 'masculine') idx = 0;
      else if (gender === 'feminine') idx = 1;
      else if (gender === 'neuter') idx = 2;
      else return { ok: false, expected: null, message: 'Neznámý rod.' };
    } else { // plural
      if (gender === 'masculine') {
        if (!animacy) return { ok: false, expected: null, message: 'Chybí životnost l-příčestí pro mužský rod množného čísla.' };
        idx = animacy === 'animate' ? 3 : 4;
      } else if (gender === 'feminine') {
        idx = 4;
      } else if (gender === 'neuter') {
        idx = 5;
      } else return { ok: false, expected: null, message: 'Neznámý rod.' };
    }
    const ending = VERB_LPART[modelName][idx];
    const expected = stem + ending;
    return expected === surface ? { ok: true, expected, message: null }
      : { ok: false, expected, message: `Použitý tvar „${surface}" neodpovídá modelu ${modelName} l-příčestí (očekáváno „${expected}").` };
  }

  return { ok: false, expected: null, message: `Neznámý druh slovesného tvaru „${vft}".` };
}

// ═══════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════

/**
 * Deterministicky ověří, zda `w.surface` odpovídá normativnímu modelu a
 * deklarovaným morfologickým hodnotám konkrétního použití.
 *
 * Vrátí { ok: boolean, expected: string|null, message: string|null }.
 * Pro funkční slova (předložka, spojka) a neznámé modely vrátí ok:true.
 */
export function validateForm(w) {
  if (!w || ['preposition', 'conjunction'].includes(w.pos)) return { ok: true, expected: null, message: null };
  if (w.pos === 'noun') return validateNoun(w);
  if (w.pos === 'adjective') return validateAdjective(w);
  if (w.pos === 'verb') return validateVerb(w);
  return { ok: true, expected: null, message: null }; // zájmeno, neznámý POS
}

// Re-export normativních dat pro testy parity FE/BE
export const _NOUN_MODELS = Object.keys(NOUN);
export const _ADJ_MODELS = ['mladý', 'jarní', 'otcův', 'matčin'];
export const _VERB_MODELS = Object.keys(VERB_INFINITIVE_SUFFIX);
export { nounStem };
