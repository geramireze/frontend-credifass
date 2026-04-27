import { Page } from '@playwright/test';

export const CREDS = {
  admin: { email: 'admin@app-prestamo.local', password: 'Admin123!' },
  cobrador: { email: 'cobrador@app-prestamo.local', password: 'Admin123!' },
};

export async function login(page: Page, email = CREDS.admin.email, password = CREDS.admin.password) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 8000 });
}

export async function logout(page: Page) {
  const btn = page.locator('[data-testid="btn-logout"], button:has-text("Cerrar"), button[aria-label*="logout"]').first();
  if (await btn.isVisible()) await btn.click();
  else await page.goto('/login');
}
