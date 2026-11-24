// scripts/photos/retouch.mjs — PROMPT-13.
//   node scripts/photos/retouch.mjs --env dev --budget 15 [--only <id-prefix>] [--dry-run] [--model <name>] [--attempts 3]
//
// AI cleanup of TIER C photos (docs/round-05-photos/audit.json) with the Gemini image-edit API. It EDITS the same
// photograph (image + instruction, never text-to-image) and then protect-composites: every pixel outside the audited
// polygon (feathered) is copied from the original, so structure/people/vehicles can't drift. Originals are never
// overwritten. Output: assets-src/retouched/<project>/<name>.png (+ region overlay), log: retouch-log.csv.
// Refuses to run without --budget; accumulates cost from usageMetadata; aborts at the cap; ≤3 attempts per photo.
// Key: GEMINI_API_KEY in .env.local (server-side only, never logged).

import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { grayRaw, ssimBlocks, csvLine } from './lib.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DOCS = join(ROOT, 'docs', 'round-05-photos');
const arg = (n, d) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : d);
const flag = (n) => process.argv.includes(n);

if (!['dev', 'prod'].includes(arg('--env', ''))) { console.error('✖ retouch: --env dev|prod is required (BU1).'); process.exit(1); }
const budget = Number(arg('--budget', NaN));
if (!(budget > 0)) { console.error('✖ retouch: --budget <USD> is required.'); process.exit(1); }
const only = arg('--only', null);
const dry = flag('--dry-run');
const MODEL = arg('--model', 'gemini-nano-banana-2.1');
const MAX_ATTEMPTS = Number(arg('--attempts', 3));
const SEND_LONG = 2048; // "2K" input/output scale
// Estimated list price used only for the budget guard (docs 2026-11-23): ≈ $0.050 per 2K output image,
// ≈ $0.034 per 1K; tokens → USD derived from that, plus a small input-token term. Real usage is logged.
const USD_PER_OUT_TOKEN = 0.05 / 1680;
const USD_PER_IN_TOKEN = 0.5e-6;

const E = {};
for (const l of readFileSync(join(ROOT, '.env.local'), 'utf8').split(/\r?\n/)) {
  const i = l.indexOf('=');
  if (i > 0 && !l.trim().startsWith('#')) E[l.slice(0, i).trim()] = l.slice(i + 1).trim();
}
const KEY = E.GEMINI_API_KEY;
if (!KEY && !dry) { console.error('✖ retouch: GEMINI_API_KEY missing in .env.local (WS1). Use --dry-run to see the plan.'); process.exit(1); }

const audit = JSON.parse(readFileSync(join(DOCS, 'audit.json'), 'utf8'));
const targets = audit.photos.filter((p) => p.tier === 'C' && p.regions?.length && (!only || p.id.startsWith(only) || p.project?.includes(only)));
// pilots first: Villa Cacique 38, then Lopesan Bloque F, then the rest
const rank = (p) => (/villa-cacique/.test(p.page) ? 0 : /lopesan.*bloque-f/.test(p.page) ? 1 : 2);
targets.sort((a, b) => rank(a) - rank(b));

const regionText = (p) => p.regions.map((r) => r.label).join('; ');
const PROMPT = (p, extra = '') =>
  `Edit this construction-site photograph. Keep the composition, camera angle, lighting, perspective, colors, sky and every building element, structure, material, person, vehicle and machine exactly as they are. Only tidy the ground and foreground inside the described area: ${p.brief ? p.brief.split('Do not change')[0].trim() : regionText(p)}. Replace the cleared ground with the surrounding clean ground surface, continuing its texture and perspective. Do not add, move or invent any object. Do not change or add any text, logo or sign. Do not alter people. Output the same aspect ratio.${extra}`;

const outDirFor = (p) => join(ROOT, 'assets-src', 'retouched', p.page.replace('proyectos/', ''));
const logPath = join(DOCS, 'retouch-log.csv');
const head = ['id', 'project', 'tier_in', 'model', 'attempt', 'status', 'out_tokens', 'in_tokens', 'cost_usd_est', 'cumulative_usd', 'ssim_outside', 'seam_delta', 'inside_delta', 'output', 'note'];
const rows = [];
let spent = 0;

