-- 2026-10-06-leads-v2.sql (WJ8) — read state, internal notes, status history, realtime. dev → prod.
alter table web.leads add column if not exists read_at timestamptz;
alter table web.job_applications add column if not exists read_at timestamptz;

-- shared internal-notes + status-history (kind distinguishes leads vs applications)
create table if not exists web.inbox_notes (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('lead','application')),
  ref_id uuid not null,
  body text not null,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);
create index if not exists inbox_notes_idx on web.inbox_notes (kind, ref_id, created_at);

create table if not exists web.inbox_status_history (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  ref_id uuid not null,
  from_status text,
  to_status text,
  changed_at timestamptz not null default now(),
  changed_by uuid default auth.uid()
);
create index if not exists inbox_status_history_idx on web.inbox_status_history (ref_id, changed_at);

create or replace function web.log_lead_status() returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    insert into web.inbox_status_history(kind, ref_id, from_status, to_status) values ('lead', new.id, old.status, new.status);
  end if;
  return new;
end; $$;
drop trigger if exists leads_status_log on web.leads;
create trigger leads_status_log after update on web.leads for each row execute function web.log_lead_status();

create or replace function web.log_app_status() returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    insert into web.inbox_status_history(kind, ref_id, from_status, to_status) values ('application', new.id, old.status, new.status);
  end if;
  return new;
end; $$;
drop trigger if exists apps_status_log on web.job_applications;
create trigger apps_status_log after update on web.job_applications for each row execute function web.log_app_status();

do $$ declare t text; begin
  foreach t in array array['inbox_notes','inbox_status_history'] loop
    execute format('alter table web.%I enable row level security', t);
    execute format('drop policy if exists %I_admin on web.%I', t, t);
    execute format('create policy %I_admin on web.%I for all to authenticated using (web.is_admin()) with check (web.is_admin())', t, t);
    execute format('grant select, insert, update, delete on web.%I to authenticated', t);
    execute format('grant all on web.%I to service_role', t);
  end loop;
end $$;

-- the original grant was column-level select (missing read_at/phone_e164); widen to the whole row so
-- the admin can read every field it shows (RLS still restricts WHICH rows via is_admin).
grant select on web.leads to authenticated;
grant select on web.job_applications to authenticated;
grant update (status, read_at) on web.leads to authenticated;
grant update (status, read_at) on web.job_applications to authenticated;

-- Realtime: add to the supabase_realtime publication (ignore if already present)
do $$ begin
  begin alter publication supabase_realtime add table web.leads; exception when duplicate_object then null; when undefined_object then null; end;
  begin alter publication supabase_realtime add table web.job_applications; exception when duplicate_object then null; when undefined_object then null; end;
end $$;
