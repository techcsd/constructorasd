# DESIGN BRIEF — constructorasd.com

Single source of truth for the visual system. Claude Code implements this as SCSS tokens + components in Prompt 1 and applies it to every page in Prompts 2–3. Everything here is a decision, not a suggestion; deviations require a note in `docs/DESIGN-DECISIONS.md`.

## 0. Intent in one paragraph

A construction company that delivers resorts and hospitals turnkey. The site must feel **built**: heavy, calm, precise. Think architecture-studio editorial, not SaaS landing page. Big photography of real work, large quiet type, one warm accent used like safety paint on concrete — rarely and on purpose. It must look clearly different from SGC (the ERP: navy + orange, app-like) and must **never read as AI-generated**.

## 1. Anti-AI rules (hard — enforced by `scripts/verify-no-ai-tropes.mjs`)

Forbidden anywhere in the site:

1. Background gradients on body/sections/cards (allowed only as a subtle photo scrim: `linear-gradient(to top, rgba(ink,.72), transparent 60%)` over images).
2. Glassmorphism / `backdrop-filter: blur` panels.
3. Purple, violet, indigo, teal or "AI blue" anywhere. The palette below is closed.
4. Rounded-square gradient icon tiles; the "3 cards with icon + title + 2 lines" row as a hero follow-up.
5. Emojis as icons (SVG `stroke="currentColor"` only, 1.5px, from a single sprite).
6. Centered-everything layouts. Default alignment is **left**; centered text only for the stats band and the final CTA.
7. Stock-photo clichés (handshakes, hard hats on a blueprint, smiling diverse team at a laptop). Only real CSD photos or neutral placeholders (solid `concrete-200` block with a thin label), never generated images.
8. Copy clichés: "Elevate", "Unlock", "Seamless", "Cutting-edge", "Soluciones integrales a su medida", "¡Bienvenido!", exclamation marks in headings, rhetorical questions as headlines. Headlines are statements. Source copy is the 2026 presentation; adapt, don't inflate.
9. Floating blobs, particles, 3D illustrations, mesh backgrounds, "glow" shadows, neon borders, animated gradient text.
10. Card borders with a thick colored left stripe; pill badges everywhere; more than one accent color on screen.
11. Scroll-jacking, parallax heavier than 8px drift, typewriter effects, counters that animate for more than 900ms.
12. Lorem ipsum in any committed file.

## 2. Color tokens

Primitives (never used directly in components):

```scss
--bone-50:  #FAF8F4;  --bone-100: #F4F1EB;  --bone-200: #EAE5DB;
--concrete-100: #D9D5CC; --concrete-200: #B9B4A9; --concrete-400: #8A857B;
--concrete-600: #5C584F; --concrete-800: #2E2C28;
--ink-900: #141516;  --ink-800: #1C1D1F;  --ink-700: #26282B;
--oxide-600: #A8370A; --oxide-500: #C2410C; --oxide-300: #E8814F; --oxide-100: #F8E3D6;
--white: #FFFFFF;
```

Semantic (what components use). Light is the default; sections can opt into the dark set via `data-tone="dark"` on the `<section>`.

| Token | Light (`bone`) | Dark (`ink`) |
|---|---|---|
| `--bg` | bone-100 | ink-900 |
| `--bg-elevated` | bone-50 | ink-800 |
| `--bg-sunken` | bone-200 | ink-700 |
| `--text` | ink-900 | bone-50 |
| `--text-2` | concrete-600 | concrete-200 |
| `--text-3` | concrete-400 | concrete-400 |
| `--line` | concrete-100 | ink-700 |
| `--line-strong` | concrete-200 | concrete-800 |
| `--accent` | oxide-500 | oxide-300 |
| `--accent-hover` | oxide-600 | oxide-500 |
| `--text-on-accent` | white | ink-900 |
| `--focus` | oxide-500 | oxide-300 |

