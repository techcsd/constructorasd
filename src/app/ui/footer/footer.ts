import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { pathFor } from '../../core/i18n/localized-routes';
import { COMPANY } from '../../../content/company';
import { Logo } from '../logo/logo';
import { Icon } from '../icon/icon';
import { TPipe } from '../../core/i18n/t.pipe';

const NAV_KEYS = ['empresa', 'servicios', 'proyectos', 'equipos', 'clientes', 'noticias', 'vacantes', 'contacto'];
const NAV_LABEL: Record<string, string> = {
  empresa: 'Empresa',
  servicios: 'Servicios',
  proyectos: 'Proyectos',
  equipos: 'Equipos',
  clientes: 'Clientes',
  noticias: 'Noticias',
  vacantes: 'Vacantes',
  contacto: 'Contacto',
};

@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Logo, Icon, TPipe],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  host: { 'data-tone': 'dark', class: 'tone-dark' },
})
export class Footer {
  private i18n = inject(I18nService);
  readonly locale = this.i18n.locale;
  readonly year = 2026;

  readonly homePath = computed(() => pathFor('home', this.locale()) ?? '/');
  readonly privacidadPath = computed(() => pathFor('privacidad', this.locale()) ?? '/privacidad');
  readonly avisoPath = computed(() => pathFor('aviso-legal', this.locale()) ?? '/aviso-legal');
  readonly links = computed(() =>
    NAV_KEYS.map((key) => ({ key, label: NAV_LABEL[key], path: pathFor(key, this.locale()) ?? '/' })),
  );

  // Company data (editable via Empresa / Ajustes) — bound here so nothing is hardcoded (WL6).
  readonly email = COMPANY.email;
  readonly instagram = COMPANY.instagram;
  readonly phones = COMPANY.phones.map((p) => ({ label: p, href: 'tel:+1' + p.replace(/[^0-9]/g, '') }));
  readonly presence = computed(() => this.i18n.pick(COMPANY.presence) ?? '');
}
