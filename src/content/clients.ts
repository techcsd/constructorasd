// Clients & collaborations — sourced from the 2026 presentation (slides 21–22). All names real (rule 2).
// Logos exist in the deck but are not integrated yet (quality/trademark review) → ClientWall renders the
// name (brief §6). Missing logos are listed in CONTENIDO-PENDIENTE. Grouping follows the deck; re-grouped
// where a name clearly belongs elsewhere.
import { Client, ClientGroup } from './types';

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'y')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const GROUPS: Record<ClientGroup, string[]> = {
  promotores: [
    'NOVAL Properties',
    'Grupo Velutini',
    'Best In Pro',
    'BATCON',
    'Arenacal PRO',
    'Vista Cana',
    'Bluewave',
    'Civil Mek',
    'TORALCO',
    'Accent Group',
    'Cana Rock Group',
    'Casa de Campo',
    'Constructora Rizek & Asociados',
    'Conde',
    'Martí Constructora',
    'Grupo Colina',
    'Pedralbes',
    'CINTER',
    'Antillean',
    'ASA',
    'CONALPI',
    'ROSCH',
    'Grupo RSS',
    'ISLADOM',
    'GOMEP',
  ],
  hoteleria: [
    'Lopesan Group',
    'H10 Hotels',
    'AMR Collection',
    'Apple Leisure Group',
    'Blue Diamond Resorts',
    'HM Hotels',
  ],
  industria_mineria: [
    'Barrick Gold',
    'Codelpa',
    'DP World',
    'Volvo',
    'Planta de Generación Itabo',
    'Zona Franca Las Américas',
    'Amway Dominicana',
  ],
  instituciones: ['MOPC', 'Ministerio de Educación', 'PUCMM', 'Banco Popular Dominicano'],
};

let order = 0;
export const CLIENTS: Client[] = (Object.keys(GROUPS) as ClientGroup[]).flatMap((group) =>
  GROUPS[group].map((name) => ({ slug: slugify(name), name, group, order: order++ })),
);
