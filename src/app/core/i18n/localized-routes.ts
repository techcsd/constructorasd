import { Type } from '@angular/core';
import { Routes } from '@angular/router';
import { Locale } from './i18n.service';

/**
 * Localized routing (WA9 / WB3). Every page is registered twice: Spanish at `/…` and English at
 * `/en/…` with a translated slug. The slug map is the single source of truth; LangSwitch and SeoService
 * both read it so a page and its twin, plus hreflang, always agree.
 */
export interface PageDef {
  /** Stable key (language-independent), used by SeoService + LangSwitch. */
  key: string;
  es: string; // Spanish slug ('' for home)
  en: string; // English slug
  loadComponent: () => Promise<Type<unknown>>;
  /** ES-only, excluded from the sitemap + noindex (e.g. /styleguide). */
  esOnly?: boolean;
}

// Prompt 1 ships SEO'd shells for the content pages, driven by one data-driven PageShell
// (see src/content/page-meta.ts). Prompt 2 replaces each with its full page. The slug map and keys
// below are already the final ones, so swapping a loadComponent later changes nothing else.
const shell = (): Promise<Type<unknown>> =>
  import('../../pages/page-shell/page-shell').then((m) => m.PageShell);

export const PAGES: PageDef[] = [
  { key: 'home', es: '', en: '', loadComponent: shell },
  { key: 'empresa', es: 'empresa', en: 'company', loadComponent: shell },
  { key: 'servicios', es: 'servicios', en: 'services', loadComponent: shell },
  { key: 'equipos', es: 'equipos', en: 'equipment', loadComponent: shell },
  { key: 'proyectos', es: 'proyectos', en: 'projects', loadComponent: shell },
  { key: 'clientes', es: 'clientes', en: 'clients', loadComponent: shell },
  { key: 'vacantes', es: 'vacantes', en: 'careers', loadComponent: shell },
  { key: 'noticias', es: 'noticias', en: 'news', loadComponent: shell },
  { key: 'contacto', es: 'contacto', en: 'contact', loadComponent: shell },
  { key: 'privacidad', es: 'privacidad', en: 'privacy', loadComponent: shell },
  { key: 'aviso-legal', es: 'aviso-legal', en: 'legal-notice', loadComponent: shell },
  { key: 'styleguide', es: 'styleguide', en: 'styleguide', esOnly: true, loadComponent: () => import('../../pages/styleguide/styleguide').then((m) => m.Styleguide) },
];

/** Path (with leading slash) for a page key in a locale. Returns undefined for an en path of an ES-only page. */
export function pathFor(key: string, locale: Locale): string | undefined {
  const p = PAGES.find((x) => x.key === key);
  if (!p) return undefined;
  if (locale === 'en') {
    if (p.esOnly) return undefined;
    return '/en' + (p.en ? '/' + p.en : '');
  }
  return '/' + p.es;
}

/** Given a URL, find its page key + current locale (for LangSwitch / SeoService). */
export function resolveUrl(url: string): { key: string; locale: Locale } | undefined {
  const clean = url.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  const isEn = clean === '/en' || clean.startsWith('/en/');
  const locale: Locale = isEn ? 'en' : 'es';
  const slug = isEn ? clean.replace(/^\/en\/?/, '') : clean.replace(/^\//, '');
  const p = PAGES.find((x) => (locale === 'en' ? x.en : x.es) === slug);
  return p ? { key: p.key, locale } : undefined;
}

/** The twin-language URL for a given URL (keeps the user on the same page). */
export function twinUrl(url: string): string | undefined {
  const r = resolveUrl(url);
  if (!r) return undefined;
  const other: Locale = r.locale === 'en' ? 'es' : 'en';
  return pathFor(r.key, other);
}

/** Build the full Routes array: ES at root, EN under /en, with { locale } data on each. */
export function buildRoutes(): Routes {
  const esChildren: Routes = PAGES.map((p) => ({
    path: p.es,
    loadComponent: p.loadComponent,
    data: { locale: 'es' as Locale, key: p.key, esOnly: !!p.esOnly },
  }));

  const enChildren: Routes = PAGES.filter((p) => !p.esOnly).map((p) => ({
    path: p.en,
    loadComponent: p.loadComponent,
    data: { locale: 'en' as Locale, key: p.key },
  }));

  return [
    { path: 'en', children: enChildren },
    ...esChildren,
    {
      path: '**',
      loadComponent: () => import('../../pages/not-found/not-found').then((m) => m.NotFound),
      data: { locale: 'es' as Locale, key: 'not-found' },
    },
  ];
}
