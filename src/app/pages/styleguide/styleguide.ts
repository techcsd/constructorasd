import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { SeoService } from '../../core/seo/seo.service';
import { COMPANY } from '../../../content/company';
import { SECTORS } from '../../../content/sectors';
import { STAGES } from '../../../content/stages';
import { PROJECTS } from '../../../content/projects';
import { CLIENTS } from '../../../content/clients';
import { Eyebrow } from '../../ui/eyebrow/eyebrow';
import { Button } from '../../ui/button/button';
import { Logo } from '../../ui/logo/logo';
import { SectionHeading } from '../../ui/section-heading/section-heading';
import { StatsBand } from '../../ui/stats-band/stats-band';
import { StageRow } from '../../ui/stage-row/stage-row';
import { ProjectCard } from '../../ui/project-card/project-card';
import { ClientWall } from '../../ui/client-wall/client-wall';
import { Quote } from '../../ui/quote/quote';
import { ContactForm } from '../../ui/contact-form/contact-form';
import { ImageFigure } from '../../ui/image-figure/image-figure';

@Component({
  selector: 'app-styleguide',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Eyebrow,
    Button,
    Logo,
    SectionHeading,
    StatsBand,
    StageRow,
    ProjectCard,
    ClientWall,
    Quote,
    ContactForm,
    ImageFigure,
  ],
  templateUrl: './styleguide.html',
  styleUrl: './styleguide.scss',
})
export class Styleguide {
  private i18n = inject(I18nService);
  private seo = inject(SeoService);
  private pick = <T>(f: { es: T; en: T }) => this.i18n.pick(f)!;

  // Semantic tokens to showcase (never primitives).
  readonly tokens = [
    'bg',
    'bg-elevated',
    'bg-sunken',
    'text',
    'text-2',
    'text-3',
    'line',
    'line-strong',
    'accent',
    'text-on-accent',
  ];

  readonly typeScale = [
    { cls: 'display', label: 'display', sample: 'Construyendo el futuro' },
    { cls: 'h1', label: 'h1', sample: 'Del terreno a la llave en mano' },
    { cls: 'h2', label: 'h2', sample: 'Un solo equipo, todo el ciclo' },
    { cls: 'h3', label: 'h3', sample: 'Lopesan Costa Bávaro — Bloque F' },
    { cls: 'lead', label: 'lead', sample: 'Entregamos resorts y hospitales llave en mano.' },
    { cls: 'body', label: 'body', sample: 'Integramos en un mismo equipo las capacidades para llevar una obra del terreno natural a su entrega.' },
    { cls: 'small', label: 'small', sample: 'CLIENTE · Sector · Ciudad' },
  ];

  readonly stats = COMPANY.stats.map((s) => ({ value: s.value, label: this.pick(s.label) }));

  readonly stage04 = (() => {
    const s = STAGES[3];
    return {
      index: String(s.index).padStart(2, '0'),
      title: this.pick(s.title),
      summary: this.pick(s.description),
      capabilities: s.capabilities.map((c) => this.pick(c)),
      heights: (s.facts ?? []).map((h) => ({ value: h.value, label: this.pick(h.label) })),
    };
  })();

  private sectorLabel(key?: string): string {
    const s = SECTORS.find((x) => x.id === key);
    return s ? this.pick(s.name) : '';
  }

  readonly showcaseProjects = ['lopesan-costa-bavaro-bloque-f', 'poseidonia', 'hospital-barahona']
    .map((slug) => PROJECTS.find((p) => p.slug === slug)!)
    .map((p) => ({
      name: p.name,
      client: p.client,
      sector: this.sectorLabel(p.sector),
      city: this.pick(p.location),
      image: p.cover.src,
      featured: !!p.featured,
    }));

  readonly clients12 = CLIENTS.slice(0, 12).map((c) => ({ name: c.name }));

  readonly quote = {
    text: this.pick(COMPANY.philosophyQuote),
    attribution: this.pick(COMPANY.philosophyAttribution),
  };

  readonly navDemo = ['Empresa', 'Servicios', 'Proyectos', 'Equipos', 'Noticias', 'Contacto'];

  constructor() {
    this.seo.set({
      title: this.i18n.t('Guía de estilos'),
      description: 'Sistema de diseño de constructorasd.com — checkpoint interno.',
      routeKey: 'styleguide',
      locale: 'es',
      noindex: true,
    });
  }
}
