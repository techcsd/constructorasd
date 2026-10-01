import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { SeoService } from '../../core/seo/seo.service';
import { PAGE_META, PageMeta } from '../../../content/page-meta';
import { Eyebrow } from '../../ui/eyebrow/eyebrow';
import { RevealDirective } from '../../core/reveal.directive';

/**
 * Data-driven page shell for Prompt 1 (SEO + H1 + eyebrow + lead from content/page-meta.ts).
 * Every content route loads this; the route's `data.key` selects the metadata. Prompt 2 replaces
 * each route's component with its full page — nothing else changes.
 */
@Component({
  selector: 'app-page-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Eyebrow, RevealDirective],
  templateUrl: './page-shell.html',
  styleUrl: './page-shell.scss',
})
export class PageShell {
  private route = inject(ActivatedRoute);
  private i18n = inject(I18nService);
  private seo = inject(SeoService);

  private data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  readonly key = computed(() => (this.data()['key'] as string) ?? 'home');
  readonly meta = computed<PageMeta | undefined>(() => PAGE_META[this.key()]);
  readonly locale = this.i18n.locale;

  readonly eyebrow = computed(() => this.i18n.pick(this.meta()?.eyebrow));
  readonly lead = computed(() => this.i18n.pick(this.meta()?.lead));

  /** H1 split into [before, emphasis, after] so one phrase renders in serif italic. */
  readonly h1parts = computed<{ before: string; em: string; after: string }>(() => {
    const m = this.meta();
    const full = this.i18n.pick(m?.h1) ?? '';
    const em = this.i18n.pick(m?.emphasis);
    if (!em || !full.includes(em)) return { before: full, em: '', after: '' };
    const i = full.indexOf(em);
    return { before: full.slice(0, i), em, after: full.slice(i + em.length) };
  });

  constructor() {
    effect(() => {
      const m = this.meta();
      if (!m) return;
      this.seo.set({
        title: this.i18n.pick(m.title) ?? '',
        description: this.i18n.pick(m.description) ?? '',
        routeKey: this.key(),
        locale: this.locale(),
      });
    });
  }
}
