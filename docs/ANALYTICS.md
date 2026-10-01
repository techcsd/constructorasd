# Analytics & monitoring — constructorasd.com

## What we collect

- **Vercel Web Analytics** (prod only): aggregate, **cookieless** page views and referrers. No personal
  data, no cross-site tracking, no cookies → **no cookie banner required**. Injected only when
  `environment.production` is true (`src/app/app.ts`).
- **Vercel Speed Insights** (prod only): anonymous Core Web Vitals (LCP/CLS/INP) samples.
- **Custom events** (no PII): `lead_submitted` and `application_submitted` — fired on a successful form
  submit (`LeadsService` callers). Just the event name; no field values.
- **Client errors**: uncaught `error` / `unhandledrejection` are posted (rate-limited, ≤1 kB, no PII — just
  the message + path + user-agent) to the `web-client-error` edge function → `web.client_errors`. Useful for
  spotting runtime breakage; could be surfaced from SGC Tecnología later.

## Lead data (not analytics)

Contact/application submissions are stored in `web.leads` / `web.job_applications` (Supabase, service role
only). The IP is never stored raw — only a salted SHA-256 hash (`ip_hash`) for rate limiting. This is
consistent with the privacy policy (`/privacidad`): data is used to answer requests and for recruitment,
kept by Constructora SD, processed by Resend (email) and Supabase (storage) as processors.

## Uptime

`constructorasd.com` should be added to SGC's existing infrastructure monitoring (DNS/RDAP/HTTP + Telegram
alerts). That change lives in the SGC repo and is **not** made here — see `CONTENIDO-PENDIENTE.md`
("Para la próxima ronda de SGC").
