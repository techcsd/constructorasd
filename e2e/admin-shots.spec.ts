import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

// Dark-studio-console screenshots for the WO1 record. Run: PW_SHOT=1 npx playwright test admin-shots --project=chromium
const RUN = process.env.PW_SHOT === '1';
const DIR = 'docs/round-04-qa';
const EMAIL = process.env['QA_ADMIN_EMAIL'];
const PASSWORD = process.env['QA_ADMIN_PASSWORD'];

test.describe('admin dark theme shots', () => {
  test.skip(!RUN || !EMAIL || !PASSWORD, 'set PW_SHOT=1 + QA creds');
  test.beforeAll(() => mkdirSync(DIR, { recursive: true }));

  test('capture login + panel + editor', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/admin/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${DIR}/admin-01-login.png`, fullPage: true });
    await page.fill('input[type=email]', EMAIL!);
    await page.fill('input[type=password]', PASSWORD!);
    await page.locator('button[type=submit]').click();
    await expect(page.locator('.pb__txt')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(900); // let the route transition + entrance motion settle before the shot
    await page.screenshot({ path: `${DIR}/admin-02-panel.png`, fullPage: true });
    await page.goto('/admin/contenido/inicio', { waitUntil: 'networkidle' });
    await expect(page.locator('.cms-title')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${DIR}/admin-03-inicio.png`, fullPage: true });
    await page.goto('/admin/contenido/proyectos', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${DIR}/admin-04-proyectos.png`, fullPage: true });
  });
});
