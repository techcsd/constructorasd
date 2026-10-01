// verify-sin-ref-hardcodeado.mjs — CLAUDE.md hard rule 4 / WA11 / Phase 1.
//
// The production Supabase project ref must NEVER be hardcoded in src/. It lives ONLY in the generated
// (gitignored) environment.ts and in .env.local. This guard scans src/ (plus scripts/, sql/,
// supabase/functions/) and fails the build if the prod ref appears anywhere it shouldn't.
//
// Escape: none — there is no legitimate reason for the literal prod ref in these trees.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const PROD_REF = 'jeeqhgccqefbqilntcpu'; // CSD prod (csd-core). dev is fzfrnrvndzrjwyvdpkgg (allowed).
const SCOPES = ['src', 'scripts', 'sql', 'supabase/functions'];
const EXTS = ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.html', '.scss', '.json', '.sql', '.md'];

// The generated env file legitimately contains the prod URL (ref) on a prod build; it is gitignored.
const ALLOW = new Set([
  'src/environments/environment.ts'.replace(/\//g, '/'),
  'scripts/verify-sin-ref-hardcodeado.mjs',
]);

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (EXTS.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

const offenders = [];
for (const scope of SCOPES) {
  for (const file of walk(join(ROOT, scope))) {
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    if (ALLOW.has(rel)) continue;
    let txt;
    try {
      txt = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    if (txt.includes(PROD_REF)) offenders.push(rel);
  }
}

if (offenders.length) {
  console.error(
    `\n[verify-sin-ref-hardcodeado] ✗ prod project ref '${PROD_REF}' hardcoded in ${offenders.length} file(s):\n`,
  );
  for (const f of offenders) console.error(`   ✗ ${f}`);
  console.error(
    `\nThe prod ref may only live in the generated environment.ts and .env.local.\n` +
      `Read it from the 'environment' object, never inline. (CLAUDE.md rule 4)\n`,
  );
  process.exit(1);
}
console.log(`[verify-sin-ref-hardcodeado] ✓ prod ref not present in ${SCOPES.join(', ')}.`);
