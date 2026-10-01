# Content model — constructorasd.com

Content v1 is static, typed TS/JSON in `src/content/`, designed to migrate to a Supabase **`web`** schema
later **without renaming fields** (CLAUDE.md rule 10 / WA8). Interfaces live in `src/content/types.ts`;
TS camelCase ↔ Postgres snake_case. Bilingual fields are `{ es, en }` in TS → two columns (`*_es`, `*_en`)
or a `jsonb` in SQL (we use two columns for query-ability). `ImageRef.src` is a key in
`src/content/image-manifest.json` → later an object-storage path.

> Do **not** create these tables yet. This is the target DDL so the static shape stays migration-ready.

## `web.projects` ↔ `Project` (`src/content/projects.ts`)

```sql
create table web.projects (
  slug          text primary key,
  name          text not null,              -- proper noun, language-neutral
  client        text not null default '',
  sector        text not null,              -- FK → web.sectors.id
  location_es   text not null, location_en  text not null,
  year          int,
  status        text not null check (status in ('ejecutado','en_ejecucion')),
  summary_es    text not null, summary_en   text not null,
  body_es       text,          body_en      text,
  scope         text[] not null default '{}',  -- stage ids
  cover         jsonb not null,             -- { src, alt_es, alt_en }
  gallery       jsonb not null default '[]',
  featured      boolean not null default false,
  "order"       int not null,
  created_at    timestamptz not null default now()
);
```

## `web.clients` ↔ `Client` (`src/content/clients.ts`)

```sql
create table web.clients (
  slug   text primary key,
  name   text not null,
  "group" text not null check ("group" in ('promotores','hoteleria','industria_mineria','instituciones')),
  logo   jsonb,          -- { src, alt_es, alt_en } | null
  "order" int not null
);
```

## `web.posts` ↔ `Post` (`src/content/posts.ts`)

```sql
create table web.posts (
  slug         text primary key,
  title_es     text not null, title_en   text not null,
  excerpt_es   text not null, excerpt_en text not null,
  cover        jsonb,
  published_at date not null,
  body_es      text not null,  -- markdown
  body_en      text not null
);
```

## `web.jobs` ↔ `Job` (`src/content/jobs.ts`)

```sql
create table web.jobs (
  slug           text primary key,
  title_es text not null, title_en text not null,
  area_es  text not null, area_en  text not null,
  location_es text not null, location_en text not null,
  type         text not null check (type in ('tiempo_completo','por_proyecto')),
  summary_es text not null, summary_en text not null,
  requirements jsonb not null default '[]',  -- [{es,en}]
  open         boolean not null default true,
  published_at date not null
);
```

## Reference content (likely stays in-repo, or becomes seed/config tables)

- `Stage` (`stages.ts`), `Sector` (`sectors.ts`), `Equipment` (`equipment.ts`), `Company` (`company.ts`):
  slow-changing editorial content. Candidate tables `web.stages`, `web.sectors`, `web.equipment`,
  `web.company` (single row) with the same bilingual-column pattern — but these rarely change, so they may
  remain static TS even after projects/clients/posts/jobs migrate.

## Bilingual rule

Every user-visible string is either a `t()` key (UI chrome, keys = Spanish) or a `{ es, en }` content field.
`verify-i18n.mjs` fails the build on a missing `en`. `content.spec.ts` asserts every `{ es, en }` leaf is
non-empty, slugs are unique, image refs resolve against the manifest, each stage has 4 capabilities, and
jobs/posts are empty in v1.
