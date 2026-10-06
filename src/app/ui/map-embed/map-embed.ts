import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '@env';
import { I18nService } from '../../core/i18n/i18n.service';
import { COMPANY } from '../../../content/company';
import type { Office } from '../../../content/types';
import { Icon } from '../icon/icon';
import { TPipe } from '../../core/i18n/t.pipe';
import { buildEmbedSrc } from './map-embed-src';

/**
 * Google Maps Embed on /contacto (WD2/WF1). Two city tabs (Santo Domingo / Punta Cana), each an
 * `<iframe>` in `place` mode with a reserved aspect ratio (no CLS). The key is public and referrer-
 * restricted (docs/MAPS-EMBED-KEY.md) and only read from the generated environment. When the key is
 * absent (local dev, or before Xaviel creates it) it falls back to the static presence card so the
 * page never breaks. Keeps the "Cómo llegar" deep links under the map.
 */
@Component({
  selector: 'app-map-embed',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, TPipe],
  templateUrl: './map-embed.html',
  styleUrl: './map-embed.scss',
})
export class MapEmbed {
  private i18n = inject(I18nService);
  private sanitizer = inject(DomSanitizer);

  readonly offices: Office[] = COMPANY.offices ?? [];
  readonly hasKey = !!environment.mapsEmbedKey && this.offices.length > 0;
  readonly active = signal(0);
  readonly presence = computed(() => this.i18n.pick(COMPANY.presence)!);

  cityName(o: Office): string {
    return this.i18n.pick(o.city)!;
  }

  readonly title = computed(() => {
    const o = this.offices[this.active()];
    return o ? `${this.i18n.t('Mapa')} — ${this.cityName(o)}` : this.i18n.t('Mapa');
  });

  readonly src = computed<SafeResourceUrl | null>(() => {
    const o = this.offices[this.active()];
    if (!o || !environment.mapsEmbedKey) return null;
    const url = buildEmbedSrc(environment.mapsEmbedKey, o.query, this.i18n.locale());
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  select(i: number): void {
    this.active.set(i);
  }
}
