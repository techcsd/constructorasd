-- constructorasd.com — web.site_content: the editable site content (one row per section, JSON payload).
-- The build (gen-content.mjs, prebuild) reads this via the Management API and overrides the TS seeds; the
-- /admin Contenido module writes it. RLS: admin email only. Seeded once from the current TS content.

create table if not exists web.site_content (
  key text primary key,                 -- 'company' | 'projects' | 'clients' | 'sectors' | 'stages' | 'equipment' | 'posts' | 'jobs' | 'page_meta'
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function web.touch_updated_at() returns trigger
  language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists site_content_touch on web.site_content;
create trigger site_content_touch before update on web.site_content
  for each row execute function web.touch_updated_at();

alter table web.site_content enable row level security;

drop policy if exists content_admin_all on web.site_content;
create policy content_admin_all on web.site_content
  for all to authenticated
  using (auth.jwt() ->> 'email' = 'tecnologia@constructorasd.com')
  with check (auth.jwt() ->> 'email' = 'tecnologia@constructorasd.com');

grant usage on schema web to authenticated;
grant select, insert, update, delete on web.site_content to authenticated;
grant all on web.site_content to service_role;

-- The build (prebuild gen-content) reads site_content with the anon key — the content is public anyway.
drop policy if exists content_public_read on web.site_content;
create policy content_public_read on web.site_content for select to anon using (true);
grant usage on schema web to anon;
grant select on web.site_content to anon;
