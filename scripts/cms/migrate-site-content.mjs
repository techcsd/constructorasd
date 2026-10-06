// migrate-site-content.mjs (WJ1 Phase 1.5) — one-time, idempotent migration of the current
// web.site_content JSON (projects, clients, posts, jobs) into the normalized CMS tables, uploading the
// referenced originals from assets-src/ to the web-media bucket and creating web.media rows.
//
// Idempotent: media keyed by sha256, collection rows keyed by slug (existing rows are left untouched).
// BU1-gated: requires --env dev|prod; prod requires --yes. Service-role key is fetched via the
// Management API (SUPABASE_ACCESS_TOKEN) — never committed.
//
// Usage: node scripts/cms/migrate-site-content.mjs --env dev [--yes]
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const arg = (n) => { const i = process.argv.indexOf(n); return i !== -1 ? process.argv[i + 1] : undefined; };
const has = (n) => process.argv.includes(n);
const env = arg('--env');
if (!['dev', 'prod'].includes(env ?? '')) { console.error('✖ --env dev|prod required (BU1).'); process.exit(1); }
if (env === 'prod' && !has('--yes')) { console.error('✖ refusing prod without --yes.'); process.exit(1); }
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) { console.error('✖ SUPABASE_ACCESS_TOKEN not set.'); process.exit(1); }

function envFile() {
  const p = join(ROOT, '.env.local'); const o = {};
  if (existsSync(p)) for (const l of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const s = l.trim(); if (!s || s.startsWith('#')) continue; const i = s.indexOf('='); if (i > 0) o[s.slice(0, i)] = s.slice(i + 1);
  }
  return o;
}
const FILE = envFile();
const REF = FILE[`SUPABASE_PROJECT_REF_${env.toUpperCase()}`];
const URL = (FILE[`SUPABASE_URL_${env.toUpperCase()}`] || `https://${REF}.supabase.co`).replace(/\/$/, '');

