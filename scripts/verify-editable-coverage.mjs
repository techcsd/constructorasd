// verify-editable-coverage.mjs (WL6/WN2) — scans PUBLIC templates (src/app/pages + src/app/ui, never the
// admin) for visible text and classifies its source: `ui` (via | t), `cms`/`bind` (interpolation/binding),
// or HARDCODED (a literal string with no editable field). Writes docs/EDITABLE-COVERAGE.md and FAILS the
// build if any HARDCODED row exists outside the allowlist (truly technical glyphs). Runs in prebuild.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCAN = [join(ROOT, 'src', 'app', 'pages'), join(ROOT, 'src', 'app', 'ui')];

// Technical/structural literals that are not editable copy (glyphs, separators, units already in content).
const ALLOW = [
  /^[\s·—–•|/×→←↑↓⋮✓»«:,.()\-+%#@…"']+$/u, // punctuation / separators / arrows only
  /^\d[\d\s.,:+%mxh-]*$/i,                   // pure numbers / units
  /^(ES|EN|DEV|CSD|SD|RNC|CV|SEO|OG|PDF|DOC|DOCX|AWCI|ACI|ACM|WhatsApp|Instagram|LinkedIn|Facebook)$/,
  /^No llenar$/, // honeypot anti-spam field label (visually hidden, not real copy)
];
const allowed = (t) => ALLOW.some((re) => re.test(t.trim()));

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    // styleguide is an internal dev-only showcase (esOnly), not public marketing copy.
    else if (n.endsWith('.html') && n !== 'styleguide.html') out.push(p);
  }
  return out;
}

const rows = [];
const hardcoded = [];

for (const dir of SCAN) {
  for (const file of walk(dir)) {
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    // Drop lines explicitly marked as allowed (brand proper nouns etc.).
    const html = readFileSync(file, 'utf8').split('\n').filter((l) => !/i18n-allow|coverage-allow/.test(l)).join('\n');
    // Text nodes: content between > and < (skip script/style). We check each for a literal word.
    for (const m of html.matchAll(/>([^<>{}@]*?)</g)) {
      const raw = m[1];
      const text = raw.replace(/\s+/g, ' ').trim();
      if (!text) continue;
      // A word of 3+ letters (incl. accents) that isn't inside an interpolation on this fragment → literal.
      if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{3,}/.test(text)) continue;
      if (allowed(text)) continue;
      rows.push({ rel, source: 'HARDCODED', text: text.slice(0, 60) });
      hardcoded.push({ rel, text: text.slice(0, 80) });
    }
    // Count the editable ones for the catalog summary.
    for (const _ of html.matchAll(/\|\s*t\b/g)) rows.push({ rel, source: 'ui', text: '(| t)' });
  }
}

// Write the catalog.
const byFile = {};
for (const r of rows) (byFile[r.rel] ??= { ui: 0, hard: [] }), r.source === 'ui' ? byFile[r.rel].ui++ : byFile[r.rel].hard.push(r.text);
let md = `# Cobertura editable (WL6)\n\nGenerado por scripts/verify-editable-coverage.mjs. Objetivo: 0 HARDCODED.\n\n`;
md += `| Archivo | Textos vía \`t()\` | HARDCODED |\n|---|---|---|\n`;
for (const [f, v] of Object.entries(byFile).sort()) md += `| ${f} | ${v.ui} | ${v.hard.length ? '**' + v.hard.length + '**' : '0'} |\n`;
if (hardcoded.length) {
  md += `\n## HARDCODED pendientes\n\n`;
  for (const h of hardcoded) md += `- \`${h.rel}\` — "${h.text}"\n`;
}
writeFileSync(join(ROOT, 'docs', 'EDITABLE-COVERAGE.md'), md);

if (hardcoded.length) {
  console.error(`[verify-editable-coverage] ✗ ${hardcoded.length} HARDCODED public string(s) — see docs/EDITABLE-COVERAGE.md`);
  for (const h of hardcoded.slice(0, 20)) console.error(`    ${h.rel}: "${h.text}"`);
  process.exit(1);
}
console.log('[verify-editable-coverage] ✓ no hardcoded public strings (all via t()/content).');
