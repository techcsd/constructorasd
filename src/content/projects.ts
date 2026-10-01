// Projects — sourced from the 2026 presentation (slides 17–19). Names + clients are real (rule 2).
// Sector/city are only set where confirmed; the rest await Prompt 2 (see CONTENIDO-PENDIENTE.md).
import { Project } from './types';

export const PROJECTS: Project[] = [
  { slug: 'poseidonia', name: 'Poseidonia', client: 'NOVAL Properties' },
  { slug: 'torre-alpha', name: 'Torre Alpha', client: 'GV Construcción' },
  { slug: 'riviera-bay', name: 'Riviera Bay', client: 'NOVAL Properties' },
  { slug: 'city-place', name: 'City Place', client: 'Best In Pro' },
  { slug: 'brisas-city-center', name: 'Brisas City Center', client: 'BATCON' },
  {
    slug: 'lopesan-costa-bavaro-bloque-f',
    name: 'Lopesan Costa Bávaro — Bloque F',
    client: 'Arenacal PRO',
    sector: 'hotelero',
    city: 'Punta Cana',
    featured: true,
    image: 'lopesan/hero',
  },
  { slug: 'monterezzo', name: 'Monterezzo', client: 'Vista Cana' },
  { slug: 'elements-volare', name: 'Elements Volare', client: 'Bluewave' },
  { slug: 'olea', name: 'Olea', client: 'Bluewave' },
  {
    slug: 'hospital-barahona',
    name: 'Hospital Barahona',
    client: 'TORALCO',
    sector: 'hospitalario',
    city: 'Barahona',
  },
  { slug: 'villa-cacique-38', name: 'Villa Cacique 38', client: 'Accent Group' },
];
