import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { applyPageSeo } from '../../core/seo/page-seo';
import { pathFor } from '../../core/i18n/localized-routes';
import { COMPANY } from '../../../content/company';
import { PageHeader } from '../../ui/page-header/page-header';
import { Eyebrow } from '../../ui/eyebrow/eyebrow';
import { Quote } from '../../ui/quote/quote';
import { StatsBand } from '../../ui/stats-band/stats-band';
import { Button } from '../../ui/button/button';
import { RevealDirective } from '../../core/reveal.directive';
import { TPipe } from '../../core/i18n/t.pipe';

@Component({
  selector: 'app-empresa',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader, Eyebrow, Quote, StatsBand, Button, RevealDirective, TPipe],
  templateUrl: './empresa.html',
  styleUrl: './empresa.scss',
})
export class Empresa {
  private i18n = inject(I18nService);
  private pick = <T>(f: { es: T; en: T }) => this.i18n.pick(f)!;

  constructor() {
    applyPageSeo('empresa');
  }

  readonly description = computed(() => this.pick(COMPANY.description));
  readonly mission = computed(() => this.pick(COMPANY.mission));
  readonly vision = computed(() => this.pick(COMPANY.vision));
  readonly values = computed(() => COMPANY.values.map((v) => this.pick(v)));
  readonly quote = computed(() => this.pick(COMPANY.philosophyQuote));
  readonly quoteAttr = computed(() => this.pick(COMPANY.philosophyAttribution));
  readonly advantages = computed(() =>
    COMPANY.advantages.map((a) => ({ title: this.pick(a.title), text: this.pick(a.text) })),
  );
  readonly stats = computed(() => COMPANY.stats.map((s) => ({ value: s.value, label: this.pick(s.label) })));
  readonly contactoPath = computed(() => pathFor('contacto', this.i18n.locale()) ?? '/contacto');
}
