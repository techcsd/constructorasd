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

    // Collapsed icon rail
    await page.locator('.adm__collapse').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${DIR}/admin-06-rail.png`, fullPage: true });
    await page.locator('.adm__collapse').click(); // expand again for the rest of the shots
    await page.waitForTimeout(400);
    await page.goto('/admin/contenido/inicio', { waitUntil: 'networkidle' });
    await expect(page.locator('.cms-title')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${DIR}/admin-03-inicio.png`, fullPage: true });
    await page.goto('/admin/contenido/proyectos', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${DIR}/admin-04-proyectos.png`, fullPage: true });

    // Command palette: Ctrl+K opens, typing filters, Enter navigates.
    await page.keyboard.press('Control+k');
    await expect(page.locator('.cmdk__input')).toBeVisible({ timeout: 5000 });
    await page.locator('.cmdk__input').fill('clien');
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${DIR}/admin-05-palette.png`, fullPage: true });
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/admin\/contenido\/clientes/, { timeout: 5000 });

    // Keyboard shortcuts help (?)
    await page.keyboard.press('?');
    await expect(page.locator('.cmdk__help-list')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: `${DIR}/admin-07-shortcuts.png`, fullPage: true });
    await page.keyboard.press('Escape');
    await expect(page.locator('.cmdk__help-list')).toBeHidden({ timeout: 5000 });

    // Project editor with the sticky live preview — open the first published project's editor.
    await page.goto('/admin/contenido/proyectos', { waitUntil: 'networkidle' });
    // Prefer a row with a real cover image so the focal picker shows a photo; fall back to any row.
    const withCover = page.locator('.cms-row:has(.cms-row__thumb img) a:has-text("Editar")').first();
    const edit = (await withCover.count())
      ? withCover
      : page.locator('.cms-row a:has-text("Editar"), a.adm-btn:has-text("Editar")').first();
    if (await edit.count()) {
      await edit.click();
      await expect(page.locator('.cms-editor')).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${DIR}/admin-08-editor.png`, fullPage: true });
    }
  });
});
