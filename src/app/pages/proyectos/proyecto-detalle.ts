import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { SeoService } from '../../core/seo/seo.service';
import { detailPathFor, pathFor } from '../../core/i18n/localized-routes';
import { ogImageFor } from '../../core/seo/og-image';
import { PROJECTS } from '../../../content/projects';
import { SECTORS } from '../../../content/sectors';
import { STAGES } from '../../../content/stages';
import { Eyebrow } from '../../ui/eyebrow/eyebrow';
import { ImageFigure } from '../../ui/image-figure/image-figure';
import { Gallery, GalleryImage } from '../../ui/gallery/gallery';
import { Button } from '../../ui/button/button';
import { Icon } from '../../ui/icon/icon';
import { RevealDirective } from '../../core/reveal.directive';
import { TPipe } from '../../core/i18n/t.pipe';

@Component({
  selector: 'app-proyecto-detalle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Eyebrow, ImageFigure, Gallery, Button, Icon, RevealDirective, TPipe],
  templateUrl: './proyecto-detalle.html',
  styleUrl: './proyecto-detalle.scss',
})
export class ProyectoDetalle {
  private route = inject(ActivatedRoute);
  private i18n = inject(I18nService);
  private seo = inject(SeoService);
  private pick = <T>(f: { es: T; en: T } | undefined) => this.i18n.pick(f);

  readonly slug = this.route.snapshot.paramMap.get('slug') ?? '';
  private sorted = [...PROJECTS].sort((a, b) => a.order - b.order);
  readonly project = computed(() => PROJECTS.find((p) => p.slug === this.slug));

  readonly name = computed(() => this.project()?.name ?? '');
  readonly client = computed(() => this.project()?.client ?? '');
  readonly coverSrc = computed(() => this.project()?.cover.src ?? '');
  readonly coverAlt = computed(() => this.pick(this.project()?.cover.alt) ?? '');
  readonly summary = computed(() => this.pick(this.project()?.summary) ?? '');
  readonly body = computed(() => this.pick(this.project()?.body) ?? '');

  readonly facts = computed(() => {
    const p = this.project();
    if (!p) return [];
    const sector = this.pick(SECTORS.find((s) => s.id === p.sector)?.name) ?? '';
    const stages = p.scope
      .map((id) => this.pick(STAGES.find((s) => s.id === id)?.title))
      .filter(Boolean)
      .join(' · ');
    const statusLabel =
      p.status === 'en_ejecucion' ? this.i18n.t('En ejecución') : this.i18n.t('Ejecutado');
    const out: { label: string; value: string }[] = [];
    if (p.client) out.push({ label: this.i18n.t('Cliente'), value: p.client });
    out.push({ label: this.i18n.t('Sector'), value: sector });
    out.push({ label: this.i18n.t('Ubicación'), value: this.pick(p.location) ?? '' });
    out.push({ label: this.i18n.t('Estado'), value: statusLabel });
    if (stages) out.push({ label: this.i18n.t('Etapas ejecutadas'), value: stages });
    return out;
  });

  // Exclude the cover from the gallery so it isn't shown twice; if nothing else remains the whole
  // gallery section is hidden (WF6 — a single-photo project uses it only as the hero).
  readonly gallery = computed<GalleryImage[]>(
    () =>
      this.project()
        ?.gallery.filter((g) => g.src !== this.coverSrc())
        .map((g) => ({ src: g.src, alt: this.pick(g.alt)! })) ?? [],
  );

  readonly proyectosPath = computed(() => pathFor('proyectos', this.i18n.locale()) ?? '/proyectos');
  readonly nav = computed(() => {
    const idx = this.sorted.findIndex((p) => p.slug === this.slug);
    if (idx < 0) return { prev: null, next: null };
    const mk = (p: (typeof PROJECTS)[number] | undefined) =>
      p ? { name: p.name, href: detailPathFor('proyecto', p.slug, this.i18n.locale())! } : null;
    return {
      prev: mk(this.sorted[idx - 1]),
      next: mk(this.sorted[idx + 1]),
    };
  });

  constructor() {
    const p = this.project();
    this.seo.set({
      title: p ? p.name : this.i18n.t('Página no encontrada'),
      description: p ? this.pick(p.summary)! : '',
      routeKey: 'proyectos',
      locale: this.i18n.locale(),
      path: p ? detailPathFor('proyecto', this.slug, this.i18n.locale())! : undefined,
      altPaths: p
        ? { es: detailPathFor('proyecto', this.slug, 'es'), en: detailPathFor('proyecto', this.slug, 'en') }
        : undefined,
      image: p ? ogImageFor(p.cover.src) : undefined,
      imageAlt: p ? this.pick(p.cover.alt) : undefined,
      noindex: !p,
    });
    if (p) {
      this.seo.setBreadcrumb(this.breadcrumb(p.name));
      this.seo.setProjectJsonLd({
        name: p.name,
        description: this.pick(p.summary)!,
        path: detailPathFor('proyecto', this.slug, this.i18n.locale())!,
        image: ogImageFor(p.cover.src),
        location: this.pick(p.location),
        year: p.year,
      });
    }
  }

  private breadcrumb(name: string) {
    return [
      { name: this.i18n.t('Proyectos'), path: this.proyectosPath() },
      { name, path: detailPathFor('proyecto', this.slug, this.i18n.locale())! },
    ];
  }
}
