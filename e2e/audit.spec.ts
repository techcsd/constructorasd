import { test, expect } from '@playwright/test';

// Permanent guards distilled from the WD6 sweep (scripts/audit-shots.mjs runs the full capture).

const KEY_ROUTES = ['/', '/empresa', '/servicios', '/proyectos', '/proyectos/lopesan-costa-bavaro-bloque-f', '/contacto', '/en', '/en/projects'];

// No page may request an asset that 404s (this would have caught the deleted logo-full.png mask).
test('no 4xx/5xx asset responses on key routes', async ({ page }) => {
  for (const route of KEY_ROUTES) {
    const bad: string[] = [];
    const onResp = (r: import('@playwright/test').Response) => {
      if (r.status() >= 400 && !/favicon/.test(r.url())) bad.push(`${r.status()} ${r.url()}`);
    };
    page.on('response', onResp);
    await page.goto(route, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    page.off('response', onResp);
    expect(bad, `${route} requested failing assets`).toEqual([]);
  }
});

// Primary interactive controls meet a 44px tap target on a phone (WCAG 2.5.5).
test('primary tap targets are ≥ 44px on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'load' });
  const targets = [
    page.locator('.app-lang-switch__opt').first(),
    page.locator('.app-logo').first(),
    page.locator('app-button[data-variant="ghost"] .app-button').first(),
  ];
  for (const t of targets) {
    const box = await t.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(43.5);
  }
});

// No element is left stuck transparent after load (reveal regression guard, WE2).
test('no reveal leftovers after load on key routes', async ({ page }) => {
  for (const route of ['/', '/proyectos', '/contacto', '/empresa']) {
    await page.goto(route, { waitUntil: 'load' });
    // Poll until every [data-reveal] has settled opaque — deterministic across engines (no fixed sleep,
    // no dependency on networkidle, which never settles under WebKit on Windows).
    await expect
      .poll(
        () => page.evaluate(() => Array.from(document.querySelectorAll('[data-reveal]')).filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.95).length),
        { timeout: 8000, message: `${route} has unrevealed elements` },
      )
      .toBe(0);
  }
});
