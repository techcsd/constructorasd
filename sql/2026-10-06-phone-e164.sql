-- 2026-10-06-phone-e164.sql — WD3 / WF4
-- Store the normalized E.164 phone (e.g. +18096925906) alongside the human-formatted `phone`
-- ("809-692-5906"). Written only by the web-contact / web-apply edge functions (service role).
-- Idempotent: safe to re-run and to apply dev → prod.

alter table web.leads            add column if not exists phone_e164 text;
alter table web.job_applications add column if not exists phone_e164 text;

comment on column web.leads.phone_e164            is 'Normalized E.164 phone when deducible (RD → +1XXXXXXXXXX), else null.';
comment on column web.job_applications.phone_e164 is 'Normalized E.164 phone when deducible (RD → +1XXXXXXXXXX), else null.';
