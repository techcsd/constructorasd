// seed-ui-strings.mjs — populate web.ui_strings from the committed i18n catalog (keys = ES source text,
// en = English). Idempotent: inserts only new keys (ignore-duplicates), so admin edits are never clobbered.
// Usage: node scripts/cms/seed-ui-strings.mjs --env dev|prod [--yes]
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (n) => { const i = process.argv.indexOf(n); return i !== -1 ? process.argv[i + 1] : undefined; };
const env = arg('--env');
if (!['dev', 'prod'].includes(env ?? '')) { console.error('✖ --env dev|prod required'); process.exit(1); }
if (env === 'prod' && !process.argv.includes('--yes')) { console.error('✖ prod needs --yes'); process.exit(1); }
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) { console.error('✖ SUPABASE_ACCESS_TOKEN not set'); process.exit(1); }

const envFile = (() => {
  const o = {}; const p = join(ROOT, '.env.local');
  if (existsSync(p)) for (const l of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const s = l.trim(); if (!s || s.startsWith('#')) continue; const i = s.indexOf('='); if (i > 0) o[s.slice(0, i)] = s.slice(i + 1);
  }
  return o;
})();
const SUF = env.toUpperCase();
const url = envFile[`SUPABASE_URL_${SUF}`];
const ref = envFile[`SUPABASE_PROJECT_REF_${SUF}`];
if (!url || !ref) { console.error('✖ SUPABASE_URL/PROJECT_REF missing in .env.local'); process.exit(1); }

const k = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, { headers: { Authorization: 'Bearer ' + TOKEN } });
if (!k.ok) { console.error('✖ could not fetch service role key:', k.status); process.exit(1); }
const SR = (await k.json()).find((x) => x.name === 'service_role')?.api_key;
if (!SR) { console.error('✖ no service_role key'); process.exit(1); }

const en = JSON.parse(readFileSync(join(ROOT, 'src/content/i18n/en.json'), 'utf8'));
const es = JSON.parse(readFileSync(join(ROOT, 'src/content/i18n/es.json'), 'utf8'));
const keys = new Set([...Object.keys(en), ...Object.keys(es)]);
const rows = [...keys].map((key) => ({ key, es: es[key] ?? null, en: en[key] ?? null }));

const r = await fetch(`${url.replace(/\/$/, '')}/rest/v1/ui_strings`, {
  method: 'POST',
  headers: {
    apikey: SR, Authorization: 'Bearer ' + SR, 'Content-Type': 'application/json',
    'Content-Profile': 'web', Prefer: 'resolution=ignore-duplicates,return=minimal',
  },
  body: JSON.stringify(rows),
});
if (!r.ok) { console.error('✖ seed failed:', r.status, (await r.text()).slice(0, 200)); process.exit(1); }
console.log(`✔ seeded ${rows.length} ui_strings into ${env} (new keys only; existing untouched).`);
