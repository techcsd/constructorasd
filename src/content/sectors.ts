// Sectors — sourced from the 2026 presentation (slide 16). Projects attached by obvious match; uncertain
// matches are flagged in CONTENIDO-PENDIENTE. Nothing invented (rule 2).
import { Sector } from './types';

export const SECTORS: Sector[] = [
  {
    id: 'hotelero',
    name: { es: 'Hotelero y turístico', en: 'Hospitality & tourism' },
    blurb: {
      es: 'Resorts y hoteles llave en mano, de la estructura a las terminaciones de lujo.',
      en: 'Turnkey resorts and hotels, from structure to luxury finishes.',
    },
    projects: ['lopesan-costa-bavaro-bloque-f', 'riviera-bay', 'monterezzo', 'elements-volare', 'olea', 'poseidonia'],
  },
  {
    id: 'institucional',
    name: { es: 'Institucional y comercial', en: 'Institutional & commercial' },
    blurb: {
      es: 'Edificaciones comerciales e institucionales con envolventes de alto desempeño.',
      en: 'Commercial and institutional buildings with high-performance envelopes.',
    },
    projects: ['brisas-city-center', 'city-place', 'plaza-roque', 'torre-alpha'],
  },
  {
    id: 'hospitalario',
    name: { es: 'Hospitalario', en: 'Healthcare' },
    blurb: {
      es: 'Infraestructura hospitalaria con exigencias técnicas y de plazo elevadas.',
      en: 'Healthcare infrastructure with demanding technical and schedule requirements.',
    },
    projects: ['hospital-barahona'],
  },
  {
    id: 'industrial',
    name: { es: 'Industrial y zona franca', en: 'Industrial & free-trade zone' },
    blurb: {
      es: 'Obra civil para plantas industriales y zonas francas.',
      en: 'Civil works for industrial plants and free-trade zones.',
    },
    projects: [],
  },
  {
    id: 'residencial',
    name: { es: 'Residencial', en: 'Residential' },
    blurb: {
      es: 'Torres y conjuntos residenciales de estructura compleja.',
      en: 'Residential towers and complexes with complex structures.',
    },
    projects: ['villa-cacique-38'],
  },
  {
    id: 'minero',
    name: { es: 'Minero', en: 'Mining' },
    blurb: {
      es: 'Obra civil e infraestructura para operaciones mineras.',
      en: 'Civil works and infrastructure for mining operations.',
    },
    projects: [],
  },
];
