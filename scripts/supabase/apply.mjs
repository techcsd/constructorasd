// apply.mjs — apply a SQL migration to a Supabase env via the Management API query endpoint, using
// SUPABASE_ACCESS_TOKEN. BU1-gated: requires --env dev|prod; prod requires --yes. Records the migration
// in web.migrations.  Usage: node scripts/supabase/apply.mjs [--file sql/X.sql] --env dev [--yes]
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
const hasFlag = (n) => process.argv.includes(n);

const env = arg('--env');
if (!['dev', 'prod'].includes(env ?? '')) {
  console.error('✖ apply: --env dev|prod is required (BU1).');
  process.exit(1);
}
if (env === 'prod' && !hasFlag('--yes')) {
  console.error('✖ apply: refusing to touch prod without --yes.');
  process.exit(1);
}

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('✖ SUPABASE_ACCESS_TOKEN not set.');
  process.exit(1);
}

// Resolve ref from .env.local.
function envFile() {
  const p = join(ROOT, '.env.local');
  const o = {};
  if (existsSync(p))
    for (const l of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const s = l.trim();
      if (!s || s.startsWith('#')) continue;
      const i = s.indexOf('=');
      if (i > 0) o[s.slice(0, i)] = s.slice(i + 1);
    }
  return o;
}
const ref = envFile()[`SUPABASE_PROJECT_REF_${env.toUpperCase()}`];
if (!ref) {
  console.error(`✖ SUPABASE_PROJECT_REF_${env.toUpperCase()} not in .env.local (run init-env.mjs).`);
  process.exit(1);
}

// File: explicit --file, else newest sql/*.sql
let file = arg('--file');
if (!file) {
  const sqls = readdirSync(join(ROOT, 'sql'))
    .filter((f) => f.endsWith('.sql'))
    .sort();
  file = sqls.length ? join('sql', sqls[sqls.length - 1]) : undefined;
}
if (!file || !existsSync(join(ROOT, file))) {
  console.error('✖ no SQL file found.');
  process.exit(1);
}
const sql = readFileSync(join(ROOT, file), 'utf8');
const id = basename(file);

async function query(q) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${text}`);
  return text;
}

console.log(`▶ applying ${file} to ${env} (${ref}) …`);
try {
  await query(sql);
  await query(
    `insert into web.migrations(id, env) values ('${id}', '${env}') on conflict (id) do update set applied_at = now(), env = excluded.env;`,
  );
  console.log(`✔ applied ${id} to ${env} and recorded in web.migrations.`);
} catch (e) {
  console.error(`✖ apply failed: ${e.message}`);
  process.exit(1);
}
