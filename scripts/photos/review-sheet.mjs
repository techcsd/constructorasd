// scripts/photos/review-sheet.mjs — PROMPT-13 Phase 3 (WS2). `node scripts/photos/review-sheet.mjs`
// Builds the single self-contained review.html for Xaviel (Spanish, double-click, no network): for every changed
// photo — tier B enhanced (enhance-log.csv) and tier C retouched (retouch-log.csv, when it exists) — original | proposed
// with a drag slider, region toggle, badges and Aprobar / Rechazar / Reintentar (+ note). "Exportar decisiones" downloads
// approvals.json. Tier-D photos are listed at the end with the reason. Images: 1600 px JPEGs in review/img/.
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DOCS = join(ROOT, 'docs', 'round-05-photos');
const MONTH = 'C:/developer/constructorasd improvements';
const roundDir = (() => {
  for (const m of readdirSync(MONTH)) { const d = join(MONTH, m, 'csd imp 23112026'); if (existsSync(d)) return d; }
  throw new Error('round folder not found');
})();
const OUT = join(roundDir, 'review');
mkdirSync(join(OUT, 'img'), { recursive: true });

const audit = JSON.parse(readFileSync(join(DOCS, 'audit.json'), 'utf8'));
const byId = new Map(audit.photos.map((p) => [p.id, p]));
const parse = (f) => (existsSync(f) ? readFileSync(f, 'utf8').trim().split('\n').filter((l) => !l.startsWith('#')).slice(1).map((l) => l.split(',')) : []);

const items = [];
const tag = (s) => s.replace(/[^a-z0-9]+/gi, '-').slice(0, 40);
async function jpg(src, dest) {
  await sharp(src).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(join(OUT, 'img', dest));
}

