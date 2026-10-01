import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { resolveUrl } from '../../core/i18n/localized-routes';
import { Icon } from '../icon/icon';
import { TPipe } from '../../core/i18n/t.pipe';

/** Floating WhatsApp button (DESIGN-BRIEF §6). Hidden on the contact page. Prefilled ES/EN message. */
@Component({
  selector: 'app-whatsapp-fab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, TPipe],
  templateUrl: './whatsapp-fab.html',
  styleUrl: './whatsapp-fab.scss',
})
export class WhatsAppFab {
  private router = inject(Router);
  private i18n = inject(I18nService);

  private url = signal(this.router.url);

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => this.url.set(e.urlAfterRedirects));
  }

  readonly visible = computed(() => resolveUrl(this.url())?.key !== 'contacto');
  readonly href = computed(() => {
    const text = this.i18n.t('Hola, me gustaría más información sobre Constructora SD.');
    return `https://wa.me/18096925906?text=${encodeURIComponent(text)}`;
  });
}
