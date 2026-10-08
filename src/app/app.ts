import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NavigationStart, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '@env';
import { I18nService } from './core/i18n/i18n.service';
import { resolveUrl } from './core/i18n/localized-routes';
import { SeoService } from './core/seo/seo.service';
import { PreviewService } from './core/preview.service';
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
  readonly preview = inject(PreviewService);

  readonly isDev = environment.envName !== 'prod';
  // The private /admin area has its own full-screen chrome — hide the public header/footer/FAB there.
  readonly isAdmin = signal(this.router.url.startsWith('/admin'));

  // Maintenance banner (Ajustes) — applied live from web.site_settings.data, no publish needed.
  private maintData = signal<{ on?: boolean; message_es?: string; message_en?: string } | null>(null);
  readonly maintenanceMsg = computed(() => {
    const m = this.maintData();
    if (!m?.on || this.isAdmin()) return '';
    return this.i18n.locale() === 'en' ? (m.message_en || m.message_es || '') : (m.message_es || m.message_en || '');
  });

  constructor() {
    // Set locale from the URL on EVERY navigation start — before the page component is created, so
    // its SEO/t() calls see the right locale during prerender and client nav alike.
    this.applyLocale(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationStart => e instanceof NavigationStart))
      .subscribe((e) => {
        this.applyLocale(e.url);
        this.isAdmin.set(e.url.split('?')[0].startsWith('/admin'));
      });

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
      this.applyAppearance();
      // Draft preview (WJ5) — only activates with ?preview=1 + an admin session; noindex when active.
      this.preview.init();
      if (this.preview.enabled()) this.doc.querySelector('meta[name=robots]')?.remove();
      if (this.preview.enabled()) {
        const m = this.doc.createElement('meta');
        m.name = 'robots'; m.content = 'noindex, nofollow';
        this.doc.head.appendChild(m);
      }
    });
  }

  /** Apply live appearance settings (brand accent) from web.site_settings. Plain fetch (no supabase-js
   *  in the public bundle); anon read is allowed by RLS. Best-effort — the design default stands if it fails. */
  private applyAppearance(): void {
    const base = (environment.supabaseUrl || '').replace(/\/$/, '');
    const anon = environment.supabaseAnonKey || '';
    if (!base || !anon || typeof document === 'undefined') return;
    fetch(`${base}/rest/v1/site_settings?select=accent,data&id=eq.1`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}`, 'Accept-Profile': 'web' },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        const accent = rows?.[0]?.accent;
        if (accent) document.documentElement.style.setProperty('--accent', accent);
        const maint = rows?.[0]?.data?.maintenance;
        if (maint) this.maintData.set(maint);
      })
      .catch(() => {});
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
