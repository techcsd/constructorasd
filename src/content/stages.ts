// The 7 construction-cycle stages — sourced from the 2026 presentation (slides 6–14). Nothing invented.
import { Stage } from './types';

import { ov } from './_overrides';
const STAGES_SEED: Stage[] = [
  {
    id: 'etapa-01',
    index: 1,
    title: { es: 'Diseño e ingeniería', en: 'Design & engineering' },
    tagline: {
      es: 'Losas de gran altura con ingeniería de encofrado.',
      en: 'High-rise slabs backed by formwork engineering.',
    },
    description: {
      es: 'Planos de encofrado a medida e ingeniería de valor, coordinados directamente con el equipo de obra.',
      en: 'Custom formwork drawings and value engineering, coordinated directly with the site team.',
    },
    capabilities: [
      { es: 'Planos de encofrado y taller', en: 'Formwork and shop drawings' },
      { es: 'Optimización de materiales y ciclos', en: 'Material and cycle optimization' },
      { es: 'Seguridad estructural verificada', en: 'Verified structural safety' },
      { es: 'Cronograma y supervisión', en: 'Scheduling and supervision' },
    ],
    images: [
      { src: 'stages/etapa-01', alt: { es: 'Ingeniería de encofrado para losas de gran altura', en: 'Formwork engineering for high-rise slabs' } },
    ],
  },
  {
    id: 'etapa-02',
    index: 2,
    title: { es: 'Movimiento de tierras', en: 'Earthworks' },
    tagline: {
      es: 'Preparamos el terreno con equipo pesado.',
      en: 'We prepare the ground with heavy equipment.',
    },
    description: {
      es: 'Desbroce, excavaciones, cortes y rellenos compactados, urbanización y obras viales con equipo pesado y control topográfico.',
      en: 'Clearing, excavation, cuts and compacted fills, urbanization and roadworks with heavy equipment and survey control.',
    },
    capabilities: [
      { es: 'Excavaciones masivas y zanjas', en: 'Mass excavation and trenching' },
      { es: 'Cortes, rellenos y compactación', en: 'Cuts, fills and compaction' },
      { es: 'Vías, acueductos y urbanización', en: 'Roads, water mains and urbanization' },
      { es: 'Topografía y nivelación', en: 'Surveying and grading' },
    ],
    images: [
      { src: 'stages/etapa-02', alt: { es: 'Movimiento de tierras con equipo pesado', en: 'Earthworks with heavy equipment' } },
    ],
  },
  {
    id: 'etapa-03',
    index: 3,
    title: { es: 'Cimentación y obra civil', en: 'Foundations & civil works' },
    tagline: {
      es: 'Bases sólidas para cada estructura.',
      en: 'Solid foundations for every structure.',
    },
    description: {
      es: 'Cimentaciones, muros de hormigón armado y obra civil para edificaciones, plantas industriales y proyectos mineros.',
      en: 'Foundations, reinforced-concrete walls and civil works for buildings, industrial plants and mining projects.',
    },
    capabilities: [
      { es: 'Cimentaciones y muros de hormigón', en: 'Foundations and concrete walls' },
      { es: 'Acueductos, drenajes e infraestructura', en: 'Water mains, drainage and infrastructure' },
      { es: 'Obra civil industrial y minera', en: 'Industrial and mining civil works' },
      { es: 'Colocación y vibrado de hormigón', en: 'Concrete placement and vibration' },
    ],
    images: [
      { src: 'stages/etapa-03', alt: { es: 'Obra civil industrial', en: 'Industrial civil works' } },
    ],
  },
  {
    id: 'etapa-04',
    index: 4,
    title: { es: 'Estructura', en: 'Structure' },
    tagline: {
      es: 'Encofrado, acero y hormigón a gran altura.',
      en: 'Formwork, steel and concrete at height.',
    },
    description: {
      es: 'Losas macizas, aligeradas y de gran altura; muros monolíticos; acero de refuerzo; andamios y apuntalamiento certificado.',
      en: 'Solid, lightened and high-rise slabs; monolithic walls; reinforcing steel; certified scaffolding and shoring.',
    },
    capabilities: [
      { es: 'Apuntalamiento de losas', en: 'Slab shoring' },
      { es: 'Encofrado de muros', en: 'Wall formwork' },
      { es: 'Acero de refuerzo', en: 'Reinforcing steel' },
      { es: 'Estructura vertical', en: 'Vertical structure' },
    ],
    facts: [
      { value: '6.00 m', label: { es: 'Doble altura', en: 'Double height' } },
      { value: '9.00 m', label: { es: 'Triple altura', en: 'Triple height' } },
      { value: '12 m +', label: { es: 'Proyectos especiales', en: 'Special projects' } },
      { value: '5.00 m', label: { es: 'Muros monolíticos', en: 'Monolithic walls' } },
    ],
    note: {
      es: 'Acero de refuerzo según ACI / RNC-11.',
      en: 'Reinforcing steel per ACI / RNC-11.',
    },
    images: [
      { src: 'stages/etapa-04', alt: { es: 'Estructura vertical y encofrado de gran altura', en: 'Vertical structure and high formwork' } },
    ],
  },
  {
    id: 'etapa-05',
    index: 5,
    title: { es: 'Sistemas livianos', en: 'Light systems' },
    tagline: {
      es: 'Envolventes e interiores livianos.',
      en: 'Light envelopes and interiors.',
    },
    description: {
      es: 'Fachadas ACM, envolventes e interiores livianos que preparan la obra para las terminaciones.',
      en: 'ACM façades, light envelopes and interiors that prepare the building for finishes.',
    },
    capabilities: [
      { es: 'Fachadas ACM', en: 'ACM façades' },
      { es: 'Particiones y cielos', en: 'Partitions and ceilings' },
      { es: 'Envolventes livianas', en: 'Light envelopes' },
      { es: 'Preparación para acabados', en: 'Preparation for finishes' },
    ],
    note: {
      es: 'Dirección técnica del Ing. Ángel R. Caraballo (formación AWCI).',
      en: 'Technical direction by Ing. Ángel R. Caraballo (AWCI training).',
    },
    images: [
      { src: 'stages/etapa-05', alt: { es: 'Fachada ACM — Plaza Roque, Punta Cana', en: 'ACM façade — Plaza Roque, Punta Cana' } },
    ],
  },
  {
    id: 'etapa-06',
    index: 6,
    title: { es: 'Terminaciones', en: 'Finishes' },
    tagline: {
      es: 'Acabados de alta terminación.',
      en: 'High-end finishes.',
    },
    description: {
      es: 'Habitaciones, baños, lobbies y áreas sociales entregados con estándares de hotelería de lujo.',
      en: 'Guest rooms, bathrooms, lobbies and social areas delivered to luxury-hospitality standards.',
    },
    capabilities: [
      { es: 'Habitación tipo y baños', en: 'Typical room and bathrooms' },
      { es: 'Áreas sociales interiores', en: 'Interior social areas' },
      { es: 'Lobbies e interiores corporativos', en: 'Lobbies and corporate interiors' },
      { es: 'Parques acuáticos', en: 'Water parks' },
    ],
    images: [
      { src: 'stages/etapa-06', alt: { es: 'Acabados de alta terminación', en: 'High-end finishes' } },
    ],
  },
  {
    id: 'etapa-07',
    index: 7,
    title: { es: 'Entrega llave en mano', en: 'Turnkey handover' },
    tagline: {
      es: 'Resorts completos listos para operar.',
      en: 'Complete resorts ready to operate.',
    },
    description: {
      es: 'Resorts completos —edificios de habitaciones, áreas sociales, piscinas y urbanismo— entregados listos para operar.',
      en: 'Complete resorts —room buildings, social areas, pools and urbanism— delivered ready to operate.',
    },
    capabilities: [
      { es: 'Un solo contrato y un solo responsable', en: 'One contract, one responsible party' },
      { es: 'Control de costo, plazo y calidad', en: 'Cost, schedule and quality control' },
      { es: 'Supervisión técnica en cada etapa', en: 'Technical supervision at every stage' },
      { es: 'Entrega operativa y acompañamiento', en: 'Operational handover and support' },
    ],
    images: [
      { src: 'stages/etapa-07', alt: { es: 'Entrega de proyecto llave en mano', en: 'Turnkey project handover' } },
    ],
  },
];

export const STAGES: Stage[] = ov('stages', STAGES_SEED);