for (const c of parse(join(DOCS, 'enhance-log.csv'))) {
  if (c[12] !== 'B_OK') continue;
  const p = byId.get(c[0]);
  if (!p) continue;
  const k = tag(c[0].replace('cms/', '').slice(0, 8) + '-' + basename(c[0]));
  await jpg(join(ROOT, p.original_path), `${k}-orig.jpg`);
  await jpg(join(ROOT, c[13]), `${k}-new.jpg`);
  items.push({ id: c[0], tier: 'B', project: p.page.replace('proyectos/', '').replace('servicios/', 'Servicios · '), label: p.short ?? c[0].slice(0, 12), orig: `img/${k}-orig.jpg`, proposed: `img/${k}-new.jpg`, region: null, attempts: 1, cost: 0, note: `${c[7] ? 'mezcla ESRGAN ' + c[7] + ' · ' : ''}nitidez ${c[8]}→${c[9]} (${c[10]}%) · SSIM ${c[11]}`, why: c[2] });
}
// tier C retouched: latest attempt that passed the automatic checks
const tried = {};
for (const c of parse(join(DOCS, 'retouch-log.csv'))) {
  const t = (tried[c[0]] ??= { n: 0, cost: 0, best: null });
  if (c[4]) t.n = Math.max(t.n, Number(c[4]));
  t.cost += Number(c[8] || 0);
  if (c[5] === 'CHECKS_OK_PENDING_REVIEW') t.best = c;
}
for (const [id, t] of Object.entries(tried)) {
  if (!t.best) continue;
  const p = byId.get(id);
  const k = tag(id.replace('cms/', '').slice(0, 8) + '-ret');
  await jpg(join(ROOT, p.original_path), `${k}-orig.jpg`);
  await jpg(join(ROOT, t.best[13]), `${k}-new.jpg`);
  const reg = join(ROOT, 'assets-src', 'retouched', p.page.replace('proyectos/', ''), `${basename(id)}.region.jpg`);
  if (existsSync(reg)) await jpg(reg, `${k}-region.jpg`);
  items.push({ id, tier: 'C', project: p.page.replace('proyectos/', ''), label: p.short ?? id.slice(0, 12), orig: `img/${k}-orig.jpg`, proposed: `img/${k}-new.jpg`, region: existsSync(reg) ? `img/${k}-region.jpg` : null, attempts: t.n, cost: t.cost, note: `retoque IA (solo la zona marcada)`, why: 'CLUTTER_GROUND' });
}
const rank = (i) => (/villa-cacique/.test(i.project) ? 0 : /lopesan.*bloque-f/.test(i.project) ? 1 : 2);
items.sort((a, b) => rank(a) - rank(b) || a.project.localeCompare(b.project));
const spent = Object.values(tried).reduce((s, t) => s + t.cost, 0);
const discarded = audit.photos.filter((p) => p.tier === 'D').map((p) => ({ id: p.id.slice(0, 14), project: p.page, why: p.why ?? p.plan ?? '' }));
const pendingC = audit.photos.filter((p) => p.tier === 'C' && !items.some((i) => i.id === p.id)).map((p) => ({ id: p.id.slice(0, 14), project: p.page, why: 'Retoque IA pendiente (falta activar facturación de Gemini).' }));

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const groups = [...new Set(items.map((i) => i.project))];
const card = (i, n) => `
<article class="card" data-id="${esc(i.id)}">
  <header><span class="badge b${i.tier}">Nivel ${i.tier} · ${i.tier === 'B' ? 'mejorada' : 'retocada'}</span><strong>${esc(i.label)}</strong>
    <span class="meta">intentos ${i.attempts} · costo US$ ${i.cost.toFixed(2)}</span></header>
  <div class="cmp" data-n="${n}">
    <img class="a" src="${i.proposed}" alt="Propuesta" /><img class="b" src="${i.orig}" alt="Original" style="clip-path: inset(0 50% 0 0)" />
    ${i.region ? `<img class="reg" src="${i.region}" alt="Zona editada" hidden />` : ''}
    <input type="range" min="0" max="100" value="50" aria-label="Deslizar entre original y propuesta" />
    <span class="lbl l">Original</span><span class="lbl r">Propuesta</span>
  </div>
  ${i.region ? '<label class="tg"><input type="checkbox" class="rg" /> Mostrar zona editada</label>' : ''}
  <p class="note">${esc(i.note)}</p>
  <div class="actions">
    <button data-d="approved" class="ok">Aprobar</button><button data-d="rejected" class="no">Rechazar</button><button data-d="retry" class="re">Reintentar</button>
    <input class="txt" placeholder="Nota (opcional, p. ej. qué corregir)" />
  </div>
</article>`;
let n = 0;
const body = groups.map((g) => `<section><h2>${esc(g)}</h2>${items.filter((i) => i.project === g).map((i) => card(i, n++)).join('')}</section>`).join('');
const dlist = [...discarded, ...pendingC].map((d) => `<li><code>${esc(d.id)}</code> ${esc(d.project)} — ${esc(d.why)}</li>`).join('');

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Revisión de fotos — Constructora SD</title>
<style>
:root{--bg:#f4f1ea;--ink:#16181a;--mut:#666;--card:#fff;--ok:#1d7a46;--no:#b3261e;--re:#8a5a00;--line:#d9d4c8}
@media (prefers-color-scheme:dark){:root{--bg:#141516;--ink:#eee;--mut:#aaa;--card:#1e2021;--line:#383b3d}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,sans-serif;padding:16px;max-width:1100px;margin-inline:auto}
h1{margin:.2em 0}h2{margin:2em 0 .5em;border-bottom:1px solid var(--line);padding-bottom:.3em;text-transform:capitalize}
.totals{display:flex;flex-wrap:wrap;gap:12px;margin:12px 0}.totals div{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 16px}
.totals b{display:block;font-size:1.5em}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px;margin:16px 0}
.card header{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.meta{color:var(--mut);font-size:.9em;margin-left:auto}
.badge{padding:2px 10px;border-radius:99px;font-size:.8em;color:#fff}.bB{background:#2f5d8a}.bC{background:#8a2f6a}
.cmp{position:relative;margin:10px 0;line-height:0;user-select:none}.cmp img{width:100%;height:auto;display:block}
.cmp .b,.cmp .reg{position:absolute;inset:0}.cmp input[type=range]{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:ew-resize;margin:0}
.cmp::after{content:"";position:absolute;top:0;bottom:0;left:var(--x,50%);width:3px;background:#fff;box-shadow:0 0 0 1px #0006;pointer-events:none}
.lbl{position:absolute;top:8px;padding:2px 8px;background:#000a;color:#fff;font:600 12px system-ui;border-radius:6px;line-height:1.4}.lbl.l{left:8px}.lbl.r{right:8px}
.note{color:var(--mut);font-size:.9em;margin:.2em 0}.actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.actions button{padding:8px 16px;border-radius:8px;border:2px solid var(--line);background:var(--card);color:var(--ink);font:inherit;cursor:pointer}
.actions .ok.on{background:var(--ok);color:#fff;border-color:var(--ok)}.actions .no.on{background:var(--no);color:#fff;border-color:var(--no)}.actions .re.on{background:var(--re);color:#fff;border-color:var(--re)}
.txt{flex:1;min-width:200px;padding:8px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:inherit}
.export{position:sticky;bottom:12px;display:flex;justify-content:flex-end;margin-top:20px}.export button{padding:12px 22px;border-radius:10px;border:none;background:var(--ink);color:var(--bg);font:600 1em system-ui;cursor:pointer}
</style></head><body>
<h1>Revisión de fotos</h1>
<p>Mueve la barra de cada foto para comparar. Marca <b>Aprobar</b>, <b>Rechazar</b> o <b>Reintentar</b> y, al final, pulsa <b>Exportar decisiones</b>: se descarga <code>approvals.json</code>. Guárdalo en esta misma carpeta (<code>review</code>).</p>
<div class="totals"><div><b id="tot">${items.length}</b>fotos para revisar</div><div><b id="done">0</b>con decisión</div><div><b>US$ ${spent.toFixed(2)} / 15.00</b>gasto real en Gemini (tope)</div><div><b>${items.filter((i) => i.tier === 'B').length} mejoradas · ${items.filter((i) => i.tier === 'C').length} retocadas</b>por nivel</div></div>
${body || '<p>No hay fotos cambiadas todavía.</p>'}
<section><h2>No se publican / pendientes</h2><ul>${dlist}</ul><p class="note">Las de nivel D no se pueden arreglar con retoque: ver <code>NEED-NEW-PHOTOS.md</code> para saber qué fotografiar.</p></section>
<div class="export"><button id="exp">Exportar decisiones</button></div>
<script>
const dec={};
document.querySelectorAll('.card').forEach(c=>{
  const id=c.dataset.id, range=c.querySelector('input[type=range]'), b=c.querySelector('.b'), cmp=c.querySelector('.cmp');
  const upd=()=>{b.style.clipPath='inset(0 '+(100-range.value)+'% 0 0)';cmp.style.setProperty('--x',range.value+'%')};
  range.addEventListener('input',upd);upd();
  const rg=c.querySelector('.rg'); if(rg)rg.addEventListener('change',()=>{c.querySelector('.reg').hidden=!rg.checked});
  c.querySelectorAll('[data-d]').forEach(btn=>btn.addEventListener('click',()=>{
    dec[id]=dec[id]||{id,decision:'',note:''};dec[id].decision=btn.dataset.d;
    c.querySelectorAll('[data-d]').forEach(x=>x.classList.toggle('on',x===btn));
    document.getElementById('done').textContent=Object.values(dec).filter(d=>d.decision).length;
  }));
  c.querySelector('.txt').addEventListener('input',e=>{dec[id]=dec[id]||{id,decision:'',note:''};dec[id].note=e.target.value});
});
window.__decisions=()=>Object.values(dec).filter(d=>d.decision);
document.getElementById('exp').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(window.__decisions(),null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='approvals.json';a.click();
});
</script></body></html>`;
writeFileSync(join(OUT, 'review.html'), html);
console.log(`[review] ${items.length} photo(s) (${items.filter((i) => i.tier === 'B').length} B, ${items.filter((i) => i.tier === 'C').length} C), ${discarded.length} D, ${pendingC.length} C pending → ${join(OUT, 'review.html')}`);
