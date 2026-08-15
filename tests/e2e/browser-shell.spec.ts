import { expect, test } from '@playwright/test';

test.describe('JARVIS intelligence shell', () => {
  test('search hub exposes multiple providers', async ({ page }) => {
    await page.goto('/');
    await page.locator('button.nav[data-app="web"]').click();
    await expect(page.getByRole('heading', { name: 'Search Hub', exact: true })).toBeVisible();
    await expect(page.locator('#webProvider')).toBeVisible();
    await expect(page.locator('button[data-provider="brave"]')).toBeVisible();
    await expect(page.locator('button[data-provider="bing"]')).toBeVisible();
  });

  test('command palette is available from the shell', async ({ page }) => {
    await page.goto('/');
    await page.locator('#paletteBtn').click();
    await expect(page.getByRole('dialog', { name: 'JARVIS command palette' })).toBeVisible();
    await expect(page.locator('#paletteInput')).toBeFocused();
  });

  test('app switching does not leave the JARVIS shell', async ({ page }) => {
    await page.goto('/');
    const pagesBefore = page.context().pages().length;
    for (const [app, heading] of [['api','API Lab'],['web','Search Hub'],['maps','Maps'],['media','Media Center']] as const) {
      await page.locator(`button.nav[data-app="${app}"]`).click();
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      expect(page.context().pages().length).toBe(pagesBefore);
      expect(page.url()).toMatch(/\/$/);
    }
  });
});
