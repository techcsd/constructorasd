// verify-tokens.mjs — DESIGN GUARD (DESIGN-BRIEF §2 / CLAUDE.md rule 1). Runs in prebuild.
//
// Components consume SEMANTIC tokens only. This guard fails the build when a component template/style:
//   1) uses a raw color literal (#hex, rgb()/rgba()/hsl() with numbers) — colors come from tokens;
//   2) references a PRIMITIVE token (--bone-*, --concrete-*, --ink-*, --oxide-*, --white) directly —
//      primitives live in _tokens.scss and are mapped to semantic tokens;
//   3) uses --accent / --accent-hover more than 3 times in one file (accent is "safety paint": rare).
//
// Scope: src/app/**/*.{scss,html}. Excluded: src/styles/** (the token/type/layout layer) and global
// styles. Per-line escape hatch: add `tokens-allow` in a comment on the line.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const APP_DIR = join(ROOT, 'src', 'app');

const ALLOW = /tokens-allow/;
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const RGB_HSL = /\b(rgba?|hsla?)\s*\(\s*[\d.]/i; // rgb(12, ...) with a numeric first arg (not rgb(var(--x)))
const PRIMITIVE = /var\(\s*--(bone|concrete|ink|oxide|white)\b/;
const ACCENT = /var\(\s*--accent(?:-hover)?\s*\)/g;
const ACCENT_MAX = 3;

function walk(dir, exts) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

const violations = [];
for (const file of walk(APP_DIR, ['.scss', '.html'])) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  const lines = readFileSync(file, 'utf8').split('\n');
  let accentCount = 0;
  lines.forEach((line, i) => {
    if (ALLOW.test(line)) return;
    // strip url()/data: and SVG path data to avoid false hex hits is unnecessary here (no inline assets)
    if (HEX.test(line)) {
      violations.push({ rel, line: i + 1, kind: 'raw-hex', text: line.trim().slice(0, 90) });
    } else if (RGB_HSL.test(line)) {
      violations.push({ rel, line: i + 1, kind: 'raw-rgb', text: line.trim().slice(0, 90) });
    }
    if (PRIMITIVE.test(line)) {
      violations.push({ rel, line: i + 1, kind: 'primitive-token', text: line.trim().slice(0, 90) });
    }
    const m = line.match(ACCENT);
    if (m) accentCount += m.length;
  });
  // The "accent is rare" rule is a public-marketing constraint; the private /admin tool uses accent
  // freely for its controls. Raw-hex / primitive checks above still apply to admin.
  const isAdmin = rel.startsWith('src/app/admin/');
  if (accentCount > ACCENT_MAX && !isAdmin) {
    violations.push({
      rel,
      line: 0,
      kind: 'accent-overuse',
      text: `${accentCount} --accent usages (max ${ACCENT_MAX} per component)`,
    });
  }
}

if (violations.length) {
  console.error(
    `\n[verify-tokens] ✗ ${violations.length} token violation(s). Components use SEMANTIC tokens only.\n` +
      `  · raw-hex / raw-rgb      → use a semantic token: var(--text|--bg|--line|--accent…)\n` +
      `  · primitive-token        → map it to a semantic token in src/styles/_tokens.scss, use that\n` +
      `  · accent-overuse         → accent is rare (max ${ACCENT_MAX} per file); demote extras to --text/--line\n` +
      `  (legitimate exception: add "tokens-allow" in a comment on the line)\n`,
  );
  for (const v of violations) console.error(`  [${v.kind}] ${v.rel}:${v.line}  ${v.text}`);
  console.error('');
  process.exit(1);
}
console.log('[verify-tokens] ✓ components use semantic tokens only.');
