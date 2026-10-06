// verify-contrast.mjs — DESIGN GUARD (DESIGN-BRIEF §2 / §9). Runs in prebuild.
//
// Computes WCAG contrast for every text/background pair in the semantic token table, in BOTH tones
// (light `:root`, dark `[data-tone="dark"]`), reading the real values from src/styles/_tokens.scss and
// resolving var() chains down to the primitive hex. Fails if any pair falls under its threshold.
//
// Thresholds: body/eyebrow/meta text 4.5:1; large-text / UI accents 3.0:1.
// (Color math ported from SGC's verify-contraste.mjs.)

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(__dirname, '..', 'src', 'styles', '_tokens.scss'), 'utf8');

// Merge every :root{} block → light map (primitives + semantic light).
const light = {};
for (const b of css.matchAll(/:root\s*\{([\s\S]*?)\n\}/g)) {
  for (const d of b[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) light[d[1]] = d[2].trim();
}
// Dark overrides: [data-tone="dark"]{} (semantic only) layered over light.
let darkBlock = '';
// Tolerate a combined selector, e.g. `[data-tone='dark'], .tone-dark {`.
const dm = css.match(/\[data-tone=['"]dark['"]\][^{]*\{([\s\S]*?)\n\}/);
if (dm) darkBlock = dm[1];
const dark = { ...light };
for (const d of darkBlock.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) dark[d[1]] = d[2].trim();

function toRgb(value, map, depth = 0) {
  if (!value || depth > 12) return null;
  value = value.trim();
  let m = value.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)$/);
  if (m) return toRgb(map[m[1]] ?? m[2], map, depth + 1);
  m = value.match(/^#([0-9a-f]{6})$/i);
  if (m)
    return {
      r: parseInt(m[1].slice(0, 2), 16),
      g: parseInt(m[1].slice(2, 4), 16),
      b: parseInt(m[1].slice(4, 6), 16),
      a: 1,
    };
  m = value.match(/^#([0-9a-f]{3})$/i);
  if (m)
    return {
      r: parseInt(m[1][0] + m[1][0], 16),
      g: parseInt(m[1][1] + m[1][1], 16),
      b: parseInt(m[1][2] + m[1][2], 16),
      a: 1,
    };
  m = value.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)$/i);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  return null;
}
function over(fg, bg) {
  if (fg.a >= 1) return fg;
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  };
}
function lum({ r, g, b }) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(fg, bg) {
  const L1 = lum(fg),
    L2 = lum(bg);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

// [fg, bg, threshold, label]
const PAIRS = [
  ['--text', '--bg', 4.5, 'body text on canvas'],
  ['--text', '--bg-elevated', 4.5, 'body text on elevated'],
  ['--text', '--bg-sunken', 4.5, 'body text on sunken'],
  ['--text-2', '--bg', 4.5, 'secondary text on canvas'],
  ['--text-2', '--bg-elevated', 4.5, 'secondary text on elevated'],
  ['--text-3', '--bg', 4.5, 'eyebrow/meta on canvas'],
  ['--text-3', '--bg-elevated', 4.5, 'eyebrow/meta on elevated'],
  ['--text-on-accent', '--accent', 4.5, 'label on accent (CTA)'],
  ['--accent-hover', '--bg', 3.0, 'accent as text/underline (UI)'],
  ['--text', '--line', 3.0, 'hairline visibility (UI)'],
  // Buttons (WD1/WE10): primary label on accent already above; secondary on light = --text/--bg.
  ['--text', '--bg', 4.5, 'secondary button label on light'],
];

// Pairs that only make sense over a dark surface (the on-dark secondary button lives only inside a
// [data-tone="dark"] section or the hero scrim). Checked in the dark tone only — bone-on-bone would
// wrongly fail in light.
const DARK_ONLY = [
  ['--btn-ondark-text', '--bg', 4.5, 'secondary button label on dark (WD1)'],
  ['--btn-ondark-border', '--bg', 3.0, 'secondary button border on dark (WD1)'],
];

let failed = 0;
for (const tone of ['light', 'dark']) {
  const map = tone === 'light' ? light : dark;
  const canvas = toRgb(map['--bg'], map) ?? { r: 255, g: 255, b: 255, a: 1 };
  console.log(`\n  ${tone.toUpperCase()}`);
  console.log('  ' + '─'.repeat(66));
  const pairs = tone === 'dark' ? [...PAIRS, ...DARK_ONLY] : PAIRS;
  for (const [fgT, bgT, thr, label] of pairs) {
    const bg0 = toRgb(map[bgT], map);
    const bg = bg0 ? over(bg0, canvas) : canvas;
    const fg = over(toRgb(map[fgT], map) ?? { r: 0, g: 0, b: 0, a: 1 }, bg);
    const r = ratio(fg, bg);
    const ok = r >= thr;
    if (!ok) failed++;
    console.log(
      `  ${ok ? '✓' : '✗'} ${r.toFixed(2).padStart(5)}:1  (min ${thr.toFixed(1)})  ${fgT} / ${bgT}  — ${label}`,
    );
  }
}
console.log('');
if (failed) {
  console.error(`[verify-contrast] ✗ ${failed} pair(s) below AA. Adjust the token values in _tokens.scss.\n`);
  process.exit(1);
}
console.log('[verify-contrast] ✓ all semantic pairs pass AA in both tones.\n');
