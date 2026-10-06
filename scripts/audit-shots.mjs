// audit-shots.mjs (WD6/WD7/WE11) — full UI/UX sweep instrument. Drives the served build across both
// languages × 3 viewports (× Chromium, + WebKit when installed), captures full-page screenshots to
// lighthouse/audit/<viewport>/<route>.png and runs mechanical checks, then writes lighthouse/audit/
// REPORT.md (one row per finding). Lighthouse itself is run by scripts/lighthouse.mjs (best-effort).
//
// Prereq: a server on BASE (default http://localhost:4466 — `node scripts/serve-dist.mjs`).
// Usage: node scripts/audit-shots.mjs [--base http://localhost:4466]
import { chromium, webkit } from 'playwright';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'lighthouse', 'audit');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:4466');

const TOP = ['', 'empresa', 'servicios', 'equipos', 'proyectos', 'clientes', 'vacantes', 'noticias', 'contacto', 'privacidad', 'aviso-legal', 'no-existe'];
const EN = { '': 'en', empresa: 'en/company', servicios: 'en/services', equipos: 'en/equipment', proyectos: 'en/projects', clientes: 'en/clients', vacantes: 'en/careers', noticias: 'en/news', contacto: 'en/contact', privacidad: 'en/privacy', 'aviso-legal': 'en/legal-notice', 'no-existe': 'en/no-existe' };
const DETAILS = ['proyectos/lopesan-costa-bavaro-bloque-f', 'proyectos/plaza-roque'];
const ROUTES = [
  ...TOP.map((r) => '/' + r),
  ...TOP.map((r) => '/' + EN[r]),
  ...DETAILS.map((r) => '/' + r),
  ...DETAILS.map((r) => '/' + r.replace('proyectos', 'en/projects')),
].map((r) => (r === '/' ? '/' : r.replace(/\/$/, '')));

const VIEWPORTS = [{ name: 'm390', width: 390, height: 844 }, { name: 't768', width: 768, height: 1024 }, { name: 'd1440', width: 1440, height: 900 }];
const slug = (r) => (r === '/' ? 'home' : r.replace(/^\//, '').replace(/\//g, '_'));

const findings = [];
const add = (route, vp, browser, sev, what) => findings.push({ route, vp, browser, sev, what });

async function auditPage(page, route, vp, browserName) {
  const errors = [];
  const failed = [];
  const isNotFound = route.includes('no-existe');
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    // The not-found page legitimately returns 404 (correct for SEO) — its own 404 is expected.
    if (isNotFound && /404/.test(t)) return;
    errors.push(t.slice(0, 160));
  });
  // Ignore favicon and the cross-origin Google Maps iframe (headless WebKit reports its sub-requests as
  // failed even though the map renders; verified live on prod).
  page.on('requestfailed', (r) => { const u = r.url(); if (!/favicon|google\.com\/maps/.test(u)) failed.push(u.slice(0, 120)); });
  let resp;
  try { resp = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 25000 }); }
  catch (e) { add(route, vp.name, browserName, 'high', `navigation failed: ${e.message.slice(0, 60)}`); return; }
  if (resp && resp.status() >= 400 && !route.includes('no-existe')) add(route, vp.name, browserName, 'high', `HTTP ${resp.status()}`);
  await page.waitForTimeout(1600);

  const checks = await page.evaluate(() => {
    const out = { overflow: 0, lowOpacity: [], noAlt: 0, tiny: [], smallTap: [] };
    const de = document.documentElement;
    out.overflow = de.scrollWidth - de.clientWidth;
    const all = Array.from(document.body.querySelectorAll('*'));
    for (const el of all) {
      const cs = getComputedStyle(el);
      // reveal leftovers: an [data-reveal] still transparent after load
      if (el.hasAttribute('data-reveal') && parseFloat(cs.opacity) < 0.95) {
        out.lowOpacity.push((el.className || el.tagName).toString().slice(0, 40));
      }
    }
    for (const img of Array.from(document.querySelectorAll('img'))) {
      const a = img.getAttribute('alt');
      if (a === null || a.trim() === '') out.noAlt++;
    }
    // text < 12px (visible, has text)
    for (const el of all) {
      if (!el.children.length && el.textContent && el.textContent.trim().length > 1) {
        const fs = parseFloat(getComputedStyle(el).fontSize);
        const r = el.getBoundingClientRect();
        if (fs && fs < 12 && r.width > 0 && r.height > 0) out.tiny.push(`${fs}px: ${el.textContent.trim().slice(0, 20)}`);
      }
    }
    // tap targets < 44 on interactive. Skip controls that get their target from a wrapping <label>
    // (checkbox/radio) and inline <a> inside running text / a label (WCAG 2.5.8 inline exception).
    for (const el of Array.from(document.querySelectorAll('a,button,input,select,textarea,[role=button],[role=tab]'))) {
      const inLabel = el.closest('label');
      const inlineLink = el.tagName === 'A' && ['P', 'SPAN', 'LABEL', 'LI'].includes(el.parentElement?.tagName) && getComputedStyle(el).display.includes('inline') && !el.className;
      if (inLabel || inlineLink) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 24)) out.smallTap.push((el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 24));
    }
    return out;
  });

  await mkdirSync(join(OUT, vp.name), { recursive: true });
  await page.screenshot({ path: join(OUT, vp.name, slug(route) + (browserName === 'webkit' ? '.wk' : '') + '.png'), fullPage: true }).catch(() => {});

  if (checks.overflow > 1) add(route, vp.name, browserName, 'high', `horizontal scroll (+${checks.overflow}px)`);
  if (checks.lowOpacity.length) add(route, vp.name, browserName, 'high', `reveal leftover: ${[...new Set(checks.lowOpacity)].slice(0, 3).join(', ')}`);
  if (checks.noAlt) add(route, vp.name, browserName, 'medium', `${checks.noAlt} <img> without alt`);
  if (vp.width < 500 && checks.smallTap.length) add(route, vp.name, browserName, 'medium', `${checks.smallTap.length} tap target(s) < 44px: ${[...new Set(checks.smallTap)].slice(0, 3).join(' / ')}`);
  const tiny = [...new Set(checks.tiny)].filter((t) => !/px: \W/.test(t));
  if (tiny.length) add(route, vp.name, browserName, 'low', `text < 12px: ${tiny.slice(0, 2).join(' | ')}`);
  if (errors.length) add(route, vp.name, browserName, 'high', `console error: ${errors[0]}`);
  if (failed.length) add(route, vp.name, browserName, 'medium', `failed request: ${failed[0]}`);
}

