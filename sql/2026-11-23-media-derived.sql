-- Round 05 (PROMPT-12): enhanced / retouched photos are NEW media rows linked to their original.
-- The original row is never deleted or unpublished; derived_from points back to it.
alter table web.media
  add column if not exists derived_from uuid references web.media(id) on delete set null,
  add column if not exists variant text not null default 'original'
    check (variant in ('original', 'enhanced', 'retouched'));
create index if not exists media_derived_from_idx on web.media (derived_from);
