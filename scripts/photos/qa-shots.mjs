// scripts/photos/qa-shots.mjs — PROMPT-14 Phase 4.2. `node scripts/photos/qa-shots.mjs`
// Serves dist/, screenshots Home, Servicios and all project pages at 1440 and 390 px into docs/round-05-qa/, and checks
// programmatically: (1) no gallery ends on an orphan row (visible tiles fill complete rows at the current column count),
// (2) no served image is upscaled beyond its natural size (rendered CSS px × DPR ≤ naturalWidth × 1.05).
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'docs', 'round-05-qa');
mkdirSync(OUT, { recursive: true });
const PORT = 4471;
const server = spawn(process.execPath, [join(ROOT, 'scripts', 'serve-dist.mjs')], { stdio: 'ignore', env: { ...process.env, PORT: String(PORT) } });
await new Promise((r) => setTimeout(r, 1500));
const base = `http://localhost:${PORT}`;

const slugs = JSON.parse(readFileSync(join(ROOT, 'src', 'content', '_overrides.json'), 'utf8')).projects.map((p) => p.slug);
const pages = [['home', '/'], ['servicios', '/servicios/'], ...slugs.map((s) => [s, `/proyectos/${s}/`])];
const report = [];
const browser = await chromium.launch();
for (const [vw, vh, tag] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const [name, path] of pages) {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    // trigger lazy images
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(OUT, `${name}-${tag}.jpg`), fullPage: true, type: "jpeg", quality: 60 });
    const res = await page.evaluate(() => {
      const out = { orphan: null, upscaled: [] };
      const grid = document.querySelector('.gallery__grid');
      if (grid) {
        const items = [...grid.children].filter((li) => getComputedStyle(li).display !== 'none');
        const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
        // last visual row: tiles crossing the lowest band must cover the grid's full width (no empty cells)
        const g = grid.getBoundingClientRect();
        const rects = items.map((li) => li.getBoundingClientRect());
        const yBand = Math.max(...rects.map((r) => r.bottom)) - 4;
        const row = rects.filter((r) => r.top < yBand && r.bottom > yBand);
        const covered = row.reduce((s, r) => s + r.width, 0);
        const gaps = (row.length - 1) * parseFloat(getComputedStyle(grid).columnGap || '0');
        out.orphan = { cols, tiles: items.length, cells: row.length, ok: Math.abs(covered + gaps - g.width) < 3 };
      }
      for (const img of document.querySelectorAll('img')) {
        if (!img.complete || !img.naturalWidth) continue;
        const r = img.getBoundingClientRect();
        if (r.width < 2) continue;
        // naturalWidth is density-scaled for w-descriptor srcsets, so read the real width from the file name (-960.avif)
        const cur = img.currentSrc || img.src;
        const m = cur.match(/-(d+).(avif|webp)$/) ?? (cur.endsWith('-large.avif') || cur.endsWith('-large.webp') ? [0, '2400'] : null);
        const fileW = m ? Number(m[1]) : img.naturalWidth;
        const need = r.width * window.devicePixelRatio;
        if (need > fileW * 1.05) out.upscaled.push({ src: cur.split('/').slice(-2).join('/'), css: Math.round(r.width), file: fileW });
      }
      return out;
    });
    report.push({ page: name, viewport: tag, ...res });
  }
  await ctx.close();
}
await browser.close();
server.kill();
const bad = report.filter((r) => (r.orphan && !r.orphan.ok) || r.upscaled.length);
writeFileSync(join(OUT, 'qa-report.json'), JSON.stringify(report, null, 1));
for (const r of report.filter((x) => x.orphan)) console.log(`gallery ${r.page} ${r.viewport}: cols ${r.orphan.cols}, ${r.orphan.tiles} tiles, ${r.orphan.cells} cells → ${r.orphan.ok ? 'ok' : 'ORPHAN'}`);
for (const r of report.filter((x) => x.upscaled.length)) console.log(`upscaled ${r.page} ${r.viewport}:`, JSON.stringify(r.upscaled));
console.log(`[qa-shots] ${report.length} page×viewport checks, ${bad.length} problem(s) → docs/round-05-qa/`);
process.exit(bad.length ? 1 : 0);
