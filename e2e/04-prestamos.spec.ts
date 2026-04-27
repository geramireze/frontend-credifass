import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('SPEC-04 Préstamos', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('CA-01: lista de préstamos carga sin errores', async ({ page }) => {
    await page.goto('/prestamos');
    await expect(page.locator('table tbody tr, [class*="prestamo-row"], [class*="empty"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('CA-01: formulario nuevo préstamo renderiza todos los campos requeridos', async ({ page }) => {
    await page.goto('/prestamos/nuevo');
    await expect(page.locator('select[formcontrolname="cliente_id"], select[id="cliente_id"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[formcontrolname="monto_prestado"], input[id="monto_prestado"]')).toBeVisible();
    await expect(page.locator('input[formcontrolname="tasa_semanal"], input[id="tasa_semanal"]')).toBeVisible();
    await expect(page.locator('input[formcontrolname="numero_semanas"], input[id="numero_semanas"]')).toBeVisible();
    await expect(page.locator('input[formcontrolname="fecha_inicio"], input[id="fecha_inicio"]')).toBeVisible();
  });

  test('CA-01: dropdown de clientes está poblado', async ({ page }) => {
    await page.goto('/prestamos/nuevo');
    // Wait for the API call to load clients
    await page.waitForTimeout(3000);
    const options = page.locator('select[id="cliente_id"] option, select[formcontrolname="cliente_id"] option');
    const count = await options.count();
    expect(count).toBeGreaterThan(1); // placeholder + at least 1 client
  });

  test('CA-02: simulación aparece al rellenar campos válidos', async ({ page }) => {
    await page.goto('/prestamos/nuevo');
    await page.waitForTimeout(2000);

    const clienteSelect = page.locator('select[id="cliente_id"], select[formcontrolname="cliente_id"]');
    const options = await clienteSelect.locator('option').all();
    if (options.length > 1) await clienteSelect.selectOption({ index: 1 });

    await page.fill('input[id="monto_prestado"], input[formcontrolname="monto_prestado"]', '500000');
    await page.fill('input[id="tasa_semanal"], input[formcontrolname="tasa_semanal"]', '5');
    await page.fill('input[id="numero_semanas"], input[formcontrolname="numero_semanas"]', '12');
    const hoy = new Date().toISOString().split('T')[0];
    await page.fill('input[id="fecha_inicio"], input[formcontrolname="fecha_inicio"]', hoy);

    // Simulation panel shows "Total a pagar" text
    await expect(page.getByText('Total a pagar')).toBeVisible({ timeout: 6000 });
    // Confirm button appears only when simulation is ready
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('CA-01: validación: monto menor a 50000 muestra mensaje de error en el campo', async ({ page }) => {
    await page.goto('/prestamos/nuevo');
    const montoInput = page.locator('input[id="monto_prestado"], input[formcontrolname="monto_prestado"]');
    await montoInput.fill('1000');
    await montoInput.blur(); // trigger touched state
    await expect(page.locator('.text-status-error-fg, [class*="error-fg"]').first()).toBeVisible({ timeout: 3000 });
  });

  test('CA-03: detalle de préstamo muestra estado y cronograma', async ({ page }) => {
    await page.goto('/prestamos');
    // Rows are <tr> with [routerLink], not <a> tags
    await page.waitForSelector('tr.data-table-row', { timeout: 8000 });
    await page.locator('tr.data-table-row').first().click();
    await expect(page).toHaveURL(/prestamos\/.+/);
    // Estado badge
    await expect(page.locator('[class*="badge"], [class*="estado"], [class*="status"]').first()).toBeVisible();
    // Cronograma table
    await expect(page.locator('table').first()).toBeVisible({ timeout: 5000 });
  });

  test('responsive 375px: formulario préstamo es usable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/prestamos/nuevo');
    await expect(page.locator('input[id="monto_prestado"], input[formcontrolname="monto_prestado"]')).toBeVisible({ timeout: 5000 });
    // On mobile, form is stacked - simulation panel is below form
    await expect(page.locator('select[id="cliente_id"]')).toBeVisible();
  });
});
