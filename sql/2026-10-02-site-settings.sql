-- constructorasd.com — web.site_settings: a single row of live appearance settings the admin can change.
-- Public (anon) can READ it so the site applies it at runtime; only the admin email can WRITE it.
-- Kept deliberately small/safe (brand accent color) so admin changes can't break the design system.

create table if not exists web.site_settings (
  id int primary key default 1,
  accent text,                                   -- hex like #c2410c; null = use the design default
  updated_at timestamptz not null default now(),
  constraint site_settings_single_row check (id = 1)
);
insert into web.site_settings (id) values (1) on conflict (id) do nothing;

alter table web.site_settings enable row level security;

drop policy if exists settings_public_read on web.site_settings;
create policy settings_public_read on web.site_settings
  for select to anon, authenticated using (true);

drop policy if exists settings_admin_write on web.site_settings;
create policy settings_admin_write on web.site_settings
  for update to authenticated
  using (auth.jwt() ->> 'email' = 'tecnologia@constructorasd.com')
  with check (auth.jwt() ->> 'email' = 'tecnologia@constructorasd.com');

-- anon needs schema usage to reach site_settings via REST (only this table is granted to anon; the rest
-- of web.* stays closed to anon by having no grants + RLS).
grant usage on schema web to anon;
grant select on web.site_settings to anon, authenticated;
grant update on web.site_settings to authenticated;
