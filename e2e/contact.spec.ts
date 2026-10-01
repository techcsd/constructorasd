import { test, expect } from '@playwright/test';

// Exercises the full form → LeadsService → success-state wiring. The edge function call is intercepted
// so the test is deterministic and doesn't create rows in sgc-dev (real persistence is verified
// separately via a direct POST; see the Prompt 3 report).
test('contact form submits and shows the confirmation', async ({ page }) => {
  await page.route('**/functions/v1/web-contact', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }),
  );

  await page.goto('/contacto', { waitUntil: 'networkidle' });
  await page.fill('#cf-nombre', 'Ana Pérez');
  await page.fill('#cf-email', 'ana@example.com');
  await page.selectOption('#cf-tipo', 'Hotelero');
  await page.fill(
    '#cf-mensaje',
    'Quisiera cotizar la estructura de un bloque de habitaciones en Punta Cana, gracias.',
  );
  await page.check('input[formControlName="consent"]');

  await page.getByRole('button', { name: /Enviar mensaje|Send message/ }).click();
  await expect(page.locator('.app-contact-form__success')).toBeVisible();
});

test('contact form shows a friendly error when the function fails', async ({ page }) => {
  await page.route('**/functions/v1/web-contact', (route) => route.fulfill({ status: 500, body: '{}' }));

  await page.goto('/contacto', { waitUntil: 'networkidle' });
  await page.fill('#cf-nombre', 'Ana Pérez');
  await page.fill('#cf-email', 'ana@example.com');
  await page.selectOption('#cf-tipo', 'Otro');
  await page.fill('#cf-mensaje', 'Mensaje de prueba suficientemente largo para pasar la validación.');
  await page.check('input[formControlName="consent"]');
  await page.getByRole('button', { name: /Enviar mensaje|Send message/ }).click();
  await expect(page.locator('.app-contact-form [role="alert"]')).toBeVisible();
});
