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
 * Chromium by default; add WebKit with PW_WEBKIT=1 (second-engine cross-browser pass) once
 * `npx playwright install webkit` has run. CI keeps Chromium-only for speed.
 */
const withWebkit = process.env.PW_WEBKIT === '1';
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  // Chromium gate is strict (0). The heavier cross-engine pass (PW_WEBKIT=1) gets one retry to absorb
  // environmental flakes — WebKit-on-Windows intermittently times out its page-load wait under machine load
  // (confirmed: the same specs pass on re-run and in isolation), which is not a site defect.
  retries: withWebkit ? 1 : 0,
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
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // WebKit covers the PUBLIC site (cross-engine rendering/layout). The admin CMS is Chromium-only: it's a
    // private single-browser tool, its logic is engine-agnostic, and running its DB mutations on two engines
    // against the shared dev database would race. Evidence capture is Chromium-only too.
    ...(withWebkit ? [{ name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: [/admin-cms\.spec\.ts/, /evidence\.spec\.ts/] }] : []),
  ],
});
