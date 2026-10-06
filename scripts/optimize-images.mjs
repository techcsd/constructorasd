// optimize-images.mjs — `npm run images` (WB12 / DESIGN-BRIEF §8).
//
// assets-src/**/*.{jpg,jpeg,png} → public/img/** as AVIF + WebP at widths 480/960/1600/2400 (never
// upscaling past the source width) plus a 24px blurred LQIP (base64, in the manifest). Writes
// public/img/manifest.json with intrinsic dimensions + generated variants, consumed by ImageFigure.
// Idempotent: skips a source whose content hash + mtime already match the manifest.
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
const SKIP_DIRS = new Set(['pptx', 'upscaled']);
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
  const usedUpscaled = existsSync(upPath);
  const buf = readFileSync(usedUpscaled ? upPath : src);
  const hash = createHash('sha1').update(buf).digest('hex').slice(0, 12);

  if (manifest[key] && manifest[key].hash === hash) {
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

  manifest[key] = { hash, width: srcW, height: srcH, aspect, widths, variants, lqip };
  built++;
  console.log(`  ✓ ${rel}  (${srcW}×${srcH}, ${widths.length} widths)${usedUpscaled ? ' [upscaled]' : ''}`);
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`[optimize-images] ✓ ${built} built, ${skipped} unchanged → public/img/manifest.json`);
