import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { pathFor, resolveUrl } from '../../core/i18n/localized-routes';

/** ES / EN switch (DESIGN-BRIEF §6). Maps the current route to its twin; current locale in --text. */
@Component({
  selector: 'app-lang-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './lang-switch.html',
  styleUrl: './lang-switch.scss',
})
export class LangSwitch {
  private router = inject(Router);
  private i18n = inject(I18nService);

  private url = signal(this.router.url);

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => this.url.set(e.urlAfterRedirects));
  }

  readonly locale = this.i18n.locale;

  private key = computed(() => resolveUrl(this.url())?.key ?? 'home');
  readonly esPath = computed(() => pathFor(this.key(), 'es') ?? '/');
  readonly enPath = computed(() => pathFor(this.key(), 'en') ?? '/en');
}