async function runBrowser(launcher, name) {
  const browser = await launcher.launch();
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    for (const route of ROUTES) { page.removeAllListeners(); await auditPage(page, route, vp, name); }
    await ctx.close();
  }
  await browser.close();
}

mkdirSync(OUT, { recursive: true });
await runBrowser(chromium, 'chromium');
try { await runBrowser(webkit, 'webkit'); } catch (e) { console.log('[audit] WebKit skipped:', e.message.slice(0, 60)); }

// reduced-motion pass (chromium): no reveal leftovers must appear, nothing animates
{
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const route of ['/', '/proyectos', '/contacto']) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(800);
    const hidden = await page.evaluate(() => Array.from(document.querySelectorAll('[data-reveal]')).filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.95).length);
    if (hidden) add(route, 'reduced-motion', 'chromium', 'high', `${hidden} element(s) hidden under prefers-reduced-motion`);
  }
  await browser.close();
}

const bySev = { high: [], medium: [], low: [] };
for (const f of findings) bySev[f.sev].push(f);
const rows = findings.map((f) => `| ${f.sev} | ${f.route} | ${f.vp} | ${f.browser} | ${f.what} |`).join('\n');
const md = `# Audit REPORT — round 06-oct (WD6)\n\nRoutes: ${ROUTES.length} × ${VIEWPORTS.length} viewports × browsers. Screenshots in lighthouse/audit/<viewport>/.\n\n**Counts:** high ${bySev.high.length} · medium ${bySev.medium.length} · low ${bySev.low.length}\n\n| sev | route | vp | browser | finding |\n|---|---|---|---|---|\n${rows || '| — | — | — | — | no mechanical findings |'}\n`;
writeFileSync(join(OUT, 'REPORT.md'), md, 'utf8');
console.log(`[audit] ${findings.length} finding(s): high ${bySev.high.length}, medium ${bySev.medium.length}, low ${bySev.low.length} → lighthouse/audit/REPORT.md`);
