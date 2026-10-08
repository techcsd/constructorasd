// psi.mjs — run Lighthouse via Google PageSpeed Insights (server-side, no local Chrome needed) against the
// LIVE site and print a scores table. Closes the P14 perf check when Chrome can't run locally.
// Usage: node scripts/qa/psi.mjs [--base https://constructorasd.com] [--strategy mobile|desktop]
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 ? process.argv[i + 1] : d; };
const BASE = (arg('--base', 'https://constructorasd.com')).replace(/\/$/, '');
const STRATEGY = arg('--strategy', 'mobile');
const KEY = process.env.PSI_API_KEY || process.env.GOOGLE_API_KEY || '';

const ROUTES = [
  ['Home', '/'],
  ['Proyectos', '/proyectos'],
  ['Proyecto detalle', '/proyectos/lopesan-costa-bavaro-bloque-f'],
  ['Servicios', '/servicios'],
  ['Empresa', '/empresa'],
  ['Contacto', '/contacto'],
];
const CATS = ['PERFORMANCE', 'ACCESSIBILITY', 'BEST_PRACTICES', 'SEO'];

const pct = (s) => (s == null ? ' – ' : String(Math.round(s * 100)).padStart(3));
const pad = (s, n) => String(s).padEnd(n);

async function run(route) {
  const u = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  u.searchParams.set('url', BASE + route);
  u.searchParams.set('strategy', STRATEGY);
  for (const c of CATS) u.searchParams.append('category', c);
  if (KEY) u.searchParams.set('key', KEY);
  const r = await fetch(u, { signal: AbortSignal.timeout(90000) });
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 120)}`);
  const j = await r.json();
  const c = j.lighthouseResult?.categories ?? {};
  const audits = j.lighthouseResult?.audits ?? {};
  return {
    perf: c.performance?.score, a11y: c.accessibility?.score, bp: c['best-practices']?.score, seo: c.seo?.score,
    lcp: audits['largest-contentful-paint']?.displayValue ?? '–',
    cls: audits['cumulative-layout-shift']?.displayValue ?? '–',
    tbt: audits['total-blocking-time']?.displayValue ?? '–',
  };
}

console.log(`\nPageSpeed Insights (${STRATEGY}) — ${BASE}\n`);
console.log(`${pad('Ruta', 20)} Perf A11y  BP  SEO   LCP        CLS     TBT`);
console.log('─'.repeat(72));
let ok = true;
for (const [name, route] of ROUTES) {
  try {
    const s = await run(route);
    console.log(`${pad(name, 20)} ${pct(s.perf)} ${pct(s.a11y)} ${pct(s.bp)} ${pct(s.seo)}   ${pad(s.lcp, 10)} ${pad(s.cls, 7)} ${s.tbt}`);
    if ((s.perf ?? 1) < 0.9 || (s.a11y ?? 1) < 1 || (s.bp ?? 1) < 1 || (s.seo ?? 1) < 1) ok = false;
  } catch (e) {
    console.log(`${pad(name, 20)} ✗ ${e.message}`);
    ok = false;
  }
  await new Promise((r) => setTimeout(r, 1500)); // be gentle on the unkeyed quota
}
console.log('─'.repeat(72));
console.log(ok ? '✓ budgets met (perf ≥90, a11y/bp/seo =100)\n' : 'ⓘ see rows below budget above\n');
