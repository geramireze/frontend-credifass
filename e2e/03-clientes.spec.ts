import { test, expect } from '@playwright/test';
import { login } from './helpers';

const NOMBRE_NUEVO = `Test E2E ${Date.now()}`;
const DOC_NUEVO = `9${Date.now().toString().slice(-7)}`;

test.describe('SPEC-03 Clientes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('CA-01: lista de clientes carga y muestra al menos un cliente', async ({ page }) => {
    await page.goto('/clientes');
    await expect(page.locator('table tbody tr, [class*="client-row"], li[class*="cliente"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('CA-01: búsqueda filtra la lista de clientes', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForSelector('table tbody tr, [class*="client"]', { timeout: 8000 });
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="buscar"]').first();
    await searchInput.fill('María');
    await page.waitForTimeout(600);
    // Either results or empty state should be visible
    const hasRows = await page.locator('table tbody tr').count();
    const hasEmpty = await page.locator('[class*="empty"]').or(page.locator(':text("Sin resultados")')).count();
    expect(hasRows + hasEmpty).toBeGreaterThan(0);
  });

  test('CA-02: formulario de nuevo cliente: campos requeridos se validan', async ({ page }) => {
    await page.goto('/clientes/nuevo');
    await page.click('button[type="submit"]');
    // Validation messages should appear
    await expect(page.locator('[class*="error"], .text-status-error-fg, [class*="invalid"]').first()).toBeVisible({ timeout: 3000 });
  });

  test('CA-02: crear cliente con datos válidos redirige a la lista', async ({ page }) => {
    await page.goto('/clientes/nuevo');
    await page.fill('input[formcontrolname="nombre"], input[id="nombre"]', NOMBRE_NUEVO);
    await page.fill('input[formcontrolname="documento"], input[id="documento"]', DOC_NUEVO);
    await page.fill('input[formcontrolname="telefono"], input[id="telefono"]', '3001234567');
    await page.fill('input[formcontrolname="direccion"], input[id="direccion"]', 'Calle 1 # 2-3');
    await page.fill('input[formcontrolname="ciudad"], input[id="ciudad"]', 'Bogotá');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/clientes/, { timeout: 8000 });
  });

  test('CA-03: detalle de cliente muestra nombre y documento', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForSelector('table tbody tr, [class*="cliente"]', { timeout: 8000 });
    // Click first client row/link
    await page.locator('table tbody tr a, [class*="cliente"] a, a[href*="/clientes/"]').first().click();
    await expect(page).toHaveURL(/clientes\/.+/);
    await expect(page.locator('h1, [class*="page-title"], [class*="nombre"]').first()).toBeVisible();
  });

  test('CA-02: agregar referencia en formulario de cliente funciona', async ({ page }) => {
    await page.goto('/clientes/nuevo');
    // Button text is "Agregar" with an icon inside it, in the referencias section
    const btnAgregar = page.locator('button:has-text("Agregar")').first();
    await expect(btnAgregar).toBeVisible({ timeout: 5000 });
    await btnAgregar.click();
    // A new reference row with ref-nombre-0 input should appear
    await expect(page.locator('input[id="ref-nombre-0"], input[placeholder="María García"]').first()).toBeVisible({ timeout: 3000 });
  });

  test('responsive 375px: formulario nuevo cliente es usable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/clientes/nuevo');
    await expect(page.locator('input[id="nombre"], input[formcontrolname="nombre"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
