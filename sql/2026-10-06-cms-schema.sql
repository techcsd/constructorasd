-- 2026-10-06-cms-schema.sql — CMS data model (WH1 / WJ1 / WJ7). Normalizes the collections that were
-- JSON blobs in web.site_content into real tables with per-row published/sort_order/soft-delete, adds a
-- web.media table for uploaded files, an admins table + web.is_admin() used by every policy, public
-- read-only views for the build (anon key), and the storage bucket + policies for web-media.
--
-- Idempotent: safe to re-run and to apply dev → prod. site_content is kept (company/stages/sectors/
-- equipment/page_meta stay there; projects/clients/posts/jobs JSON kept one release as rollback).

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Admins + is_admin() (WJ7) — replaces the hardcoded email in every policy
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists web.admins (
  email text primary key,
  created_at timestamptz not null default now()
);
insert into web.admins(email) values ('tecnologia@constructorasd.com')
  on conflict (email) do nothing;

create or replace function web.is_admin() returns boolean
  language sql stable security definer set search_path = web, public as $$
  select exists (select 1 from web.admins a where a.email = auth.jwt() ->> 'email');
$$;
revoke all on function web.is_admin() from public;
grant execute on function web.is_admin() to authenticated, anon, service_role;

-- shared touch trigger already exists (web.touch_updated_at); (re)create defensively
create or replace function web.touch_updated_at() returns trigger
  language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Media (uploaded files; the file bytes live in Storage bucket web-media)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists web.media (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'web-media',
  path text not null unique,
  original_name text,
  mime text not null,
  bytes bigint,
  width int,
  height int,
  sha256 text,
  alt_es text not null default '',
  alt_en text not null default '',
  focal_x numeric not null default 0.5,
  focal_y numeric not null default 0.5,
  created_by text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists media_sha256_idx on web.media (sha256);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Collections
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists web.clients (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  group_key text not null check (group_key in ('promotores','hoteleria','industria_mineria','instituciones')),
  logo_media_id uuid references web.media(id) on delete set null,
  published boolean not null default false,
  sort_order int not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists web.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  client_id uuid references web.clients(id) on delete set null,
  client_name text,                          -- denormalized proper noun (client may be a non-wall name)
  sector_key text check (sector_key in ('hotelero','institucional','hospitalario','industrial','residencial','minero')),
  location_es text default '',
  location_en text default '',
  year int,
  status text check (status in ('ejecutado','en_ejecucion')),
  summary_es text default '',
  summary_en text default '',
  body_es text default '',
  body_en text default '',
  scope text[] not null default '{}',        -- stage ids
  cover_media_id uuid references web.media(id) on delete set null,
  featured boolean not null default false,
  published boolean not null default false,
  sort_order int not null default 0,
  seo_title_es text default '',
  seo_title_en text default '',
  seo_description_es text default '',
  seo_description_en text default '',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists web.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references web.projects(id) on delete cascade,
  media_id uuid not null references web.media(id) on delete cascade,
  sort_order int not null default 0,
  caption_es text default '',
  caption_en text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists project_images_project_idx on web.project_images (project_id, sort_order);

create table if not exists web.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_es text default '',
  title_en text default '',
  excerpt_es text default '',
  excerpt_en text default '',
  body_es text default '',
  body_en text default '',
  cover_media_id uuid references web.media(id) on delete set null,
  published_at timestamptz,
  published boolean not null default false,
  sort_order int not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists web.jobs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_es text default '',
  title_en text default '',
  area_es text default '',
  area_en text default '',
  location_es text default '',
  location_en text default '',
  type text check (type in ('tiempo_completo','por_proyecto')),
  summary_es text default '',
  summary_en text default '',
  requirements_es text[] not null default '{}',
  requirements_en text[] not null default '{}',
  open boolean not null default true,
  published boolean not null default false,
  sort_order int not null default 0,
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Publish plumbing
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists web.slug_redirects (
  from_path text primary key,
  to_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists web.publish_log (
  id uuid primary key default gen_random_uuid(),
  requested_by text,
  requested_at timestamptz not null default now(),
  deploy_id text,
  state text,                                -- QUEUED | BUILDING | READY | ERROR
  finished_at timestamptz,
  note text
);

create table if not exists web.site_state (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into web.site_state(key, value) values ('last_published_at', 'null'::jsonb)
  on conflict (key) do nothing;

-- touch triggers on every mutable table
do $$
declare t text;
begin
  foreach t in array array['media','clients','projects','project_images','posts','jobs','site_state'] loop
    execute format('drop trigger if exists %I_touch on web.%I', t, t);
    execute format('create trigger %I_touch before update on web.%I for each row execute function web.touch_updated_at()', t, t);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RLS — admin full access via is_admin(); anon select only published & not deleted
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['admins','media','clients','projects','project_images','posts','jobs','slug_redirects','publish_log','site_state'] loop
    execute format('alter table web.%I enable row level security', t);
    execute format('drop policy if exists %I_admin_all on web.%I', t, t);
    execute format($p$create policy %I_admin_all on web.%I for all to authenticated using (web.is_admin()) with check (web.is_admin())$p$, t, t);
    execute format('grant select, insert, update, delete on web.%I to authenticated', t);
    execute format('grant all on web.%I to service_role', t);
  end loop;
end $$;

-- anon read: published + not soft-deleted (the static build reads with the anon key)
grant usage on schema web to anon;

drop policy if exists clients_public_read on web.clients;
create policy clients_public_read on web.clients for select to anon using (published and deleted_at is null);
grant select on web.clients to anon;

drop policy if exists projects_public_read on web.projects;
create policy projects_public_read on web.projects for select to anon using (published and deleted_at is null);
grant select on web.projects to anon;

drop policy if exists posts_public_read on web.posts;
create policy posts_public_read on web.posts for select to anon using (published and deleted_at is null);
grant select on web.posts to anon;

drop policy if exists jobs_public_read on web.jobs;
create policy jobs_public_read on web.jobs for select to anon using (published and deleted_at is null);
grant select on web.jobs to anon;

-- project_images: visible when the parent project is published
drop policy if exists project_images_public_read on web.project_images;
create policy project_images_public_read on web.project_images for select to anon
  using (exists (select 1 from web.projects p where p.id = project_id and p.published and p.deleted_at is null));
grant select on web.project_images to anon;

-- media: file metadata (bytes live in a public bucket); any non-deleted row is readable
drop policy if exists media_public_read on web.media;
create policy media_public_read on web.media for select to anon using (deleted_at is null);
grant select on web.media to anon;

-- slug_redirects are public (the build turns them into 301s)
drop policy if exists slug_redirects_public_read on web.slug_redirects;
create policy slug_redirects_public_read on web.slug_redirects for select to anon using (true);
grant select on web.slug_redirects to anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Public views the build consumes (anon) — media joined, published only
-- ─────────────────────────────────────────────────────────────────────────────
create or replace view web.v_public_media with (security_invoker = true) as
  select id, bucket, path, mime, width, height, sha256, alt_es, alt_en, focal_x, focal_y from web.media where deleted_at is null;

create or replace view web.v_public_clients with (security_invoker = true) as
  select c.id, c.slug, c.name, c.group_key, c.sort_order, c.logo_media_id from web.clients c
  where c.published and c.deleted_at is null order by c.sort_order, c.name;

create or replace view web.v_public_projects with (security_invoker = true) as
  select p.id, p.slug, p.name, coalesce(p.client_name, c.name) as client_name, p.sector_key,
         p.location_es, p.location_en, p.year, p.status, p.summary_es, p.summary_en, p.body_es, p.body_en,
         p.scope, p.cover_media_id, p.featured, p.sort_order,
         p.seo_title_es, p.seo_title_en, p.seo_description_es, p.seo_description_en
  from web.projects p left join web.clients c on c.id = p.client_id
  where p.published and p.deleted_at is null order by p.sort_order, p.name;

create or replace view web.v_public_project_images with (security_invoker = true) as
  select pi.id, pi.project_id, pi.media_id, pi.sort_order, pi.caption_es, pi.caption_en
  from web.project_images pi join web.projects p on p.id = pi.project_id
  where p.published and p.deleted_at is null order by pi.project_id, pi.sort_order;

create or replace view web.v_public_posts with (security_invoker = true) as
  select id, slug, title_es, title_en, excerpt_es, excerpt_en, body_es, body_en, cover_media_id, published_at, sort_order
  from web.posts where published and deleted_at is null order by published_at desc nulls last, sort_order;

create or replace view web.v_public_jobs with (security_invoker = true) as
  select id, slug, title_es, title_en, area_es, area_en, location_es, location_en, type, summary_es, summary_en,
         requirements_es, requirements_en, open, published_at, sort_order
  from web.jobs where published and deleted_at is null order by sort_order, published_at desc nulls last;

grant select on web.v_public_media, web.v_public_clients, web.v_public_projects,
  web.v_public_project_images, web.v_public_posts, web.v_public_jobs to anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Rewrite EXISTING admin policies to use web.is_admin() (was literal email)
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['site_content','dev_notes','leads','job_applications','site_settings'] loop
    if to_regclass('web.'||t) is not null then
      execute format('drop policy if exists %I_admin_all on web.%I', t, t);
      -- original policy names varied; drop the known ones too
      execute format('drop policy if exists content_admin_all on web.%I', t);
      execute format($p$create policy %I_admin_all on web.%I for all to authenticated using (web.is_admin()) with check (web.is_admin())$p$, t, t);
    end if;
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Storage bucket web-media (public read; admin-only write)
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('web-media', 'web-media', true, 15728640,
        array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists web_media_admin_write on storage.objects;
create policy web_media_admin_write on storage.objects for insert to authenticated
  with check (bucket_id = 'web-media' and web.is_admin());
drop policy if exists web_media_admin_update on storage.objects;
create policy web_media_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'web-media' and web.is_admin()) with check (bucket_id = 'web-media' and web.is_admin());
drop policy if exists web_media_admin_delete on storage.objects;
create policy web_media_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'web-media' and web.is_admin());
-- public read is handled by the bucket's public flag; no select policy needed for anon on a public bucket.
