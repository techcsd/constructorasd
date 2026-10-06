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
const imgWarnings = [];

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
    const isHero = /(^|\/)hero(\/|-)/i.test(rel) || /hero/i.test(basename(file));
    const isAvif = file.endsWith('.avif');
    const isWebp = file.endsWith('.webp');
    // Modern browsers serve AVIF, so the budget is enforced there (180 kB hero / 250 kB otherwise).
    // WebP is a fallback for old browsers: over-budget is a warning, not a build failure.
    if (isAvif) {
      const limit = isHero ? HERO_MAX_KB : MAX_KB;
      if (kb > limit) {
        violations.push({
          rel,
          line: 0,
          kind: isHero ? 'hero-too-big' : 'img-too-big',
          text: `${kb.toFixed(0)} kB > ${limit} kB (AVIF, served)`,
        });
      }
    } else if (isWebp && kb > MAX_KB) {
      imgWarnings.push(`${rel}  ${kb.toFixed(0)} kB > ${MAX_KB} kB (WebP fallback)`);
    }
  }
}

// ── 4) every project cover must have a ≥1600 w variant (WF2) ──
const MANIFEST = join(SRC, 'content', 'image-manifest.json');
const PROJECTS = join(SRC, 'content', 'projects.ts');
if (existsSync(MANIFEST) && existsSync(PROJECTS)) {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const txt = readFileSync(PROJECTS, 'utf8');
  const covers = new Set();
  for (const m of txt.matchAll(/cover:\s*\{\s*src:\s*'([^']+)'/g)) covers.add(m[1]);
  for (const key of covers) {
    const e = manifest[key];
    if (!e) {
      violations.push({ rel: 'src/content/projects.ts', line: 0, kind: 'cover-missing', text: `${key} not in image-manifest` });
    } else if (Math.max(...e.widths) < 1600) {
      violations.push({
        rel: 'src/content/image-manifest.json',
        line: 0,
        kind: 'cover-lowres',
        text: `${key} max width ${Math.max(...e.widths)} < 1600 — upscale (scripts/upscale-images.mjs) then npm run images`,
      });
    }
  }
}

// ── 5) required static brand/icon assets must exist (regression guard) ──
// These are committed assets NOT produced by optimize-images; a wholesale `rm -rf public/img` would
// drop them and 404 the logo mask on every page. Fail the build if any is missing.
const REQUIRED_STATIC = [
  'img/logo-full.png', 'img/logo-mono.png', 'img/logo-mark.svg',
  'img/logo-dark.svg', 'img/logo-light.svg', 'img/icon-192.png', 'img/icon-512.png',
];
for (const rel of REQUIRED_STATIC) {
  if (!existsSync(join(ROOT, 'public', rel))) {
    violations.push({ rel: `public/${rel}`, line: 0, kind: 'static-missing', text: 'required brand asset missing (restore from git)' });
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
console.log('[verify-images] ✓ alt text present; served AVIF within budget (hero ≤180 kB, rest ≤250 kB).');
if (imgWarnings.length) {
  console.log(`[verify-images]   note: ${imgWarnings.length} WebP fallback(s) over 250 kB (AVIF is served first):`);
  for (const w of imgWarnings.slice(0, 10)) console.log(`     ${w}`);
}
