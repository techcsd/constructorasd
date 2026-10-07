import { test, expect } from '@playwright/test';

// WE4 — no horizontal scrollbar on any route at the three reference widths.
const ROUTES = ['/', '/empresa', '/proyectos', '/proyectos/lopesan-costa-bavaro-bloque-f', '/contacto', '/en'];
for (const width of [390, 768, 1440]) {
  test(`no horizontal scroll @${width} (WE4)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ROUTES) {
      await page.goto(route, { waitUntil: 'load' });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${route} @${width}`).toBeLessThanOrEqual(1);
    }
  });
}

// WE1 — the philosophy quote spans a real measure, not one word per line (≥ 50% of its container).
test('quote text fills ≥ 50% of the container on desktop (WE1)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'load' });
  const text = page.locator('.app-quote__text').first();
  await text.scrollIntoViewIfNeeded();
  const t = await text.boundingBox();
  const container = await page.locator('.app-quote').first().boundingBox();
  expect(t!.width).toBeGreaterThan(container!.width * 0.5);
});

// WE2 — navigating to a project detail must not leave the hero title invisible (reveal regression).
test('project detail H1 is visible immediately after navigation (WE2)', async ({ page }) => {
  await page.goto('/proyectos', { waitUntil: 'load' });
  await page.locator('.app-project-card a, a.app-project-card').first().click();
  await page.waitForURL(/\/proyectos\/.+/);
  const h1 = page.locator('h1').first();
  await expect(h1).toBeVisible();
  const opacity = await h1.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(opacity).toBe(1);
});

// WE12 — a project whose location is the neutral country placeholder hides it from the card meta.
test('placeholder location is omitted from project cards (WE12)', async ({ page }) => {
  await page.goto('/proyectos', { waitUntil: 'load' });
  const metas = await page.locator('.app-project-card__meta').allInnerTexts();
  expect(metas.some((m) => /República Dominicana|Dominican Republic/.test(m))).toBe(false);
});
