import { test, expect } from '@playwright/test';

// WL5/WN3 — motion must be tasteful AND fully collapse under prefers-reduced-motion.

test('reduced-motion: hero has no residual transform or animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'load' });
  const kids = await page.locator('.home-hero__content > *').evaluateAll((els) =>
    els.map((el) => ({
      t: getComputedStyle(el).transform,
      o: getComputedStyle(el).opacity,
      a: getComputedStyle(el).animationName,
    })),
  );
  expect(kids.length).toBeGreaterThan(0);
  for (const k of kids) {
    expect(k.t === 'none' || k.t === 'matrix(1, 0, 0, 1, 0, 0)').toBeTruthy(); // no motion transform
    expect(k.a).toBe('none'); // no animation at all
    expect(parseFloat(k.o)).toBeGreaterThan(0); // visible (baseline opacity, not mid-fade)
  }
  const kenburns = await page.locator('.home-hero__media img').first().evaluate((el) => getComputedStyle(el).animationName);
  expect(kenburns).toBe('none');
});

test('normal motion: hero content is fully visible within 1s', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  const opacities = await page.locator('.home-hero__content > *').evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).opacity)));
  expect(opacities.length).toBeGreaterThan(0);
  for (const o of opacities) expect(o).toBeGreaterThanOrEqual(0.8); // animation finished → visible
});