if (dry) {
  console.log(`[retouch] DRY RUN — model ${MODEL}, budget $${budget}, ≤${MAX_ATTEMPTS} attempts/photo`);
  let est = 0;
  for (const p of targets) {
    const c = MAX_ATTEMPTS * (0.05 + 0.002);
    est += c;
    console.log(`  • ${p.id.slice(0, 14)} ${p.page}\n    regions: ${regionText(p)}\n    prompt: ${PROMPT(p).slice(0, 160)}…\n    worst-case ≈ $${c.toFixed(2)}`);
  }
  console.log(`[retouch] ${targets.length} photo(s), worst-case ≈ $${est.toFixed(2)} (cap $${budget})`);
  process.exit(0);
}

async function callGemini(jpg, prompt) {
  const body = { contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: jpg.toString('base64') } }] }], generationConfig: { responseModalities: ['IMAGE'] } };
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, { method: 'POST', headers: { 'x-goog-api-key': KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${(j.error?.message ?? '').slice(0, 200)}`);
  const parts = j.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((x) => x.inlineData || x.inline_data);
  const d = img?.inlineData ?? img?.inline_data;
  const u = j.usageMetadata ?? {};
  return { buf: d ? Buffer.from(d.data, 'base64') : null, outTok: u.candidatesTokenCount ?? 0, inTok: u.promptTokenCount ?? 0, text: parts.map((x) => x.text).filter(Boolean).join(' ').slice(0, 160) };
}

function maskSvg(p, W, H, feather) {
  const pts = p.regions.flatMap((r) => `<polygon points="${r.polygon.map(([x, y]) => `${(x * W).toFixed(1)},${(y * H).toFixed(1)}`).join(' ')}" fill="#fff"/>`).join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#000"/>${pts}</svg>`);
}

