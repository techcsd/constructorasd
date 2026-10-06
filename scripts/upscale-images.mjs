// upscale-images.mjs (WD5 / WF2) — upscale low-resolution source photos so the pipeline can emit a
// crisp ≥1600 w variant. Uses Real-ESRGAN (realesrgan-ncnn-vulkan, model realesrgan-x4plus) when the
// portable binary is available under tools/ or %USERPROFILE%\tools or on PATH; otherwise falls back to
// a sharp lanczos3 enlarge + mild sharpen and SAYS SO in the log (a sharp enlarge adds no real detail —
// treat its output as a stopgap, not a substitute for a real high-res photo).
//
// Originals in assets-src/ are never touched; upscaled copies go to assets-src/upscaled/<same path>.
// optimize-images.mjs prefers assets-src/upscaled/<path> when it exists.
//
// Usage: node scripts/upscale-images.mjs [--min-width 1600] [--scale auto]
import sharp from 'sharp';
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'assets-src');
const OUT = join(SRC, 'upscaled');

const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i !== -1 ? process.argv[i + 1] : d;
};
const MIN_WIDTH = Number(arg('--min-width', '1600'));
const DIRS = ['projects', 'stages', 'lopesan']; // content-referenced trees (pptx is a raw dump, skipped)

// Locate a Real-ESRGAN binary (optional).
function findEsrgan() {
  const names = ['realesrgan-ncnn-vulkan', 'realesrgan-ncnn-vulkan.exe'];
  const roots = [join(ROOT, 'tools'), join(process.env.USERPROFILE ?? '', 'tools')];
  for (const r of roots) for (const n of names) {
    const p = join(r, n);
    if (existsSync(p)) return p;
  }
  const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['realesrgan-ncnn-vulkan']);
  if (which.status === 0) return String(which.stdout).split(/\r?\n/)[0].trim();
  return null;
}
const ESRGAN = findEsrgan();

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(jpe?g|png)$/i.test(name)) out.push(p);
  }
  return out;
}

console.log(ESRGAN ? `[upscale] using Real-ESRGAN: ${ESRGAN}` : `[upscale] Real-ESRGAN not found → sharp lanczos3 fallback (no hallucinated detail)`);

let done = 0, skipped = 0;
for (const d of DIRS) {
  for (const src of walk(join(SRC, d))) {
    const rel = relative(SRC, src).replace(/\\/g, '/');
    const meta = await sharp(src).metadata();
    const w = meta.width ?? 0;
    if (w >= MIN_WIDTH) { skipped++; continue; }

    const scale = w >= 1000 ? 2 : 4; // ESRGAN model scales; mirrored by the sharp target width
    const target = w * scale;
    const outPath = join(OUT, rel);
    mkdirSync(dirname(outPath), { recursive: true });

    if (ESRGAN) {
      const r = spawnSync(ESRGAN, ['-i', src, '-o', outPath, '-s', String(scale), '-n', 'realesrgan-x4plus'], {
        stdio: 'ignore',
      });
      if (r.status === 0) {
        console.log(`  ✓ ${rel}  ${w}px → ~${target}px (ESRGAN ×${scale})`);
        done++;
        continue;
      }
      console.log(`  ! ${rel}  ESRGAN failed → sharp fallback`);
    }
    // sharp fallback: enlarge with lanczos3 then a mild sharpen.
    await sharp(src)
      .resize({ width: target, kernel: sharp.kernel.lanczos3 })
      .sharpen({ sigma: 0.6 })
      .toFile(outPath);
    console.log(`  ✓ ${rel}  ${w}px → ${target}px (sharp lanczos3 ×${scale})`);
    done++;
  }
}
console.log(`[upscale] ${done} upscaled → assets-src/upscaled/, ${skipped} already ≥ ${MIN_WIDTH}px.`);
