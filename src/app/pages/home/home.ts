import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { applyPageSeo } from '../../core/seo/page-seo';
import { splitEmphasis } from '../../core/split-emphasis';
import { pathFor, detailPathFor } from '../../core/i18n/localized-routes';
import { HOME } from '../../../content/home';
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
import { HeroMotion } from '../../core/hero-motion.directive';
import { TPipe } from '../../core/i18n/t.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Eyebrow, Button, SectionHeading, StatsBand, StageRow, ProjectCard, ClientWall, Quote, ImageFigure, RevealDirective, HeroMotion, TPipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private i18n = inject(I18nService);
  private pick = <T>(f: { es: T; en: T } | undefined) => this.i18n.pick(f)!;
  constructor() { applyPageSeo('home'); }

  // Resolve an editable button href: a page key → localized routerLink; else an external href.
  private linkFor(href: string): { routerLink: string | null; href: string | null; external: boolean } {
    const p = href ? pathFor(href, this.i18n.locale()) : undefined;
    if (p) return { routerLink: p, href: null, external: false };
    return { routerLink: null, href: href || null, external: /^https?:/i.test(href) };
  }

  // 1 · Hero
  private hero = HOME.hero;
  readonly heroImage = this.hero.image || 'lopesan/hero';
  readonly heroAlt = computed(() => this.pick(this.hero.alt));
  readonly heroLead = computed(() => this.pick(this.hero.lead));
  readonly heroEyebrow = computed(() => this.pick(this.hero.eyebrow));
  readonly h1parts = computed(() => splitEmphasis(this.pick(this.hero.title), this.pick(this.hero.emphasis)));
  readonly heroPrimary = computed(() => ({ label: this.pick(this.hero.primary.label), ...this.linkFor(this.hero.primary.href) }));
  readonly heroSecondary = computed(() => ({ label: this.pick(this.hero.secondary.label), ...this.linkFor(this.hero.secondary.href) }));

  // 2 · Intro
  readonly introEyebrow = computed(() => this.pick(HOME.intro.eyebrow));
  readonly introTitle = computed(() => this.pick(HOME.intro.title));
  readonly intro = computed(() => this.pick(HOME.intro.text));
  readonly introLink = computed(() => ({ label: this.pick(HOME.intro.linkLabel), ...this.linkFor(HOME.intro.href) }));

  // 3 · Stats
  readonly stats = computed(() => HOME.stats.map((s) => ({ value: s.value + (s.suffix ?? ''), label: this.pick(s.label) })));

  // 4 · Stages
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

  // 5 · Featured projects (auto = first N featured by order; manual = the selected slugs in order)
  private sectorLabel = (id: string) => this.pick(SECTORS.find((s) => s.id === id)?.name);
  private toCard = (p: (typeof PROJECTS)[number]) => ({
    name: p.name, client: p.client, sector: this.sectorLabel(p.sector), city: this.pick(p.location),
    image: p.cover.src, alt: this.pick(p.cover.alt), href: detailPathFor('proyecto', p.slug, this.i18n.locale())!,
  });
  private featuredList(): (typeof PROJECTS) {
    const sel = HOME.featuredProjects;
    if (sel.mode === 'manual' && sel.ids.length) {
      return sel.ids.map((slug) => PROJECTS.find((p) => p.slug === slug)).filter((p): p is (typeof PROJECTS)[number] => !!p);
    }
    return [...PROJECTS].sort((a, b) => a.order - b.order);
  }
  readonly featured = computed(() => this.toCard(this.featuredList()[0]));
  readonly featuredRest = computed(() => this.featuredList().slice(1, 5).map((p) => this.toCard(p)));

  // 6 · Sectors
  readonly sectorsHeading = computed(() => this.pick(HOME.sectors.title));
  readonly sectorsLead = computed(() => this.pick(HOME.sectors.lead));
  readonly sectors = computed(() =>
    SECTORS.map((s) => {
      const first = s.projects[0] ? PROJECTS.find((p) => p.slug === s.projects[0]) : undefined;
      return { name: this.pick(s.name), blurb: this.pick(s.blurb), example: first?.name ?? '' };
    }),
  );

  // 7 · Quote
  readonly quote = computed(() => this.pick(HOME.quote.text));
  readonly quoteAttr = computed(() => this.pick(HOME.quote.author));

  // 8 · Clients
  readonly clients = computed(() => CLIENTS.slice(0, HOME.clientsOnHome.max ?? 12).map((c) => ({ name: c.name })));

  // 9 · Advantages
  readonly advantages = computed(() => HOME.advantages.map((a) => ({ title: this.pick(a.title), text: this.pick(a.text) })));

  // 10 · CTA
  readonly ctaTitle = computed(() => this.pick(HOME.cta.title));
  readonly ctaButton = computed(() => ({ label: this.pick(HOME.cta.buttonLabel), ...this.linkFor(HOME.cta.href) }));
  readonly ctaShowPhones = HOME.cta.showPhones;

  // Ghost "ver todos" links + phones
  readonly empresaPath = computed(() => pathFor('empresa', this.i18n.locale()) ?? '/empresa');
  readonly serviciosPath = computed(() => pathFor('servicios', this.i18n.locale()) ?? '/servicios');
  readonly proyectosPath = computed(() => pathFor('proyectos', this.i18n.locale()) ?? '/proyectos');
  readonly clientesPath = computed(() => pathFor('clientes', this.i18n.locale()) ?? '/clientes');
  readonly contactoPath = computed(() => pathFor('contacto', this.i18n.locale()) ?? '/contacto');
  readonly phoneLinks = COMPANY.phones.map((p) => ({ label: p, href: 'tel:+1' + p.replace(/[^0-9]/g, '') }));
}
