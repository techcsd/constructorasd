import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { applyPageSeo } from '../../core/seo/page-seo';
import { COMPANY } from '../../../content/company';
import { PageHeader } from '../../ui/page-header/page-header';
import { Eyebrow } from '../../ui/eyebrow/eyebrow';
import { ContactForm } from '../../ui/contact-form/contact-form';
import { Icon } from '../../ui/icon/icon';
import { RevealDirective } from '../../core/reveal.directive';
import { TPipe } from '../../core/i18n/t.pipe';

@Component({
  selector: 'app-contacto',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader, Eyebrow, ContactForm, Icon, RevealDirective, TPipe],
  templateUrl: './contacto.html',
  styleUrl: './contacto.scss',
})
export class Contacto {
  private i18n = inject(I18nService);
  constructor() {
    applyPageSeo('contacto');
  }
  readonly phones = COMPANY.phones;
  readonly email = COMPANY.email;
  readonly instagram = COMPANY.instagram;
  readonly instagramUrl = 'https://www.instagram.com/' + COMPANY.instagram;
  readonly whatsappUrl = computed(
    () =>
      `https://wa.me/${COMPANY.whatsapp}?text=` +
      encodeURIComponent(this.i18n.t('Hola, me gustaría más información sobre Constructora SD.')),
  );
  readonly presence = computed(() => this.i18n.pick(COMPANY.presence)!);
  readonly cities = [
    { name: 'Santo Domingo', url: 'https://www.google.com/maps/search/?api=1&query=Santo+Domingo' },
    { name: 'Punta Cana', url: 'https://www.google.com/maps/search/?api=1&query=Punta+Cana' },
  ];
  telHref(p: string): string {
    return 'tel:+1' + p.replace(/[^0-9]/g, '');
  }
}
