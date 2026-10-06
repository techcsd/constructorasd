// gen-version.mjs — prebuild: write public/version.json with the build timestamp + a revision marker.
// The admin's publish bar fetches /version.json to detect when a new deploy has gone live (WK2 degraded
// path, used when a Vercel token isn't configured). Build-generated + gitignored.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'version.json');

const rev = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || String(Date.now());
const builtAt = new Date().toISOString();

mkdirSync(join(ROOT, 'public'), { recursive: true });
writeFileSync(OUT, JSON.stringify({ builtAt, rev: rev.slice(0, 12) }) + '\n');
console.log(`[gen-version] ✓ public/version.json (rev ${rev.slice(0, 12)}, ${builtAt})`);
