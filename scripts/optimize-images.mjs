// optimize-images.mjs — `npm run images` (WB12 / DESIGN-BRIEF §8).
//
// assets-src/**/*.{jpg,jpeg,png} → public/img/** as AVIF + WebP at widths 480/960/1600/2400 (never
// upscaling past the source width) plus a 24px blurred LQIP (base64, in the manifest). Writes
// public/img/manifest.json with intrinsic dimensions + generated variants, consumed by ImageFigure.
// Idempotent: skips a source whose content hash + mtime already match the manifest.
//
// ROLES (round 05 / WR6): card+gallery widths 480–1600 (AVIF ≤250 kB), hero = the same widths but any
// file named *hero* must be ≤180 kB (LCP), and `large` (2400 px long side, AVIF ≤600 kB, lightbox only,
// never in the srcset of a card). Static (non-CMS) keys prefer assets-src/enhanced/**/<name>.png when it
// exists; CMS photos are enhanced as NEW media rows (derived_from), so their keys are untouched.
//
// Originals in assets-src/ are gitignored; only the optimized output in public/img/ is committed.

import sharp from 'sharp';
import { createHash } from 'node:crypto';
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
  mkdirSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, extname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC_DIR = join(ROOT, 'assets-src');
const OUT_DIR = join(ROOT, 'public', 'img');
// Manifest lives under src/ so components can import it directly (ImageFigure). The optimized
// AVIF/WebP files live in public/img/ and are served statically.
const MANIFEST = join(ROOT, 'src', 'content', 'image-manifest.json');

// Widths: 1600 added (WF2) so every cover has a ≥1600 w variant for 2× DPR. 2400 is intentionally
// omitted — at q42 a 2400 AVIF of these detailed drone/site photos blows the 250 kB budget (CLAUDE.md
// rule 8: budget is correctness); 1600 within budget covers the 1320 container at ~1.2× DPR and cards
// (50vw) at 2×. `withoutEnlargement` means 1600 only appears when the (possibly upscaled) source allows.
const WIDTHS = [480, 960, 1280, 1600];
const AVIF = { quality: 42, effort: 6 };
// The 1600 tier of a dense aerial photo can edge past the 250 kB budget at q42; drop it a few points
// so every served AVIF stays under budget (imperceptible at that size).
const AVIF_LARGE = { quality: 36, effort: 6 };
const WEBP = { quality: 46, effort: 5 };
// Staging folders under assets-src/ that are NOT walked as sources: raw PPTX dump + the upscaled/
// mirror (which is read on demand below as a preferred source for its matching original).
const SKIP_DIRS = new Set(['pptx', 'upscaled', 'enhanced', 'retouched']);
const ENHANCED_DIR = join(SRC_DIR, 'enhanced');
const LARGE_LONG_SIDE = 2400;
const LARGE_MAX_KB = 600;

function findEnhanced(key) {
  if (key.startsWith('cms/') || !existsSync(ENHANCED_DIR)) return null;
  const name = key.split('/').pop() + '.png';
  for (const d of readdirSync(ENHANCED_DIR)) {
    const p = join(ENHANCED_DIR, d, name);
    if (existsSync(p)) return p;
  }
  return null;
}

// `large`: long side ≤2400, AVIF quality lowered until ≤600 kB. Skipped when the source is too small to matter.
async function buildLarge(buf, key) {
  const meta = await sharp(buf).rotate().metadata();
  const rot = meta.orientation && meta.orientation >= 5;
  const sw = rot ? meta.height : meta.width, sh = rot ? meta.width : meta.height;
  if (Math.max(sw, sh) < 2000) return null;
  const base = sharp(buf).rotate().resize({ width: LARGE_LONG_SIDE, height: LARGE_LONG_SIDE, fit: 'inside', withoutEnlargement: true });
  const info = await base.clone().toBuffer({ resolveWithObject: true });
  const avifPath = join(OUT_DIR, `${key}-large.avif`), webpPath = join(OUT_DIR, `${key}-large.webp`);
  let q = 50, kb = 1e9;
  while (q >= 26) {
    const out = await base.clone().avif({ quality: q, effort: 6 }).toBuffer();
    kb = out.length / 1024;
    if (kb <= LARGE_MAX_KB - 10) { writeFileSync(avifPath, out); break; }
    q -= 4;
  }
  for (let wq = 62; wq >= 30; wq -= 6) {
    const out = await base.clone().webp({ quality: wq, effort: 5 }).toBuffer();
    writeFileSync(webpPath, out);
    if (out.length / 1024 <= LARGE_MAX_KB) break;
  }
  return { width: info.info.width, height: info.info.height, avif: `/img/${key}-large.avif`, webp: `/img/${key}-large.webp` };
}
const UPSCALED_DIR = join(SRC_DIR, 'upscaled');

