import { Injectable, signal } from '@angular/core';
import es from '../../../content/i18n/es.json';
import en from '../../../content/i18n/en.json';
import overrides from '../../../content/_overrides.json';

export type Locale = 'es' | 'en';
export const LOCALES: Locale[] = ['es', 'en'];
export const DEFAULT_LOCALE: Locale = 'es';

type Dict = Record<string, string>;
// web.ui_strings edits (WL6) merged in at build via _overrides.json (gen-content), DB wins per key.
const UI = ((overrides as { ui?: { es?: Dict; en?: Dict } }).ui) ?? {};
const DICTS: Record<Locale, Dict> = {
  es: { ...(es as Dict), ...(UI.es ?? {}) },
  en: { ...(en as Dict), ...(UI.en ?? {}) },
};

/**
 * Runtime i18n (WB3 / CLAUDE.md rule 3). No `@angular/localize` (that would duplicate the Vercel build).
 *
 * The translation KEY is the Spanish source text, so Spanish needs no catalog and a key is never
 * "missing" at runtime (it falls through to Spanish). English lives in content/i18n/en.json.
 *
 * SSR-safe: the locale comes from the route prefix (`/en`), set by the router, NOT from
 * localStorage/navigator (which don't exist during prerender). Nothing here touches the DOM at init.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private _locale = signal<Locale>(DEFAULT_LOCALE);
  readonly locale = this._locale.asReadonly();

  setLocale(locale: Locale): void {
    if (LOCALES.includes(locale) && locale !== this._locale()) {
      this._locale.set(locale);
    }
  }

  /** Translate `key` (Spanish source text) to the active locale, interpolating `{name}` params. */
  t(key: string, params?: Record<string, string | number>): string {
    const locale = this._locale(); // reactive read
    // The key is the ES source; a dict entry (ES override or EN translation) wins when present.
    let out = DICTS[locale][key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return out;
  }

  /** Resolve a `{ es, en }` content field to the active locale (falls back to es). */
  pick<T>(field: { es: T; en: T } | undefined): T | undefined {
    if (!field) return undefined;
    return this._locale() === 'en' ? field.en : field.es;
  }
}
