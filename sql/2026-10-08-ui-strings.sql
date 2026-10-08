-- 2026-10-08-ui-strings.sql (WL6/WM3/WN2) — every visible UI string editable from the admin.
-- key = the Spanish source text (the t() key). es = optional ES override (null/equal = use the key as-is).
-- en = English. context = human description; page = where it appears. The build (gen-content, anon) reads
-- it and merges it into the t() catalog; the TS/JSON files stay as fallback defaults. dev → prod.
create table if not exists web.ui_strings (
  key text primary key,
  es text,
  en text,
  context text,
  page text,
  updated_at timestamptz not null default now()
);

drop trigger if exists ui_strings_touch on web.ui_strings;
create trigger ui_strings_touch before update on web.ui_strings
  for each row execute function web.touch_updated_at();

alter table web.ui_strings enable row level security;

drop policy if exists ui_strings_admin_all on web.ui_strings;
create policy ui_strings_admin_all on web.ui_strings for all to authenticated
  using (web.is_admin()) with check (web.is_admin());

-- Public text: anon may read (the static build fetches it with the anon key).
drop policy if exists ui_strings_public_read on web.ui_strings;
create policy ui_strings_public_read on web.ui_strings for select to anon using (true);

grant select, insert, update, delete on web.ui_strings to authenticated;
grant select on web.ui_strings to anon;
grant all on web.ui_strings to service_role;
