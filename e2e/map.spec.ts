import { test, expect } from '@playwright/test';

// WD2/WF1 — the contact map renders two city tabs and switches between them. When a MAPS_EMBED_KEY is
// configured the panel is a Google Maps iframe with the right src host + title; without a key (local /
// preview before Xaviel creates it) it shows the static fallback card. Both paths are asserted so the
// guard is honest regardless of whether the key is present in this build.
test('contact map: two tabs, switchable, iframe-or-fallback (WD2/WF1)', async ({ page }) => {
  await page.goto('/contacto', { waitUntil: 'networkidle' });

  const tabs = page.locator('.map-embed__tab');
  await expect(tabs).toHaveCount(2);
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');

  const iframe = page.locator('iframe.map-embed__frame');
  const fallback = page.locator('.map-embed__fallback');

  if (await iframe.count()) {
    const src = await iframe.getAttribute('src');
    expect(src).toContain('https://www.google.com/maps/embed/v1/place');
    await expect(iframe).toHaveAttribute('title', /Mapa|Map/);
    const first = src;
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(iframe).not.toHaveAttribute('src', first!); // tab switch changes the src
  } else {
    await expect(fallback).toBeVisible();
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  }

  // "Cómo llegar" deep links remain under the map.
  await expect(page.locator('.map-embed__cities a')).toHaveCount(2);
});
