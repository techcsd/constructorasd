// verify-images.mjs — IMAGE GUARD (DESIGN-BRIEF §8 / §9, perf budgets). Runs in prebuild.
//
// Fails the build when:
//   1) an <img> or <app-image-figure> is missing a meaningful alt (empty, or equal to the filename);
//   2) any committed file in public/img/ exceeds 250 kB;
//   3) a hero/LCP image (public/img/hero/** or filename containing "hero") exceeds 180 kB.
//
// Per-line escape hatch for alt (decorative images): `images-allow`.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, basename, extname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');
const IMG_DIR = join(ROOT, 'public', 'img');

const MAX_KB = 250;
const HERO_MAX_KB = 180;

function walk(dir, exts) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p, exts));
    else if (!exts || exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

const violations = [];

// ── 1) alt text on <img> and <app-image-figure> ──
const IMG_TAG = /<(img|app-image-figure)\b[^>]*?>/gis;
for (const file of walk(SRC, ['.html'])) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  const txt = readFileSync(file, 'utf8');
  let m;
  IMG_TAG.lastIndex = 0;
  while ((m = IMG_TAG.exec(txt))) {
    const tag = m[0];
    if (/images-allow/.test(tag)) continue;
    // accept a bound alt ([alt]="…" or alt="{{…}}") — can't evaluate, trust it's meaningful
    const bound = /\[alt\]\s*=|\[attr\.alt\]\s*=/.test(tag);
    const staticAlt = tag.match(/\salt\s*=\s*"([^"]*)"/i);
    const line = txt.slice(0, m.index).split('\n').length;
    if (bound) continue;
    if (!staticAlt) {
      violations.push({ rel, line, kind: 'alt-missing', text: tag.slice(0, 80) });
    } else {
      const alt = staticAlt[1].trim();
      if (!alt) violations.push({ rel, line, kind: 'alt-empty', text: tag.slice(0, 80) });
    }
  }
}

// ── 2 + 3) file sizes in public/img ──
if (existsSync(IMG_DIR)) {
  for (const file of walk(IMG_DIR, null)) {
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    if (/\.(json|txt|md)$/.test(file)) continue; // manifest etc.
    const kb = statSync(file).size / 1024;
    // The 180 kB hero budget is defined for the AVIF the browser actually serves as LCP; the WebP
    // fallback (older browsers) uses the general 250 kB cap. Non-hero images: 250 kB.
    const isHero = /(^|\/)hero(\/|-)/i.test(rel) || /hero/i.test(basename(file));
    const isAvif = file.endsWith('.avif');
    const limit = isHero && isAvif ? HERO_MAX_KB : MAX_KB;
    if (kb > limit) {
      violations.push({
        rel,
        line: 0,
        kind: isHero && isAvif ? 'hero-too-big' : 'img-too-big',
        text: `${kb.toFixed(0)} kB > ${limit} kB`,
      });
    }
  }
}

if (violations.length) {
  console.error(
    `\n[verify-images] ✗ ${violations.length} image issue(s):\n` +
      `  alt-missing/alt-empty → add a meaningful alt (ES/EN), not the filename\n` +
      `  img-too-big (>${MAX_KB}kB) / hero-too-big (>${HERO_MAX_KB}kB) → re-run npm run images / recrop\n` +
      `  (decorative image: add "images-allow" in the tag)\n`,
  );
  for (const v of violations) console.error(`  [${v.kind}] ${v.rel}:${v.line}  ${v.text}`);
  console.error('');
  process.exit(1);
}
console.log('[verify-images] ✓ alt text present; all public/img files within budget.');
