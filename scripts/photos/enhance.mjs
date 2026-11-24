// scripts/photos/enhance.mjs — PROMPT-12 Phase 3. `node scripts/photos/enhance.mjs [--only <id-prefix>]`
//
// Free, local, non-generative enhancement for TIER B photos only (docs/round-05-photos/audit.json):
//   sharp: normalise (auto-levels) → CLAHE only for DARK/FLAT_LIGHT → light median denoise only for NOISE
//   → Real-ESRGAN ncnn-vulkan (x4plus, downscaled to ×2) only when the long side < 2400 px
//   → mild unsharp. No crops, no rotations, no colour grading beyond exposure.
// Safety net per photo: sharpness must improve and block-SSIM vs the *current* image (resized) ≥ 0.90,
// else the result is discarded and logged B_FAILED → keep original. Originals are never overwritten.
// Output: assets-src/enhanced/<folder>/<name>.png (gitignored) + docs/round-05-photos/enhance-log.csv.

import sharp from 'sharp';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { grayRaw, laplacianVariance, ssimBlocks, csvLine } from './lib.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DOCS = join(ROOT, 'docs', 'round-05-photos');
const OUT = join(ROOT, 'assets-src', 'enhanced');
const TMP = join(ROOT, 'scratchpad', 'enh-tmp');
const EXE = join(ROOT, 'tools', 'realesrgan', 'realesrgan-ncnn-vulkan.exe');
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
mkdirSync(TMP, { recursive: true });

const audit = JSON.parse(readFileSync(join(DOCS, 'audit.json'), 'utf8'));
const targets = audit.photos.filter((p) => p.tier === 'B' && (!only || p.id.startsWith(only)));
const haveEsrgan = existsSync(EXE);
if (!haveEsrgan) console.warn('[enhance] Real-ESRGAN binary missing → Lanczos ×2 fallback');

function esrgan(inPng, outPng) {
  const r = spawnSync(EXE, ['-i', inPng, '-o', outPng, '-n', 'realesrgan-x4plus', '-s', '4'], { encoding: 'utf8', cwd: dirname(EXE) });
  return r.status === 0 && existsSync(outPng);
}

