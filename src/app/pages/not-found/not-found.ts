import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { SeoService } from '../../core/seo/seo.service';
import { pathFor } from '../../core/i18n/localized-routes';
import { Button } from '../../ui/button/button';
import { TPipe } from '../../core/i18n/t.pipe';

@Component({
  selector: 'app-not-found',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, TPipe],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFound {
  private i18n = inject(I18nService);
  private seo = inject(SeoService);

  readonly homePath = computed(() => pathFor('home', this.i18n.locale()) ?? '/');
  readonly proyectosPath = computed(() => pathFor('proyectos', this.i18n.locale()) ?? '/proyectos');
  readonly contactoPath = computed(() => pathFor('contacto', this.i18n.locale()) ?? '/contacto');

  constructor() {
    this.seo.set({
      title: this.i18n.t('Página no encontrada'),
      description: this.i18n.t('La página que buscas no existe o fue movida.'),
      routeKey: 'home',
      locale: this.i18n.locale(),
      noindex: true,
    });
  }
}
