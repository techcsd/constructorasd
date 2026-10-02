// setup-admin.mjs — configure Supabase Auth for the private /admin panel:
//   • ENABLE the email provider (additive; needed for password login),
//   • ensure the single admin user exists.
// NOTE: these are shared BU1 projects — we do NOT change public-signup settings (that's SGC's call).
// dev_notes is locked to the admin email via RLS, so the signup state is irrelevant to CSD's data.
// BU1-gated: --env dev|prod (prod needs --yes). Uses the service_role key fetched via the Management API
// SERVER-SIDE ONLY — never logged, never committed, never sent to the browser (rule 5).
//   dev:  sets a password and writes it to the file given by --out (gitignored scratch) for the e2e test.
//   prod: creates the user WITHOUT a password and prints a one-time set-password link to share with Xaviel.
import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (n) => {
  const i = process.argv.indexOf(n);
  return i !== -1 ? process.argv[i + 1] : undefined;
};
const has = (n) => process.argv.includes(n);

const env = arg('--env');
if (!['dev', 'prod'].includes(env ?? '')) {
  console.error('✖ --env dev|prod required');
  process.exit(1);
}
if (env === 'prod' && !has('--yes')) {
  console.error('✖ prod needs --yes');
  process.exit(1);
}
const ADMIN_EMAIL = (arg('--email') || 'tecnologia@constructorasd.com').toLowerCase();
const OUT = arg('--out');
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('✖ SUPABASE_ACCESS_TOKEN not set');
  process.exit(1);
}

const local = {};
for (const l of readFileSync(join(ROOT, '.env.local'), 'utf8').split(/\r?\n/)) {
  const s = l.trim();
  if (!s || s.startsWith('#')) continue;
  const i = s.indexOf('=');
  if (i > 0) local[s.slice(0, i)] = s.slice(i + 1);
}
const ref = local[`SUPABASE_PROJECT_REF_${env.toUpperCase()}`];
const url = local[`SUPABASE_URL_${env.toUpperCase()}`] || (ref ? `https://${ref}.supabase.co` : '');
if (!ref) {
  console.error('✖ ref not in .env.local');
  process.exit(1);
}

const mgmt = (path, opts = {}) =>
  fetch(`https://api.supabase.com${path}`, {
    ...opts,
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });

// 1) service_role key (server-side only).
const keys = await (await mgmt(`/v1/projects/${ref}/api-keys`)).json();
const serviceRole = keys.find((k) => k.name === 'service_role')?.api_key;
if (!serviceRole) {
  console.error('✖ could not fetch service_role key');
  process.exit(1);
}

// 2) Auth config: ONLY enable the email provider (additive). Don't touch signup settings on shared projects.
const cfg = await mgmt(`/v1/projects/${ref}/config/auth`, {
  method: 'PATCH',
  body: JSON.stringify({ external_email_enabled: true }),
});
console.log(`auth config PATCH (enable email) → ${cfg.status}`);
// Revert any earlier over-reach on sign-ups back to the Supabase defaults (one-time cleanup, harmless if already default).
if (has('--restore-signup')) {
  await mgmt(`/v1/projects/${ref}/config/auth`, {
    method: 'PATCH',
    body: JSON.stringify({ disable_signup: false, mailer_autoconfirm: false }),
  });
  console.log('↩ restored signup defaults (disable_signup=false, mailer_autoconfirm=false)');
}

const authAdmin = (path, opts = {}) =>
  fetch(`${url}/auth/v1${path}`, {
    ...opts,
    headers: { Authorization: 'Bearer ' + serviceRole, apikey: serviceRole, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });

// 3) ensure the admin user exists.
const listed = await (await authAdmin(`/admin/users?per_page=200`)).json();
const found = (listed.users || []).find((u) => (u.email || '').toLowerCase() === ADMIN_EMAIL);

if (env === 'dev') {
  const password = 'Dev-' + randomBytes(12).toString('base64url') + '-9A';
  if (found) {
    await authAdmin(`/admin/users/${found.id}`, { method: 'PUT', body: JSON.stringify({ password, email_confirm: true }) });
    console.log('✔ dev admin password reset for', ADMIN_EMAIL);
  } else {
    const r = await authAdmin(`/admin/users`, { method: 'POST', body: JSON.stringify({ email: ADMIN_EMAIL, password, email_confirm: true }) });
    console.log('✔ dev admin user created:', r.status);
  }
  if (OUT) {
    writeFileSync(OUT, JSON.stringify({ email: ADMIN_EMAIL, password }));
    console.log('✔ dev creds →', OUT);
  }
} else {
  const redirect = 'https://constructorasd.com/admin/login';
  // Merge our redirect into the project's auth allowlist WITHOUT dropping SGC's existing entries.
  const curCfg = await (await mgmt(`/v1/projects/${ref}/config/auth`)).json();
  const allow = (curCfg.uri_allow_list || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!allow.includes(redirect)) {
    allow.push(redirect);
    await mgmt(`/v1/projects/${ref}/config/auth`, { method: 'PATCH', body: JSON.stringify({ uri_allow_list: allow.join(',') }) });
    console.log('✔ added admin redirect to auth allowlist (preserved existing entries)');
  }
  if (!found) {
    const r = await authAdmin(`/admin/users`, { method: 'POST', body: JSON.stringify({ email: ADMIN_EMAIL, email_confirm: true }) });
    console.log('✔ prod admin user created:', r.status);
  } else {
    console.log('• prod admin user already exists');
  }
  const linkRes = await authAdmin(`/admin/generate_link`, {
    method: 'POST',
    body: JSON.stringify({ type: 'recovery', email: ADMIN_EMAIL, redirect_to: redirect }),
  });
  const link = await linkRes.json();
  const action = link.action_link || link.properties?.action_link || '(no link — status ' + linkRes.status + ' ' + JSON.stringify(link).slice(0, 200) + ')';
  console.log('\n=== ONE-TIME SET-PASSWORD LINK (give to Xaviel) ===\n' + action + '\n');
}
