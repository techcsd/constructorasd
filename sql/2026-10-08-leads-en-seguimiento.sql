-- 2026-10-08-leads-en-seguimiento.sql (WH4) — add 'en_seguimiento' to the web.leads status CHECK.
-- dev → prod. The original constraint (sql/2026-10-01-web-schema.sql) allowed only
-- nuevo/contactado/descartado; the lead inbox now also offers "en seguimiento".
alter table web.leads drop constraint if exists leads_status_check;
alter table web.leads add constraint leads_status_check
  check (status in ('nuevo', 'contactado', 'en_seguimiento', 'descartado'));