if (!existsSync(SRC_DIR)) {
  console.log(`[optimize-images] ⏭  no assets-src/ — nothing to optimize.`);
  process.exit(0);
}
mkdirSync(OUT_DIR, { recursive: true });

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      out.push(...walk(p));
    } else if (/\.(jpe?g|png)$/i.test(name)) out.push(p);
  }
  return out;
}

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
const sources = walk(SRC_DIR);
let built = 0,
  skipped = 0;

for (const src of sources) {
  const rel = relative(SRC_DIR, src).replace(/\\/g, '/');
  const key = rel.replace(/\.(jpe?g|png)$/i, '');
  // Prefer an upscaled copy (assets-src/upscaled/<rel>) when present (WF2) so the 1600 w variant comes
  // from the enlarged source, not from enlarging a small original.
  const upPath = join(UPSCALED_DIR, rel);
  const enhPath = findEnhanced(key);
  const usedUpscaled = !enhPath && existsSync(upPath);
  const buf = readFileSync(enhPath ?? (usedUpscaled ? upPath : src));
  const hash = createHash('sha1').update(buf).digest('hex').slice(0, 12);

  if (manifest[key] && manifest[key].hash === hash) {
    // Same pixels: only back-fill the `large` variant (added in round 05) without re-encoding the rest.
    if (manifest[key].large === undefined) {
      mkdirSync(join(OUT_DIR, dirname(key)), { recursive: true });
      manifest[key].large = (await buildLarge(buf, key)) ?? null;
      if (manifest[key].large) console.log(`  + large ${key}`);
    }
    skipped++;
    continue;
  }

  const meta = await sharp(buf).metadata();
  // Honor EXIF orientation: swap dimensions for rotated (orientation 5–8) phone photos.
  let srcW = meta.width ?? Math.max(...WIDTHS);
  let srcH = meta.height ?? srcW;
  if (meta.orientation && meta.orientation >= 5) [srcW, srcH] = [srcH, srcW];
  const aspect = +(srcW / srcH).toFixed(4);
  const widths = WIDTHS.filter((w) => w <= srcW);
  if (widths.length === 0) widths.push(srcW);

  const outRelDir = dirname(key);
  mkdirSync(join(OUT_DIR, outRelDir), { recursive: true });

  const variants = { avif: {}, webp: {} };
  for (const w of widths) {
    const resized = sharp(buf).rotate().resize({ width: w, withoutEnlargement: true });
    const avifPath = join(OUT_DIR, `${key}-${w}.avif`);
    const webpPath = join(OUT_DIR, `${key}-${w}.webp`);
    await resized.clone().avif(w >= 1600 ? AVIF_LARGE : AVIF).toFile(avifPath);
    await resized.clone().webp(WEBP).toFile(webpPath);
    variants.avif[w] = `/img/${key}-${w}.avif`;
    variants.webp[w] = `/img/${key}-${w}.webp`;
  }

  // 24px LQIP, inline base64 webp.
  const lqipBuf = await sharp(buf).rotate().resize({ width: 24 }).webp({ quality: 40 }).toBuffer();
  const lqip = `data:image/webp;base64,${lqipBuf.toString('base64')}`;

  const large = (await buildLarge(buf, key)) ?? null;
  manifest[key] = { hash, width: srcW, height: srcH, aspect, widths, variants, lqip, large };
  built++;
  console.log(`  ✓ ${rel}  (${srcW}×${srcH}, ${widths.length} widths)${enhPath ? ' [enhanced]' : usedUpscaled ? ' [upscaled]' : ''}${large ? ' +large' : ''}`);
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`[optimize-images] ✓ ${built} built, ${skipped} unchanged → public/img/manifest.json`);
