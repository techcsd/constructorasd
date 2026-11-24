// scripts/photos/publish-enhanced.mjs — PROMPT-12 Phase 4.3.
//   node scripts/photos/publish-enhanced.mjs --env dev|prod [--yes (prod)] [--revert]
//
// Uploads each tier-B CMS photo's enhanced version (assets-src/enhanced/**) to the web-media bucket as a
// NEW media row linked to its original (derived_from, variant='enhanced') and swaps it into the slots it
// came from (projects.cover_media_id / project_images.media_id). The original row/file is never deleted
// or unpublished. Uses the env's service-role key from .env.local (server-side only). Every swap is logged in docs/round-05-photos/publish-log[-prod].csv so --revert can undo it.

import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { csvLine } from './lib.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DOCS = join(ROOT, 'docs', 'round-05-photos');
const envName = process.argv.includes('--env') ? process.argv[process.argv.indexOf('--env') + 1] : undefined;
if (!['dev', 'prod'].includes(envName ?? '')) {
  console.error('✖ publish-enhanced: --env dev|prod is required (BU1).');
  process.exit(1);
}
if (envName === 'prod' && !process.argv.includes('--yes')) {
  console.error('✖ publish-enhanced: refusing to touch prod without --yes.');
  process.exit(1);
}
const SUF = envName.toUpperCase();
const revert = process.argv.includes('--revert');

const E = {};
for (const l of readFileSync(join(ROOT, '.env.local'), 'utf8').split(/\r?\n/)) {
  const i = l.indexOf('=');
  if (i > 0 && !l.trim().startsWith('#')) E[l.slice(0, i).trim()] = l.slice(i + 1).trim();
}
const URL_ = E[`SUPABASE_URL_${SUF}`].replace(/\/$/, '');

// Service-role key for the chosen env (server-side script only, never logged / bundled — rule 5).
const JWT = E[`SUPABASE_SERVICE_ROLE_KEY_${SUF}`];
if (!JWT) { console.error(`✖ SUPABASE_SERVICE_ROLE_KEY_${SUF} missing in .env.local`); process.exit(1); }

const H = (extra = {}) => ({ apikey: JWT, Authorization: 'Bearer ' + JWT, 'Accept-Profile': 'web', 'Content-Profile': 'web', ...extra });
async function rest(method, path, body, prefer) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { method, headers: H({ 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) }), body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status} ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
}

const logPath = join(DOCS, envName === 'dev' ? 'publish-log.csv' : `publish-log-${envName}.csv`);
const head = ['original_media_id', 'enhanced_media_id', 'swap_table', 'swap_row_id', 'swap_column'];

if (revert) {
  const lines = readFileSync(logPath, 'utf8').trim().split('\n').slice(1).map((l) => l.split(','));
  for (const [orig, enh, table, rowId, col] of lines) {
    if (!table) continue;
    await rest('PATCH', `${table}?id=eq.${rowId}`, { [col]: orig });
    console.log(`  ↺ ${table}.${col} ${rowId} → original ${orig.slice(0, 8)}`);
  }
  process.exit(0);
}

const log = JSON.parse(readFileSync(join(DOCS, 'audit.json'), 'utf8'));
const okRows = readFileSync(join(DOCS, 'enhance-log.csv'), 'utf8').trim().split('\n').slice(1)
  .map((l) => l.split(',')).filter((c) => c[0].startsWith('cms/') && c[12] === 'B_OK').map((c) => ({ id: c[0], out: c[13] }));

const media = await rest('GET', 'media?select=*&deleted_at=is.null');
const out = [csvLine(head)];
for (const { id, out: file } of okRows) {
  const sha = id.slice(4);
  const orig = media.find((m) => m.sha256 === sha && m.variant === 'original');
  if (!orig) { console.warn('  ! no original media row for', id.slice(0, 14)); continue; }
  let enh = media.find((m) => m.derived_from === orig.id && m.variant === 'enhanced');
  if (!enh) {
    const jpg = await sharp(join(ROOT, file)).jpeg({ quality: 90, mozjpeg: true }).toBuffer({ resolveWithObject: true });
    const path = `enhanced/${randomUUID()}.jpg`;
    const up = await fetch(`${URL_}/storage/v1/object/web-media/${path}`, { method: 'POST', headers: { apikey: JWT, Authorization: 'Bearer ' + JWT, 'Content-Type': 'image/jpeg', 'x-upsert': 'false' }, body: jpg.data });
    if (!up.ok) throw new Error(`upload ${path} → ${up.status} ${await up.text()}`);
    [enh] = await rest('POST', 'media', [{
      bucket: 'web-media', path, original_name: `${(orig.original_name || sha.slice(0, 8)).replace(/\.[a-z]+$/i, '')}-mejorada.jpg`, mime: 'image/jpeg',
      bytes: jpg.data.length, width: jpg.info.width, height: jpg.info.height, sha256: createHash('sha256').update(jpg.data).digest('hex'),
      alt_es: orig.alt_es, alt_en: orig.alt_en, focal_x: orig.focal_x, focal_y: orig.focal_y, created_by: 'photos-r05',
      derived_from: orig.id, variant: 'enhanced',
    }], 'return=representation');
    console.log(`  + uploaded ${path} (${(jpg.data.length / 1024).toFixed(0)} kB, ${jpg.info.width}×${jpg.info.height})`);
  }
  let swapped = 0;
  for (const p of await rest('GET', `projects?select=id&cover_media_id=eq.${orig.id}`)) {
    await rest('PATCH', `projects?id=eq.${p.id}`, { cover_media_id: enh.id });
    out.push(csvLine([orig.id, enh.id, 'projects', p.id, 'cover_media_id'])); swapped++;
  }
  for (const p of await rest('GET', `project_images?select=id&media_id=eq.${orig.id}`)) {
    await rest('PATCH', `project_images?id=eq.${p.id}`, { media_id: enh.id });
    out.push(csvLine([orig.id, enh.id, 'project_images', p.id, 'media_id'])); swapped++;
  }
  console.log(`  ✓ ${id.slice(0, 14)} → enhanced ${enh.id.slice(0, 8)} (${swapped} slot swap)`);
}
const prior = existsSync(logPath) ? readFileSync(logPath, 'utf8').trim().split('\n').slice(1) : [];
writeFileSync(logPath, [out[0], ...prior, ...out.slice(1)].join('\n') + '\n');
