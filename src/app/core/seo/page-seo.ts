import { effect, inject } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import { SeoService } from './seo.service';
import { PAGE_META } from '../../../content/page-meta';

/**
 * Wire a static page's SEO from content/page-meta.ts. Call in an injection context (constructor/field).
 * Re-runs on locale change so title/description/canonical/hreflang follow the active language.
 */
export function applyPageSeo(key: string): void {
  const i18n = inject(I18nService);
  const seo = inject(SeoService);
  effect(() => {
    const m = PAGE_META[key];
    if (!m) return;
    seo.set({
      title: i18n.pick(m.title) ?? '',
      description: i18n.pick(m.description) ?? '',
      routeKey: key,
      locale: i18n.locale(),
    });
  });
}
