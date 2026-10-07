-- 2026-10-06-dev-notes-v2.sql (WJ6) — pin/archive/color/template + version history. dev → prod.
alter table web.dev_notes add column if not exists pinned boolean not null default false;
alter table web.dev_notes add column if not exists archived boolean not null default false;
alter table web.dev_notes add column if not exists color text;
alter table web.dev_notes add column if not exists template text;
alter table web.dev_notes add column if not exists last_opened_at timestamptz;

create table if not exists web.dev_note_versions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references web.dev_notes(id) on delete cascade,
  title text,
  body text,
  bytes int,
  saved_at timestamptz not null default now()
);
create index if not exists dev_note_versions_idx on web.dev_note_versions (note_id, saved_at desc);

-- keep at most 50 versions per note
create or replace function web.trim_note_versions() returns trigger language plpgsql as $$
begin
  delete from web.dev_note_versions where id in (
    select id from web.dev_note_versions where note_id = new.note_id order by saved_at desc offset 50
  );
  return null;
end; $$;
drop trigger if exists dev_note_versions_trim on web.dev_note_versions;
create trigger dev_note_versions_trim after insert on web.dev_note_versions
  for each row execute function web.trim_note_versions();

alter table web.dev_note_versions enable row level security;
drop policy if exists dev_note_versions_admin on web.dev_note_versions;
create policy dev_note_versions_admin on web.dev_note_versions for all to authenticated
  using (web.is_admin()) with check (web.is_admin());
grant select, insert, delete on web.dev_note_versions to authenticated;
grant all on web.dev_note_versions to service_role;

-- dev_notes policy already via is_admin() (PROMPT-06). Ensure grants cover the new columns (table-level).
grant select, insert, update, delete on web.dev_notes to authenticated;
