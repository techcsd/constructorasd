import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { applyPageSeo } from '../../core/seo/page-seo';
import { STAGES } from '../../../content/stages';
import { PageHeader } from '../../ui/page-header/page-header';
import { Eyebrow } from '../../ui/eyebrow/eyebrow';
import { ImageFigure } from '../../ui/image-figure/image-figure';
import { Icon } from '../../ui/icon/icon';
import { RevealDirective } from '../../core/reveal.directive';

@Component({
  selector: 'app-servicios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader, Eyebrow, ImageFigure, Icon, RevealDirective],
  templateUrl: './servicios.html',
  styleUrl: './servicios.scss',
})
export class Servicios {
  private i18n = inject(I18nService);
  private pick = <T>(f: { es: T; en: T } | undefined) => this.i18n.pick(f);
  constructor() {
    applyPageSeo('servicios');
  }
  readonly stages = computed(() =>
    STAGES.map((s) => ({
      id: s.id,
      index: String(s.index).padStart(2, '0'),
      eyebrow: `${this.i18n.t('Etapa')} ${String(s.index).padStart(2, '0')} / ${this.pick(s.title)!}`,
      title: this.pick(s.title)!,
      tagline: this.pick(s.tagline)!,
      description: this.pick(s.description)!,
      capabilities: s.capabilities.map((c) => this.pick(c)!),
      note: this.pick(s.note) ?? '',
      facts: (s.facts ?? []).map((f) => ({ value: f.value, label: this.pick(f.label)! })),
      image: s.images[0]?.src ?? '',
      imageAlt: this.pick(s.images[0]?.alt) ?? '',
      gallery: s.images.slice(1).map((im) => ({ src: im.src, alt: this.pick(im.alt) ?? '' })),
    })),
  );
}
