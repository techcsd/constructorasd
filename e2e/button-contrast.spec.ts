import { test, expect } from '@playwright/test';

// P16 / WL1 / WM1 — the hero "Hablemos" secondary button must be BONE (not ink) and readable. The round-02
// check was by screenshot and missed the real color; this reads getComputedStyle. Covers / and /en.

const BONE = 'rgb(250, 248, 244)'; // --bone-50 #faf8f4
const rgb = (s: string) => (s.match(/\d+(?:\.\d+)?/g) || []).slice(0, 3).map(Number);
const lum = (c: number[]) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const contrast = (a: string, b: string) => { const la = lum(rgb(a)), lb = lum(rgb(b)); const [hi, lo] = la > lb ? [la, lb] : [lb, la]; return (hi + 0.05) / (lo + 0.05); };

for (const path of ['/', '/en']) {
  test(`hero secondary button is bone + readable (P16) ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'load' });
    const btn = page.locator('.home-hero app-button[data-variant="secondary"] .app-button').first();
    await expect(btn).toBeVisible();
    const color = await btn.evaluate((el) => getComputedStyle(el).color);
    expect(color, 'hero secondary text must be bone, not ink').toBe(BONE);
    const border = await btn.evaluate((el) => getComputedStyle(el).borderTopColor);
    expect(border, 'hero secondary border must be bone (translucent)').toMatch(/^rgba?\(250, ?248, ?244/);
    // AA against the dark surface behind it (the hero sits on ink #141516 under the photo/scrim).
    expect(contrast(color, 'rgb(20, 21, 22)')).toBeGreaterThanOrEqual(4.5);
  });
}

test('dark-section CTA button text meets AA against its own background', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  const btn = page.locator('[data-tone="dark"] app-button[data-variant="primary"] .app-button').first();
  await expect(btn).toBeVisible();
  const color = await btn.evaluate((el) => getComputedStyle(el).color);
  const bg = await btn.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(contrast(color, bg), 'CTA band button must be readable').toBeGreaterThanOrEqual(4.5);
});
