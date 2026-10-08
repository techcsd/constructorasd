// gen-content.mjs v2 (WI5 / WJ2) — prebuild. Reads the editable content and writes src/content/
// _overrides.json, which the content modules merge over their TS seeds. SINGLETONS (company, stages,
// sectors, equipment, page_meta) come from web.site_content as before; COLLECTIONS (projects, clients,
// posts, jobs) now come from the normalized CMS tables via the web.v_public_* views, with their images
// downloaded from the web-media bucket to assets-src/cms/<sha>.<ext> (cached) so the existing
// optimize-images pipeline turns them into static AVIF/WebP under the key `cms/<sha>`.
//
// Best-effort in dev/preview: on any failure it falls back to the TS seeds and logs loudly (never breaks
// the preview). STRICT in prod: a failed fetch fails the build (ENV_NAME=prod) so an outage can't
// silently publish stale seeds.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'content', '_overrides.json');
const CMS_DIR = join(ROOT, 'assets-src', 'cms');

const SINGLETONS = new Set(['company', 'stages', 'sectors', 'equipment', 'page_meta', 'home']);

function envFromGenerated() {
  try {
    const env = readFileSync(join(ROOT, 'src', 'environments', 'environment.ts'), 'utf8');
    return {
      url: env.match(/"supabaseUrl"\s*:\s*"([^"]+)"/)?.[1],
      anon: env.match(/"supabaseAnonKey"\s*:\s*"([^"]+)"/)?.[1],
      production: /"production"\s*:\s*true/.test(env) || env.match(/"envName"\s*:\s*"([^"]+)"/)?.[1] === 'prod',
    };
  } catch {
    return {};
  }
}

const strict = (process.env.ENV_NAME === 'prod');

async function fetchJson(url, anon, path) {
  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${path}`, {
    headers: { apikey: anon, Authorization: 'Bearer ' + anon, 'Accept-Profile': 'web' },
  });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${(await res.text()).slice(0, 120)}`);
  return res.json();
}

/** Download a web-media original to assets-src/cms/<sha>.<ext> if missing; return the manifest key. */
async function cacheMedia(url, m, byId) {
  const media = byId.get(m);
  if (!media) return null;
  const ext = (media.path.split('.').pop() || 'jpg').toLowerCase();
  const key = `cms/${media.sha256}`;
  const file = join(CMS_DIR, `${media.sha256}.${ext}`);
  if (!existsSync(file)) {
    mkdirSync(CMS_DIR, { recursive: true });
    const r = await fetch(`${url.replace(/\/$/, '')}/storage/v1/object/public/${media.bucket}/${media.path}`);
    if (!r.ok) throw new Error(`media ${media.path} → ${r.status}`);
    writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  }
  return { key, alt: { es: media.alt_es ?? '', en: media.alt_en ?? '' } };
}

