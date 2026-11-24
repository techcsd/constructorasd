// contact-sheets.mjs — builds labelled contact sheets (6 per sheet) from inventory.json for visual triage.
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = join(ROOT, 'scratchpad', 'sheets'); mkdirSync(outDir, { recursive: true });
const rows = JSON.parse(readFileSync(join(ROOT, 'docs/round-05-photos/inventory.json'), 'utf8'));
const seen = new Set(); const imgs = [];
for (const r of rows) { if (r.role === 'fallback' || r.role === 'og' || seen.has(r.id)) continue; seen.add(r.id); imgs.push(r); }
const W = 760, H = 570, COLS = 3, PER = 6;
for (let s = 0; s * PER < imgs.length; s++) {
  const chunk = imgs.slice(s * PER, s * PER + PER);
  const comps = [];
  for (let i = 0; i < chunk.length; i++) {
    const r = chunk[i];
    const buf = await sharp(join(ROOT, r.original_path)).rotate().resize(W - 8, H - 34, { fit: 'contain', background: '#222' }).jpeg({ quality: 85 }).toBuffer();
    const label = `${s * PER + i + 1}. ${r.id.replace(/(cms\/[0-9a-f]{6})[0-9a-f]+/, '$1')} | ${r.project || r.page} | ${r.role}`;
    const svg = Buffer.from(`<svg width="${W}" height="30"><rect width="${W}" height="30" fill="#000"/><text x="6" y="21" font-size="16" fill="#fff" font-family="Arial">${label.replace(/&/g,'&amp;')}</text></svg>`);
    const x = (i % COLS) * W, y = Math.floor(i / COLS) * H;
    comps.push({ input: buf, left: x + 4, top: y + 30 }, { input: svg, left: x, top: y });
  }
  await sharp({ create: { width: W * COLS, height: H * 2, channels: 3, background: '#111' } }).composite(comps).jpeg({ quality: 82 }).toFile(join(outDir, `sheet-${s + 1}.jpg`));
}
console.log(imgs.length, 'images ->', Math.ceil(imgs.length / PER), 'sheets');
