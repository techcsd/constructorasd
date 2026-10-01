// init-env.mjs — populate .env.local for constructorasd using the Supabase Management API + the
// SUPABASE_ACCESS_TOKEN already in the environment. Fetches each project's URL + anon key (the anon key
// is public by design — it ships to browsers). Service role is NOT written (edge functions get it
// auto-injected at runtime; local tooling uses the access token). Refs are documented, not secrets.
import { writeFileSync, existsSync, readFileSync } from 'node:fs';

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('✖ SUPABASE_ACCESS_TOKEN not set');
  process.exit(1);
}

async function api(path) {
  const r = await fetch('https://api.supabase.com' + path, {
    headers: { Authorization: 'Bearer ' + TOKEN },
  });
  if (!r.ok) throw new Error(`${path} → ${r.status} ${await r.text()}`);
  return r.json();
}

// Resolve project refs by NAME (never hardcode the prod ref — verify-sin-ref-hardcodeado bans it).
// dev = sgc-dev · prod = csd-core (shared BU1 projects; CSD web lives in schema `web`).
const projects = await api('/v1/projects');
const byName = (n) => projects.find((p) => p.name === n)?.id;
const REFS = { DEV: byName('sgc-dev'), PROD: byName('csd-core') };
if (!REFS.DEV || !REFS.PROD) {
  console.error('✖ could not resolve sgc-dev / csd-core by name:', projects.map((p) => p.name).join(', '));
  process.exit(1);
}

const out = {};
for (const [env, ref] of Object.entries(REFS)) {
  const keys = await api(`/v1/projects/${ref}/api-keys`);
  const anon = keys.find((k) => k.name === 'anon')?.api_key;
  out[`SUPABASE_PROJECT_REF_${env}`] = ref;
  out[`SUPABASE_URL_${env}`] = `https://${ref}.supabase.co`;
  out[`SUPABASE_ANON_KEY_${env}`] = anon ?? '';
}

// Preserve an existing RESEND_API_KEY if the file already has one.
let resend = '';
if (existsSync('.env.local')) {
  const m = readFileSync('.env.local', 'utf8').match(/^RESEND_API_KEY=(.*)$/m);
  if (m) resend = m[1];
}

const lines = [
  '# constructorasd.com — local config (gitignored). Supabase URL + anon key fetched via the Management',
  '# API (anon keys are public). Service role is NOT here (rule 5). dev=sgc-dev, prod=csd-core (shared BU1',
  '# projects; CSD lives in schema `web`).',
  '',
  `SUPABASE_PROJECT_REF_DEV=${out.SUPABASE_PROJECT_REF_DEV}`,
  `SUPABASE_URL_DEV=${out.SUPABASE_URL_DEV}`,
  `SUPABASE_ANON_KEY_DEV=${out.SUPABASE_ANON_KEY_DEV}`,
  '',
  `SUPABASE_PROJECT_REF_PROD=${out.SUPABASE_PROJECT_REF_PROD}`,
  `SUPABASE_URL_PROD=${out.SUPABASE_URL_PROD}`,
  `SUPABASE_ANON_KEY_PROD=${out.SUPABASE_ANON_KEY_PROD}`,
  '',
  'SITE_URL_DEV=https://constructorasd.vercel.app',
  'SITE_URL_PROD=https://constructorasd.com',
  '',
  '# Resend API key for the edge functions (set when available; also set as a Supabase edge secret).',
  `RESEND_API_KEY=${resend}`,
  '',
];
writeFileSync('.env.local', lines.join('\n'));
console.log(
  '✔ .env.local written:',
  Object.keys(out).join(', '),
  '| anon dev:',
  out.SUPABASE_ANON_KEY_DEV ? 'set' : 'MISSING',
  '| anon prod:',
  out.SUPABASE_ANON_KEY_PROD ? 'set' : 'MISSING',
);
