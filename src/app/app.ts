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

    // Vercel analytics + speed insights — PROD builds only (WB10), browser only.
    afterNextRender(async () => {
      if (environment.production) {
        try {
          const { inject: vaInject } = await import('@vercel/analytics');
          vaInject({ mode: 'production' });
          const { injectSpeedInsights } = await import('@vercel/speed-insights');
          injectSpeedInsights();
        } catch {
          /* analytics is best-effort */
        }
      }
      this.installErrorReporter();
    });
  }

  /** Report uncaught errors to the web-client-error edge function (rate-limited, no PII). */
  private installErrorReporter(): void {
    const base = (environment.supabaseUrl || '').replace(/\/$/, '');
    const anon = environment.supabaseAnonKey || '';
    if (!base || !anon || typeof window === 'undefined') return;
    let sent = 0;
    const report = (message: string, source?: string) => {
      if (sent >= 5 || !message) return; // cap per page load
      sent++;
      fetch(`${base}/functions/v1/web-client-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anon, Authorization: `Bearer ${anon}` },
        body: JSON.stringify({ message: String(message).slice(0, 1024), source, page: location.pathname }),
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener('error', (e) => report(e.message, e.filename));
    window.addEventListener('unhandledrejection', (e) =>
      report(`unhandledrejection: ${(e.reason && e.reason.message) || e.reason}`),
    );
  }

  private applyLocale(url: string): void {
    // Prefer the slug-map match; fall back to the /en prefix so even unknown EN URLs (404s) stay English.
    const clean = url.split('?')[0];
    const locale = resolveUrl(url)?.locale ?? (clean === '/en' || clean.startsWith('/en/') ? 'en' : 'es');
    this.i18n.setLocale(locale);
    this.doc.documentElement.lang = locale;
  }
}