Rules: accent appears on at most **one** element per viewport (the primary CTA, or an eyebrow rule, or a hovered link underline) — the guard counts `--accent` usages per component and fails above 3 per template. All text/background pairs must pass WCAG AA (4.5:1); `scripts/verify-contrast.mjs` checks the token table.

## 3. Typography

Self-hosted variable woff2 in `public/fonts/` (download from Fontsource at build-prep, commit the woff2, `font-display: swap`, `size-adjust` fallbacks to avoid CLS).

- **Hanken Grotesk** `100–900` — everything (display, body, UI). Display uses weight 500–600 with tight tracking (`-0.02em` to `-0.035em`), never 800+.
- **Instrument Serif** italic `400` — only for: the brand philosophy quote, big numerals in the stats band, and one-word emphasis inside a display headline (`<em>`). Max one serif moment per screen.

Fluid scale (clamp, 16px base, 1.2 ratio mobile → 1.333 desktop):

| Token | Size | Use |
|---|---|---|
| `--fs-display` | clamp(2.75rem, 6.5vw, 6rem) | Hero H1 only, line-height .98 |
| `--fs-h1` | clamp(2.25rem, 4.5vw, 4rem) | Page titles, line-height 1.02 |
| `--fs-h2` | clamp(1.75rem, 3vw, 2.75rem) | Section titles, lh 1.08 |
| `--fs-h3` | clamp(1.25rem, 1.8vw, 1.5rem) | Card titles, lh 1.2 |
| `--fs-lead` | clamp(1.125rem, 1.4vw, 1.375rem) | Intro paragraphs, lh 1.45, color `--text-2` |
| `--fs-body` | 1rem / 1.0625rem desktop | lh 1.6, max-width 65ch |
| `--fs-small` | .875rem | meta, captions, lh 1.5 |
| `--fs-eyebrow` | .75rem | uppercase, tracking .14em, weight 600, `--text-3` |

Eyebrows (`SECCIÓN 02 / ALCANCE`) echo the presentation and are the main "system" signature: a short uppercase label with a 24px hairline in `--line-strong` before it.

## 4. Layout & spacing

- Container: `max-width: 1320px`, side padding `clamp(20px, 4vw, 56px)`. Wide/full-bleed images break the container.
- Grid: 12 columns, gutter 24px (32px ≥ 1200px). Compositions are **asymmetric on purpose**: text in cols 1–5, image in 6–12; or an image offset upward by `--space-10` over a dark band.
- Spacing scale (`--space-1..16`): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160, 192 px. Section padding: `--space-11` (128) desktop, `--space-9` (64) mobile. Generous whitespace is part of the look — do not compress.
- Radii: `--r-sm: 2px`, `--r-md: 4px`, `--r-img: 6px`. No pills except the WhatsApp FAB (circle). No 16px+ radii.
- Shadows: almost none. `--shadow-1: 0 1px 2px rgba(20,21,22,.06)` for sticky header; images get no shadow.
- Lines: 1px hairlines in `--line` structure the page (table-like rows for the project index, the service stages, the client list). This is the second system signature.
- Breakpoints: 480 / 768 / 1024 / 1280 / 1536. Mobile first.

## 5. Motion

- Page-load: none beyond the hero image fade (300ms).
- On-scroll reveal: `opacity 0→1` + `translateY(12px→0)`, 420ms, `cubic-bezier(.2,.7,.2,1)`, stagger 60ms, once. Implemented with one `IntersectionObserver` directive (`appReveal`), SSR-safe (no-op on server; content is visible without JS).
- Hover: links get a 1px underline that grows from left (180ms); image cards scale `1.00→1.02` over 600ms with `overflow:hidden`; buttons change background only.
- Numerals in the stats band count up over 800ms, once, only if `prefers-reduced-motion: no-preference`.
- `prefers-reduced-motion: reduce` disables every transform/opacity animation globally.

