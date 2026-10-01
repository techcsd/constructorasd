import { describe, it, expect } from 'vitest';
import { PAGES, pathFor, resolveUrl, twinUrl, buildRoutes } from './localized-routes';

describe('localized routes', () => {
  it('pathFor builds ES and EN paths with translated slugs', () => {
    expect(pathFor('empresa', 'es')).toBe('/empresa');
    expect(pathFor('empresa', 'en')).toBe('/en/company');
    expect(pathFor('home', 'es')).toBe('/');
    expect(pathFor('home', 'en')).toBe('/en');
  });

  it('ES-only pages (styleguide) have no EN path', () => {
    expect(pathFor('styleguide', 'es')).toBe('/styleguide');
    expect(pathFor('styleguide', 'en')).toBeUndefined();
  });

  it('resolveUrl identifies key + locale from a URL', () => {
    expect(resolveUrl('/servicios')).toEqual({ key: 'servicios', locale: 'es' });
    expect(resolveUrl('/en/services')).toEqual({ key: 'servicios', locale: 'en' });
    expect(resolveUrl('/en')).toEqual({ key: 'home', locale: 'en' });
    expect(resolveUrl('/')).toEqual({ key: 'home', locale: 'es' });
  });

  it('resolveUrl ignores query/hash and trailing slashes', () => {
    expect(resolveUrl('/en/projects/?sector=hotelero#x')).toEqual({ key: 'proyectos', locale: 'en' });
  });

  it('twinUrl maps a page to its other-language twin', () => {
    expect(twinUrl('/proyectos')).toBe('/en/projects');
    expect(twinUrl('/en/contact')).toBe('/contacto');
  });

  it('every non-ES-only page has both slugs and a unique key', () => {
    const keys = new Set<string>();
    for (const p of PAGES) {
      expect(keys.has(p.key)).toBe(false);
      keys.add(p.key);
      expect(typeof p.en).toBe('string');
    }
  });

  it('buildRoutes emits an /en parent, ES roots and a wildcard', () => {
    const routes = buildRoutes();
    expect(routes.some((r) => r.path === 'en')).toBe(true);
    expect(routes.some((r) => r.path === '**')).toBe(true);
    expect(routes.some((r) => r.path === 'empresa')).toBe(true);
  });
});
