// Equipment lines + formwork systems — sourced from the 2026 presentation (slide 11). Nothing invented.
import { Equipment } from './types';

export const EQUIPMENT: Equipment[] = [
  { index: 1, name: { es: 'Encofrado modular metálico', en: 'Modular metal formwork' } },
  { index: 2, name: { es: 'Encofrado de aluminio para muros y losas', en: 'Aluminium formwork for walls and slabs' } },
  { index: 3, name: { es: 'Andamios multidireccionales certificados', en: 'Certified multidirectional scaffolding' } },
  { index: 4, name: { es: 'Grúas torre y grúas móviles', en: 'Tower cranes and mobile cranes' } },
  { index: 5, name: { es: 'Mezcladoras y bombas de concreto', en: 'Concrete mixers and pumps' } },
  { index: 6, name: { es: 'Equipos de corte y doblado de acero', en: 'Steel cutting and bending equipment' } },
  { index: 7, name: { es: 'Vibradores de inmersión profesionales', en: 'Professional immersion vibrators' } },
  { index: 8, name: { es: 'Equipos de topografía y nivelación', en: 'Surveying and grading equipment' } },
];

export const FORMWORK_SYSTEMS: string[] = ['Faresin', 'PERI', 'Symons'];