async function mgmt(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error(`mgmt ${r.status} ${await r.text()}`);
  return r.json();
}
async function serviceKey() {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys`, { headers: { Authorization: 'Bearer ' + TOKEN } });
  const keys = await r.json();
  return keys.find((k) => k.name === 'service_role').api_key;
}
const SRK = await serviceKey();
// web schema (not public) → PostgREST profile headers, same as supabase-js .schema('web')
const rest = (path, opts = {}) => fetch(`${URL}/rest/v1/${path}`, {
  ...opts, headers: { apikey: SRK, Authorization: 'Bearer ' + SRK, 'Content-Type': 'application/json', 'Accept-Profile': 'web', 'Content-Profile': 'web', ...(opts.headers || {}) },
});

// ── source content (DB site_content; the TS seeds are the same) ──
const content = {};
for (const r of (await mgmt(`select key, data from web.site_content where key in ('projects','clients','posts','jobs')`))) content[r.key] = r.data;
const PROJECTS = content.projects ?? [];
const CLIENTS = content.clients ?? [];
const POSTS = content.posts ?? [];
const JOBS = content.jobs ?? [];

// ── image helpers ──
const EXTS = ['jpg', 'jpeg', 'png', 'webp'];
const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
function findOriginal(key) {
  // prefer an upscaled copy if present (same as the build), else the original
  for (const base of [join(ROOT, 'assets-src', 'upscaled'), join(ROOT, 'assets-src')]) {
    for (const e of EXTS) { const p = join(base, `${key}.${e}`); if (existsSync(p)) return { path: p, ext: e }; }
  }
  return null;
}
const mediaCache = new Map(); // sha -> id
async function ensureMedia(ref) {
  if (!ref || !ref.src) return null;
  const found = findOriginal(ref.src);
  if (!found) { console.log(`  ! missing original for ${ref.src}`); return null; }
  const buf = readFileSync(found.path);
  const sha = createHash('sha256').update(buf).digest('hex');
  if (mediaCache.has(sha)) return mediaCache.get(sha);
  // existing?
  const ex = await (await rest(`media?sha256=eq.${sha}&select=id`)).json();
  if (ex[0]) { mediaCache.set(sha, ex[0].id); return ex[0].id; }
  const meta = await sharp(buf).rotate().metadata();
  const path = `migrated/${sha}.${found.ext === 'jpeg' ? 'jpg' : found.ext}`;
  // upload to storage (upsert)
  const up = await fetch(`${URL}/storage/v1/object/web-media/${path}`, {
    method: 'POST', headers: { apikey: SRK, Authorization: 'Bearer ' + SRK, 'Content-Type': MIME[found.ext], 'x-upsert': 'true' }, body: buf,
  });
  if (!up.ok && up.status !== 409) { console.log(`  ! upload ${path} → ${up.status} ${(await up.text()).slice(0, 80)}`); return null; }
  const ins = await rest('media', {
    method: 'POST', headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ bucket: 'web-media', path, original_name: `${ref.src.split('/').pop()}.${found.ext}`, mime: MIME[found.ext], bytes: buf.length, width: meta.width ?? null, height: meta.height ?? null, sha256: sha, alt_es: ref.alt?.es ?? '', alt_en: ref.alt?.en ?? '', created_by: 'migration' }),
  });
  const j = await ins.json();
  const id = j[0]?.id;
  if (id) { mediaCache.set(sha, id); console.log(`  + media ${ref.src} (${meta.width}×${meta.height})`); }
  return id ?? null;
}

async function existing(table) {
  const j = await (await rest(`${table}?select=slug`)).json();
  return new Set((Array.isArray(j) ? j : []).map((r) => r.slug));
}

console.log(`▶ migrating site_content → CMS tables on ${env} (${REF})`);

// ── clients ──
let cCount = 0; const clientSlugById = {};
const haveClients = await existing('clients');
for (const c of CLIENTS) {
  const logoId = c.logo ? await ensureMedia(c.logo) : null;
  if (haveClients.has(c.slug)) { continue; }
  const r = await rest('clients', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({
    slug: c.slug, name: c.name, group_key: c.group, logo_media_id: logoId, published: true, sort_order: c.order ?? 0,
  }) });
  if (r.ok) { const j = await r.json(); clientSlugById[c.name] = j[0]?.id; cCount++; }
  else console.log(`  ! client ${c.slug} → ${r.status} ${(await r.text()).slice(0, 80)}`);
}

// map client proper-noun name → id (for projects)
const clientRows = await (await rest('clients?select=id,name')).json();
const clientIdByName = Object.fromEntries((Array.isArray(clientRows) ? clientRows : []).map((r) => [r.name, r.id]));

// ── projects ──
let pCount = 0, imgCount = 0;
const haveProjects = await existing('projects');
for (const p of PROJECTS) {
  if (haveProjects.has(p.slug)) continue;
  const coverId = await ensureMedia(p.cover);
  const body = {
    slug: p.slug, name: p.name, client_id: clientIdByName[p.client] ?? null, client_name: p.client ?? null,
    sector_key: p.sector, location_es: p.location?.es ?? '', location_en: p.location?.en ?? '',
    year: p.year ?? null, status: p.status, summary_es: p.summary?.es ?? '', summary_en: p.summary?.en ?? '',
    body_es: p.body?.es ?? '', body_en: p.body?.en ?? '', scope: p.scope ?? [], cover_media_id: coverId,
    featured: !!p.featured, published: true, sort_order: p.order ?? 0,
  };
  const r = await rest('projects', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(body) });
  if (!r.ok) { console.log(`  ! project ${p.slug} → ${r.status} ${(await r.text()).slice(0, 100)}`); continue; }
  const projectId = (await r.json())[0].id;
  pCount++;
  let i = 0;
  for (const g of p.gallery ?? []) {
    const mid = await ensureMedia(g);
    if (!mid) continue;
    const ri = await rest('project_images', { method: 'POST', body: JSON.stringify({ project_id: projectId, media_id: mid, sort_order: i++, caption_es: g.alt?.es ?? '', caption_en: g.alt?.en ?? '' }) });
    if (ri.ok) imgCount++;
  }
  console.log(`  + project ${p.slug} (+${i} gallery)`);
}

// ── posts & jobs (empty today, but handle them) ──
let postCount = 0;
const havePosts = await existing('posts');
for (const po of POSTS) {
  if (havePosts.has(po.slug)) continue;
  const coverId = po.cover ? await ensureMedia(po.cover) : null;
  const r = await rest('posts', { method: 'POST', body: JSON.stringify({ slug: po.slug, title_es: po.title?.es ?? '', title_en: po.title?.en ?? '', excerpt_es: po.excerpt?.es ?? '', excerpt_en: po.excerpt?.en ?? '', body_es: po.body?.es ?? '', body_en: po.body?.en ?? '', cover_media_id: coverId, published_at: po.publishedAt ?? null, published: true }) });
  if (r.ok) postCount++;
}
let jobCount = 0;
const haveJobs = await existing('jobs');
for (const j of JOBS) {
  if (haveJobs.has(j.slug)) continue;
  const r = await rest('jobs', { method: 'POST', body: JSON.stringify({ slug: j.slug, title_es: j.title?.es ?? '', title_en: j.title?.en ?? '', area_es: j.area?.es ?? '', area_en: j.area?.en ?? '', location_es: j.location?.es ?? '', location_en: j.location?.en ?? '', type: j.type, summary_es: j.summary?.es ?? '', summary_en: j.summary?.en ?? '', requirements_es: (j.requirements ?? []).map((x) => x.es), requirements_en: (j.requirements ?? []).map((x) => x.en), open: j.open !== false, published: true, published_at: j.publishedAt ?? null }) });
  if (r.ok) jobCount++;
}

console.log(`✔ migrated: ${cCount} clients, ${pCount} projects (${imgCount} gallery images), ${postCount} posts, ${jobCount} jobs → ${env}`);
