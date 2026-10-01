import { test, expect } from '@playwright/test';

const SLUGS = [
  'lopesan-costa-bavaro-bloque-f',
  'poseidonia',
  'hospital-barahona',
  'brisas-city-center',
  'torre-alpha',
  'riviera-bay',
  'city-place',
  'monterezzo',
  'elements-volare',
  'olea',
  'villa-cacique-38',
  'plaza-roque',
];

for (const slug of SLUGS) {
  for (const base of ['/proyectos', '/en/projects']) {
    test(`${base}/${slug} prerendered with one h1 and a cover image`, async ({ page }) => {
      const resp = await page.goto(`${base}/${slug}`, { waitUntil: 'domcontentloaded' });
      expect(resp?.status(), `status ${base}/${slug}`).toBeLessThan(400);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('.pd-hero img').first()).toBeVisible();
      await expect(page.locator('.pd-facts').first()).toBeVisible();
    });
  }
}

test('language switch round-trips on a list and a detail', async ({ page }) => {
  await page.goto('/proyectos', { waitUntil: 'networkidle' });
  await page.locator('.app-lang-switch a[hreflang="en"]').first().click();
  await expect(page).toHaveURL(/\/en\/projects$/);
  await page.locator('.app-lang-switch a[hreflang="es"]').first().click();
  await expect(page).toHaveURL(/\/proyectos$/);

  await page.goto('/proyectos/olea', { waitUntil: 'networkidle' });
  await page.locator('.app-lang-switch a[hreflang="en"]').first().click();
  await expect(page).toHaveURL(/\/en\/projects\/olea$/);
});

test('sector filter and list toggle update the grid via the URL', async ({ page }) => {
  await page.goto('/proyectos', { waitUntil: 'networkidle' });
  const cardCount = await page.locator('app-project-card').count();
  expect(cardCount).toBe(12);

  // Filter to hospitalario → only Hospital Barahona.
  await page.getByRole('button', { name: 'Hospitalario' }).click();
  await expect(page).toHaveURL(/sector=hospitalario/);
  await expect(page.locator('app-project-card')).toHaveCount(1);

  // Back to all, switch to list view.
  await page.getByRole('button', { name: 'Todos' }).click();
  await page.getByRole('button', { name: 'Lista' }).click();
  await expect(page).toHaveURL(/vista=lista/);
  await expect(page.locator('app-project-index-row')).toHaveCount(12);
});

test('gallery lightbox opens, advances with keyboard and closes with Escape', async ({ page }) => {
  await page.goto('/proyectos/lopesan-costa-bavaro-bloque-f', { waitUntil: 'networkidle' });
  const thumbs = page.locator('.gallery__thumb');
  expect(await thumbs.count()).toBeGreaterThan(1);
  await thumbs.first().click();
  const lightbox = page.locator('.gallery__lightbox');
  await expect(lightbox).toBeVisible();
  const caption = page.locator('.gallery__caption');
  const first = await caption.textContent();
  await page.keyboard.press('ArrowRight');
  await expect(caption).not.toHaveText(first ?? '');
  await page.keyboard.press('Escape');
  await expect(lightbox).toHaveCount(0);
});
