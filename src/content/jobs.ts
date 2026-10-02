// Open positions. Empty in v1 → the Vacantes page shows the spontaneous-application state (send your CV).
// No fabricated vacancies (rule 2).
import { Job } from './types';

import { ov } from './_overrides';
const JOBS_SEED: Job[] = [];

export const JOBS: Job[] = ov('jobs', JOBS_SEED);
