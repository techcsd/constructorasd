// verify-security.mjs (A16) — prove the web.* private tables are locked. DEV-ONLY (creates + deletes a
// throwaway auth user). Checks: (1) anon has no access to private tables; (2) the public views work;
// (3) a real AUTHENTICATED but NON-ADMIN user is still rejected (RLS via web.is_admin()).
// Usage: node scripts/qa/verify-security.mjs --env dev
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (n) => { const i = process.argv.indexOf(n); return i !== -1 ? process.argv[i + 1] : undefined; };
if (arg('--env') !== 'dev') { console.error('✖ dev only (creates a throwaway user).'); process.exit(1); }

const env = (() => {
  const o = {}; const p = join(ROOT, '.env.local');
  if (existsSync(p)) for (const l of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const s = l.trim(); if (!s || s.startsWith('#')) continue; const i = s.indexOf('='); if (i > 0) o[s.slice(0, i)] = s.slice(i + 1);
  }
  return o;
})();
const URL = env.SUPABASE_URL_DEV, ANON = env.SUPABASE_ANON_KEY_DEV, REF = env.SUPABASE_PROJECT_REF_DEV;
if (!URL || !ANON || !REF) { console.error('✖ SUPABASE_{URL,ANON_KEY,PROJECT_REF}_DEV required in .env.local'); process.exit(1); }

// Service role key isn't stored locally — fetch it via the Management API (same as migrate-site-content).
let SR = env.SUPABASE_SERVICE_ROLE_KEY_DEV || '';
if (!SR) {
  const MGMT = process.env.SUPABASE_ACCESS_TOKEN;
  if (!MGMT) { console.error('✖ SUPABASE_ACCESS_TOKEN required (to fetch the service role key).'); process.exit(1); }
  const k = await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys`, { headers: { Authorization: 'Bearer ' + MGMT } });
  if (!k.ok) { console.error('✖ could not fetch service role key:', k.status); process.exit(1); }
  SR = ((await k.json()).find((x) => x.name === 'service_role') || {}).api_key || '';
  if (!SR) { console.error('✖ service_role key not returned by Management API.'); process.exit(1); }
}

const rest = (path, { token = ANON, method = 'GET', body } = {}) => fetch(`${URL}/rest/v1/${path}`, {
  method, headers: { apikey: ANON, Authorization: `Bearer ${token}`, 'Accept-Profile': 'web', 'Content-Profile': 'web', 'Content-Type': 'application/json', Prefer: 'return=representation' },
  ...(body ? { body: JSON.stringify(body) } : {}),
});

let pass = 0, fail = 0;
const ok = (cond, label, detail = '') => { console.log(`  ${cond ? '✓' : '✗'} ${label}${detail ? ' — ' + detail : ''}`); cond ? pass++ : fail++; };

console.log('\nA16 — security verification (dev)\n');

// 1) anon — no access to private tables, public views work
console.log('anon:');
for (const t of ['leads', 'dev_notes', 'inbox_notes']) {
  const r = await rest(`${t}?select=id&limit=1`);
  ok(r.status === 401 || r.status === 403, `anon SELECT web.${t} denied`, `HTTP ${r.status}`);
}
{
  const r = await rest('media', { method: 'POST', body: { bucket: 'web-media', path: 'x', mime: 'image/png', bytes: 1 } });
  ok(r.status === 401 || r.status === 403, 'anon INSERT web.media denied', `HTTP ${r.status}`);
}
{
  const r = await rest('v_public_projects?select=slug&limit=1');
  ok(r.ok, 'anon SELECT v_public_projects works', `HTTP ${r.status}`);
}

// 2) authenticated NON-ADMIN user — create, sign in, probe, delete
console.log('\nauthenticated non-admin:');
const email = `qa-nonadmin-${Date.now().toString(36)}@example.com`, password = 'NonAdmin!' + Date.now();
let userId = null, token = null;
try {
  const c = await fetch(`${URL}/auth/v1/admin/users`, { method: 'POST', headers: { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, email_confirm: true }) });
  userId = (await c.json()).id;
  ok(!!userId, 'created throwaway non-admin user');
  const s = await fetch(`${URL}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const sj = await s.json();
  token = sj.access_token;

  if (token) {
    // The project let a non-team user sign in — then RLS (web.is_admin) must still reject it.
    ok(true, 'signed in (got a JWT)');
    const ins = await rest('dev_notes', { token, method: 'POST', body: { title: 'x', body: 'x' } });
    ok(ins.status === 401 || ins.status === 403, 'non-admin INSERT web.dev_notes denied', `HTTP ${ins.status}`);
    const sel = await rest('leads?select=id&limit=1', { token });
    const rows = sel.ok ? await sel.json() : null;
    ok(sel.status === 401 || sel.status === 403 || (sel.ok && Array.isArray(rows) && rows.length === 0), 'non-admin sees no leads (RLS)', `HTTP ${sel.status}${rows ? ` rows=${rows.length}` : ''}`);
    const up = await fetch(`${URL}/storage/v1/object/web-media/qa-nonadmin-${Date.now()}.png`, { method: 'POST', headers: { apikey: ANON, Authorization: `Bearer ${token}`, 'Content-Type': 'image/png' }, body: 'x' });
    ok(up.status === 401 || up.status === 403, 'non-admin cannot upload to web-media', `HTTP ${up.status}`);
  } else {
    // Stronger: this (SGC-shared) project's auth hook blocks sign-in for non-team users entirely — a random
    // authenticated non-admin can't even get a session, so there's nothing to probe.
    ok(s.status === 403, 'non-team user cannot even sign in (auth hook blocks it)', `HTTP ${s.status}: ${sj.msg ?? ''}`);
  }
} finally {
  if (userId) {
    const d = await fetch(`${URL}/auth/v1/admin/users/${userId}`, { method: 'DELETE', headers: { apikey: SR, Authorization: `Bearer ${SR}` } });
    console.log(`  · cleaned up throwaway user (HTTP ${d.status})`);
  }
}

console.log(`\n${fail === 0 ? '✓' : '✗'} A16: ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
