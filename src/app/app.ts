import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  afterNextRender,
  inject,
} from '@angular/core';
import { NavigationStart, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '@env';
import { I18nService } from './core/i18n/i18n.service';
import { resolveUrl } from './core/i18n/localized-routes';
import { SeoService } from './core/seo/seo.service';
import { TPipe } from './core/i18n/t.pipe';
import { Header } from './ui/header/header';
import { Footer } from './ui/footer/footer';
import { WhatsAppFab } from './ui/whatsapp-fab/whatsapp-fab';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, TPipe, Header, Footer, WhatsAppFab],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private router = inject(Router);
  private i18n = inject(I18nService);
  private seo = inject(SeoService);
  private doc = inject<Document>(DOCUMENT);

  readonly isDev = environment.envName !== 'prod';

  constructor() {
    // Set locale from the URL on EVERY navigation start — before the page component is created, so
    // its SEO/t() calls see the right locale during prerender and client nav alike.
    this.applyLocale(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationStart => e instanceof NavigationStart))
      .subscribe((e) => this.applyLocale(e.url));

    this.seo.setOrganizationJsonLd();

    // Vercel analytics + speed insights — browser only (CSP allows the Vercel hosts, see vercel.json).
    afterNextRender(async () => {
      try {
        const { inject: vaInject } = await import('@vercel/analytics');
        vaInject({ mode: environment.production ? 'production' : 'development' });
        const { injectSpeedInsights } = await import('@vercel/speed-insights');
        injectSpeedInsights();
      } catch {
        /* analytics is best-effort */
      }
    });
  }

  private applyLocale(url: string): void {
    // Prefer the slug-map match; fall back to the /en prefix so even unknown EN URLs (404s) stay English.
    const clean = url.split('?')[0];
    const locale = resolveUrl(url)?.locale ?? (clean === '/en' || clean.startsWith('/en/') ? 'en' : 'es');
    this.i18n.setLocale(locale);
    this.doc.documentElement.lang = locale;
  }
}
