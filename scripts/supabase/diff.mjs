// diff.mjs (I01) — compare what's applied to dev vs prod: web.migrations rows + deployed edge functions.
// Read-only. Flags anything present in one env but not the other. Usage: node scripts/supabase/diff.mjs
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) { console.error('✖ SUPABASE_ACCESS_TOKEN not set.'); process.exit(1); }

const env = (() => {
  const o = {}; const p = join(ROOT, '.env.local');
  if (existsSync(p)) for (const l of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const s = l.trim(); if (!s || s.startsWith('#')) continue; const i = s.indexOf('='); if (i > 0) o[s.slice(0, i)] = s.slice(i + 1);
  }
  return o;
})();
const REF = { dev: env.SUPABASE_PROJECT_REF_DEV, prod: env.SUPABASE_PROJECT_REF_PROD };
if (!REF.dev || !REF.prod) { console.error('✖ SUPABASE_PROJECT_REF_{DEV,PROD} required in .env.local'); process.exit(1); }

const H = { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' };
async function query(ref, sql) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: 'POST', headers: H, body: JSON.stringify({ query: sql }) });
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 120)}`);
  return r.json();
}
async function functions(ref) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/functions`, { headers: H });
  if (!r.ok) throw new Error(`${r.status}`);
  return (await r.json()).map((f) => f.slug ?? f.name).filter((n) => n && n.startsWith('web-')).sort();
}

const diffSets = (a, b) => ({ onlyA: a.filter((x) => !b.includes(x)), onlyB: b.filter((x) => !a.includes(x)) });

let drift = 0;
console.log(`\nI01 — dev (${REF.dev}) ↔ prod (${REF.prod})\n`);

// 1) migrations (web.migrations)
try {
  const [dev, prod] = await Promise.all([
    query(REF.dev, 'select id from web.migrations order by id;'),
    query(REF.prod, 'select id from web.migrations order by id;'),
  ]);
  const d = dev.map((r) => r.id), p = prod.map((r) => r.id);
  const { onlyA, onlyB } = diffSets(d, p);
  console.log(`migrations: dev=${d.length} prod=${p.length}`);
  if (onlyA.length) { drift++; console.log('  ✗ only in dev:', onlyA.join(', ')); }
  if (onlyB.length) { drift++; console.log('  ✗ only in prod:', onlyB.join(', ')); }
  if (!onlyA.length && !onlyB.length) console.log('  ✓ identical set');
} catch (e) { drift++; console.log('  ✗ migrations check failed:', e.message); }

// 2) edge functions (web-*)
try {
  const [dev, prod] = await Promise.all([functions(REF.dev), functions(REF.prod)]);
  const { onlyA, onlyB } = diffSets(dev, prod);
  console.log(`\nweb-* functions: dev=${dev.length} prod=${prod.length}`);
  if (onlyA.length) { drift++; console.log('  ✗ only in dev:', onlyA.join(', ')); }
  if (onlyB.length) { drift++; console.log('  ✗ only in prod:', onlyB.join(', ')); }
  if (!onlyA.length && !onlyB.length) console.log('  ✓ identical set:', dev.join(', '));
} catch (e) { drift++; console.log('  ✗ functions check failed:', e.message); }

console.log(`\n${drift === 0 ? '✓ dev and prod are in sync' : `✗ ${drift} difference(s) — reconcile before release`}\n`);
process.exit(drift === 0 ? 0 : 1);
