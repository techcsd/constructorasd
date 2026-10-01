# constructorasd.com

Corporate website of **Constructora Scheker & Domínguez (CSD)** — a Dominican construction company
(earthworks, structures, light systems, finishes, turnkey resorts & hospitals). Bilingual (Spanish
default, English under `/en`), built with Angular 21 (standalone, signals, `@angular/ssr` static
prerender), deployed on Vercel, with leads/CVs persisted to Supabase (schema `web`) + email via Resend.

Built and maintained solo with Claude Code. See `CLAUDE.md` for the house rules and `docs/` for the design
brief, decisions, content model, environments, analytics and the DNS cutover.

## Requirements

- Node 20+ / npm 10+ (the repo pins `legacy-peer-deps=true` in `.npmrc`).
- A `.env.local` (gitignored). Generate it from the Supabase Management API:
  ```bash
  SUPABASE_ACCESS_TOKEN=… node scripts/supabase/init-env.mjs
  ```
  It writes `SUPABASE_URL_{DEV,PROD}`, `SUPABASE_ANON_KEY_{DEV,PROD}`, `SITE_URL_*` and project refs.
  Service-role keys are **not** stored (rule 5).

## Common commands

| Command | What it does |
|---|---|
| `npm start` | dev server (`ng serve`); generates a dev `environment.ts` first |
| `npm run build` | runs all `verify-*` guards (prebuild), prerenders every route in ES+EN, then the sitemap |
| `npm run build:dev` / `build:prod` | env-resolved build via `scripts/build-env.mjs` (what Vercel runs) |
| `npm test` | vitest unit tests (i18n, routes, SEO, contrast, content, lead validators) |
| `npm run test:e2e` | Playwright smoke (run `npm run build` first) |
| `npm run images` | optimize `assets-src/**` → `public/img/**` (AVIF/WebP, manifest) |
| `npm run og` | regenerate the default Open Graph image |
| `npm run lighthouse` | local Lighthouse on `/` and a project detail (needs Chrome or Playwright’s Chromium) |

## Deploy

Vercel builds via `vercel.json` → `node scripts/build-env.mjs`, which picks the env from the branch
(`main` → prod, else dev), generates `environment.ts`, runs the guards and prerenders. Branch `dev` gets a
preview; `main` is production. **Production domain and DNS are gated on Xaviel’s OK** (CLAUDE.md rule 6).

## Backend (schema `web`)

Supabase projects are shared with SGC (BU1): `dev = sgc-dev`, `prod = csd-core`; CSD lives in schema `web`.
Apply migrations with `node scripts/supabase/apply.mjs --env dev|prod`; edge functions in
`supabase/functions/` (`web-contact`, `web-apply`, `web-client-error`) are deployed per environment. The
site only ever calls the edge functions with the **anon** key; the service role never reaches the browser.

## Repo layout

See `CLAUDE.md` → *Repo map*. In short: `src/app/{core,ui,pages}`, `src/content/` (typed, Supabase-ready
data), `src/styles/` (semantic tokens), `scripts/` (guards + tooling), `sql/`, `supabase/functions/`,
`docs/`.
