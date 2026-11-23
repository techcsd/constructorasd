// scripts/photos/inventory.mjs — PROMPT-12 Phase 1. `node scripts/photos/inventory.mjs`
//
// Enumerates every image the public site can show (CMS projects via _overrides.json + static content
// + stage covers + home hero + og), resolves each to its original (assets-src/ and, via perceptual
// hash, the source folders — read-only), measures it, and groups duplicates (pHash Hamming ≤ 6).
// Writes docs/round-05-photos/inventory.csv and scratchpad-independent inventory.json (kept in
// docs/round-05-photos/ — small, text only).

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import sharp from 'sharp';
import { measure, hamming, csvLine } from './lib.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'docs', 'round-05-photos');
const SRC = join(ROOT, 'assets-src');
const MANIFEST = JSON.parse(readFileSync(join(ROOT, 'src', 'content', 'image-manifest.json'), 'utf8'));
const OVERRIDES = JSON.parse(readFileSync(join(ROOT, 'src', 'content', '_overrides.json'), 'utf8'));
const SOURCE_FOLDERS = [
  join('C:', 'Users', 'xavie', 'Desktop', 'X Dev', 'Constructora SD', 'CSD alt', '01_PROYECTOS', '02_PROYECTO ACTUAL'),
  join(SRC, 'pptx'),
];
mkdirSync(OUT, { recursive: true });

const IMG_RE = /\.(jpe?g|png)$/i;
function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    let s;
    try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) walk(p, acc);
    else if (IMG_RE.test(n) && s.size > 20_000) acc.push(p);
  }
  return acc;
}

function fileFor(key) {
  for (const ext of ['jpg', 'jpeg', 'png']) {
    const p = join(SRC, `${key}.${ext}`);
    if (existsSync(p)) return p;
  }
  return null;
}

// ── usages ──
const usages = []; // {key, page, project, role}
for (const p of OVERRIDES.projects ?? []) {
  const pk = (s) => s.src;
  if (p.cover?.src) usages.push({ key: pk(p.cover), page: `proyectos/${p.slug}`, project: p.name ?? p.slug, role: 'card' });
  (p.gallery ?? []).forEach((g, i) =>
    usages.push({ key: pk(g), page: `proyectos/${p.slug}`, project: p.name ?? p.slug, role: 'gallery', pos: i + 1 }),
  );
}
// static stages + home hero (not overridden by the CMS today)
const stagesTs = readFileSync(join(ROOT, 'src', 'content', 'stages.ts'), 'utf8');
for (const m of stagesTs.matchAll(/src:\s*'(stages\/[a-z0-9-]+)'/g))
  usages.push({ key: m[1], page: `servicios/${m[1].split('/')[1]}`, project: '', role: 'stage' });
usages.push({ key: 'lopesan/hero', page: 'inicio', project: '', role: 'hero' });
// og
const ogDir = join(ROOT, 'public', 'og');
if (existsSync(ogDir)) for (const n of readdirSync(ogDir)) if (IMG_RE.test(n)) usages.push({ key: `og/${n}`, page: 'og', project: '', role: 'og', file: join(ogDir, n) });

// every other key in the build manifest that nothing references any more = static fallback
const used = new Set(usages.map((u) => u.key));
for (const key of Object.keys(MANIFEST)) if (!used.has(key)) usages.push({ key, page: '(fallback estático, sin uso)', project: '', role: 'fallback' });

// ── source index (pHash of every candidate original; cached) ──
const CACHE = join(OUT, '.source-index.json');
let index = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
const candidates = SOURCE_FOLDERS.flatMap((d) => walk(d));
let fresh = 0;
for (const f of candidates) {
  if (index[f]) continue;
  try {
    const m = await measure(f);
    index[f] = { phash: m.phash, w: m.w, h: m.h, bytes: statSync(f).size };
    fresh++;
  } catch { index[f] = null; }
}
writeFileSync(CACHE, JSON.stringify(index));
console.log(`[inventory] source index: ${candidates.length} candidates (${fresh} new)`);

// ── measure each distinct image once ──
const byKey = new Map();
for (const u of usages) {
  if (byKey.has(u.key)) continue;
  const file = u.file ?? fileFor(u.key);
  if (!file) { byKey.set(u.key, { missing: true }); continue; }
  const m = await measure(file);
  const man = MANIFEST[u.key];
  let served = {};
  if (man) {
    const wMax = Math.max(...man.widths);
    const hMax = Math.round(wMax / man.aspect);
    const avif = join(ROOT, 'public', man.variants.avif[wMax].replace(/^\//, ''));
    served = { served_w: wMax, served_h: hMax, served_bytes: existsSync(avif) ? statSync(avif).size : '' };
  }
  // best original match in the source folders: smallest hamming, prefer larger pixels
  let best = null;
  for (const [f, e] of Object.entries(index)) {
    if (!e) continue;
    const d = hamming(m.phash, e.phash);
    if (d <= 8 && (!best || d < best.d || (d === best.d && e.w * e.h > best.px))) best = { f, d, px: e.w * e.h, w: e.w, h: e.h };
  }
  byKey.set(u.key, { file, ...m, ...served, native: best });
}

// ── duplicate groups ──
const keys = [...byKey.keys()].filter((k) => !byKey.get(k).missing);
const group = new Map();
let g = 0;
for (const k of keys) {
  if (group.has(k)) continue;
  const mates = keys.filter((o) => o !== k && hamming(byKey.get(k).phash, byKey.get(o).phash) <= 6);
  if (!mates.length) continue;
  g++;
  group.set(k, g);
  for (const o of mates) group.set(o, g);
}
const useCount = new Map();
for (const u of usages) if (u.role !== 'fallback') useCount.set(u.key, (useCount.get(u.key) ?? 0) + 1);

// ── write ──
const rows = [];
const head = ['id','page','project','role','original_path','orig_w','orig_h','served_w','served_h','served_bytes','sharpness','clip_dark_pct','clip_light_pct','noise_est','phash','dup_group','used_in_count','native_source','native_w','native_h'];
const lines = [csvLine(head)];
for (const u of usages) {
  const m = byKey.get(u.key);
  if (m.missing) { console.warn('[inventory] no file for', u.key); continue; }
  const row = {
    id: u.key, page: u.page, project: u.project, role: u.role,
    original_path: relative(ROOT, m.file).replace(/\\/g, '/'),
    orig_w: m.w, orig_h: m.h, served_w: m.served_w ?? '', served_h: m.served_h ?? '', served_bytes: m.served_bytes ?? '',
    sharpness: m.sharpness, clip_dark_pct: m.clip_dark_pct, clip_light_pct: m.clip_light_pct, noise_est: m.noise_est,
    phash: m.phash, dup_group: group.get(u.key) ?? '', used_in_count: useCount.get(u.key) ?? 0,
    native_source: m.native ? m.native.f.replace(/\\/g, '/') : '', native_w: m.native?.w ?? '', native_h: m.native?.h ?? '',
    mean_luma: m.mean_luma, pos: u.pos ?? '',
  };
  rows.push(row);
  lines.push(csvLine(head.map((h) => row[h])));
}
writeFileSync(join(OUT, 'inventory.csv'), lines.join('\n') + '\n');
writeFileSync(join(OUT, 'inventory.json'), JSON.stringify(rows, null, 1));
console.log(`[inventory] ✓ ${rows.length} usage rows, ${byKey.size} distinct images, ${g} duplicate group(s) → docs/round-05-photos/inventory.csv`);
