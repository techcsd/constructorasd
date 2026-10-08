import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { applyPageSeo } from '../../core/seo/page-seo';
import { detailPathFor } from '../../core/i18n/localized-routes';
import { PROJECTS } from '../../../content/projects';
import { SECTORS } from '../../../content/sectors';
import { PreviewService } from '../../core/preview.service';
import { SectorId } from '../../../content/types';
import { PageHeader } from '../../ui/page-header/page-header';
import { ProjectCard } from '../../ui/project-card/project-card';
import { ProjectIndexRow } from '../../ui/project-index-row/project-index-row';
import { TPipe } from '../../core/i18n/t.pipe';

@Component({
  selector: 'app-proyectos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader, ProjectCard, ProjectIndexRow, TPipe],
  templateUrl: './proyectos.html',
  styleUrl: './proyectos.scss',
})
export class Proyectos {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private i18n = inject(I18nService);
  private preview = inject(PreviewService);

  constructor() {
    applyPageSeo('proyectos');
  }

  private qp = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  readonly vista = computed<'cuadricula' | 'lista'>(() => (this.qp().get('vista') === 'lista' ? 'lista' : 'cuadricula'));
  readonly sector = computed<string>(() => this.qp().get('sector') ?? '');

  readonly sectorChips = computed(() => [
    { id: '', label: this.i18n.t('Todos') },
    ...SECTORS.map((s) => ({ id: s.id as string, label: this.i18n.pick(s.name)! })),
  ]);

  private sectorLabel(id: SectorId): string {
    return this.i18n.pick(SECTORS.find((s) => s.id === id)?.name) ?? '';
  }

  readonly projects = computed(() => {
    const sec = this.sector();
    const locale = this.i18n.locale();
    const source = this.preview.projects() ?? PROJECTS; // drafts in preview, static otherwise
    return source.filter((p) => !sec || p.sector === sec)
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((p) => ({
        name: p.name,
        client: p.client,
        sector: this.sectorLabel(p.sector),
        city: this.i18n.pick(p.location)!,
        image: p.cover.src,
        focal: p.cover.focal,
        alt: this.i18n.pick(p.cover.alt)!,
        featured: p.featured,
        href: detailPathFor('proyecto', p.slug, locale)!,
      }));
  });

  setVista(v: 'cuadricula' | 'lista'): void {
    this.router.navigate([], { queryParams: { vista: v === 'cuadricula' ? null : v }, queryParamsHandling: 'merge' });
  }
  setSector(id: string): void {
    this.router.navigate([], { queryParams: { sector: id || null }, queryParamsHandling: 'merge' });
  }
}
