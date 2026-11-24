// scripts/photos/lib.mjs — shared image metrics for the round-05 photo audit (Node + sharp only).
import sharp from 'sharp';

const ANALYSIS_W = 1200;

/** Decode to an oriented grayscale raw buffer at a given width. */
export async function grayRaw(input, width) {
  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width, withoutEnlargement: false })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

/** Variance of the Laplacian (higher = sharper). Computed on a 1200 px-wide resize. */
export function laplacianVariance({ data, w, h }) {
  let sum = 0, sumSq = 0, n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const v = data[i - w] + data[i + w] + data[i - 1] + data[i + 1] - 4 * data[i];
      sum += v;
      sumSq += v * v;
      n++;
    }
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

/** Immerkaer fast noise sigma estimate. */
export function noiseEstimate({ data, w, h }) {
  let acc = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const v =
        data[i - w - 1] - 2 * data[i - w] + data[i - w + 1] -
        2 * data[i - 1] + 4 * data[i] - 2 * data[i + 1] +
        data[i + w - 1] - 2 * data[i + w] + data[i + w + 1];
      acc += Math.abs(v);
    }
  }
  return (Math.sqrt(Math.PI / 2) * acc) / (6 * (w - 2) * (h - 2));
}

/** Percent of pixels crushed to black / blown to white, plus mean luma. */
export function exposureStats({ data }) {
  let dark = 0, light = 0, sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = data[i];
    if (v <= 5) dark++;
    if (v >= 250) light++;
    sum += v;
  }
  return {
    dark: (dark / data.length) * 100,
    light: (light / data.length) * 100,
    mean: sum / data.length,
  };
}

// 32×32 DCT-II perceptual hash → 64-bit hex string.
const N = 32;
const COS = Array.from({ length: 8 }, (_, u) =>
  Array.from({ length: N }, (_, x) => Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N))),
);
export async function phash(input) {
  const { data } = await sharp(input)
    .rotate()
    .resize(N, N, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const coeffs = [];
  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      let s = 0;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) s += data[y * N + x] * COS[u][x] * COS[v][y];
      coeffs.push(s);
    }
  }
  const sorted = coeffs.slice(1).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  let bits = '';
  for (let i = 0; i < 64; i++) bits += coeffs[i] > median ? '1' : '0';
  return BigInt('0b' + bits).toString(16).padStart(16, '0');
}

export function hamming(a, b) {
  let x = BigInt('0x' + a) ^ BigInt('0x' + b);
  let c = 0;
  while (x) {
    c += Number(x & 1n);
    x >>= 1n;
  }
  return c;
}

export async function measure(input) {
  const meta = await sharp(input).metadata();
  let w = meta.width, h = meta.height;
  if (meta.orientation && meta.orientation >= 5) [w, h] = [h, w];
  const g = await grayRaw(input, ANALYSIS_W);
  const ex = exposureStats(g);
  return {
    w,
    h,
    sharpness: +laplacianVariance(g).toFixed(1),
    clip_dark_pct: +ex.dark.toFixed(2),
    clip_light_pct: +ex.light.toFixed(2),
    mean_luma: +ex.mean.toFixed(1),
    noise_est: +noiseEstimate(g).toFixed(2),
    phash: await phash(input),
  };
}

/** Global SSIM (single window, 8-bit gray) between two same-size raw gray buffers. */
export function ssimGlobal(a, b) {
  const n = a.length;
  let ma = 0, mb = 0;
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
  ma /= n; mb /= n;
  let va = 0, vb = 0, cov = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - ma, db = b[i] - mb;
    va += da * da; vb += db * db; cov += da * db;
  }
  va /= n - 1; vb /= n - 1; cov /= n - 1;
  const C1 = (0.01 * 255) ** 2, C2 = (0.03 * 255) ** 2;
  return ((2 * ma * mb + C1) * (2 * cov + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2));
}

/** Mean SSIM over 8×8 blocks (stride 8) — closer to the standard local SSIM than the global form. */
export function ssimBlocks(a, b, w, h) {
  const C1 = (0.01 * 255) ** 2, C2 = (0.03 * 255) ** 2;
  let total = 0, count = 0;
  for (let by = 0; by + 8 <= h; by += 8) {
    for (let bx = 0; bx + 8 <= w; bx += 8) {
      let ma = 0, mb = 0;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const i = (by + y) * w + bx + x; ma += a[i]; mb += b[i]; }
      ma /= 64; mb /= 64;
      let va = 0, vb = 0, cov = 0;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        const i = (by + y) * w + bx + x;
        const da = a[i] - ma, db = b[i] - mb;
        va += da * da; vb += db * db; cov += da * db;
      }
      va /= 63; vb /= 63; cov /= 63;
      total += ((2 * ma * mb + C1) * (2 * cov + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2));
      count++;
    }
  }
  return total / count;
}

export function csvLine(cells) {
  return cells
    .map((c) => {
      const s = c == null ? '' : String(c);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    })
    .join(',');
}