## 6. Components (build in Prompt 1, showcase on `/styleguide`)

| Component | Spec |
|---|---|
| `Header` | Transparent over the hero (light text on dark photo), becomes `--bg-elevated` with hairline after 24px scroll. Left: logo (black on light / white on dark variant, SVG). Center-right: 6 links (Empresa, Servicios, Proyectos, Equipos, Noticias, Contacto). Right: language switch `ES / EN` (text, current one in `--text`, other in `--text-3`) + primary button "Hablemos". Mobile: full-screen menu, ink background, links at `--fs-h2`. |
| `Button` | Variants `primary` (accent bg, `--text-on-accent`), `secondary` (1px `--line-strong`, transparent, text `--text`), `ghost` (text + arrow). Height 48px, padding 0 24px, radius `--r-sm`, weight 500, no uppercase. Arrow icon `→` is SVG, shifts 4px on hover. |
| `Eyebrow` | hairline + uppercase label; optional index `01`. |
| `SectionHeading` | Eyebrow + H2 (max 14 words) + optional lead; grid: heading cols 1–6, lead cols 8–12. |
| `StatsBand` | Dark tone. 3–4 stats; numeral in Instrument Serif at `--fs-display`, label in eyebrow style. Hairlines between items. |
| `StageRow` | For the 7 construction stages: a table-like row — index `01`, title, one-line description, chevron; expands (details/summary, no JS required) to reveal 4 bullet capabilities + 1 image. |
| `ProjectCard` | Image 4:5 (index) or 16:10 (featured), below it: name (`--fs-h3`), then `CLIENTE · Sector · Ciudad` in small. No overlay text on images except the featured hero. |
| `ProjectIndexRow` | Alternative list view: hairline rows with name / client / sector / year, hover shows thumbnail at the right edge (desktop only). |
| `ClientWall` | Logos in grayscale at 60% opacity, 6/4/2 columns, hairlines; where a logo is missing, render the client name in `--fs-small` uppercase (never a placeholder image). |
| `Quote` | Instrument Serif italic, `--fs-h2`, left rule 1px (not 3px+), attribution in eyebrow style. |
| `ImageFigure` | `NgOptimizedImage`, AVIF/WebP `srcset`, `aspect-ratio` reserved, optional caption in `--fs-small` `--text-3`. |
| `ContactForm` | Fields: nombre, empresa, email, teléfono, tipo de proyecto (select: Hotelero / Institucional / Hospitalario / Industrial / Residencial / Minero / Otro), mensaje, consentimiento (checkbox linking Privacidad). Labels above inputs, 1px bottom-border inputs on bone, 2px on focus in `--focus`. Inline validation, success state replaces the form with a short confirmation. |
| `WhatsAppFab` | Circle 56px, ink background, white WhatsApp glyph, bottom-right, hidden on the contact page. Link `https://wa.me/18096925906?text=...` (prefilled ES/EN). |
| `Footer` | Dark tone. 4 columns: brand + one-line description; navigation; contact (phones, email, Instagram); legal (Privacidad, Aviso legal) + `© 2026 Constructora Scheker & Domínguez`. Bottom hairline row with "Santo Domingo / Punta Cana". |
| `LangSwitch` | Keeps the same route in the other language (`/proyectos/olea` ↔ `/en/projects/olea`). |

## 7. Page compositions (apply in Prompt 2)

