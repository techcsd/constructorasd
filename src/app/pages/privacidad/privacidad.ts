import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { applyPageSeo } from '../../core/seo/page-seo';
import { PageHeader } from '../../ui/page-header/page-header';
import { LocalizedText } from '../../../content/types';

interface LegalSection {
  heading: LocalizedText;
  paras: LocalizedText[];
}

const SECTIONS: LegalSection[] = [
  {
    heading: { es: 'Responsable del tratamiento', en: 'Data controller' },
    paras: [
      {
        es: 'El responsable del tratamiento de los datos personales recogidos a través de este sitio es Constructora Scheker & Domínguez («CSD»). Datos de contacto: info@constructorasd.com · 809-692-5906. [Razón social, RNC y domicilio legal — pendiente de confirmar.]',
        en: 'The controller of the personal data collected through this site is Constructora Scheker & Domínguez (“CSD”). Contact: info@constructorasd.com · 809-692-5906. [Registered name, RNC (tax ID) and legal address — pending confirmation.]',
      },
    ],
  },
  {
    heading: { es: 'Datos que recopilamos', en: 'Data we collect' },
    paras: [
      {
        es: 'Recopilamos únicamente los datos que usted nos facilita de forma voluntaria: a través del formulario de contacto (nombre, empresa, correo electrónico, teléfono y el contenido de su mensaje) y, en el caso de postulaciones de empleo, los datos de su hoja de vida (CV) y los documentos que adjunte.',
        en: 'We collect only the data you provide voluntarily: through the contact form (name, company, email, phone and the content of your message) and, in the case of job applications, the data in your résumé (CV) and any documents you attach.',
      },
    ],
  },
  {
    heading: { es: 'Finalidades', en: 'Purposes' },
    paras: [
      {
        es: 'Utilizamos sus datos para responder a sus solicitudes comerciales y de información, y para gestionar los procesos de selección de personal. No los empleamos para fines distintos de aquellos para los que fueron recabados.',
        en: 'We use your data to respond to your commercial and information requests, and to manage personnel selection processes. We do not use it for purposes other than those for which it was collected.',
      },
    ],
  },
  {
    heading: { es: 'Base legal y consentimiento', en: 'Legal basis and consent' },
    paras: [
      {
        es: 'El tratamiento se fundamenta en el consentimiento que usted otorga al enviar el formulario, conforme a la Ley núm. 172-13 sobre protección de datos personales de la República Dominicana. Puede retirar su consentimiento en cualquier momento.',
        en: 'Processing is based on the consent you grant when submitting the form, in accordance with Dominican Law No. 172-13 on the protection of personal data. You may withdraw your consent at any time.',
      },
    ],
  },
  {
    heading: { es: 'Conservación de datos', en: 'Data retention' },
    paras: [
      {
        es: 'Conservamos sus datos durante el tiempo necesario para atender su solicitud y, en el caso de postulaciones, durante el proceso de selección y un período razonable posterior, salvo que usted solicite su eliminación antes.',
        en: 'We retain your data for as long as necessary to handle your request and, for applications, during the selection process and a reasonable period afterwards, unless you request its deletion sooner.',
      },
    ],
  },
  {
    heading: { es: 'Encargados y terceros', en: 'Processors and third parties' },
    paras: [
      {
        es: 'No vendemos ni cedemos sus datos. Para operar el sitio nos apoyamos en proveedores que actúan como encargados del tratamiento, entre ellos servicios de envío de correo y de base de datos (p. ej. Resend y Supabase), que tratan los datos siguiendo nuestras instrucciones y con las debidas garantías.',
        en: 'We do not sell or transfer your data. To operate the site we rely on providers that act as data processors, including email-delivery and database services (e.g. Resend and Supabase), which process data following our instructions and with appropriate safeguards.',
      },
    ],
  },
  {
    heading: { es: 'Sus derechos (ARCO)', en: 'Your rights (ARCO)' },
    paras: [
      {
        es: 'Usted tiene derecho a acceder a sus datos, rectificarlos, cancelarlos o eliminarlos y oponerse a su tratamiento (derechos ARCO), así como a retirar su consentimiento.',
        en: 'You have the right to access, rectify, cancel or delete your data and to object to its processing (ARCO rights), as well as to withdraw your consent.',
      },
    ],
  },
  {
    heading: { es: 'Cómo ejercer sus derechos', en: 'How to exercise your rights' },
    paras: [
      {
        es: 'Para ejercer cualquiera de estos derechos, escríbanos a info@constructorasd.com indicando su solicitud. Atenderemos su petición en los plazos previstos por la ley.',
        en: 'To exercise any of these rights, write to us at info@constructorasd.com describing your request. We will respond within the timeframes established by law.',
      },
    ],
  },
  {
    heading: { es: 'Cambios en esta política', en: 'Changes to this policy' },
    paras: [
      {
        es: 'Podemos actualizar esta política para reflejar cambios legales u operativos. Publicaremos cualquier modificación en esta misma página.',
        en: 'We may update this policy to reflect legal or operational changes. Any modification will be published on this page.',
      },
    ],
  },
];

@Component({
  selector: 'app-privacidad',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader],
  templateUrl: './privacidad.html',
  styleUrl: './privacidad.scss',
})
export class Privacidad {
  private i18n = inject(I18nService);
  readonly sections = computed(() =>
    SECTIONS.map((s) => ({
      heading: this.i18n.pick(s.heading),
      paras: s.paras.map((p) => this.i18n.pick(p)),
    })),
  );
  constructor() {
    applyPageSeo('privacidad');
  }
}
