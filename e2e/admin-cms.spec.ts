import { test, expect, Page } from '@playwright/test';

// Admin CMS suite (WJ9). Runs against the served dev build with the dev-only qa_admin (creds from
// .env.local via playwright.config). Skips when the creds aren't present (e.g. CI without .env.local).
const EMAIL = process.env['QA_ADMIN_EMAIL'];
const PASSWORD = process.env['QA_ADMIN_PASSWORD'];

test.describe('admin CMS', () => {
  // Serial: avoids concurrent logins + data loads against the dev Supabase (flaky under parallel load).
  test.describe.configure({ mode: 'serial' });
  test.skip(!EMAIL || !PASSWORD, 'QA admin creds not set (.env.local)');

  async function login(page: Page): Promise<void> {
    await page.goto('/admin/login', { waitUntil: 'networkidle' });
    await page.fill('input[type=email]', EMAIL!);
    await page.fill('input[type=password]', PASSWORD!);
    await page.locator('button[type=submit]').click();
    // Wait for the authenticated shell (publish bar) rather than a fixed delay.
    await expect(page.locator('.pb__txt')).toBeVisible({ timeout: 15000 });
  }

  test('login → projects list shows migrated projects with thumbnails', async ({ page }) => {
    await login(page);
    await page.goto('/admin/contenido/proyectos', { waitUntil: 'networkidle' });
    await expect(page.locator('.cms-row').first()).toBeVisible({ timeout: 15000 });
    expect(await page.locator('.cms-row__thumb img').count()).toBeGreaterThan(0);
  });

  test('create a draft project, see it in the list, then trash it', async ({ page }) => {
    await login(page);
    const slug = 'qa-e2e-' + Date.now().toString(36);
    await page.goto('/admin/contenido/proyectos/editar', { waitUntil: 'networkidle' });
    await page.locator('input').first().fill('QA e2e ' + slug);
    await page.locator('select').first().selectOption('industrial');
    await page.locator('select').nth(1).selectOption('ejecutado');
    await page.locator('textarea').nth(0).fill('Resumen e2e.');
    await page.locator('textarea').nth(1).fill('e2e summary.');
    await page.getByRole('button', { name: /Guardar proyecto/ }).click();
    await page.waitForURL('**/admin/contenido/proyectos');
    const row = page.locator('.cms-row', { hasText: 'QA e2e ' + slug });
    await expect(row).toHaveCount(1);
    // trash it (confirm dialog auto-accept)
    page.on('dialog', (d) => d.accept());
    await row.getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.locator('.cms-row', { hasText: 'QA e2e ' + slug })).toHaveCount(0);
  });

  test('empresa form loads the company data', async ({ page }) => {
    await login(page);
    await page.goto('/admin/contenido/empresa', { waitUntil: 'networkidle' });
    await expect(page.locator('input').first()).toHaveValue(/Constructora/);
    expect(await page.locator('.cms-office').count()).toBeGreaterThan(0);
  });

  test('biblioteca shows media with usage counts', async ({ page }) => {
    await login(page);
    await page.goto('/admin/contenido/biblioteca', { waitUntil: 'networkidle' });
    await expect(page.locator('.cms-media-card').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.cms-media-card__use').first()).toContainText(/uso/);
  });

  test('publish bar reflects state', async ({ page }) => {
    await login(page);
    await expect(page.locator('.pb__txt')).toContainText(/publicad|cambios|Comprobando/i);
  });

  test('draft preview shows an unpublished project that the public list hides (WJ5)', async ({ page }) => {
    await login(page);
    const name = 'QA preview ' + Date.now().toString(36);
    await page.goto('/admin/contenido/proyectos/editar', { waitUntil: 'networkidle' });
    await page.locator('input').first().fill(name);
    await page.locator('select').first().selectOption('industrial');
    await page.locator('select').nth(1).selectOption('ejecutado');
    await page.locator('textarea').nth(0).fill('Borrador.');
    await page.locator('textarea').nth(1).fill('Draft.');
    await page.getByRole('button', { name: /Guardar proyecto/ }).click(); // published OFF by default
    await page.waitForURL('**/admin/contenido/proyectos');

    // public list (static, published only) hides it; preview (admin session) shows it
    await page.goto('/proyectos', { waitUntil: 'networkidle' });
    await expect(page.locator('.app-project-card', { hasText: name })).toHaveCount(0);
    await page.goto('/proyectos?preview=1', { waitUntil: 'networkidle' });
    await expect(page.locator('.preview-banner')).toBeVisible();
    await expect(page.locator('.app-project-card', { hasText: name })).toHaveCount(1, { timeout: 15000 });

    // cleanup → trash
    page.on('dialog', (d) => d.accept());
    await page.goto('/admin/contenido/proyectos', { waitUntil: 'networkidle' });
    await page.locator('.cms-row', { hasText: name }).getByRole('button', { name: 'Eliminar' }).click();
  });
});
