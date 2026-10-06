import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { resolveUrl } from '../../core/i18n/localized-routes';
import { Icon } from '../icon/icon';
import { TPipe } from '../../core/i18n/t.pipe';

/**
 * Floating WhatsApp button (DESIGN-BRIEF §6). Hidden on the contact page. Prefilled ES/EN message.
 * WE6/WF7: switches to a bone variant with an ink glyph when it sits over a dark section or the footer,
 * so the circle no longer disappears into the dark pixels behind it.
 */
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
  private destroyRef = inject(DestroyRef);

  private url = signal(this.router.url);
  readonly onDark = signal(false);

  private io?: IntersectionObserver;
  private darkInView = new Set<Element>();

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        this.url.set(e.urlAfterRedirects);
        // New page → re-scan which dark sections sit under the FAB.
        queueMicrotask(() => this.observeDark());
      });

    afterNextRender(() => this.observeDark());
    this.destroyRef.onDestroy(() => this.io?.disconnect());
  }

  readonly visible = computed(() => resolveUrl(this.url())?.key !== 'contacto');
  readonly href = computed(() => {
    const text = this.i18n.t('Hola, me gustaría más información sobre Constructora SD.');
    return `https://wa.me/18096925906?text=${encodeURIComponent(text)}`;
  });

  /** Observe dark surfaces within a thin band at the FAB's vertical position (bottom-right corner). */
  private observeDark(): void {
    if (typeof IntersectionObserver === 'undefined' || typeof document === 'undefined') return;
    this.io?.disconnect();
    this.darkInView.clear();
    this.onDark.set(false);

    this.io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) this.darkInView.add(e.target);
          else this.darkInView.delete(e.target);
        }
        this.onDark.set(this.darkInView.size > 0);
      },
      // Band spanning ~88%–96% of the viewport height — where the fixed FAB lives.
      { rootMargin: '-88% 0px -4% 0px', threshold: 0 },
    );

    const targets = document.querySelectorAll('[data-tone="dark"], .tone-dark, footer, .app-footer');
    targets.forEach((t) => this.io!.observe(t));
  }
}
