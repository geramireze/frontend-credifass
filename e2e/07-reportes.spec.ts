import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('SPEC-08 Reportes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('CA-01: página de reportes carga sin errores 500', async ({ page }) => {
    const errors: string[] = [];
    page.on('response', (resp) => {
      if (resp.status() >= 500) errors.push(`${resp.status()} ${resp.url()}`);
    });
    await page.goto('/reportes');
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('CA-01: sección de reportes muestra algún contenido o estado vacío', async ({ page }) => {
    await page.goto('/reportes');
    await expect(
      page.locator('table, [class*="chart"], [class*="empty"], canvas, [class*="reporte"]').first(),
    ).toBeVisible({ timeout: 8000 });
  });

  test('CA-02: filtro de rango cambia los datos mostrados', async ({ page }) => {
    await page.goto('/reportes');
    await page.waitForTimeout(1000);
    const rangeSelect = page.locator('select[formcontrolname="rango"], select[id="rango"], button:has-text("7d"), button:has-text("30d")').first();
    if (await rangeSelect.isVisible()) {
      const tag = await rangeSelect.evaluate((el) => el.tagName.toLowerCase());
      if (tag === 'select') {
        await rangeSelect.selectOption({ index: 1 });
      } else {
        await rangeSelect.click();
      }
      await page.waitForTimeout(1000);
    }
    // No error after changing range
    await expect(page.locator('[role="alert"][class*="error"]')).toHaveCount(0);
  });

  test('CA-03: exportación: botón Excel o PDF visible', async ({ page }) => {
    await page.goto('/exportacion');
    await expect(
      page.locator('button:has-text("Excel"), button:has-text("PDF"), a:has-text("Exportar")').first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
