// gen-redirects.mjs — postbuild (A03b). Turns web.slug_redirects (captured by gen-content into
// src/content/_redirects.generated.json) into static redirect stub pages inside the prerendered output.
// A renamed PUBLISHED slug keeps its old URL alive: the stub sets rel=canonical → new URL, redirects
// instantly (JS replace + meta-refresh) and is noindex,follow so search engines consolidate to the new
// page. Pure static — it works on every publish because the deploy-hook rebuild regenerates the stubs
// from the live DB. (Vercel reads vercel.json from source *before* the build, so build-time redirects
// there can't go live on a deploy-hook rebuild; emitting into the output is the mechanism that can.)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src', 'content', '_redirects.generated.json');
const OUTDIR = join(ROOT, 'dist', 'constructorasd', 'browser');

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function stub(to) {
  const t = esc(to);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">`
    + `<meta name="viewport" content="width=device-width,initial-scale=1"><title>Redirigiendo…</title>`
    + `<link rel="canonical" href="${t}"><meta name="robots" content="noindex,follow">`
    + `<meta http-equiv="refresh" content="0;url=${t}">`
    + `<script>location.replace(${JSON.stringify(to)})</script>`
    + `<style>body{font-family:system-ui,sans-serif;padding:2rem;color:#333}a{color:#b45309}</style></head>`
    + `<body>Esta página se movió. Redirigiendo a <a href="${t}">${t}</a>…</body></html>`;
}

function main() {
  if (!existsSync(SRC)) { console.log('[gen-redirects] ⏭  no redirects file — skip.'); return; }
  if (!existsSync(OUTDIR)) { console.log('[gen-redirects] ⏭  no build output — skip.'); return; }
  let reds = [];
  try { reds = JSON.parse(readFileSync(SRC, 'utf8')); } catch { reds = []; }

  let written = 0, skipped = 0;
  for (const r of reds) {
    const from = String(r.from_path || '').replace(/\/+$/, '');
    const to = String(r.to_path || '');
    if (!from.startsWith('/') || !to.startsWith('/') || from === to) { skipped++; continue; }
    const rel = from.replace(/^\//, '');
    const dirFile = join(OUTDIR, rel, 'index.html');
    const flatFile = join(OUTDIR, rel + '.html');
    // never clobber a real prerendered page (e.g. a slug later reused by a live page)
    if (existsSync(dirFile) || existsSync(flatFile)) { skipped++; continue; }
    mkdirSync(join(OUTDIR, rel), { recursive: true });
    writeFileSync(dirFile, stub(to));
    written++;
  }
  console.log(`[gen-redirects] ✓ ${written} redirect stub(s), ${skipped} skipped (${reds.length} total).`);
}
main();
