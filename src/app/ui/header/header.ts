import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
  afterNextRender,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { pathFor, resolveUrl } from '../../core/i18n/localized-routes';
import { Logo } from '../logo/logo';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { LangSwitch } from '../lang-switch/lang-switch';
import { TPipe } from '../../core/i18n/t.pipe';

const NAV_KEYS = ['empresa', 'servicios', 'proyectos', 'equipos', 'noticias', 'contacto'];
const NAV_LABEL: Record<string, string> = {
  empresa: 'Empresa',
  servicios: 'Servicios',
  proyectos: 'Proyectos',
  equipos: 'Equipos',
  noticias: 'Noticias',
  contacto: 'Contacto',
};

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Logo, Button, Icon, LangSwitch, TPipe],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  host: {
    '[class.is-scrolled]': 'scrolled()',
    '[class.over-hero]': 'overHero() && !scrolled()',
    '[class.menu-open]': 'menuOpen()',
    '(document:keydown.escape)': 'closeMenu()',
  },
})
export class Header {
  private router = inject(Router);
  private i18n = inject(I18nService);

  private url = signal(this.router.url);
  readonly scrolled = signal(false);
  readonly menuOpen = signal(false);

  private menuPanel = viewChild<ElementRef<HTMLElement>>('menuPanel');
  private menuToggle = viewChild<ElementRef<HTMLElement>>('menuToggle');

  readonly locale = this.i18n.locale;
  readonly homePath = computed(() => pathFor('home', this.locale()) ?? '/');
  readonly contactoPath = computed(() => pathFor('contacto', this.locale()) ?? '/contacto');
  readonly links = computed(() =>
    NAV_KEYS.map((key) => ({ key, label: NAV_LABEL[key], path: pathFor(key, this.locale()) ?? '/' })),
  );
  readonly overHero = computed(() => resolveUrl(this.url())?.key === 'home' ? false : false);
  // (Prompt 1 pages have no dark hero; home gets its hero in Prompt 2. The transparent state is
  //  demonstrated statically on /styleguide. Kept as a computed so it's trivial to wire to route data later.)

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        this.url.set(e.urlAfterRedirects);
        this.closeMenu();
      });

    afterNextRender(() => {
      const onScroll = () => this.scrolled.set(window.scrollY > 24);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    });
  }

  toggleMenu(): void {
    this.menuOpen() ? this.closeMenu() : this.openMenu();
  }

  openMenu(): void {
    this.menuOpen.set(true);
    if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
    queueMicrotask(() => this.menuPanel()?.nativeElement.querySelector<HTMLElement>('a')?.focus());
  }

  closeMenu(): void {
    if (!this.menuOpen()) return;
    // Only pull focus back to the toggle if focus was inside the menu (not on route-change close).
    const focusInMenu =
      typeof document !== 'undefined' && !!this.menuPanel()?.nativeElement.contains(document.activeElement);
    this.menuOpen.set(false);
    if (typeof document !== 'undefined') document.body.style.overflow = '';
    if (focusInMenu) queueMicrotask(() => this.menuToggle()?.nativeElement.focus());
  }

  onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeMenu();
      return;
    }
    if (event.key !== 'Tab') return;
    const panel = this.menuPanel()?.nativeElement;
    if (!panel) return;
    const focusable = panel.querySelectorAll<HTMLElement>('a, button');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