for (const p of targets) {
  const src = join(ROOT, p.original_path);
  const meta = await sharp(src).metadata();
  const [W, H] = meta.orientation && meta.orientation >= 5 ? [meta.height, meta.width] : [meta.width, meta.height];
  const name = basename(p.id);
  const outDir = outDirFor(p);
  mkdirSync(outDir, { recursive: true });
  const scale = Math.min(1, SEND_LONG / Math.max(W, H));
  const sw = Math.round(W * scale), sh = Math.round(H * scale);
  const sent = await sharp(src).rotate().resize(sw, sh).jpeg({ quality: 92 }).toBuffer();
  const feather = Math.max(4, Math.round(24 * (Math.max(W, H) / 2048))); // ≈24 px at 2K scale
  const maskPng = await sharp(maskSvg(p, W, H)).blur(feather / 2).grayscale().raw().toBuffer({ resolveWithObject: true });
  const hardMask = await sharp(maskSvg(p, W, H)).grayscale().raw().toBuffer();
  const origRGB = await sharp(src).rotate().removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let note = '', done = false;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS && !done; attempt++) {
    if (spent >= budget) { console.log(`✖ budget cap $${budget} reached — stopping`); rows.push([p.id, p.page, 'C', MODEL, attempt, 'BUDGET_STOP', '', '', '', spent.toFixed(3), '', '', '', '', '']); break; }
    const extra = attempt === 1 ? '' : ` Previous attempt was rejected: ${note}. Be more conservative: only clean the described area and match the neighbouring ground exactly.`;
    let res;
    try { res = await callGemini(sent, PROMPT(p, extra)); } catch (e) { console.log(`  ! ${e.message}`); rows.push([p.id, p.page, 'C', MODEL, attempt, 'API_ERROR', '', '', '0', spent.toFixed(3), '', '', '', '', e.message.slice(0, 120)]); note = 'API error'; continue; }
    const cost = res.outTok * USD_PER_OUT_TOKEN + res.inTok * USD_PER_IN_TOKEN;
    spent += cost;
    if (!res.buf) { note = `no image returned (${res.text})`; rows.push([p.id, p.page, 'C', MODEL, attempt, 'NO_IMAGE', res.outTok, res.inTok, cost.toFixed(4), spent.toFixed(3), '', '', '', '', note]); console.log(`  ✗ ${name.slice(0, 8)} #${attempt} ${note}`); continue; }
    const raw = join(outDir, `${name}.model-a${attempt}.png`);
    writeFileSync(raw, res.buf);
    // align to the original size (aspect should match; fit:'fill' only absorbs ≤1 px rounding)
    const mi = await sharp(res.buf).metadata();
    const aspectErr = Math.abs(mi.width / mi.height - W / H) / (W / H);
    const gen = await sharp(res.buf).resize(W, H, { fit: 'fill', kernel: 'lanczos3' }).removeAlpha().raw().toBuffer();
    // protect-composite: original everywhere except the feathered polygon
    const out = Buffer.allocUnsafe(origRGB.data.length);
    for (let i = 0, n = W * H; i < n; i++) {
      const a = maskPng.data[i] / 255;
      for (let c = 0; c < 3; c++) out[i * 3 + c] = origRGB.data[i * 3 + c] * (1 - a) + gen[i * 3 + c] * a;
    }
    // checks
    const toGray = async (b) => (await sharp(b, { raw: { width: W, height: H, channels: 3 } }).resize(1200, Math.round((1200 * H) / W)).grayscale().raw().toBuffer({ resolveWithObject: true }));
    const go = await toGray(origRGB.data), gc = await toGray(out);
    const hm = await sharp(hardMask, { raw: { width: W, height: H, channels: 1 } }).resize(1200, go.info.height).raw().toBuffer();
    // SSIM outside: zero the mask area in both and compute block SSIM (inside blocks are identical-by-zero)
    const a1 = Buffer.from(go.data), b1 = Buffer.from(gc.data);
    for (let i = 0; i < hm.length; i++) if (hm[i] > 10) { a1[i] = 0; b1[i] = 0; }
    const ssimOut = ssimBlocks(a1, b1, go.info.width, go.info.height);
    let seam = 0, sn = 0, inside = 0, inn = 0;
    for (let i = 0; i < hm.length; i++) {
      const d = Math.abs(go.data[i] - gc.data[i]);
      if (hm[i] > 10) { inside += d; inn++; }
    }
    // seam: mean abs luma change across a 6 px band straddling the polygon edge, vs the same in the original
    const w1 = go.info.width, h1 = go.info.height;
    for (let y = 6; y < h1 - 6; y++) for (let x = 6; x < w1 - 6; x++) {
      const i = y * w1 + x;
      const edge = (hm[i] > 10) !== (hm[i + 1] > 10) || (hm[i] > 10) !== (hm[i + w1] > 10);
      if (edge) { seam += Math.abs((gc.data[i + 1] - gc.data[i - 1]) + (gc.data[i + w1] - gc.data[i - w1])) - Math.abs((go.data[i + 1] - go.data[i - 1]) + (go.data[i + w1] - go.data[i - w1])); sn++; }
    }
    const seamDelta = sn ? seam / sn : 0, insideDelta = inn ? inside / inn : 0;
    const okChecks = ssimOut >= 0.995 && aspectErr < 0.02 && Math.abs(seamDelta) < 12 && insideDelta > 1; // inside must actually change
    const outFile = join(outDir, `${name}.a${attempt}.png`);
    await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png().toFile(outFile);
    // overlay of the region for review
    await sharp(src).rotate().composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${p.regions.map((r) => `<polygon points="${r.polygon.map(([x, y]) => `${x * W},${y * H}`).join(' ')}" fill="rgba(255,0,0,0.25)" stroke="#ff0" stroke-width="4"/>`).join('')}</svg>`) }]).jpeg({ quality: 80 }).toFile(join(outDir, `${name}.region.jpg`));
    rows.push([p.id, p.page, 'C', MODEL, attempt, okChecks ? 'CHECKS_OK_PENDING_REVIEW' : 'CHECKS_FAILED', res.outTok, res.inTok, cost.toFixed(4), spent.toFixed(3), ssimOut.toFixed(4), seamDelta.toFixed(1), insideDelta.toFixed(1), outFile.replace(ROOT + '\\', '').replace(/\\/g, '/'), res.text]);
    console.log(`  ${okChecks ? '✓' : '✗'} ${name.slice(0, 8)} #${attempt}  ssim_out ${ssimOut.toFixed(4)}  seam ${seamDelta.toFixed(1)}  inside Δ${insideDelta.toFixed(1)}  ≈$${cost.toFixed(3)} (Σ $${spent.toFixed(3)})  → ${outFile.split('assets-src')[1]}`);
    if (okChecks) done = true; else note = `automatic checks failed (ssim_out ${ssimOut.toFixed(3)}, inside Δ${insideDelta.toFixed(1)})`;
  }
}
const prior = existsSync(logPath) ? readFileSync(logPath, 'utf8').trim().split('\n').slice(1) : [];
writeFileSync(logPath, [`# model=${MODEL} budget=${budget} est_price=$0.05/2K-image`, csvLine(head), ...prior.filter((l) => !l.startsWith('#') && !l.startsWith('id,')), ...rows.map(csvLine)].join('\n') + '\n');
console.log(`[retouch] ${rows.length} attempt(s), estimated spend $${spent.toFixed(3)} / cap $${budget} → docs/round-05-photos/retouch-log.csv`);
