import { defineConfig, devices } from '@playwright/test';

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
