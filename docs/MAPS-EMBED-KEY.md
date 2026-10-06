# Google Maps Embed key — `constructorasd-web-embed` (WD2 / WF1 / WG2)

The `/contacto` map uses the **Google Maps Embed API** in `place` mode (two city tabs). The key is
**public by nature** (it travels in the `<iframe src>`) but is **referrer-restricted**, so it only works
from our domains — the same model as SGC's browser key. **No key is ever committed to the repo**: it
lives only in `MAPS_EMBED_KEY` (`.env.local` locally, Vercel env in CI) and is injected into the
generated, gitignored `environment.ts` as `mapsEmbedKey`.

> **Status (06-oct-2026 — DONE):** per Xaviel's instruction, the map reuses the **existing SGC GCP key**
> (`sgc.parametros.google_maps_browser_key`), verified to work for the Maps Embed API from `localhost`,
> `*.vercel.app` and `constructorasd.com`. It is set as `MAPS_EMBED_KEY` in `.env.local` and in Vercel
> (preview + production), so the real map is live. The steps below are kept only for **rotating** the key
> or moving to a dedicated `constructorasd-web-embed` key later.

## Create the key (Google Cloud Console)

Use the **same GCP project that already holds SGC's Maps keys** (the project with the general
`AIzaSy…` key described in `SGC/docs/google-maps-cloud-checklist.md`). The Embed API has **no cost**.

1. **APIs & Services → Library →** enable **Maps Embed API** (only this one is needed for the embed).
2. **APIs & Services → Credentials → Create credentials → API key.** Rename it
   **`constructorasd-web-embed`**.
3. **Application restrictions → Websites (HTTP referrers).** Add exactly:
   - `https://constructorasd.com/*`
   - `https://www.constructorasd.com/*`
   - `https://constructorasd*.vercel.app/*`  (preview deploys)
   - `http://localhost:4200/*`  (local dev)
4. **API restrictions → Restrict key →** select **Maps Embed API** only.
5. Copy the key value.

(If you have `gcloud` authenticated elsewhere, the equivalent is:
`gcloud services enable maps-embed-backend.googleapis.com` then create/annotate the key with the same
referrer + API restrictions. Do **not** widen SGC's existing browser key.)

## Install the key

- **Local:** add to `.env.local` (gitignored):
  ```
  MAPS_EMBED_KEY=<the key>
  ```
- **Vercel:** add `MAPS_EMBED_KEY` to **Project → Settings → Environment Variables** for **Preview**
  and **Production**. Redeploy (or push to `dev`) — `scripts/gen-environment.mjs` exposes it as
  `environment.mapsEmbedKey` and the iframe replaces the fallback automatically.

## Exact office address (WG1)

The pins currently point at the **city centers** of Santo Domingo and Punta Cana (`company.ts →
offices[].query`). When the exact street address is known, update `query` (and optionally
`addressLine`) there, or from **/admin › Contenido** if it exposes company fields. One-line change,
no code.

## Guards

- `verify-sin-ref-hardcodeado.mjs` fails the build if a Google API key literal (`AIza…`) appears
  anywhere under `src/`, `scripts/`, `sql/` or `supabase/functions/`.
- CSP (`vercel.json`) allows the iframe via `frame-src https://www.google.com` while keeping
  `frame-ancestors 'none'`.
