import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { SeoService } from '../../core/seo/seo.service';
import { JOBS } from '../../../content/jobs';
import { detailPathFor, pathFor } from '../../core/i18n/localized-routes';
import { Eyebrow } from '../../ui/eyebrow/eyebrow';
import { ApplyForm } from '../../ui/apply-form/apply-form';
import { Button } from '../../ui/button/button';
import { TPipe } from '../../core/i18n/t.pipe';

@Component({
  selector: 'app-vacante-detalle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Eyebrow, ApplyForm, Button, TPipe],
  templateUrl: './vacante-detalle.html',
  styleUrl: './vacante-detalle.scss',
})
export class VacanteDetalle {
  private route = inject(ActivatedRoute);
  private i18n = inject(I18nService);
  private seo = inject(SeoService);

  readonly slug = this.route.snapshot.paramMap.get('slug') ?? '';
  readonly job = computed(() => JOBS.find((j) => j.slug === this.slug));
  readonly vacantesPath = computed(() => pathFor('vacantes', this.i18n.locale()) ?? '/vacantes');

  readonly title = computed(() => this.i18n.pick(this.job()?.title) ?? '');
  readonly summary = computed(() => this.i18n.pick(this.job()?.summary) ?? '');
  readonly area = computed(() => this.i18n.pick(this.job()?.area) ?? '');
  readonly location = computed(() => this.i18n.pick(this.job()?.location) ?? '');
  readonly requirements = computed(() => (this.job()?.requirements ?? []).map((r) => this.i18n.pick(r)!));

  constructor() {
    const j = this.job();
    this.seo.set({
      title: j ? this.i18n.pick(j.title)! : this.i18n.t('Página no encontrada'),
      description: j ? this.i18n.pick(j.summary)! : '',
      routeKey: 'vacantes',
      locale: this.i18n.locale(),
      path: j ? detailPathFor('vacante', this.slug, this.i18n.locale())! : undefined,
      altPaths: j
        ? { es: detailPathFor('vacante', this.slug, 'es'), en: detailPathFor('vacante', this.slug, 'en') }
        : undefined,
      noindex: !j,
    });
    if (j) {
      this.seo.setBreadcrumb([
        { name: this.i18n.t('Vacantes'), path: this.vacantesPath() },
        { name: this.i18n.pick(j.title)!, path: detailPathFor('vacante', this.slug, this.i18n.locale())! },
      ]);
      this.seo.setJobPostingJsonLd({
        title: this.i18n.pick(j.title)!,
        description: this.i18n.pick(j.summary)!,
        datePosted: j.publishedAt,
        employmentType: j.type === 'tiempo_completo' ? 'FULL_TIME' : 'CONTRACTOR',
        location: this.i18n.pick(j.location)!,
      });
    }
  }
}
