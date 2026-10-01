import { Type } from '@angular/core';
import { Routes } from '@angular/router';
import { Locale } from './i18n.service';
import { PROJECTS } from '../../../content/projects';
import { JOBS } from '../../../content/jobs';
import { POSTS } from '../../../content/posts';

/**
 * Localized routing (WA9 / WB3). Every page is registered twice: Spanish at `/…` and English at
 * `/en/…` with a translated slug. The slug map is the single source of truth; LangSwitch and SeoService
 * both read it so a page, its twin, and hreflang always agree.
 */
export interface PageDef {
  key: string;
  es: string;
  en: string;
  loadComponent: () => Promise<Type<unknown>>;
  esOnly?: boolean;
}

/** A `:slug` detail route (project / job / post) with its prerender slug list. */
export interface DetailDef {
  key: string;
  es: string; // parent segment, ES
  en: string; // parent segment, EN
  loadComponent: () => Promise<Type<unknown>>;
  params: () => string[];
}

export const PAGES: PageDef[] = [
  { key: 'home', es: '', en: '', loadComponent: () => import('../../pages/home/home').then((m) => m.Home) },
  { key: 'empresa', es: 'empresa', en: 'company', loadComponent: () => import('../../pages/empresa/empresa').then((m) => m.Empresa) },
  { key: 'servicios', es: 'servicios', en: 'services', loadComponent: () => import('../../pages/servicios/servicios').then((m) => m.Servicios) },
  { key: 'equipos', es: 'equipos', en: 'equipment', loadComponent: () => import('../../pages/equipos/equipos').then((m) => m.Equipos) },
  { key: 'proyectos', es: 'proyectos', en: 'projects', loadComponent: () => import('../../pages/proyectos/proyectos').then((m) => m.Proyectos) },
  { key: 'clientes', es: 'clientes', en: 'clients', loadComponent: () => import('../../pages/clientes/clientes').then((m) => m.Clientes) },
  { key: 'vacantes', es: 'vacantes', en: 'careers', loadComponent: () => import('../../pages/vacantes/vacantes').then((m) => m.Vacantes) },
  { key: 'noticias', es: 'noticias', en: 'news', loadComponent: () => import('../../pages/noticias/noticias').then((m) => m.Noticias) },
  { key: 'contacto', es: 'contacto', en: 'contact', loadComponent: () => import('../../pages/contacto/contacto').then((m) => m.Contacto) },
  { key: 'privacidad', es: 'privacidad', en: 'privacy', loadComponent: () => import('../../pages/privacidad/privacidad').then((m) => m.Privacidad) },
  { key: 'aviso-legal', es: 'aviso-legal', en: 'legal-notice', loadComponent: () => import('../../pages/aviso-legal/aviso-legal').then((m) => m.AvisoLegal) },
  { key: 'styleguide', es: 'styleguide', en: 'styleguide', esOnly: true, loadComponent: () => import('../../pages/styleguide/styleguide').then((m) => m.Styleguide) },
];

export const DETAILS: DetailDef[] = [
  {
    key: 'proyecto',
    es: 'proyectos',
    en: 'projects',
    loadComponent: () => import('../../pages/proyectos/proyecto-detalle').then((m) => m.ProyectoDetalle),
    params: () => PROJECTS.map((p) => p.slug),
  },
  {
    key: 'vacante',
    es: 'vacantes',
    en: 'careers',
    loadComponent: () => import('../../pages/vacantes/vacante-detalle').then((m) => m.VacanteDetalle),
    params: () => JOBS.map((j) => j.slug),
  },
  {
    key: 'noticia',
    es: 'noticias',
    en: 'news',
    loadComponent: () => import('../../pages/noticias/noticia-detalle').then((m) => m.NoticiaDetalle),
    params: () => POSTS.map((p) => p.slug),
  },
];

/** Path (with leading slash) for a static page key in a locale. */
export function pathFor(key: string, locale: Locale): string | undefined {
  const p = PAGES.find((x) => x.key === key);
  if (!p) return undefined;
  if (locale === 'en') {
    if (p.esOnly) return undefined;
    return '/en' + (p.en ? '/' + p.en : '');
  }
  return '/' + p.es;
}

/** Path for a detail route (parent segment + slug) in a locale. */
export function detailPathFor(key: string, slug: string, locale: Locale): string | undefined {
  const d = DETAILS.find((x) => x.key === key);
  if (!d) return undefined;
  return locale === 'en' ? `/en/${d.en}/${slug}` : `/${d.es}/${slug}`;
}

export interface UrlInfo {
  key: string;
  locale: Locale;
  slug?: string;
}

/** Identify a URL: static page or detail route, with locale (+ slug). */
export function resolveUrl(url: string): UrlInfo | undefined {
  const clean = url.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  const isEn = clean === '/en' || clean.startsWith('/en/');
  const locale: Locale = isEn ? 'en' : 'es';
  const rest = isEn ? clean.replace(/^\/en\/?/, '') : clean.replace(/^\//, '');

  // Detail route: <segment>/<slug>
  const parts = rest.split('/');
  if (parts.length === 2) {
    const [seg, slug] = parts;
    const d = DETAILS.find((x) => (locale === 'en' ? x.en : x.es) === seg);
    if (d) return { key: d.key, locale, slug };
  }

  const p = PAGES.find((x) => (locale === 'en' ? x.en : x.es) === rest);
  return p ? { key: p.key, locale } : undefined;
}

/** The twin-language URL for a given URL (keeps the user on the same page/detail). */
export function twinUrl(url: string): string | undefined {
  const r = resolveUrl(url);
  if (!r) return undefined;
  const other: Locale = r.locale === 'en' ? 'es' : 'en';
  return r.slug ? detailPathFor(r.key, r.slug, other) : pathFor(r.key, other);
}

/** Build the full Routes array: ES at root, EN under /en, detail routes, then the wildcard. */
export function buildRoutes(): Routes {
  const esChildren: Routes = [
    ...PAGES.map((p) => ({
      path: p.es,
      loadComponent: p.loadComponent,
      data: { locale: 'es' as Locale, key: p.key },
    })),
    ...DETAILS.map((d) => ({
      path: `${d.es}/:slug`,
      loadComponent: d.loadComponent,
      data: { locale: 'es' as Locale, key: d.key },
    })),
  ];

  const enChildren: Routes = [
    ...PAGES.filter((p) => !p.esOnly).map((p) => ({
      path: p.en,
      loadComponent: p.loadComponent,
      data: { locale: 'en' as Locale, key: p.key },
    })),
    ...DETAILS.map((d) => ({
      path: `${d.en}/:slug`,
      loadComponent: d.loadComponent,
      data: { locale: 'en' as Locale, key: d.key },
    })),
  ];

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
