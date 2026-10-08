-- 2026-10-08-settings-data.sql (WN2 / Ajustes) — extend web.site_settings with a flexible `data` jsonb for
-- the global settings module (destination emails, WhatsApp message, social, legal data, maintenance banner,
-- analytics). Public (anon) already reads the row; only the admin writes it. dev → prod.
alter table web.site_settings add column if not exists data jsonb not null default '{}'::jsonb;
