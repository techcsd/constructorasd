// The 7 construction-cycle stages — sourced from the 2026 presentation (slides 7–14). Nothing invented.
import { Stage } from './types';

export const STAGES: Stage[] = [
  {
    index: '01',
    slug: 'etapa-01',
    title: { es: 'Diseño e ingeniería', en: 'Design & engineering' },
    summary: {
      es: 'Planos de encofrado a medida e ingeniería de valor, coordinados con el equipo de obra.',
      en: 'Custom formwork drawings and value engineering, coordinated with the site team.',
    },
    capabilities: [
      { es: 'Planos de encofrado y taller', en: 'Formwork and shop drawings' },
      { es: 'Optimización de materiales y ciclos', en: 'Material and cycle optimization' },
      { es: 'Seguridad estructural verificada', en: 'Verified structural safety' },
      { es: 'Cronograma y supervisión', en: 'Scheduling and supervision' },
    ],
  },
  {
    index: '02',
    slug: 'etapa-02',
    title: { es: 'Movimiento de tierras', en: 'Earthworks' },
    summary: {
      es: 'Desbroce, excavaciones, cortes y rellenos compactados, urbanización y obras viales con equipo pesado.',
      en: 'Clearing, excavation, cuts and compacted fills, urbanization and roadworks with heavy equipment.',
    },
    capabilities: [
      { es: 'Excavaciones masivas y zanjas', en: 'Mass excavation and trenching' },
      { es: 'Cortes, rellenos y compactación', en: 'Cuts, fills and compaction' },
      { es: 'Vías, acueductos y urbanización', en: 'Roads, water mains and urbanization' },
      { es: 'Topografía y nivelación', en: 'Surveying and grading' },
    ],
  },
  {
    index: '03',
    slug: 'etapa-03',
    title: { es: 'Cimentación y obra civil', en: 'Foundations & civil works' },
    summary: {
      es: 'Cimentaciones, muros de hormigón armado y obra civil para edificaciones, plantas industriales y proyectos mineros.',
      en: 'Foundations, reinforced-concrete walls and civil works for buildings, industrial plants and mining projects.',
    },
    capabilities: [
      { es: 'Cimentaciones y muros de hormigón', en: 'Foundations and concrete walls' },
      { es: 'Acueductos, drenajes e infraestructura', en: 'Water mains, drainage and infrastructure' },
      { es: 'Obra civil industrial y minera', en: 'Industrial and mining civil works' },
      { es: 'Colocación y vibrado de hormigón', en: 'Concrete placement and vibration' },
    ],
  },
  {
    index: '04',
    slug: 'etapa-04',
    title: { es: 'Estructura', en: 'Structure' },
    summary: {
      es: 'Encofrado, acero y hormigón. Losas macizas, aligeradas y de gran altura; muros monolíticos; acero de refuerzo según ACI / RNC-11; andamios y apuntalamiento certificado.',
      en: 'Formwork, steel and concrete. Solid, lightened and high-rise slabs; monolithic walls; reinforcing steel per ACI / RNC-11; certified scaffolding and shoring.',
    },
    capabilities: [
      { es: 'Apuntalamiento de losas', en: 'Slab shoring' },
      { es: 'Encofrado de muros', en: 'Wall formwork' },
      { es: 'Acero de refuerzo', en: 'Reinforcing steel' },
      { es: 'Estructura vertical', en: 'Vertical structure' },
    ],
    heights: [
      { value: '6.00 m', label: { es: 'Doble altura', en: 'Double height' } },
      { value: '9.00 m', label: { es: 'Triple altura', en: 'Triple height' } },
      { value: '12 m +', label: { es: 'Proyectos especiales', en: 'Special projects' } },
      { value: '5.00 m', label: { es: 'Muros monolíticos', en: 'Monolithic walls' } },
    ],
  },
  {
    index: '05',
    slug: 'etapa-05',
    title: { es: 'Instalaciones y sistemas livianos', en: 'MEP & light systems' },
    summary: {
      es: 'Sistemas livianos, instalaciones y particiones que preparan la obra para las terminaciones.',
      en: 'Light systems, installations and partitions that prepare the building for finishes.',
    },
    capabilities: [
      { es: 'Particiones y cielos', en: 'Partitions and ceilings' },
      { es: 'Instalaciones coordinadas', en: 'Coordinated installations' },
      { es: 'Sistemas livianos', en: 'Light systems' },
      { es: 'Preparación para acabados', en: 'Preparation for finishes' },
    ],
  },
  {
    index: '06',
    slug: 'etapa-06',
    title: { es: 'Terminaciones', en: 'Finishes' },
    summary: {
      es: 'Acabados de alta terminación. Habitaciones, baños, lobbies y áreas sociales con estándares de hotelería de lujo.',
      en: 'High-end finishes. Guest rooms, bathrooms, lobbies and social areas to luxury-hospitality standards.',
    },
    capabilities: [
      { es: 'Habitación tipo y baños', en: 'Typical room and bathrooms' },
      { es: 'Áreas sociales interiores', en: 'Interior social areas' },
      { es: 'Lobbies e interiores corporativos', en: 'Lobbies and corporate interiors' },
      { es: 'Parques acuáticos', en: 'Water parks' },
    ],
  },
  {
    index: '07',
    slug: 'etapa-07',
    title: { es: 'Entrega llave en mano', en: 'Turnkey handover' },
    summary: {
      es: 'Resorts completos —edificios de habitaciones, áreas sociales, piscinas y urbanismo— entregados listos para operar.',
      en: 'Complete resorts —room buildings, social areas, pools and urbanism— delivered ready to operate.',
    },
    capabilities: [
      { es: 'Un solo contrato y un solo responsable', en: 'One contract, one responsible party' },
      { es: 'Control de costo, plazo y calidad', en: 'Cost, schedule and quality control' },
      { es: 'Supervisión técnica en cada etapa', en: 'Technical supervision at every stage' },
      { es: 'Entrega operativa y acompañamiento', en: 'Operational handover and support' },
    ],
  },
];
