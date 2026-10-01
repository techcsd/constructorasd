// Company facts — sourced from the 2026 presentation (slides 1, 3, 4, 23, 24). Nothing invented (rule 2).
// `founded` is NOT stated in the deck → left undefined and listed in CONTENIDO-PENDIENTE.
import { Company } from './types';

export const COMPANY: Company = {
  name: 'Constructora Scheker & Domínguez',
  shortName: 'Constructora SD',
  tagline: {
    es: 'Construyendo el futuro con bases sólidas',
    en: 'Building the future on solid ground',
  },
  description: {
    es: 'Constructora Scheker & Domínguez (CSD) es una empresa dominicana dedicada al diseño, construcción y supervisión de proyectos. Integramos en un mismo equipo las capacidades necesarias para llevar una obra desde el terreno natural hasta su entrega final. Hemos ejecutado obras hoteleras, institucionales, hospitalarias, industriales y mineras, desde el movimiento de tierras hasta los acabados, con un único interlocutor para todo el proyecto.',
    en: 'Constructora Scheker & Domínguez (CSD) is a Dominican company dedicated to the design, construction and supervision of projects. We bring together, in a single team, every capability needed to carry a project from raw ground to final handover. We have delivered hospitality, institutional, healthcare, industrial and mining works — from earthworks to finishes — with a single point of contact for the whole project.',
  },
  mission: {
    es: 'Brindar soluciones constructivas integrales y de alta calidad, cumpliendo los más exigentes estándares del sector y garantizando calidad y puntualidad en cada entrega.',
    en: 'To deliver integral, high-quality construction solutions that meet the sector’s most demanding standards, guaranteeing quality and punctuality on every handover.',
  },
  vision: {
    es: 'Ser la empresa constructora de referencia en el Caribe, reconocida por su innovación, su excelencia y su capacidad de entregar proyectos llave en mano.',
    en: 'To be the benchmark construction company in the Caribbean, recognized for its innovation, its excellence and its ability to deliver turnkey projects.',
  },
  values: [
    { es: 'Calidad', en: 'Quality' },
    { es: 'Eficiencia', en: 'Efficiency' },
    { es: 'Seguridad', en: 'Safety' },
    { es: 'Compromiso', en: 'Commitment' },
  ],
  philosophyQuote: {
    es: 'Innovar es una actividad de riesgo, cuyo principal riesgo es no practicarla.',
    en: 'Innovation is a risky activity, whose main risk is not practicing it.',
  },
  philosophyAttribution: {
    es: 'Filosofía empresarial CSD',
    en: 'CSD company philosophy',
  },
  stats: [
    { value: '45+', label: { es: 'Proyectos ejecutados', en: 'Projects delivered' } },
    { value: '12', label: { es: 'Años de experiencia', en: 'Years of experience' } },
    { value: '8', label: { es: 'Ciudades y regiones', en: 'Cities and regions' } },
    { value: '7', label: { es: 'Etapas del ciclo', en: 'Stages of the cycle' } },
  ],
  advantages: [
    {
      title: { es: 'Alcance integral', en: 'End-to-end scope' },
      text: {
        es: 'Del movimiento de tierras a la entrega llave en mano, con un solo interlocutor.',
        en: 'From earthworks to turnkey delivery, with a single point of contact.',
      },
    },
    {
      title: { es: 'Estructuras complejas', en: 'Complex structures' },
      text: {
        es: 'Capacidad técnica para geometrías y sistemas de alta complejidad.',
        en: 'Technical capacity for high-complexity geometries and systems.',
      },
    },
    {
      title: { es: 'Tiempo y calidad', en: 'Time and quality' },
      text: {
        es: 'Procesos optimizados que maximizan velocidad sin comprometer estándares.',
        en: 'Optimized processes that maximize speed without compromising standards.',
      },
    },
    {
      title: { es: 'Mayor seguridad', en: 'Greater safety' },
      text: {
        es: 'Protocolos que reducen riesgos y accidentes en todas las etapas.',
        en: 'Protocols that reduce risks and accidents at every stage.',
      },
    },
    {
      title: { es: 'Ingeniería de valor', en: 'Value engineering' },
      text: {
        es: 'Ahorros reales sin sacrificar calidad ni resistencia.',
        en: 'Real savings without sacrificing quality or strength.',
      },
    },
    {
      title: { es: 'Organización en obra', en: 'On-site organization' },
      text: {
        es: 'Orden y limpieza permanentes que garantizan el cronograma.',
        en: 'Permanent order and cleanliness that keep the schedule on track.',
      },
    },
  ],
  phones: ['809-692-5906', '829-322-5878'],
  email: 'info@constructorasd.com',
  instagram: 'constructorasd',
  whatsapp: '18096925906',
  presence: { es: 'Santo Domingo · Punta Cana', en: 'Santo Domingo · Punta Cana' },
  founded: undefined,
};
