-- constructorasd.com — schema `web` (WA11). Isolated from SGC's schemas in the same project.
-- BU1: applied to sgc-dev first (tested), then csd-core prod. Recorded in web.migrations.
-- Rule 5: NO anon/authenticated policies — only the edge functions (service role) read/write.

create schema if not exists web;

create table if not exists web.migrations (
  id text primary key,
  applied_at timestamptz not null default now(),
  env text
);

create table if not exists web.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  locale text not null check (locale in ('es','en')),
  name text not null,
  company text,
  email text not null,
  phone text,
  project_type text,
  message text not null,
  consent boolean not null default false,
  source text default 'web',
  page text,
  utm jsonb,
  ip_hash text,
  user_agent text,
  status text not null default 'nuevo' check (status in ('nuevo','contactado','descartado')),
  emailed_at timestamptz,
  email_error text
);

create table if not exists web.job_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  locale text not null check (locale in ('es','en')),
  job_slug text,                               -- null = candidatura espontánea
  name text not null,
  email text not null,
  phone text,
  message text,
  cv_path text not null,
  cv_size int,
  cv_mime text,
  consent boolean not null default false,
  ip_hash text,
  user_agent text,
  status text not null default 'nuevo' check (status in ('nuevo','revisado','descartado'))
);

create table if not exists web.rate_limits (
  key text primary key,
  hits int not null,
  window_start timestamptz not null
);

create table if not exists web.client_errors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  message text not null,
  source text,
  page text,
  user_agent text,
  ip_hash text
);

-- RLS on, NO policies for anon/authenticated (service role bypasses RLS).
alter table web.leads            enable row level security;
alter table web.job_applications enable row level security;
alter table web.rate_limits      enable row level security;
alter table web.client_errors    enable row level security;

revoke all on schema web from anon, authenticated;
revoke all on all tables in schema web from anon, authenticated;

-- The edge functions use the service_role (bypasses RLS). Grant it access to the new schema explicitly
-- (new schemas don't auto-grant). anon/authenticated remain with nothing.
grant usage on schema web to service_role;
grant all on all tables in schema web to service_role;
grant all on all sequences in schema web to service_role;
alter default privileges in schema web grant all on tables to service_role;
alter default privileges in schema web grant all on sequences to service_role;

-- Indexes
create index if not exists leads_created_at_idx   on web.leads (created_at desc);
create index if not exists leads_status_idx       on web.leads (status);
create index if not exists leads_email_idx        on web.leads (email);
create index if not exists apps_created_at_idx     on web.job_applications (created_at desc);
create index if not exists apps_status_idx         on web.job_applications (status);
create index if not exists apps_email_idx          on web.job_applications (email);
create index if not exists client_errors_created_idx on web.client_errors (created_at desc);

-- Private CV bucket (idempotent). No public access; the edge function issues short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'web-cv', 'web-cv', false, 5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
