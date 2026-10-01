// build-env.mjs — Vercel build entrypoint.
//
// Resolves the environment (explicit --env, else from VERCEL_GIT_COMMIT_REF: main -> prod, else dev),
// generates src/environments/environment.ts, then runs the full `npm run build` (prebuild guards + prerender).
//
// vercel.json uses: "buildCommand": "node scripts/build-env.mjs"
// Refuses to run with an invalid --env value (CLAUDE.md: --env gated scripts).

import { spawnSync } from 'node:child_process';
import { generateEnvironment, resolveEnvName } from './gen-environment.mjs';

const argv = process.argv.slice(2);
const i = argv.indexOf('--env');
const explicit = i !== -1 ? argv[i + 1] : undefined;

if (explicit && !['dev', 'prod'].includes(explicit)) {
  console.error(`✖ build-env: --env must be "dev" or "prod" (got "${explicit}")`);
  process.exit(1);
}

const envName = resolveEnvName(explicit);
const env = generateEnvironment(envName);
console.log(`▶ build-env: building for ENV_NAME="${envName}" (siteUrl=${env.siteUrl})`);

// Run the project build (prebuild guards run automatically via npm lifecycle).
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const res = spawnSync(npmCmd, ['run', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, ENV_NAME: envName },
  shell: process.platform === 'win32',
});
process.exit(res.status ?? 1);
