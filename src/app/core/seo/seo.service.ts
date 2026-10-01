import { Injectable, inject, DOCUMENT } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '@env';
import { Locale } from '../i18n/i18n.service';
import { pathFor } from '../i18n/localized-routes';

export interface SeoInput {
  /** Already-localized page title (without the brand suffix). */
  title: string;
  /** Already-localized meta description. */
  description: string;
  /** Page key from the slug map — used to build canonical + hreflang pair. */
  routeKey: string;
  locale: Locale;
  /** Force noindex (e.g. /styleguide). Non-prod builds are always noindex regardless. */
  noindex?: boolean;
  image?: string;
  type?: 'website' | 'article';
}

const BRAND = 'Constructora SD';
const TITLE_TEMPLATE = (t: string) => `${t} — ${BRAND}`;

/**
 * SeoService — title/meta/canonical/hreflang/OG/Twitter + Organization JSON-LD.
 * SSR-safe: writes into <head> via the injected DOCUMENT, so it runs during prerender.
 * Every non-prod build is forced to noindex (CLAUDE.md / WB10, keep previews out of search).
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private doc = inject<Document>(DOCUMENT);

  private get siteUrl(): string {
    return (environment.siteUrl || 'https://constructorasd.com').replace(/\/$/, '');
  }
  private get isProd(): boolean {
    return environment.production;
  }

  set(input: SeoInput): void {
    const devPrefix = this.isProd ? '' : '[DEV] ';
    this.title.setTitle(devPrefix + TITLE_TEMPLATE(input.title));

    this.meta.updateTag({ name: 'description', content: input.description });

    // robots: non-prod or explicit → noindex
    const noindex = !this.isProd || input.noindex;
    this.meta.updateTag({
      name: 'robots',
      content: noindex ? 'noindex, nofollow' : 'index, follow',
    });

    const esPath = pathFor(input.routeKey, 'es');
    const enPath = pathFor(input.routeKey, 'en');
    const currentPath = input.locale === 'en' ? (enPath ?? esPath) : esPath;
    const canonical = this.abs(currentPath);

    this.setCanonical(canonical);
    this.setHreflang(esPath, enPath);

    // Open Graph
    const image = this.abs(input.image ?? '/og/default.jpg');
    this.meta.updateTag({ property: 'og:type', content: input.type ?? 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Constructora Scheker & Domínguez' });
    this.meta.updateTag({ property: 'og:title', content: TITLE_TEMPLATE(input.title) });
    this.meta.updateTag({ property: 'og:description', content: input.description });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:locale', content: input.locale === 'en' ? 'en_US' : 'es_DO' });

    // Twitter
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: TITLE_TEMPLATE(input.title) });
    this.meta.updateTag({ name: 'twitter:description', content: input.description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
  }

  private abs(path?: string): string {
    if (!path) return this.siteUrl + '/';
    const p = path.endsWith('/') || path.includes('.') ? path : path + '/';
    return this.siteUrl + p;
  }

  private setCanonical(href: string): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private setHreflang(esPath?: string, enPath?: string): void {
    this.doc.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
    const add = (hreflang: string, path?: string) => {
      if (!path) return;
      const link = this.doc.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', hreflang);
      link.setAttribute('href', this.abs(path));
      this.doc.head.appendChild(link);
    };
    add('es', esPath);
    add('en', enPath);
    add('x-default', esPath);
  }

  /** BreadcrumbList JSON-LD for a detail page. Items are {name, path}; replaces any previous breadcrumb. */
  setBreadcrumb(items: { name: string; path: string }[]): void {
    const id = 'ld-breadcrumb';
    this.doc.getElementById(id)?.remove();
    const data = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: it.name,
        item: this.abs(it.path),
      })),
    };
    const script = this.doc.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    this.doc.head.appendChild(script);
  }

  /** Organization JSON-LD — injected once by the app shell. */
  setOrganizationJsonLd(): void {
    const id = 'ld-organization';
    if (this.doc.getElementById(id)) return;
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Constructora Scheker & Domínguez',
      alternateName: 'Constructora SD',
      url: this.siteUrl + '/',
      logo: this.abs('/img/logo-dark.svg'),
      email: 'info@constructorasd.com',
      telephone: ['+1-809-692-5906', '+1-829-322-5878'],
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Santo Domingo',
        addressCountry: 'DO',
      },
      areaServed: 'DO',
      sameAs: ['https://www.instagram.com/constructorasd'],
    };
    const script = this.doc.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    this.doc.head.appendChild(script);
  }
}
