// find-overflow.mjs — DIAGNOSTIC (WE4). Drives the served build with Playwright across 390 / 768 / 1440
// and lists every element whose right edge exceeds the document width (the cause of a horizontal
// scrollbar). Run against a running server:  node scripts/serve-dist.mjs &  then  node scripts/find-overflow.mjs
//
// Usage: node scripts/find-overflow.mjs [--base http://localhost:4466]
import { chromium } from 'playwright';

const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i !== -1 ? process.argv[i + 1] : d;
};
const BASE = arg('--base', 'http://localhost:4466');

const ROUTES = [
  '/', '/empresa', '/servicios', '/equipos', '/proyectos',
  '/proyectos/lopesan-costa-bavaro-bloque-f', '/proyectos/plaza-roque',
  '/clientes', '/vacantes', '/noticias', '/contacto',
  '/en', '/en/projects', '/en/contact',
];
const WIDTHS = [390, 768, 1440];

const browser = await chromium.launch();
let total = 0;
for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  for (const route of ROUTES) {
    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 20000 });
    } catch {
      console.log(`  ! ${route} @${width} — navigation failed`);
      continue;
    }
    const offenders = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      // Intentionally off-canvas / dev-only chrome never causes a real scrollbar (overflow-x:clip).
      const IGNORE = ['dev-ribbon', 'visually-hidden', 'skip-link', 'app-contact-form__hp', 'apply-form__hp'];
      const out = [];
      for (const el of Array.from(document.body.querySelectorAll('*'))) {
        const cls = el.getAttribute('class') || '';
        if (IGNORE.some((c) => cls.includes(c)) || el.closest('[aria-hidden="true"]')) continue;
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.right > docW + 1) {
          out.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.getAttribute('class') || '').slice(0, 60),
            right: Math.round(r.right),
            docW,
          });
        }
      }
      // Keep the widest few, de-duplicated by class.
      const seen = new Set();
      return out
        .sort((a, b) => b.right - a.right)
        .filter((o) => (seen.has(o.cls) ? false : seen.add(o.cls)))
        .slice(0, 6);
    });
    const scrolls = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    // A real horizontal scrollbar (scrolls) is the failure; stray off-canvas elements are info only.
    if (scrolls) {
      total += 1;
      console.log(`\n✗ ${route} @${width}px  — HORIZONTAL SCROLL`);
      for (const o of offenders) console.log(`    <${o.tag} class="${o.cls}">  right=${o.right} > ${o.docW}`);
    } else if (offenders.length) {
      console.log(`~ ${route} @${width}px  (off-canvas, no scrollbar): ${offenders.map((o) => o.cls || o.tag).join(', ')}`);
    } else {
      console.log(`✓ ${route} @${width}px`);
    }
  }
  await page.close();
}
await browser.close();
console.log(total ? `\n[find-overflow] ${total} overflowing element(s).` : '\n[find-overflow] ✓ no overflow.');
process.exit(total ? 1 : 0);
