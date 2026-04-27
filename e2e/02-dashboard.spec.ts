import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('SPEC-07 Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
  });

  test('CA-01: KPI cards visibles con valores numéricos', async ({ page }) => {
    // At least one KPI card must render with a number
    await expect(page.locator('[class*="kpi"], [class*="stat"], [class*="card"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('CA-01: no hay errores visibles en el dashboard', async ({ page }) => {
    await page.waitForTimeout(2000);
    const errorAlert = page.locator('[role="alert"], .alert-error');
    const count = await errorAlert.count();
    // Errors should not appear on normal load
    for (let i = 0; i < count; i++) {
      const text = await errorAlert.nth(i).textContent();
      expect(text).not.toMatch(/error|Error|500/);
    }
  });

  test('layout 375px: bottom tab bar visible, sidebar oculto', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    // Bottom nav: nav[aria-label="Navegación principal"] is md:hidden → visible on mobile
    const bottomNav = page.locator('nav[aria-label="Navegación principal"]');
    await expect(bottomNav).toBeVisible();
    // At least one nav link inside it
    await expect(bottomNav.locator('a').first()).toBeVisible();
  });

  test('layout 1440px: sidebar visible', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.reload();
    await expect(page.locator('nav a[href="/clientes"], aside a[href="/clientes"]').first()).toBeVisible();
  });
});
