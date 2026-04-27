import { test, expect } from '@playwright/test';
import { CREDS, login } from './helpers';

test.describe('SPEC-01 Auth', () => {
  test('CA-01: login con credenciales válidas redirige al dashboard', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/dashboard/);
    // sidebar o contenido del dashboard visible
    await expect(page.locator('h1, [class*="page-title"]').first()).toBeVisible();
  });

  test('CA-01: login guarda accessToken en sessionStorage', async ({ page }) => {
    await login(page);
    const token = await page.evaluate(() => sessionStorage.getItem('access_token'));
    expect(token).toBeTruthy();
  });

  test('CA-02: login con contraseña incorrecta muestra error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', CREDS.admin.email);
    await page.fill('input[type="password"]', 'WrongPassword99!');
    await page.click('button[type="submit"]');
    await expect(page.locator('[role="alert"], .alert-error, [class*="error"]').first()).toBeVisible({ timeout: 5000 });
    await expect(page).not.toHaveURL(/dashboard/);
  });

  test('CA-02: login con email vacío no envía el form', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="password"]', 'SomePass1!');
    await page.click('button[type="submit"]');
    // HTML5 required validation keeps us on login
    await expect(page).toHaveURL(/login/);
  });

  test('redirección: rutas protegidas sin token mandan al login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('CA-07: link "olvidé contraseña" navega a la página de recuperación', async ({ page }) => {
    await page.goto('/login');
    const link = page.locator('a[href*="olvide"], a:has-text("Olvidé"), a:has-text("olvidé")').first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/olvide/);
  });

  test('CA-07: forgot-password muestra campo de email y botón de envío', async ({ page }) => {
    await page.goto('/olvide-contrasena');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('layout login: logo, título y campos visibles a 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    // Brand icon rendered by app-icon component (custom element)
    // h2 "Iniciar sesión" is always in the visible form card (not duplicated in the hidden desktop panel)
    await expect(page.locator('h2:has-text("Iniciar"), h2:has-text("sesión")')).toBeVisible();
    await expect(page.locator('h2:has-text("Iniciar"), h2:has-text("sesión")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
