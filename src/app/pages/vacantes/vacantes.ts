import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { applyPageSeo } from '../../core/seo/page-seo';
import { detailPathFor } from '../../core/i18n/localized-routes';
import { JOBS } from '../../../content/jobs';
import { PageHeader } from '../../ui/page-header/page-header';
import { Eyebrow } from '../../ui/eyebrow/eyebrow';
import { ApplyForm } from '../../ui/apply-form/apply-form';
import { RevealDirective } from '../../core/reveal.directive';
import { TPipe } from '../../core/i18n/t.pipe';

@Component({
  selector: 'app-vacantes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader, Eyebrow, ApplyForm, RevealDirective, TPipe],
  templateUrl: './vacantes.html',
  styleUrl: './vacantes.scss',
})
export class Vacantes {
  private i18n = inject(I18nService);
  constructor() {
    applyPageSeo('vacantes');
  }
  readonly jobs = computed(() =>
    JOBS.filter((j) => j.open).map((j) => ({
      slug: j.slug,
      title: this.i18n.pick(j.title)!,
      area: this.i18n.pick(j.area)!,
      location: this.i18n.pick(j.location)!,
      href: detailPathFor('vacante', j.slug, this.i18n.locale()) ?? '',
    })),
  );
  readonly hasJobs = computed(() => this.jobs().length > 0);
}
