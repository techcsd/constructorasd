# Content model — constructorasd.com

Content v1 lives statically in the repo as typed TS/JSON (`src/content/`), designed to migrate to a
Supabase `web` schema in a later round without changing field names (CLAUDE.md hard rule 10 / WA8).

The TypeScript interfaces in `src/content/types.ts` mirror the future tables **field-for-field**
(camelCase in TS ↔ snake_case in Postgres). Do not add a field that could not be a column.

## Planned tables ↔ interfaces

| Future table | Interface | Source file (v1) | Notes |
|---|---|---|---|
| `web.projects` | `Project` | `src/content/projects.ts` | 11 projects from the 2026 presentation |
| `web.clients` | `Client` | `src/content/clients.ts` | ~42 clients/collaborations |
| `web.posts` | `Post` | `src/content/posts/*.md` | Markdown + frontmatter, rendered with marked + DOMPurify |
| `web.jobs` | `Job` | `src/content/jobs.ts` | open positions; empty → spontaneous-application form |

> Full interface definitions land in Prompt 2. This stub records the contract so Prompt 1 scaffolding
> (routes, SEO) stays aligned.

## Bilingual fields

Every user-visible string is either resolved through `t()` (UI chrome) or stored as `{ es, en }` on the
content object (content copy). `verify-i18n.mjs` fails the build when an `en` value is missing.
