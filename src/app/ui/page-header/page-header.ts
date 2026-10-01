import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { PAGE_META, PageMeta } from '../../../content/page-meta';
import { Eyebrow } from '../eyebrow/eyebrow';
import { RevealDirective } from '../../core/reveal.directive';
import { splitEmphasis } from '../../core/split-emphasis';

/** Page header (eyebrow + H1 with serif emphasis + lead) driven by content/page-meta.ts. */
@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Eyebrow, RevealDirective],
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
})
export class PageHeader {
  readonly key = input.required<string>();
  private i18n = inject(I18nService);

  readonly meta = computed<PageMeta | undefined>(() => PAGE_META[this.key()]);
  readonly eyebrow = computed(() => this.i18n.pick(this.meta()?.eyebrow));
  readonly lead = computed(() => this.i18n.pick(this.meta()?.lead));

  readonly h1parts = computed(() =>
    splitEmphasis(this.i18n.pick(this.meta()?.h1) ?? '', this.i18n.pick(this.meta()?.emphasis)),
  );
}
