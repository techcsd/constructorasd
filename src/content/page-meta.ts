/**
 * Page metadata for the Prompt-1 shells (SEO + H1 + eyebrow + lead), bilingual via { es, en }.
 * These are section statements and neutral descriptions — never invented facts/figures (CLAUDE.md rule 2).
 * Prompt 2 replaces the shells with full pages; the keys here stay the same.
 */
export interface LocalizedText {
  es: string;
  en: string;
}

export interface PageMeta {
  eyebrow?: LocalizedText;
  index?: string;
  h1: LocalizedText;
  /** A word/phrase inside h1 to render in editorial serif italic (one per screen). */
  emphasis?: LocalizedText;
  lead?: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
}

export const PAGE_META: Record<string, PageMeta> = {
  home: {
    eyebrow: { es: 'Santo Domingo · Punta Cana · desde 2014', en: 'Santo Domingo · Punta Cana · since 2014' },
    h1: { es: 'Construyendo el futuro con bases sólidas', en: 'Building the future on solid ground' },
    emphasis: { es: 'sólidas', en: 'solid ground' },
    lead: {
      es: 'Entregamos resorts, hospitales y obras institucionales llave en mano, cubriendo todo el ciclo constructivo con un solo equipo.',
      en: 'We deliver resorts, hospitals and institutional works turnkey, covering the whole construction cycle with a single team.',
    },
    title: { es: 'Inicio', en: 'Home' },
    description: {
      es: 'Constructora Scheker & Domínguez: obras llave en mano en República Dominicana — del terreno a la entrega.',
      en: 'Constructora Scheker & Domínguez: turnkey construction in the Dominican Republic — from groundwork to handover.',
    },
  },
  empresa: {
    eyebrow: { es: 'La empresa', en: 'The company' },
    index: '01',
    h1: { es: 'Un solo equipo, todo el ciclo constructivo.', en: 'One team, the whole construction cycle.' },
    lead: {
      es: 'Movimiento de tierra, estructuras, sistemas livianos y terminaciones, bajo un mismo contrato y un mismo responsable.',
      en: 'Earthworks, structures, light systems and finishes — under one contract and one responsible party.',
    },
    title: { es: 'Empresa', en: 'Company' },
    description: {
      es: 'Quiénes somos: una constructora que ejecuta el ciclo completo de la obra con un solo equipo responsable.',
      en: 'Who we are: a builder that runs the full construction cycle with a single accountable team.',
    },
  },
  servicios: {
    eyebrow: { es: 'Servicios', en: 'Services' },
    index: '02',
    h1: { es: 'Del terreno a la llave en mano.', en: 'From the ground to turnkey.' },
    lead: {
      es: 'Siete etapas del ciclo constructivo, cada una ejecutada con equipo y sistemas propios.',
      en: 'Seven stages of the construction cycle, each executed with our own equipment and systems.',
    },
    title: { es: 'Servicios', en: 'Services' },
    description: {
      es: 'Las siete etapas del ciclo constructivo de Constructora SD, del movimiento de tierra a las terminaciones.',
      en: 'The seven stages of the Constructora SD construction cycle, from earthworks to finishes.',
    },
  },
  equipos: {
    eyebrow: { es: 'Equipos', en: 'Equipment' },
    index: '03',
    h1: { es: 'Equipos y sistemas para construir a escala.', en: 'Equipment and systems to build at scale.' },
    lead: {
      es: 'Maquinaria propia y sistemas de encofrado Faresin, PERI y Symons para estructuras de gran formato.',
      en: 'Our own machinery and Faresin, PERI and Symons formwork systems for large-format structures.',
    },
    title: { es: 'Equipos', en: 'Equipment' },
    description: {
      es: 'Maquinaria y sistemas de encofrado de Constructora SD para obras de gran escala.',
      en: 'Constructora SD machinery and formwork systems for large-scale works.',
    },
  },
  proyectos: {
    eyebrow: { es: 'Proyectos', en: 'Projects' },
    index: '04',
    h1: { es: 'Obras que hablan por nosotros.', en: 'Work that speaks for us.' },
    lead: {
      es: 'Una selección de proyectos hoteleros, institucionales e industriales ejecutados por Constructora SD.',
      en: 'A selection of hospitality, institutional and industrial projects built by Constructora SD.',
    },
    title: { es: 'Proyectos', en: 'Projects' },
    description: {
      es: 'Proyectos de Constructora SD: resorts, hospitales y obras institucionales en República Dominicana.',
      en: 'Constructora SD projects: resorts, hospitals and institutional works in the Dominican Republic.',
    },
  },
  clientes: {
    eyebrow: { es: 'Clientes', en: 'Clients' },
    index: '05',
    h1: { es: 'Clientes y colaboraciones.', en: 'Clients and collaborations.' },
    lead: {
      es: 'Promotores, cadenas hoteleras, industria e instituciones que han confiado en nuestro trabajo.',
      en: 'Developers, hotel chains, industry and institutions that have trusted our work.',
    },
    title: { es: 'Clientes', en: 'Clients' },
    description: {
      es: 'Clientes y colaboraciones de Constructora Scheker & Domínguez.',
      en: 'Clients and collaborations of Constructora Scheker & Domínguez.',
    },
  },
  vacantes: {
    eyebrow: { es: 'Vacantes', en: 'Careers' },
    h1: { es: 'Construye tu carrera con nosotros.', en: 'Build your career with us.' },
    lead: {
      es: 'Buscamos personas que sepan construir con rigor. Envíanos tu CV y conversemos.',
      en: 'We look for people who build with rigor. Send us your CV and let’s talk.',
    },
    title: { es: 'Vacantes', en: 'Careers' },
    description: {
      es: 'Oportunidades para trabajar en Constructora SD. Envía tu CV.',
      en: 'Opportunities to work at Constructora SD. Send your CV.',
    },
  },
  noticias: {
    eyebrow: { es: 'Noticias', en: 'News' },
    h1: { es: 'Novedades y avances de obra.', en: 'Updates and project progress.' },
    lead: {
      es: 'Notas sobre nuestros proyectos, hitos y la empresa.',
      en: 'Notes on our projects, milestones and the company.',
    },
    title: { es: 'Noticias', en: 'News' },
    description: {
      es: 'Noticias y avances de Constructora Scheker & Domínguez.',
      en: 'News and progress from Constructora Scheker & Domínguez.',
    },
  },
  contacto: {
    eyebrow: { es: 'Contacto', en: 'Contact' },
    h1: { es: 'Hablemos de tu proyecto.', en: 'Let’s talk about your project.' },
    lead: {
      es: 'Cuéntanos qué quieres construir. Te respondemos por correo o WhatsApp.',
      en: 'Tell us what you want to build. We reply by email or WhatsApp.',
    },
    title: { es: 'Contacto', en: 'Contact' },
    description: {
      es: 'Contacta a Constructora SD: teléfono, correo y WhatsApp.',
      en: 'Contact Constructora SD: phone, email and WhatsApp.',
    },
  },
  privacidad: {
    eyebrow: { es: 'Legal', en: 'Legal' },
    h1: { es: 'Política de privacidad.', en: 'Privacy policy.' },
    lead: {
      es: 'Cómo tratamos los datos que nos envías a través del sitio.',
      en: 'How we handle the data you send us through the site.',
    },
    title: { es: 'Política de privacidad', en: 'Privacy policy' },
    description: {
      es: 'Política de privacidad de Constructora SD (Ley 172-13 RD).',
      en: 'Constructora SD privacy policy (Dominican Law 172-13).',
    },
  },
  'aviso-legal': {
    eyebrow: { es: 'Legal', en: 'Legal' },
    h1: { es: 'Aviso legal.', en: 'Legal notice.' },
    lead: {
      es: 'Información legal y condiciones de uso del sitio.',
      en: 'Legal information and terms of use of the site.',
    },
    title: { es: 'Aviso legal', en: 'Legal notice' },
    description: {
      es: 'Aviso legal y condiciones de uso de constructorasd.com.',
      en: 'Legal notice and terms of use of constructorasd.com.',
    },
  },
};
