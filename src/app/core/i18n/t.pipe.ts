import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from './i18n.service';

/**
 * `{{ 'Contacto' | t }}` — translate a Spanish-source key to the active locale.
 * `pure: false` so a locale change re-renders immediately (locale changes on route navigation; the
 * lookup is a cheap object access, so the per-cycle cost is negligible).
 */
@Pipe({ name: 't', standalone: true, pure: false })
export class TPipe implements PipeTransform {
  private i18n = inject(I18nService);
  transform(key: string, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params);
  }
}
