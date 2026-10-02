// seed-content.ts — one-time: push the current site content (the TS seeds) into web.site_content so the
// admin + build read from the DB. Run via tsx. BU1-gated: --env dev|prod (prod needs --yes). Uses the
// service_role key (fetched via the Management API) with PostgREST upsert — server-side only.
//   npx tsx scripts/supabase/seed-content.ts --env dev
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PROJECTS } from '../../src/content/projects';
import { CLIENTS } from '../../src/content/clients';
import { COMPANY } from '../../src/content/company';
import { SECTORS } from '../../src/content/sectors';
import { STAGES } from '../../src/content/stages';
import { EQUIPMENT, FORMWORK_SYSTEMS } from '../../src/content/equipment';
import { JOBS } from '../../src/content/jobs';
import { POSTS } from '../../src/content/posts';
import { PAGE_META } from '../../src/content/page-meta';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (n: string) => {
  const i = process.argv.indexOf(n);
  return i !== -1 ? process.argv[i + 1] : undefined;
};
const has = (n: string) => process.argv.includes(n);

const env = arg('--env');
if (env !== 'dev' && env !== 'prod') {
  console.error('✖ --env dev|prod required');
  process.exit(1);
}
if (env === 'prod' && !has('--yes')) {
  console.error('✖ prod needs --yes');
  process.exit(1);
}
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('✖ SUPABASE_ACCESS_TOKEN not set');
  process.exit(1);
}

const local: Record<string, string> = {};
for (const l of readFileSync(join(ROOT, '.env.local'), 'utf8').split(/\r?\n/)) {
  const s = l.trim();
  if (!s || s.startsWith('#')) continue;
  const i = s.indexOf('=');
  if (i > 0) local[s.slice(0, i)] = s.slice(i + 1);
}
const ref = local[`SUPABASE_PROJECT_REF_${env.toUpperCase()}`];
const url = local[`SUPABASE_URL_${env.toUpperCase()}`] || `https://${ref}.supabase.co`;

const CONTENT: Record<string, unknown> = {
  company: COMPANY,
  projects: PROJECTS,
  clients: CLIENTS,
  sectors: SECTORS,
  stages: STAGES,
  equipment: EQUIPMENT,
  formwork: FORMWORK_SYSTEMS,
  jobs: JOBS,
  posts: POSTS,
  page_meta: PAGE_META,
};

async function main(): Promise<void> {
  const keys = await (
    await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, { headers: { Authorization: 'Bearer ' + TOKEN } })
  ).json();
  const serviceRole = (keys as { name: string; api_key: string }[]).find((k) => k.name === 'service_role')?.api_key;
  if (!serviceRole) throw new Error('could not fetch service_role');

  const rows = Object.entries(CONTENT).map(([key, data]) => ({ key, data }));
  const res = await fetch(`${url}/rest/v1/site_content`, {
    method: 'POST',
    headers: {
      apikey: serviceRole,
      Authorization: 'Bearer ' + serviceRole,
      'Content-Type': 'application/json',
      'Content-Profile': 'web',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(rows),
  });
  console.log(`seed → ${res.status}`, res.ok ? '✔ ' + rows.map((r) => r.key).join(', ') : await res.text());
}

main().catch((e) => {
  console.error('✖', e.message);
  process.exit(1);
});
