// Clients & collaborations — sourced from the 2026 presentation (slides 21–22). All names real (rule 2).
// Grouping is organizational (for the Clientes page) and can be refined in Prompt 2.
import { Client } from './types';

export const CLIENTS: Client[] = [
  // Promotores y constructoras
  { name: 'NOVAL Properties', group: 'promotores' },
  { name: 'Grupo Velutini', group: 'promotores' },
  { name: 'Best In Pro', group: 'promotores' },
  { name: 'BATCON', group: 'promotores' },
  { name: 'Arenacal PRO', group: 'promotores' },
  { name: 'Vista Cana', group: 'promotores' },
  { name: 'Bluewave', group: 'promotores' },
  { name: 'Civil Mek', group: 'promotores' },
  { name: 'Accent Group', group: 'promotores' },
  { name: 'Constructora Rizek & Asociados', group: 'promotores' },
  { name: 'Conde Martí', group: 'promotores' },
  { name: 'Constructora Grupo Colina', group: 'promotores' },
  { name: 'Pedralbes', group: 'promotores' },
  { name: 'CINTER', group: 'promotores' },
  { name: 'Antillean', group: 'promotores' },
  { name: 'ASA', group: 'promotores' },
  { name: 'CONALPI', group: 'promotores' },
  { name: 'ROSCH', group: 'promotores' },
  { name: 'Grupo RSS', group: 'promotores' },
  { name: 'GOMEP', group: 'promotores' },
  { name: 'ISLADOM', group: 'promotores' },

  // Hotelería
  { name: 'Lopesan Group', group: 'hoteleria' },
  { name: 'H10 Hotels', group: 'hoteleria' },
  { name: 'AMR Collection', group: 'hoteleria' },
  { name: 'Apple Leisure Group', group: 'hoteleria' },
  { name: 'Blue Diamond Resorts', group: 'hoteleria' },
  { name: 'HM Hotels', group: 'hoteleria' },
  { name: 'Cana Rock Group', group: 'hoteleria' },
  { name: 'Casa de Campo', group: 'hoteleria' },

  // Industria y minería
  { name: 'Barrick Gold', group: 'industria' },
  { name: 'Codelpa', group: 'industria' },
  { name: 'TORALCO', group: 'industria' },
  { name: 'DP World', group: 'industria' },
  { name: 'Volvo', group: 'industria' },
  { name: 'Zona Franca Las Américas', group: 'industria' },
  { name: 'Planta de Generación Itabo', group: 'industria' },
  { name: 'Amway Dominicana', group: 'industria' },

  // Instituciones
  { name: 'MOPC', group: 'instituciones' },
  { name: 'Ministerio de Educación', group: 'instituciones' },
  { name: 'PUCMM', group: 'instituciones' },
  { name: 'Banco Popular Dominicano', group: 'instituciones' },
];
