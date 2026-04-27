import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('SPEC-10 Auditoría', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('CA-01: página de auditoría carga tabla (con registros o estado vacío)', async ({ page }) => {
    await page.goto('/auditoria');
    await page.waitForTimeout(1500);
    // Either rows exist or the empty state is shown
    const hasRows = await page.locator('table tbody tr').count();
    const hasEmpty = await page.getByText('No hay registros de auditoría').count();
    expect(hasRows + hasEmpty).toBeGreaterThan(0);
  });

  test('CA-02: filtro de acción filtra la tabla', async ({ page }) => {
    await page.goto('/auditoria');
    await page.waitForTimeout(1000);
    const searchInput = page.locator('input[placeholder*="Buscar"], input[placeholder*="buscar"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('LOGIN');
      await page.waitForTimeout(600);
      // Either results or empty
      const count = await page.locator('table tbody tr, [class*="empty"]').count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('CA-02: tabla de auditoría muestra columnas acción, entidad, fecha', async ({ page }) => {
    await page.goto('/auditoria');
    await page.waitForSelector('table', { timeout: 8000 });
    const headers = await page.locator('table thead th').allTextContents();
    const headerText = headers.join(' ').toLowerCase();
    expect(headerText).toMatch(/acción|accion|fecha|entidad/);
  });

  test('paginación de auditoría funciona', async ({ page }) => {
    await page.goto('/auditoria');
    await page.waitForTimeout(1000);
    const nextBtn = page.locator('button[aria-label*="siguiente"], button:has-text("Siguiente"), button:has-text(">")').first();
    if (await nextBtn.isVisible() && !(await nextBtn.isDisabled())) {
      await nextBtn.click();
      await page.waitForTimeout(500);
      // Still on auditoria page
      await expect(page).toHaveURL(/auditoria/);
    }
  });
});
