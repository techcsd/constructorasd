import { test, expect } from '@playwright/test';

const LONG_MSG = 'Quisiera cotizar la estructura de un bloque de habitaciones en Punta Cana, gracias.';

async function fillValid(page: import('@playwright/test').Page): Promise<void> {
  await page.fill('#cf-nombre', 'Ana Pérez');
  await page.fill('#cf-email', 'ana@example.com');
  await page.selectOption('#cf-tipo', 'Hotelero');
  await page.fill('#cf-mensaje', LONG_MSG);
  await page.check('#cf-consent');
}

test('contact form submits and offers "Enviar otro mensaje" (WF8)', async ({ page }) => {
  await page.route('**/functions/v1/web-contact', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }),
  );

  await page.goto('/contacto', { waitUntil: 'networkidle' });
  await fillValid(page);
  await page.getByRole('button', { name: /Enviar mensaje|Send message/ }).click();

  const success = page.locator('.app-contact-form__success');
  await expect(success).toBeVisible();

  // "Enviar otro mensaje" resets back to an empty form.
  await success.getByRole('button', { name: /Enviar otro mensaje|Send another message/ }).click();
  await expect(page.locator('#cf-mensaje')).toBeVisible();
  await expect(page.locator('#cf-mensaje')).toHaveValue('');
});

test('short message shows an inline field error and sends no request (WD4/WE9)', async ({ page }) => {
  let requested = false;
  await page.route('**/functions/v1/web-contact', (route) => {
    requested = true;
    return route.fulfill({ status: 200, body: '{"ok":true}' });
  });

  await page.goto('/contacto', { waitUntil: 'networkidle' });
  await page.fill('#cf-nombre', 'Ana Pérez');
  await page.fill('#cf-email', 'ana@example.com');
  await page.selectOption('#cf-tipo', 'Otro');
  await page.fill('#cf-mensaje', 'corto'); // 5 chars < 10
  await page.check('#cf-consent');
  await page.getByRole('button', { name: /Enviar mensaje|Send message/ }).click();

  await expect(page.locator('#cf-mensaje-err')).toBeVisible();
  await expect(page.locator('#cf-mensaje-err')).toContainText(/Mínimo 10 caracteres|Minimum 10 characters/);
  // no generic banner, no request fired
  expect(requested).toBe(false);
});

test('phone field masks to 809-692-5906 while typing (WD3/WF4)', async ({ page }) => {
  await page.goto('/contacto', { waitUntil: 'networkidle' });
  await page.locator('#cf-telefono').pressSequentially('8096925906', { delay: 10 });
  await expect(page.locator('#cf-telefono')).toHaveValue('809-692-5906');
});

test('rate-limit (429) shows the specific copy, not the generic one (WE9)', async ({ page }) => {
  await page.route('**/functions/v1/web-contact', (route) =>
    route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'rate_limited' }) }),
  );

  await page.goto('/contacto', { waitUntil: 'networkidle' });
  await fillValid(page);
  await page.getByRole('button', { name: /Enviar mensaje|Send message/ }).click();

  const alert = page.locator('.app-contact-form [role="alert"]');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(/varios mensajes seguidos|several messages in a row/);
});
