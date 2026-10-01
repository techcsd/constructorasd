// verify-i18n.mjs — i18n GUARD (CLAUDE.md rule 3 / WA9). Runs in prebuild.
//
// "Both languages always." Every user-visible UI string goes through t() (the key IS the Spanish text);
// its English must exist. This guard:
//   1) FAILS if src/content/i18n/{es,en}.json is missing or not valid JSON.
//   2) FAILS if any t() key used in code (or present in es.json) has no English in en.json.
//   3) WARNS (advisory) about likely hard-coded visible Spanish text in templates not wrapped in t().
//
// t() usage detected: the `| t` pipe and `t('…')` / `.t('…')` calls, in .html and .ts.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');
const I18N_DIR = join(SRC, 'content', 'i18n');

function fail(msg) {
  console.error(`\n[verify-i18n] ✗ ${msg}\n`);
  process.exit(1);
}

const catalogs = {};
for (const lang of ['es', 'en']) {
  const p = join(I18N_DIR, `${lang}.json`);
  if (!existsSync(p)) fail(`missing src/content/i18n/${lang}.json`);
  try {
    catalogs[lang] = JSON.parse(readFileSync(p, 'utf8'));
  } catch (e) {
    fail(`src/content/i18n/${lang}.json is not valid JSON: ${e.message}`);
  }
}

// Collect used t() keys.
const used = new Set();
const PIPE_RE = /(['"`])((?:\\.|(?!\1).)*?)\1\s*\|\s*t\b/g;
const CALL_RE = /\.t\(\s*(['"`])((?:\\.|(?!\1).)*?)\1/g;

function walk(dir, exts) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

for (const file of walk(SRC, ['.html', '.ts'])) {
  if (/\.spec\.ts$/.test(file)) continue;
  const txt = readFileSync(file, 'utf8');
  for (const re of [PIPE_RE, CALL_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(txt))) {
      const s = m[2].replace(/\\(['"`])/g, '$1').trim();
      if (s) used.add(s);
    }
  }
}

// Keys that must have English: everything used + everything already in es.json.
const mustTranslate = new Set([...used, ...Object.keys(catalogs.es)]);
const missing = [...mustTranslate].filter((k) => !(k in catalogs.en) || catalogs.en[k] === '');

if (missing.length) {
  console.error(`\n[verify-i18n] ✗ ${missing.length} key(s) missing English in src/content/i18n/en.json:\n`);
  for (const k of missing.slice(0, 40)) console.error(`   · ${k}`);
  if (missing.length > 40) console.error(`   … and ${missing.length - 40} more`);
  console.error(`\nAdd the English value for each key. (CLAUDE.md rule 3 — both languages always.)\n`);
  process.exit(1);
}

// Advisory: hard-coded visible Spanish in templates (heuristic, never fails the build).
const SPANISH = /[áéíóúñ¿¡]/i;
const warnings = [];
for (const file of walk(SRC, ['.html'])) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (/i18n-allow/.test(line)) return;
    // text node between > and < that contains Spanish accents and no interpolation/pipe
    const m = line.match(/>\s*([^<>{]*[áéíóúñ][^<>{]*)\s*</i);
    if (m && SPANISH.test(m[1]) && !/\|\s*t\b/.test(line) && !/{{/.test(line)) {
      warnings.push(`${rel}:${i + 1}  ${m[1].trim().slice(0, 60)}`);
    }
  });
}

console.log(
  `[verify-i18n] ✓ ${used.size} t() key(s) used; en.json covers all ${mustTranslate.size} required key(s).`,
);
if (warnings.length) {
  console.log(`[verify-i18n]   advisory: ${warnings.length} possible hard-coded Spanish string(s):`);
  for (const w of warnings.slice(0, 15)) console.log(`     ${w}`);
  if (warnings.length > 15) console.log(`     … and ${warnings.length - 15} more`);
}
process.exit(0);
