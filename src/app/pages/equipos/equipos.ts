import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { applyPageSeo } from '../../core/seo/page-seo';
import { EQUIPMENT, FORMWORK_SYSTEMS } from '../../../content/equipment';
import { PageHeader } from '../../ui/page-header/page-header';
import { Eyebrow } from '../../ui/eyebrow/eyebrow';
import { ImageFigure } from '../../ui/image-figure/image-figure';
import { RevealDirective } from '../../core/reveal.directive';
import { TPipe } from '../../core/i18n/t.pipe';

@Component({
  selector: 'app-equipos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader, Eyebrow, ImageFigure, RevealDirective, TPipe],
  templateUrl: './equipos.html',
  styleUrl: './equipos.scss',
})
export class Equipos {
  private i18n = inject(I18nService);
  constructor() {
    applyPageSeo('equipos');
  }
  readonly lines = computed(() =>
    EQUIPMENT.map((e) => ({ index: String(e.index).padStart(2, '0'), name: this.i18n.pick(e.name)! })),
  );
  readonly formwork = FORMWORK_SYSTEMS;
}
