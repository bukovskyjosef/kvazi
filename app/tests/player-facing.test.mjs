/**
 * Regression test: player-facing pages must not leak internal authority
 * terminology (Issue #151).
 *
 * Scans rendered PHP/HTML content in app/public for terms that belong to
 * the internal governance/docs layer but must not appear in text visible
 * to players.  Internal PHP/JS comments are excluded — only strings that
 * would be rendered in the browser are checked.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join, extname} from 'node:path';

const PUBLIC_DIR = 'app/public';

// Terms forbidden in player-facing rendered output.
// Each entry: [regex, human-readable description]
const FORBIDDEN = [
  [/kanonick[ýáé]/gi, 'kanonický/á/é'],
  [/normativní\s+(balík|modul)/gi, 'normativní balík/modul'],
  [/veřejn[áé]\s+(projekce|shrnutí)/gi, 'veřejná projekce/shrnutí'],
  [/source\s+of\s+truth/gi, 'source of truth'],
  [/governance\s+defect/gi, 'governance defect'],
  [/github\.com\/bukovskyjosef\/kvazi/gi, 'GitHub repo URL'],
];

// Collect all .php and .html files under app/public, excluding admin/.
function collectFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip admin surfaces — they are behind auth, not player-facing.
      if (entry.name === 'admin') continue;
      results.push(...collectFiles(full));
    } else if (['.php', '.html'].includes(extname(entry.name))) {
      results.push(full);
    }
  }
  return results;
}

// Strip PHP/JS/HTML comments so only renderable content is checked.
function stripComments(src) {
  // PHP single-line comments: // … and # …
  let out = src.replace(/\/\/[^\n]*/g, '');
  // PHP/JS block comments: /* … */
  out = out.replace(/\/\*[\s\S]*?\*\//g, '');
  // HTML comments: <!-- … -->
  out = out.replace(/<!--[\s\S]*?-->/g, '');
  return out;
}

const files = collectFiles(PUBLIC_DIR);

test('player-facing pages contain no internal authority terminology (#151)', () => {
  const violations = [];
  for (const file of files) {
    const raw = readFileSync(file, 'utf8');
    const rendered = stripComments(raw);
    for (const [re, label] of FORBIDDEN) {
      re.lastIndex = 0;
      const m = re.exec(rendered);
      if (m) {
        violations.push(`${file}: found "${m[0]}" (${label})`);
      }
    }
  }
  assert.deepStrictEqual(violations, [],
    'Player-facing files must not contain internal authority terms:\n' +
    violations.join('\n'));
});
