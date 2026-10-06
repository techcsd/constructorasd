import { defineConfig, devices } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';

// Load dev-only QA admin creds from .env.local (gitignored) so the admin CMS suite can log in. Absent
// in CI → those tests skip gracefully.
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^(QA_ADMIN_[A-Z]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

/**
 * Playwright smoke config. Serves the prerendered build (run `npm run build` first).
 * Chromium only (headless shell installed in CI).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4466',
    trace: 'off',
  },
  webServer: {
    command: 'node scripts/serve-dist.mjs',
    url: 'http://localhost:4466',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
