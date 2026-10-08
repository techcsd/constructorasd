// cleanup-dev.mjs — purge QA/e2e test artifacts from the DEV database only (projects/notes/inbox notes
// created by the Playwright admin suite). DEV-ONLY by design: it hard-deletes rows, so it refuses any
// other env. Reusable before/after a QA run.  Usage: node scripts/qa/cleanup-dev.mjs --env dev
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (n) => { const i = process.argv.indexOf(n); return i !== -1 ? process.argv[i + 1] : undefined; };

const env = arg('--env');
if (env !== 'dev') {
  console.error('✖ cleanup-dev: only --env dev is allowed (this hard-deletes rows).');
  process.exit(1);
}
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) { console.error('✖ SUPABASE_ACCESS_TOKEN not set.'); process.exit(1); }

function envFile() {
  const o = {}; const p = join(ROOT, '.env.local');
  if (existsSync(p)) for (const l of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const s = l.trim(); if (!s || s.startsWith('#')) continue;
    const i = s.indexOf('='); if (i > 0) o[s.slice(0, i)] = s.slice(i + 1);
  }
  return o;
}
const ref = envFile()['SUPABASE_PROJECT_REF_DEV'];
if (!ref) { console.error('✖ SUPABASE_PROJECT_REF_DEV not in .env.local.'); process.exit(1); }

async function query(q) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${text}`);
  return text ? JSON.parse(text) : [];
}

// Markers the Playwright admin suite uses: "QA preview …", "QA e2e …", "QA dup …", "QA nota …", "nota e2e …".
const PURGE = `
with gone as (
  delete from web.project_images where project_id in (select id from web.projects where name like 'QA %') returning 1
), p as (
  delete from web.projects where name like 'QA %' returning 1
), nv as (
  delete from web.dev_note_versions where note_id in (select id from web.dev_notes where title like 'QA %') returning 1
), n as (
  delete from web.dev_notes where title like 'QA %' returning 1
), inx as (
  delete from web.inbox_notes where body like 'nota e2e%' returning 1
)
select (select count(*) from p) as projects, (select count(*) from n) as notes, (select count(*) from inx) as inbox_notes;`;

try {
  const rows = await query(PURGE);
  const r = Array.isArray(rows) ? rows[0] : rows;
  console.log(`✔ dev cleanup: ${r?.projects ?? 0} project(s), ${r?.notes ?? 0} note(s), ${r?.inbox_notes ?? 0} inbox note(s) purged.`);
} catch (e) {
  console.error(`✖ cleanup failed: ${e.message}`);
  process.exit(1);
}
