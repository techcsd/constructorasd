-- constructorasd.com — web.dev_notes (the /admin "Dev notes" module). BU1: sgc-dev first, then csd-core.
-- Unlike the public web.* tables, dev_notes IS reachable by AUTHENTICATED users (the developer): the admin
-- panel reads/writes it directly with the anon client after a Supabase Auth login. Public sign-ups are
-- disabled on the project, so "authenticated" == the single dev account. leads/job_applications/etc. stay
-- fully closed to authenticated (no grants, no policies).

create extension if not exists pgcrypto; -- gen_random_uuid()

create table if not exists web.dev_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',                                   -- markdown
  status text not null default 'open'   check (status in ('open','done')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);

create index if not exists dev_notes_created_idx on web.dev_notes (created_at desc);
create index if not exists dev_notes_status_idx  on web.dev_notes (status);

-- keep updated_at fresh on edits
create or replace function web.touch_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dev_notes_touch on web.dev_notes;
create trigger dev_notes_touch before update on web.dev_notes
  for each row execute function web.touch_updated_at();

-- RLS: locked to the single admin email (NOT "any authenticated"). These are shared BU1 projects, so
-- auth.users may hold other accounts (SGC); the JWT email claim is signed by Supabase Auth and can't be
-- forged, so only a session for this exact email can touch dev_notes. anon gets nothing.
alter table web.dev_notes enable row level security;

drop policy if exists dev_notes_auth_all on web.dev_notes;
drop policy if exists dev_notes_admin_all on web.dev_notes;
create policy dev_notes_admin_all on web.dev_notes
  for all to authenticated
  using (auth.jwt() ->> 'email' = 'tecnologia@constructorasd.com')
  with check (auth.jwt() ->> 'email' = 'tecnologia@constructorasd.com');

-- Grants: authenticated needs schema usage + rights on dev_notes ONLY (never leads/applications).
grant usage on schema web to authenticated;
grant select, insert, update, delete on web.dev_notes to authenticated;

-- service_role keeps full access.
grant all on web.dev_notes to service_role;
