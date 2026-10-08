// set-secrets.mjs — set the web-* edge function secrets for an env via the Management API.
// Usage: node scripts/supabase/set-secrets.mjs --env dev [--yes]
// RESEND_API_KEY is only set if present in the environment or .env.local (never fabricated).
import { readFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
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
const ref = envFile[`SUPABASE_PROJECT_REF_${env.toUpperCase()}`];
if (!ref) { console.error(`✖ SUPABASE_PROJECT_REF_${env.toUpperCase()} missing (run init-env.mjs)`); process.exit(1); }

// This Supabase project is shared with SGC — fetch existing secret names so we don't rotate shared values.
let existing = new Set();
try {
  const g = await fetch(`https://api.supabase.com/v1/projects/${ref}/secrets`, { headers: { Authorization: 'Bearer ' + TOKEN } });
  if (g.ok) existing = new Set((await g.json()).map((s) => s.name));
} catch { /* ignore — fall through to create */ }

const resend = process.env.RESEND_API_KEY || envFile.RESEND_API_KEY || '';
const secrets = [
  { name: 'ENV_NAME', value: env },
  { name: 'MAIL_FROM', value: 'Constructora SD <web@constructorasd.com>' },
  { name: 'MAIL_TO', value: 'info@constructorasd.com' },
  { name: 'MAIL_TO_DEV', value: 'Tecnologia@constructorasd.com' },
];
// IP_SALT: create once, NEVER rotate (rotating would reset rate-limit continuity for both apps).
if (!existing.has('IP_SALT')) secrets.push({ name: 'IP_SALT', value: 'csd-web-' + randomBytes(16).toString('hex') });
if (resend) secrets.push({ name: 'RESEND_API_KEY', value: resend });

// Vercel deploy-status (WK2) — project/team are public identifiers; the TOKEN is the only secret and is
// only set when present (the web-deploy-status function stays inert until then).
const vercelProject = process.env.VERCEL_PROJECT_ID || envFile.VERCEL_PROJECT_ID || '';
const vercelTeam = process.env.VERCEL_TEAM || envFile.VERCEL_TEAM || '';
const vercelToken = process.env.VERCEL_TOKEN || envFile.VERCEL_TOKEN || '';
if (vercelProject) secrets.push({ name: 'VERCEL_PROJECT_ID', value: vercelProject });
if (vercelTeam) secrets.push({ name: 'VERCEL_TEAM', value: vercelTeam });
if (vercelToken) secrets.push({ name: 'VERCEL_TOKEN', value: vercelToken });

const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/secrets`, {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify(secrets),
});
if (!r.ok) { console.error('✖ set-secrets failed:', r.status, await r.text()); process.exit(1); }
console.log(`✔ secrets set on ${env} (${ref}):`, secrets.map((s) => s.name).join(', '));
console.log(resend ? '  RESEND_API_KEY set.' : '  ⚠ RESEND_API_KEY NOT set (emails will record email_error until provided).');
console.log(vercelToken ? '  VERCEL_TOKEN set (deploy-status active).' : '  ⓘ VERCEL_TOKEN not set (publish bar uses token-free polling until provided).');
