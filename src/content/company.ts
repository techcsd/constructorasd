// Company facts — sourced from the 2026 presentation (slides 3, 4, 16, 23). Nothing invented (rule 2).
import { Advantage, Stat } from './types';
import { LocalizedText } from './page-meta';

export const STATS: Stat[] = [
  { value: '45+', label: { es: 'Proyectos ejecutados', en: 'Projects delivered' } },
  { value: '12', label: { es: 'Años de experiencia', en: 'Years of experience' } },
  { value: '8', label: { es: 'Ciudades y regiones', en: 'Cities and regions' } },
  { value: '7', label: { es: 'Etapas del ciclo', en: 'Stages of the cycle' } },
];

export const PHILOSOPHY_QUOTE: { text: LocalizedText; attribution: LocalizedText } = {
  text: {
    es: 'Innovar es una actividad de riesgo, cuyo principal riesgo es no practicarla.',
    en: 'Innovation is a risky activity, whose main risk is not practicing it.',
  },
  attribution: { es: 'Filosofía empresarial CSD', en: 'CSD company philosophy' },
};

export const SECTORS: { key: string; label: LocalizedText }[] = [
  { key: 'hotelero', label: { es: 'Hotelero y turístico', en: 'Hospitality & tourism' } },
  { key: 'institucional', label: { es: 'Institucional y comercial', en: 'Institutional & commercial' } },
  { key: 'hospitalario', label: { es: 'Hospitalario', en: 'Healthcare' } },
  { key: 'industrial', label: { es: 'Industrial y zona franca', en: 'Industrial & free-trade zone' } },
  { key: 'residencial', label: { es: 'Residencial', en: 'Residential' } },
  { key: 'minero', label: { es: 'Minero', en: 'Mining' } },
];

export const ADVANTAGES: Advantage[] = [
  {
    index: '01',
    title: { es: 'Alcance integral', en: 'End-to-end scope' },
    body: {
      es: 'Del movimiento de tierras a la entrega llave en mano, con un solo interlocutor.',
      en: 'From earthworks to turnkey delivery, with a single point of contact.',
    },
  },
  {
    index: '02',
    title: { es: 'Estructuras complejas', en: 'Complex structures' },
    body: {
      es: 'Capacidad técnica para geometrías y sistemas de alta complejidad.',
      en: 'Technical capacity for high-complexity geometries and systems.',
    },
  },
  {
    index: '03',
    title: { es: 'Tiempo y calidad', en: 'Time and quality' },
    body: {
      es: 'Procesos optimizados que maximizan velocidad sin comprometer estándares.',
      en: 'Optimized processes that maximize speed without compromising standards.',
    },
  },
  {
    index: '04',
    title: { es: 'Mayor seguridad', en: 'Greater safety' },
    body: {
      es: 'Protocolos que reducen riesgos y accidentes en todas las etapas.',
      en: 'Protocols that reduce risks and accidents at every stage.',
    },
  },
  {
    index: '05',
    title: { es: 'Ingeniería de valor', en: 'Value engineering' },
    body: {
      es: 'Ahorros reales sin sacrificar calidad ni resistencia.',
      en: 'Real savings without sacrificing quality or strength.',
    },
  },
  {
    index: '06',
    title: { es: 'Organización en obra', en: 'On-site organization' },
    body: {
      es: 'Orden y limpieza permanentes que garantizan el cronograma.',
      en: 'Permanent order and cleanliness that keep the schedule on track.',
    },
  },
];
