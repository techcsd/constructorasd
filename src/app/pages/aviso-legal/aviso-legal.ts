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
    heading: { es: 'Titularidad del sitio', en: 'Site ownership' },
    paras: [
      {
        es: 'Este sitio web, constructorasd.com, es titularidad de Constructora Scheker & Domínguez («CSD»). Contacto: info@constructorasd.com · 809-692-5906. [Razón social, RNC y domicilio legal — pendiente de confirmar.]',
        en: 'This website, constructorasd.com, is owned by Constructora Scheker & Domínguez (“CSD”). Contact: info@constructorasd.com · 809-692-5906. [Registered name, RNC (tax ID) and legal address — pending confirmation.]',
      },
    ],
  },
  {
    heading: { es: 'Objeto y condiciones de uso', en: 'Purpose and terms of use' },
    paras: [
      {
        es: 'Este sitio tiene carácter informativo sobre la empresa, sus servicios y sus proyectos. El acceso y uso del sitio implican la aceptación de las presentes condiciones. El usuario se compromete a hacer un uso lícito y adecuado de sus contenidos.',
        en: 'This site is informational in nature, covering the company, its services and its projects. Accessing and using the site implies acceptance of these terms. The user agrees to make lawful and appropriate use of its contents.',
      },
    ],
  },
  {
    heading: { es: 'Propiedad intelectual', en: 'Intellectual property' },
    paras: [
      {
        es: 'Las marcas, logotipos, textos, fotografías y demás contenidos del sitio son propiedad de CSD o de sus respectivos titulares y están protegidos por la legislación aplicable. No se permite su reproducción, distribución o modificación sin autorización previa.',
        en: 'The trademarks, logos, texts, photographs and other contents of the site are the property of CSD or of their respective owners and are protected by applicable law. Their reproduction, distribution or modification is not permitted without prior authorization.',
      },
    ],
  },
  {
    heading: { es: 'Limitación de responsabilidad', en: 'Limitation of liability' },
    paras: [
      {
        es: 'CSD procura que la información del sitio sea correcta y esté actualizada, pero no garantiza la ausencia de errores ni la disponibilidad ininterrumpida del servicio. CSD no será responsable de los daños derivados del uso del sitio en la medida permitida por la ley.',
        en: 'CSD endeavors to keep the information on the site accurate and up to date, but does not guarantee the absence of errors or uninterrupted availability of the service. CSD shall not be liable for damages arising from use of the site to the extent permitted by law.',
      },
    ],
  },
  {
    heading: { es: 'Enlaces externos', en: 'External links' },
    paras: [
      {
        es: 'El sitio puede contener enlaces a sitios de terceros (por ejemplo, redes sociales). CSD no se responsabiliza del contenido ni de las políticas de dichos sitios.',
        en: 'The site may contain links to third-party sites (for example, social media). CSD is not responsible for the content or policies of those sites.',
      },
    ],
  },
  {
    heading: { es: 'Ley aplicable', en: 'Applicable law' },
    paras: [
      {
        es: 'Estas condiciones se rigen por las leyes de la República Dominicana. Para cualquier controversia, las partes se someten a los tribunales competentes de la República Dominicana.',
        en: 'These terms are governed by the laws of the Dominican Republic. For any dispute, the parties submit to the competent courts of the Dominican Republic.',
      },
    ],
  },
  {
    heading: { es: 'Contacto', en: 'Contact' },
    paras: [
      {
        es: 'Para cualquier consulta relativa a este aviso legal, escríbanos a info@constructorasd.com o llame al 809-692-5906.',
        en: 'For any question regarding this legal notice, write to info@constructorasd.com or call 809-692-5906.',
      },
    ],
  },
];

@Component({
  selector: 'app-aviso-legal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader],
  templateUrl: './aviso-legal.html',
  styleUrl: './aviso-legal.scss',
})
export class AvisoLegal {
  private i18n = inject(I18nService);
  readonly sections = computed(() =>
    SECTIONS.map((s) => ({
      heading: this.i18n.pick(s.heading),
      paras: s.paras.map((p) => this.i18n.pick(p)),
    })),
  );
  constructor() {
    applyPageSeo('aviso-legal');
  }
}