async function main() {
  const { url, anon, production } = envFromGenerated();
  if (!url || !anon) {
    writeFileSync(OUT, '{}\n');
    console.log('[gen-content] ⏭  no supabase env — using seeds ({}).');
    return;
  }

  const out = {};

  // 1) singletons from site_content (unchanged)
  try {
    const rows = await fetchJson(url, anon, 'site_content?select=key,data');
    for (const r of rows) if (SINGLETONS.has(r.key)) out[r.key] = r.data;
    console.log(`[gen-content] ✓ singletons: ${Object.keys(out).join(', ') || '(none)'}`);
  } catch (e) {
    if (strict) { console.error(`[gen-content] ✗ STRICT (prod): ${e.message}`); process.exit(1); }
    writeFileSync(OUT, '{}\n');
    console.log(`[gen-content] ⚠ ${e.message} — using seeds ({}).`);
    return;
  }

  // 2) collections from the CMS tables (via public views)
  try {
    const [mediaRows, clients, projects, projImages] = await Promise.all([
      fetchJson(url, anon, 'v_public_media?select=id,bucket,path,sha256,alt_es,alt_en,width,height,focal_x,focal_y'),
      fetchJson(url, anon, 'v_public_clients?select=*'),
      fetchJson(url, anon, 'v_public_projects?select=*'),
      fetchJson(url, anon, 'v_public_project_images?select=*'),
    ]);
    const byId = new Map(mediaRows.map((m) => [m.id, m]));

    // Home hero media (WL2): resolve home.hero.mediaId → optimized image key so a photo uploaded from
    // /admin › Inicio actually appears on the hero (priority/LCP image).
    if (out.home?.hero?.mediaId) {
      const hero = await cacheMedia(url, out.home.hero.mediaId, byId);
      if (hero) { out.home.hero.image = hero.key; if (!out.home.hero.alt?.es && !out.home.hero.alt?.en) out.home.hero.alt = hero.alt; }
    }

    // Stage cover media (WL4): resolve each stage's coverMediaId → its first image (home accordion / servicios).
    if (Array.isArray(out.stages)) {
      for (const st of out.stages) {
        if (st?.coverMediaId) {
          const c = await cacheMedia(url, st.coverMediaId, byId);
          if (c) st.images = [{ src: c.key, alt: st.images?.[0]?.alt ?? c.alt }, ...(st.images ?? []).slice(1)];
        }
        // Gallery (WL4) → appended after the cover, for the /servicios strip.
        if (Array.isArray(st?.galleryMediaIds) && st.galleryMediaIds.length) {
          const extra = [];
          for (const id of st.galleryMediaIds) { const g = await cacheMedia(url, id, byId); if (g) extra.push({ src: g.key, alt: g.alt }); }
          if (extra.length) st.images = [...(st.images ?? []), ...extra];
        }
      }
    }

    // clients
    out.clients = [];
    for (const c of clients) {
      const logo = c.logo_media_id ? await cacheMedia(url, c.logo_media_id, byId) : null;
      out.clients.push({ slug: c.slug, name: c.name, group: c.group_key, ...(logo ? { logo } : {}), order: c.sort_order });
    }

    // projects (+ gallery)
    const galleryByProject = new Map();
    for (const pi of projImages) {
      if (!galleryByProject.has(pi.project_id)) galleryByProject.set(pi.project_id, []);
      galleryByProject.get(pi.project_id).push(pi);
    }
    out.projects = [];
    for (const p of projects) {
      const cover = await cacheMedia(url, p.cover_media_id, byId);
      const gallery = [];
      for (const pi of galleryByProject.get(p.id) ?? []) {
        const g = await cacheMedia(url, pi.media_id, byId);
        if (g) gallery.push({ src: g.key, alt: { es: pi.caption_es || g.alt.es, en: pi.caption_en || g.alt.en } });
      }
      out.projects.push({
        slug: p.slug, name: p.name, client: p.client_name ?? '', sector: p.sector_key,
        location: { es: p.location_es ?? '', en: p.location_en ?? '' }, year: p.year ?? undefined,
        status: p.status, summary: { es: p.summary_es ?? '', en: p.summary_en ?? '' },
        ...(p.body_es || p.body_en ? { body: { es: p.body_es ?? '', en: p.body_en ?? '' } } : {}),
        scope: p.scope ?? [], cover: cover ? { src: cover.key, alt: cover.alt } : { src: '', alt: { es: '', en: '' } },
        gallery, featured: !!p.featured, order: p.sort_order,
      });
    }

    // posts & jobs (empty today, but wire them)
    const posts = await fetchJson(url, anon, 'v_public_posts?select=*');
    out.posts = [];
    for (const po of posts) {
      const cover = po.cover_media_id ? await cacheMedia(url, po.cover_media_id, byId) : null;
      out.posts.push({ slug: po.slug, title: { es: po.title_es, en: po.title_en }, excerpt: { es: po.excerpt_es, en: po.excerpt_en }, ...(cover ? { cover: { src: cover.key, alt: cover.alt } } : {}), publishedAt: po.published_at, body: { es: po.body_es, en: po.body_en } });
    }
    const jobs = await fetchJson(url, anon, 'v_public_jobs?select=*');
    out.jobs = jobs.map((j) => ({ slug: j.slug, title: { es: j.title_es, en: j.title_en }, area: { es: j.area_es, en: j.area_en }, location: { es: j.location_es, en: j.location_en }, type: j.type, summary: { es: j.summary_es, en: j.summary_en }, requirements: (j.requirements_es ?? []).map((es, i) => ({ es, en: (j.requirements_en ?? [])[i] ?? es })), open: j.open, publishedAt: j.published_at }));

    console.log(`[gen-content] ✓ CMS: ${out.projects.length} projects, ${out.clients.length} clients, ${out.posts.length} posts, ${out.jobs.length} jobs (media → assets-src/cms/)`);
  } catch (e) {
    if (strict) { console.error(`[gen-content] ✗ STRICT (prod): ${e.message}`); process.exit(1); }
    console.log(`[gen-content] ⚠ CMS fetch failed (${e.message}) — collections fall back to TS seeds.`);
  }

  // 2b) ui_strings (WL6) → merge ONLY the changes over the committed i18n catalog into out.ui (kept small).
  try {
    const enBase = JSON.parse(readFileSync(join(ROOT, 'src', 'content', 'i18n', 'en.json'), 'utf8'));
    const esBase = JSON.parse(readFileSync(join(ROOT, 'src', 'content', 'i18n', 'es.json'), 'utf8'));
    const rows = await fetchJson(url, anon, 'ui_strings?select=key,es,en');
    const uiEs = {}, uiEn = {};
    for (const r of rows) {
      if (r.es != null && r.es !== (esBase[r.key] ?? r.key)) uiEs[r.key] = r.es;
      if (r.en != null && r.en !== enBase[r.key]) uiEn[r.key] = r.en;
    }
    if (Object.keys(uiEs).length || Object.keys(uiEn).length) out.ui = { es: uiEs, en: uiEn };
    console.log(`[gen-content] ✓ ui_strings: ${Object.keys(uiEs).length} es + ${Object.keys(uiEn).length} en override(s)`);
  } catch (e) {
    if (strict) { console.error(`[gen-content] ✗ STRICT ui_strings (prod): ${e.message}`); process.exit(1); }
    console.log(`[gen-content] ⚠ ui_strings: ${e.message} — using the committed catalog.`);
  }

  // 3) slug redirects (A03b) → separate generated file consumed by the postbuild gen-redirects.mjs
  const REDIR_OUT = join(ROOT, 'src', 'content', '_redirects.generated.json');
  try {
    const reds = await fetchJson(url, anon, 'slug_redirects?select=from_path,to_path');
    writeFileSync(REDIR_OUT, JSON.stringify(reds) + '\n');
    console.log(`[gen-content] ✓ redirects: ${reds.length}`);
  } catch (e) {
    if (strict) { console.error(`[gen-content] ✗ STRICT redirects (prod): ${e.message}`); process.exit(1); }
    writeFileSync(REDIR_OUT, '[]\n');
    console.log(`[gen-content] ⚠ redirects: ${e.message} — none.`);
  }

  writeFileSync(OUT, JSON.stringify(out) + '\n');
}

await main();
