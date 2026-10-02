// set-deploy-hook.mjs — read VERCEL_DEPLOY_HOOK from .env.local and set it as the edge secret on both
// Supabase projects, so the admin "Publicar" button (web-publish) can trigger a site rebuild.
// Create the hook first: Vercel → Project constructorasd → Settings → Git → Deploy Hooks → name it
// "publish", branch "main" → copy the URL → put VERCEL_DEPLOY_HOOK=<url> in .env.local → run this.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
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
const hook = local['VERCEL_DEPLOY_HOOK'];
if (!hook) {
  console.error('✖ VERCEL_DEPLOY_HOOK not in .env.local — add it first.');
  process.exit(1);
}
const REFS = { dev: local['SUPABASE_PROJECT_REF_DEV'], prod: local['SUPABASE_PROJECT_REF_PROD'] };
for (const [env, ref] of Object.entries(REFS)) {
  if (!ref) continue;
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/secrets`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify([{ name: 'VERCEL_DEPLOY_HOOK', value: hook }]),
  });
  console.log(`${env} (${ref}) → ${r.status} ${r.ok ? '✔' : await r.text()}`);
}
console.log('Done — the admin «Publicar» button will now trigger rebuilds.');
