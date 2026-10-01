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

// Cap at 1600w: the container is 1320px and these detailed site photos compress poorly past that.
// (The hero budget is defined at 1600w AVIF; larger widths only blow the per-image budget.)
const WIDTHS = [480, 960, 1600];
const AVIF = { quality: 44, effort: 6 };
const WEBP = { quality: 52, effort: 5 };

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
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(jpe?g|png)$/i.test(name)) out.push(p);
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
  const buf = readFileSync(src);
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
    await resized.clone().avif(AVIF).toFile(avifPath);
    await resized.clone().webp(WEBP).toFile(webpPath);
    variants.avif[w] = `/img/${key}-${w}.avif`;
    variants.webp[w] = `/img/${key}-${w}.webp`;
  }

  // 24px LQIP, inline base64 webp.
  const lqipBuf = await sharp(buf).rotate().resize({ width: 24 }).webp({ quality: 40 }).toBuffer();
  const lqip = `data:image/webp;base64,${lqipBuf.toString('base64')}`;

  manifest[key] = { hash, width: srcW, height: srcH, aspect, widths, variants, lqip };
  built++;
  console.log(`  ✓ ${rel}  (${srcW}×${srcH}, ${widths.length} widths)`);
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`[optimize-images] ✓ ${built} built, ${skipped} unchanged → public/img/manifest.json`);
