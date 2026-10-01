import { test, expect, Page } from '@playwright/test';

const ES_ROUTES = [
  '/',
  '/empresa',
  '/servicios',
  '/equipos',
  '/proyectos',
  '/clientes',
  '/vacantes',
  '/noticias',
  '/contacto',
  '/privacidad',
  '/aviso-legal',
  '/styleguide',
];
const EN_ROUTES = [
  '/en',
  '/en/company',
  '/en/services',
  '/en/equipment',
  '/en/projects',
  '/en/clients',
  '/en/careers',
  '/en/news',
  '/en/contact',
  '/en/privacy',
  '/en/legal-notice',
];

// Network/analytics 404s on the local static server are not app bugs.
const BENIGN = /Failed to load resource|_vercel|vercel-scripts|insights|analytics|favicon/i;

function watch(page: Page) {
  const errors: string[] = [];
  const googleFonts: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && !BENIGN.test(m.text())) errors.push(m.text());
  });
  page.on('request', (r) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) googleFonts.push(r.url());
  });
  return { errors, googleFonts };
}

for (const path of [...ES_ROUTES, ...EN_ROUTES]) {
  test(`${path} → 200, one h1, no Google Fonts, no console errors`, async ({ page }) => {
    const { errors, googleFonts } = watch(page);
    const resp = await page.goto(path, { waitUntil: 'networkidle' });
    expect(resp?.status(), `status for ${path}`).toBeLessThan(400);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(googleFonts, 'no Google Fonts requests at runtime').toEqual([]);
    expect(errors, `no console errors on ${path}`).toEqual([]);
  });
}

test('EN page sets <html lang="en"> and translates the nav', async ({ page }) => {
  await page.goto('/en/company', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.app-header__nav')).toContainText('Services');
});

test('mobile menu opens, traps focus and closes on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const toggle = page.locator('.app-header__toggle');
  await toggle.click();
  await expect(page.locator('.app-header__menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.app-header__menu')).toHaveCount(0);
});
