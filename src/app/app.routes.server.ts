import { RenderMode, ServerRoute } from '@angular/ssr';
import { DETAILS } from './core/i18n/localized-routes';

// Static output: every route is prerendered. Detail routes (:slug) list their slugs via
// getPrerenderParams so each project/job/post gets its own HTML in both languages. Empty lists
// (jobs/posts in v1) simply prerender nothing for that pattern.
const detailRoutes: ServerRoute[] = DETAILS.flatMap((d) => {
  const params = async () => d.params().map((slug) => ({ slug }));
  return [
    { path: `${d.es}/:slug`, renderMode: RenderMode.Prerender, getPrerenderParams: params },
    { path: `en/${d.en}/:slug`, renderMode: RenderMode.Prerender, getPrerenderParams: params },
  ];
});

export const serverRoutes: ServerRoute[] = [
  ...detailRoutes,
  { path: '**', renderMode: RenderMode.Prerender },
];
