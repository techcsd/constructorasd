# Dev notes — reference & what we ported (WH2 / A0)

## SGC (BP5) — `src/app/pages/tecnologia/dev-notes/` + `src/shared/ui/markdown-editor/`
Split markdown editor (textarea left / preview right), `marked` GFM + `highlight.js` + DOMPurify, Tab = 2
spaces, HANDOFF template, tags, pinned, archived, "mías/compartidas" over `sgc.notas` with `ambito='dev'`,
checklist items linkable to tasks/issues/versions.

## csd-app — `src/app/pages/notas/`
Same notes model on mobile: edit/preview **toggle** instead of a side-by-side split, otherwise identical.

## What applies to constructorasd (single admin)
- **Port (adapted):** the split markdown editor (marked + highlight.js subset + DOMPurify + Tab + copy-code),
  HANDOFF/Decisión/Bug templates, tags, pinned, archived, search/filter list.
- **Drop:** "mías/compartidas" sharing (one admin), checklist-to-task linking (no SGC tasks here).
- **Add (WH3):** real autosave — debounce 700 ms + on blur/switch/hide/unload, state indicator
  (Guardado/Guardando/Sin conexión/Error con reintentos), localStorage backup, conflict guard on
  `updated_at`, and version history (`web.dev_note_versions`, max 50, snapshot on Ctrl+S / big diff).

Implementation: `src/app/admin/ui/markdown-editor/` (shared), `src/app/admin/pages/dev-notes-page.*`,
`src/app/admin/dev-notes.service.ts`, `sql/2026-10-06-dev-notes-v2.sql`.
