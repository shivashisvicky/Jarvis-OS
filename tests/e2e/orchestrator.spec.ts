import { expect, test } from '@playwright/test';

test('JARVIS intelligence core paints immediately and hydrates quietly', async ({ page }) => {
  await page.goto('/');
  const console = page.locator('.jarvis-mission-console');
  await expect(console).toBeVisible({ timeout: 5000 });
  await expect(console.getByText('JARVIS INTELLIGENCE CORE', { exact: true })).toBeVisible();
  await expect(console.getByText('What should JARVIS work on?', { exact: true })).toBeVisible();
  await expect(console.locator('.jmc-action')).toHaveCount(4);
});

test('JARVIS intelligence core survives signal-provider failure', async ({ page }) => {
  await page.route('https://api.gdeltproject.org/**', route => route.abort());
  await page.goto('/');
  await expect(page.locator('.jarvis-mission-console')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.jmc-action').first()).toBeVisible();
});
