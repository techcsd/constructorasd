# ADMIN DESIGN BRIEF — "Dark studio console" (constructorasd.com `/admin`)

The admin is Xaviel's tool, not the brand's showroom. It can look nothing like the public site. Direction chosen 08-oct: **dark studio console** — a pro tool that feels fast, precise and a little cinematic. Fixed dark theme (no toggle). Claude Code implements this as its own token sheet and proves it on `/admin/styleguide` + two real screens before touching the rest (gate WO1).

## 1. Mood in one line
A night-shift control room for a construction company: graphite surfaces, warm oxide signal lights, crisp mono numbers, things glide instead of jump.

## 2. Tokens (`src/app/admin/styles/admin-tokens.scss`, scoped under `.admin-root`)

```scss
// Surfaces (graphite ramp, slightly warm)
--a-bg:        #0E1012;   // app canvas
--a-bg-2:      #141719;   // sidebar / rails
--a-surface:   #1A1D21;   // cards, panels
--a-surface-2: #22262B;   // hover / inset
--a-surface-3: #2B3036;   // active / pressed
--a-line:      rgba(255,255,255,.06);
--a-line-2:    rgba(255,255,255,.12);
// Text
--a-text:      #ECEAE4;   // warm white
--a-text-2:    #A8ABB2;
--a-text-3:    #6E7279;
// Signal (brand oxide, lifted for dark)
--a-accent:    #F08A4B;   // primary actions, active nav, focus
--a-accent-2:  #C2410C;   // pressed
--a-accent-soft: rgba(240,138,75,.14);
// Semantic
--a-ok:        #7FD1A9;   // mint — saved / published / online
--a-warn:      #F2C14E;
--a-danger:    #F0665C;
--a-info:      #8CB4F0;
// Glass (allowed in the admin, not on the public site)
--a-glass:     rgba(26,29,33,.72);  + backdrop-filter: blur(14px) saturate(140%)
// Shape & depth
--a-r-sm: 6px; --a-r-md: 10px; --a-r-lg: 14px; --a-r-pill: 999px;
--a-shadow-1: 0 1px 0 rgba(255,255,255,.04) inset, 0 8px 24px rgba(0,0,0,.35);
--a-shadow-2: 0 1px 0 rgba(255,255,255,.06) inset, 0 20px 50px rgba(0,0,0,.5);
--a-glow:     0 0 0 1px var(--a-accent-soft), 0 0 24px rgba(240,138,75,.25);
// Type
--a-font:      'Hanken Grotesk', system-ui;
--a-mono:      'JetBrains Mono', ui-monospace;   // numbers, ids, code, timestamps
// Motion
--a-ease:      cubic-bezier(.2,.8,.2,1);
--a-ease-spring: linear(0, .3 10%, .7 20%, 1.02 35%, .98 55%, 1);  // CSS linear() spring
--a-t-fast: 140ms; --a-t-base: 220ms; --a-t-slow: 360ms;
```

Background texture: a very subtle noise (SVG `feTurbulence`, 3 % opacity) on `--a-bg` so large dark areas don't band. One ambient oxide glow (radial, 6 % opacity) behind the top-left of the canvas, static. No gradients on cards.

## 3. Layout
- **Sidebar** 240 px, collapsible to 64 px (icons + tooltips), remembers state. Sections: Panel · Inicio · Contenido (Proyectos, Clientes, Noticias, Vacantes, Empresa, Etapas, Sectores, Equipos, Páginas, Textos del sitio, Biblioteca) · Leads (badge) · Dev notes · Apariencia · Ajustes. Bottom: publish status pill + user + logout.
- **Top bar** (glass, sticky): breadcrumb, global search / command palette trigger (`Ctrl+K`), "cambios sin publicar" counter + **Publicar** (accent, with progress ring when deploying), environment chip (`DEV` amber / `PROD` mint).
- **Content** max 1440 px, 24 px gutters, 12-col grid; editors use a 2-column pattern: form (8) + live preview / meta (4) sticky.
- **Density**: comfortable by default; tables with 44 px rows.

## 4. Components (all on `/admin/styleguide`)
Buttons (primary accent, secondary outline, ghost, danger, icon), inputs (filled `--a-surface-2`, 1 px `--a-line-2`, focus = accent ring + glow), selects, switches (spring), tags/chips, segmented control (ES/EN), tabs with sliding indicator, cards, stat tiles (mono numbers, sparkline optional), tables (sticky header, row hover lift 1 px, selection checkboxes), drag handles (grab cursor, lifted shadow while dragging), media tiles (hover reveals actions: ver, reemplazar, descargar, eliminar), focal-point picker, upload dropzone (dashed line that turns accent on dragover + progress bar), toasts (bottom-right, slide+fade, mint/amber/red bar), modals (scale .96→1 + backdrop blur), command palette (centered, spring in, fuzzy results with kbd hints), empty states (mono caption + one action), skeleton shimmer, tooltips, keyboard hints (`kbd` styled).

## 5. Motion
- Route change: content fades + 8 px up, 220 ms; sidebar active indicator slides (spring).
- Lists: items stagger in 30 ms (max 12).
- Save: button morphs to a check (mint) for 1.2 s; autosave pill pulses once.
- Publish: progress ring on the button; on READY the pill turns mint with a soft glow 1.5 s.
- Drag & drop: item lifts (shadow-2, scale 1.02), neighbors slide.
- Numbers on Panel count up (600 ms) on first load only.
- Everything honours `prefers-reduced-motion` (durations → 0, no transforms).
- No parallax, no particles, no cursor effects in the admin either.

## 6. Screens to build for the gate (WO1)
1. `/admin/styleguide` — every token and component above, with real data where possible.
2. **Panel** — stat tiles (leads nuevos, proyectos publicados/borradores, cambios sin publicar, último deploy con estado), "actividad reciente" (publicaciones, leads, notas), accesos rápidos.
3. **Editor de Proyecto** — the most complex screen: form + sticky live preview (card + hero), gallery with drag, focal picker, bilingual segmented control, autosave pill, publish bar.

Claude Code deploys these three to the preview, posts screenshots in the report and **stops**. After approval, the same tokens/components are applied to every admin screen (lists, editors, Leads inbox, Dev notes, Biblioteca, Apariencia, Textos del sitio, login).

## 7. Quality bars
- Contrast AA on all text (mono timestamps included); focus visible everywhere; full keyboard operation (sidebar, tables, palette, drag via keyboard).
- Admin chunks stay lazy; `/admin` route first load ≤ 350 kB gz JS; JetBrains Mono self-hosted, subset, preloaded only inside the admin.
- No regression on the public Lighthouse budgets (admin styles never load on public routes — guard).
