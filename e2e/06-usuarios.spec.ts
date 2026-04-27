import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('SPEC-02 Usuarios y Roles', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('CA-01: lista de usuarios carga para admin', async ({ page }) => {
    await page.goto('/usuarios');
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 8000 });
  });

  test('CA-01: lista muestra al menos el admin', async ({ page }) => {
    await page.goto('/usuarios');
    await page.waitForSelector('table tbody tr', { timeout: 8000 });
    const rows = await page.locator('table tbody tr').count();
    expect(rows).toBeGreaterThan(0);
  });

  test('CA-02: botón "Nuevo usuario" abre panel lateral', async ({ page }) => {
    await page.goto('/usuarios');
    await page.click('button[aria-label="Crear nuevo usuario"]');
    // Side panel dialog opens — use the dialog role with specific name
    await expect(page.getByRole('dialog', { name: 'Crear usuario' })).toBeVisible({ timeout: 3000 });
  });

  test('CA-02: panel nuevo usuario tiene campo nombre, email y rol', async ({ page }) => {
    await page.goto('/usuarios');
    await page.click('button[aria-label="Crear nuevo usuario"]');
    await expect(page.locator('input[id="panel-nombre"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('input[id="panel-email"]')).toBeVisible();
    await expect(page.locator('select[id="panel-rol"]')).toBeVisible();
  });

  test('CA-03: tabla muestra nombre, email y badge de rol', async ({ page }) => {
    await page.goto('/usuarios');
    await page.waitForSelector('table tbody tr', { timeout: 8000 });
    // Check headers contain expected columns
    const headers = await page.locator('table thead th').allTextContents();
    const headerText = headers.join(' ').toLowerCase();
    expect(headerText).toMatch(/nombre|email|rol/);
  });

  test('CA-04: menú de acciones contiene opción Desactivar o Reactivar', async ({ page }) => {
    await page.goto('/usuarios');
    await page.waitForSelector('table tbody tr', { timeout: 8000 });
    // Open action menu for first row
    const menuBtn = page.locator('button[aria-label*="Acciones para"]').first();
    await menuBtn.click();
    await expect(page.locator('[role="menu"]')).toBeVisible({ timeout: 2000 });
    await expect(
      page.locator('[role="menuitem"]:has-text("Desactivar"), [role="menuitem"]:has-text("Reactivar")').first(),
    ).toBeVisible();
  });

  test('responsive 375px: lista usuarios legible en móvil', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/usuarios');
    await expect(page.locator('h1, [class*="page-title"]').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('table, [class*="empty"]').first()).toBeVisible();
  });
});
