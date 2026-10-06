# Round 02 QA — `csd imp 06102026` (v1.6.0)

Every item from Xaviel's notes (WD) and the 06-oct live audit (WE), with the before state (from the
audit), what it is now, and the regression guard that keeps it fixed. Screenshots of the fixed states are
in `docs/round-02-qa/`. Lighthouse could not run locally (Chrome crashes in this environment — the
`lighthouse.mjs` script is best-effort by design); the **Vercel preview is the source of truth** for the
Lighthouse budgets.

| Item | Before (audit) | After | Guarded by |
|---|---|---|---|
| **WD4/WE9** contact send bug | Any message < 20 chars → 400 `message_short` → generic "no pudimos enviar"; "Garage de autos." never sent | `MSG_MIN=10` both sides; short msg → inline field error, no request; valid msg → 200 (verified dev **and** prod) | `lead-validation.spec` MSG_MIN parity + 10/9 char cases; `e2e/contact` short-msg + success |
| **WD3/WF4** phone mask | Plain `<input type=tel>`, no formatting | Live `809-692-5906` / intl grouping; `phone_e164` stored | `phone-format.spec` (11 cases); `e2e/contact` typing → `809-692-5906` |
| **WE9/WF8** error mapping / resend | Generic banner for every failure; no way to send another | Field errors mapped; rate-limit specific copy; "Enviar otro mensaje" + scroll/focus | `e2e/contact` rate-limit copy + resend reset |
| **WD2/WF1** map | Static grid placeholder with 2 dots | Google Maps Embed, SD/PC tabs (fallback card until the key exists) | `map-embed-src.spec`; `e2e/map` tabs + iframe-or-fallback |
| **WD1/WE10** hero "Hablemos" invisible | Ink border/text on a dark photo → nearly invisible | On-dark secondary variant (bone border/text, translucent fill) | `verify-contrast` on-dark button pairs (AA both tones) |
| **WE2/WF5** reveal blank viewport | Navigating to a detail showed an empty viewport until scroll; ghost blocks | In-viewport elements reveal immediately; 0.01 threshold; 1200 ms failsafe | `e2e/layout` detail H1 opacity==1 after nav |
| **WE1** quote one-word-per-line | `max-width:24ch` on the 16px host ≈ 215px | Measure moved to the h2 text (`min(100%,42rem)`) | `e2e/layout` quote width ≥ 50% of container |
| **WE3/WF6** detail hero | Page started at the title; cover only in the gallery | Full-width 21:9/4:3 hero, title+client over scrim, facts/narrative below | `e2e/projects` cover image present; prerender all slugs |
| **WE4** horizontal scroll | `width:100vw` hero overflowed by the scrollbar | Hero full-bleed without 100vw; `overflow-x:clip` guard | `find-overflow.mjs` + `e2e/layout` no-scroll @390/768/1440 |
| **WE5** LQIP never resolves | Cards stayed blurred 1–3 s after load | Blur resolves on `img` decode/load (≤250 ms); priority/eager for first cards | blur-up tied to decode; first-3 `/proyectos` cards `priority` |
| **WE6/WF7** FAB invisible on dark | Ink circle on ink sections → only the glyph showed | Bone disc + ink glyph over dark sections/footer (observer) | observer toggles `.app-wa-fab--on-dark` (verified in capture) |
| **WE7** Lopesan gallery | 5 material-stack photos, no structure | Curated to estructura / apuntalamiento / fachada | `projects.ts` curation; richer set logged in CONTENIDO-PENDIENTE |
| **WE8** prev/next row | "Todos los proyectos" tiny/centered, no icon | 3-col prev/all/next, eyebrow labels, sprite arrows, ghost button | layout holds with empty columns when an edge is missing |
| **WE12** repeated location | "República Dominicana" on 7 cards | Placeholder omitted from card meta (kept in detail facts) | `e2e/layout` no placeholder in card meta |
| **WD5/WF2** low-res photos | Plaza Roque only 480w; several covers < 1600 | Covers upscaled to ≥1600w (sharp fallback); budget held | `verify-images` ≥1600 cover rule; `upscale-images.mjs` |

## Verification summary

- `npm run build` — green (all `verify-*` guards; 53 routes prerendered in both languages).
- `npm test` — 54 vitest passing.
- `npm run test:e2e` — 63 Playwright passing.
- Supabase: `phone_e164` migration + `web-contact` / `web-apply` deployed to **dev and prod**; dev POST
  of "Garage de autos." returned **200** with `phone_e164` stored and `emailed_at` set.
- Lighthouse: run on the Vercel preview (local Chrome unavailable).
