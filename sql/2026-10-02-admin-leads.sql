-- constructorasd.com — admin read access to the lead inbox (contact + CV applications).
-- BU1: sgc-dev first, then csd-core. Like dev_notes, access is locked to the admin email via RLS so the
-- /admin panel can read them with the anon client after login. anon still gets nothing.

-- web.leads: admin can read + update status.
drop policy if exists leads_admin_read on web.leads;
create policy leads_admin_read on web.leads
  for select to authenticated
  using (auth.jwt() ->> 'email' = 'tecnologia@constructorasd.com');

drop policy if exists leads_admin_update on web.leads;
create policy leads_admin_update on web.leads
  for update to authenticated
  using (auth.jwt() ->> 'email' = 'tecnologia@constructorasd.com')
  with check (auth.jwt() ->> 'email' = 'tecnologia@constructorasd.com');

grant select (
  id, created_at, locale, name, company, email, phone, project_type, message, consent,
  page, status, emailed_at, email_error
), update (status) on web.leads to authenticated;

-- web.job_applications: admin can read + update status.
drop policy if exists apps_admin_read on web.job_applications;
create policy apps_admin_read on web.job_applications
  for select to authenticated
  using (auth.jwt() ->> 'email' = 'tecnologia@constructorasd.com');

drop policy if exists apps_admin_update on web.job_applications;
create policy apps_admin_update on web.job_applications
  for update to authenticated
  using (auth.jwt() ->> 'email' = 'tecnologia@constructorasd.com')
  with check (auth.jwt() ->> 'email' = 'tecnologia@constructorasd.com');

grant select, update (status) on web.job_applications to authenticated;

grant usage on schema web to authenticated;

-- Let the admin read CVs in the private web-cv bucket (to mint short-lived signed download URLs).
drop policy if exists cv_admin_read on storage.objects;
create policy cv_admin_read on storage.objects
  for select to authenticated
  using (bucket_id = 'web-cv' and auth.jwt() ->> 'email' = 'tecnologia@constructorasd.com');
