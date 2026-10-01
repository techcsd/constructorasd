import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { applyPageSeo } from '../../core/seo/page-seo';
import { pathFor, detailPathFor } from '../../core/i18n/localized-routes';
import { PAGE_META } from '../../../content/page-meta';
import { COMPANY } from '../../../content/company';
import { STAGES } from '../../../content/stages';
import { PROJECTS } from '../../../content/projects';
import { SECTORS } from '../../../content/sectors';
import { CLIENTS } from '../../../content/clients';
import { Eyebrow } from '../../ui/eyebrow/eyebrow';
import { Button } from '../../ui/button/button';
import { SectionHeading } from '../../ui/section-heading/section-heading';
import { StatsBand } from '../../ui/stats-band/stats-band';
import { StageRow } from '../../ui/stage-row/stage-row';
import { ProjectCard } from '../../ui/project-card/project-card';
import { ClientWall } from '../../ui/client-wall/client-wall';
import { Quote } from '../../ui/quote/quote';
import { ImageFigure } from '../../ui/image-figure/image-figure';
import { RevealDirective } from '../../core/reveal.directive';
import { TPipe } from '../../core/i18n/t.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Eyebrow,
    Button,
    SectionHeading,
    StatsBand,
    StageRow,
    ProjectCard,
    ClientWall,
    Quote,
    ImageFigure,
    RevealDirective,
    TPipe,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private i18n = inject(I18nService);
  private pick = <T>(f: { es: T; en: T } | undefined) => this.i18n.pick(f)!;
  constructor() {
    applyPageSeo('home');
  }

  private meta = PAGE_META['home'];
  readonly heroLead = computed(() => this.pick(this.meta.lead));
  readonly heroEyebrow = computed(() => this.pick(this.meta.eyebrow));
  readonly h1parts = computed(() => {
    const full = this.pick(this.meta.h1);
    const em = this.pick(this.meta.emphasis);
    const i = full.indexOf(em);
    return i < 0 ? { before: full, em: '', after: '' } : { before: full.slice(0, i), em, after: full.slice(i + em.length) };
  });

  readonly intro = computed(() => this.pick(COMPANY.description));
  readonly stats = computed(() => COMPANY.stats.map((s) => ({ value: s.value, label: this.pick(s.label) })));

  readonly stages = computed(() =>
    STAGES.map((s) => ({
      index: String(s.index).padStart(2, '0'),
      title: this.pick(s.title),
      summary: this.pick(s.tagline),
      capabilities: s.capabilities.map((c) => this.pick(c)),
      facts: (s.facts ?? []).map((f) => ({ value: f.value, label: this.pick(f.label) })),
      image: s.images[0]?.src ?? '',
      imageAlt: this.pick(s.images[0]?.alt),
    })),
  );

  private sectorLabel = (id: string) => this.pick(SECTORS.find((s) => s.id === id)?.name);
  private sorted = [...PROJECTS].sort((a, b) => a.order - b.order);
  private toCard = (p: (typeof PROJECTS)[number]) => ({
    name: p.name,
    client: p.client,
    sector: this.sectorLabel(p.sector),
    city: this.pick(p.location),
    image: p.cover.src,
    alt: this.pick(p.cover.alt),
    href: detailPathFor('proyecto', p.slug, this.i18n.locale())!,
  });
  readonly featured = computed(() => this.toCard(this.sorted[0]));
  readonly featuredRest = computed(() => this.sorted.slice(1, 5).map((p) => this.toCard(p)));

  readonly sectors = computed(() =>
    SECTORS.map((s) => {
      const first = s.projects[0] ? PROJECTS.find((p) => p.slug === s.projects[0]) : undefined;
      return { name: this.pick(s.name), blurb: this.pick(s.blurb), example: first?.name ?? '' };
    }),
  );

  readonly quote = computed(() => this.pick(COMPANY.philosophyQuote));
  readonly quoteAttr = computed(() => this.pick(COMPANY.philosophyAttribution));
  readonly clients = computed(() => CLIENTS.slice(0, 12).map((c) => ({ name: c.name })));
  readonly advantages = computed(() =>
    COMPANY.advantages.map((a) => ({ title: this.pick(a.title), text: this.pick(a.text) })),
  );

  readonly empresaPath = computed(() => pathFor('empresa', this.i18n.locale()) ?? '/empresa');
  readonly serviciosPath = computed(() => pathFor('servicios', this.i18n.locale()) ?? '/servicios');
  readonly proyectosPath = computed(() => pathFor('proyectos', this.i18n.locale()) ?? '/proyectos');
  readonly clientesPath = computed(() => pathFor('clientes', this.i18n.locale()) ?? '/clientes');
  readonly contactoPath = computed(() => pathFor('contacto', this.i18n.locale()) ?? '/contacto');
  readonly phoneLinks = COMPANY.phones.map((p) => ({ label: p, href: 'tel:+1' + p.replace(/[^0-9]/g, '') }));
}
