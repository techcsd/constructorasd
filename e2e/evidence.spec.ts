import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

/**
 * QA evidence capture (A/P workflow matrix). Skipped by default; run with:
 *   PW_EVIDENCE=1 npx playwright test evidence --project=chromium
 * Saves full-page screenshots per route × {mobile 390, desktop 1280} under docs/round-03-qa/ (gitignored —
 * regenerate on demand). The functional assertions live in the other specs; this only produces the record.
 */
const RUN = process.env.PW_EVIDENCE === '1';
const DIR = 'docs/round-03-qa';

const ROUTES: { id: string; path: string }[] = [
  { id: 'P01-home-es', path: '/' },
  { id: 'P01-home-en', path: '/en' },
  { id: 'P03-empresa', path: '/empresa' },
  { id: 'P04-servicios', path: '/servicios' },
  { id: 'P05-equipos', path: '/equipos' },
  { id: 'P07-proyectos', path: '/proyectos' },
  { id: 'P06-clientes', path: '/clientes' },
  { id: 'P09-noticias', path: '/noticias' },
  { id: 'P10-vacantes', path: '/vacantes' },
  { id: 'P11-contacto', path: '/contacto' },
  { id: 'P13-404', path: '/no-existe' },
  { id: 'A01-admin-login', path: '/admin' },
];

const VIEWPORTS = [
  { tag: 'mobile', width: 390, height: 844 },
  { tag: 'desktop', width: 1280, height: 900 },
];

test.describe('evidence', () => {
  test.skip(!RUN, 'set PW_EVIDENCE=1 to capture');
  test.beforeAll(() => mkdirSync(DIR, { recursive: true }));

  for (const r of ROUTES) {
    for (const v of VIEWPORTS) {
      test(`${r.id} @ ${v.tag}`, async ({ page }) => {
        await page.setViewportSize({ width: v.width, height: v.height });
        await page.goto(r.path, { waitUntil: 'load' });
        await expect(page.locator('body')).toBeVisible();
        await page.screenshot({ path: `${DIR}/${r.id}-${v.tag}.png`, fullPage: true });
      });
    }
  }
});