**Home `/`**
1. Hero: full-bleed photo (Lopesan structure or the best formwork shot), ink scrim, H1 `Construyendo el futuro con bases sólidas` with `<em>sólidas</em>` in serif, lead from slide 1, two buttons (Ver proyectos / Hablemos). Bottom-left eyebrow: `Santo Domingo · Punta Cana · desde 2014`.
2. Intro (bone): eyebrow `01 / La empresa`, H2 "Un solo equipo, todo el ciclo constructivo.", lead from slide 3, ghost link "Conocer la empresa".
3. StatsBand (ink): 45+ proyectos · 12 años · 8 ciudades y regiones · 7 etapas.
4. Stages: 7 `StageRow`s.
5. Featured projects: 1 featured + 4 cards, link "Todos los proyectos".
6. Sectors: 6 items in a 3×2 hairline grid, each with sector name + 1 line + representative project.
7. Quote: «Innovar es una actividad de riesgo, cuyo principal riesgo es no practicarla.» — Filosofía empresarial CSD.
8. ClientWall (12 logos max on home, link to all).
9. Advantages: 6 items (slide 23) as a two-column numbered list, not cards.
10. CTA band (ink): "Construyamos juntos el próximo proyecto." + button + phones.

**Empresa `/empresa`** — H1, who we are (slide 3), mission/vision side by side, 4 values as a hairline row, philosophy quote, "Cómo trabajamos" (one contract, one responsible — slide 14), advantages, CTA.

**Servicios `/servicios`** — H1 "Del terreno a la llave en mano.", 7 stages each as a full section (alternating image side), with the 4 capabilities from slides 7–14; stage 04 includes the heights table (6.00 m / 9.00 m / 12 m+ / 5.00 m muros). Anchor links `#etapa-01…07`.

**Equipos `/equipos`** — the 8 equipment lines (slide 11) as hairline rows, formwork systems line "Faresin / PERI / Symons", 2 images.

**Proyectos `/proyectos`** — toggle grid/list; filters by sector (client-side, URL `?sector=`); 11 projects. **Detail `/proyectos/:slug`** — hero image, facts column (Cliente, Sector, Ubicación, Alcance, Etapas ejecutadas), narrative (from the presentation, 2–4 short paragraphs; where missing, a factual 1-paragraph summary — never invented figures), gallery, prev/next project.

**Clientes `/clientes`** — intro + full ClientWall (all ~42 names), grouped: Promotores y constructoras / Hotelería / Industria y minería / Instituciones.

**Vacantes `/vacantes`** — intro, open positions list (from `content/jobs.ts`; if empty: "No hay vacantes abiertas — envíanos tu CV" with the spontaneous-application form), detail `/vacantes/:slug` with the application form (CV upload).

**Noticias `/noticias`** — list of posts (title, date, 1-line summary, optional image), **`/noticias/:slug`** article layout at 65ch.

**Contacto `/contacto`** — two columns: form (left, cols 1–6) / details (right, cols 8–12: phones, email, Instagram, presence, hours), static map image.

**Legal** — `/privacidad`, `/aviso-legal`: plain article layout.

**`/styleguide`** (not linked, `noindex`) — tokens, type scale, buttons, eyebrow, stats band, stage row, project card, client wall, form, header states, dark/light sections, and a real Home hero mock. This is the WA15 checkpoint page.

## 8. Imagery rules

- Real photos only. Priority: presentation `ppt/media` images (mapped to projects by slide), then the Lopesan folder. Crop to 3:2 / 4:5 / 16:10; no filters beyond a slight contrast lift; no AI upscaling.
- Every image has a meaningful `alt` (ES and EN) — the guard fails on empty alt or alt equal to the filename.
- Hero/LCP image: `priority`, preloaded, ≤ 180 kB at 1600w AVIF.
- Logos: monochrome SVG if available, else PNG converted to grayscale at build.

## 9. Accessibility & quality bars

- WCAG 2.2 AA; visible focus ring (2px `--focus`, offset 2px); skip-link; semantic landmarks; forms with labels and `aria-describedby` errors; menu is keyboard operable; `lang` per route (`es` / `en`).
- Lighthouse (mobile, Home and a project detail): Performance ≥ 90, Accessibility 100, Best Practices 100, SEO 100. LCP ≤ 2.5 s, CLS ≤ 0.05, INP ≤ 200 ms. Initial JS ≤ 120 kB gz on Home.