const rows = [];
for (const p of targets) {
  const srcRel = p.native_path ?? p.original_path; // true source (static native) when the CMS copy is an enlargement
  const src = join(ROOT, srcRel);
  const current = join(ROOT, p.original_path); // what the site shows now: the comparison baseline
  const folder = p.role === 'stage' ? 'servicios' : p.page.replace('proyectos/', '');
  const name = basename(p.id);
  const outDir = join(OUT, folder);
  mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, `${name}.png`);
  const codes = p.codes ?? [];

  const meta = await sharp(src).metadata();
  let [w, h] = meta.orientation && meta.orientation >= 5 ? [meta.height, meta.width] : [meta.width, meta.height];
  const long = Math.max(w, h);

  // 1) gentle mechanical pass
  let pipe = sharp(src).rotate().normalise({ lower: 1, upper: 99 });
  if (codes.includes('DARK') || codes.includes('FLAT_LIGHT')) pipe = pipe.clahe({ width: Math.round(w / 8), height: Math.round(h / 8), maxSlope: 2 });
  if (codes.includes('NOISE')) pipe = pipe.median(3);
  const stage1 = join(TMP, `${folder}-${name}-s1.png`);
  await pipe.png().toFile(stage1);

  // 2) resolution: Real-ESRGAN (×4 → ×2) only when long side < 2400. Full-strength ESRGAN output tends to
  // over-process (painterly texture, SSIM < 0.9), so it is blended with a plain Lanczos enlargement and the
  // STRONGEST blend that passes the safety net is kept (alpha logged).
  let method = 'sharp-only', outW = w, outH = h;
  const cur = await grayRaw(current, 1200);
  const sBefore = laplacianVariance(cur);
  const evalBuf = async (b) => {
    const { data, info } = await sharp(b).resize(1200, cur.h, { fit: 'fill' }).grayscale().raw().toBuffer({ resolveWithObject: true });
    const e = { data, w: info.width, h: info.height };
    const sA = laplacianVariance(e);
    return { sA, ssim: ssimBlocks(cur.data, e.data, cur.w, cur.h) };
  };
  const finish = (b) => sharp(b).sharpen({ sigma: 0.8, m1: 0.6, m2: 1.2 }).png().toBuffer();
  let buf, alphaUsed = '', sAfter = 0, ssim = 0, pass = false;
  if (long < 2400) {
    const up = join(TMP, `${folder}-${name}-x4.png`);
    const ok = haveEsrgan && esrgan(stage1, up);
    method = ok ? 'realesrgan-x4plus→×2 (blend)' : 'lanczos×2 (fallback)';
    outW = w * 2; outH = h * 2;
    const lan = await sharp(stage1).resize({ width: outW, height: outH, kernel: 'lanczos3' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const alphas = ok ? [1, 0.75, 0.6, 0.45, 0.3, 0.2] : [0];
    const esr = ok ? await sharp(up).resize({ width: outW, height: outH, kernel: 'lanczos3' }).removeAlpha().raw().toBuffer() : null;
    for (const al of alphas) {
      let mixed;
      if (ok) {
        mixed = Buffer.allocUnsafe(lan.data.length);
        for (let i = 0; i < mixed.length; i++) mixed[i] = lan.data[i] * (1 - al) + esr[i] * al;
      } else mixed = lan.data;
      buf = await finish(await sharp(mixed, { raw: { width: outW, height: outH, channels: lan.info.channels } }).png().toBuffer());
      const r = await evalBuf(buf);
      sAfter = r.sA; ssim = r.ssim; alphaUsed = ok ? String(al) : 'n/a';
      pass = sAfter > sBefore * 1.02 && ssim >= 0.9;
      if (pass) break;
    }
    if (ok) rmSync(up, { force: true });
  } else {
    buf = await finish(await sharp(stage1).toBuffer());
    const r = await evalBuf(buf);
    sAfter = r.sA; ssim = r.ssim; alphaUsed = 'n/a';
    pass = sAfter > sBefore * 1.02 && ssim >= 0.9;
  }
  const gain = (sAfter / sBefore - 1) * 100;
  if (pass) writeFileSync(outFile, buf);
  else rmSync(outFile, { force: true });
  rows.push([p.id, folder, codes.join('+'), srcRel, `${w}x${h}`, `${outW}x${outH}`, method, alphaUsed, sBefore.toFixed(0), sAfter.toFixed(0), gain.toFixed(1), ssim.toFixed(3), pass ? 'B_OK' : 'B_FAILED → keep original', pass ? outFile.replace(ROOT + '\\', '').replace(/\\/g, '/') : '']);
  console.log(`  ${pass ? '✓' : '✗'} ${folder}/${name.slice(0, 10)}  ${method}  sharp ${sBefore.toFixed(0)}→${sAfter.toFixed(0)} (${gain.toFixed(0)}%)  a=${alphaUsed} ssim ${ssim.toFixed(3)}`);
  rmSync(stage1, { force: true });
}

const head = ['id', 'folder', 'reasons', 'input', 'input_px', 'output_px', 'method', 'esrgan_alpha', 'sharpness_before', 'sharpness_after', 'gain_pct', 'ssim', 'status', 'output'];
const logPath = join(DOCS, 'enhance-log.csv');
let prior = [];
if (only && existsSync(logPath)) prior = readFileSync(logPath, 'utf8').trim().split('\n').slice(1).filter((l) => !l.startsWith(only));
writeFileSync(logPath, [csvLine(head), ...prior, ...rows.map(csvLine)].join('\n') + '\n');
console.log(`[enhance] ${rows.filter((r) => r[12] === 'B_OK').length}/${rows.length} ok → docs/round-05-photos/enhance-log.csv`);
