import { expect, test } from '@playwright/test';

test.describe('JARVIS embedded browser', () => {
  test('browser opens inside the JARVIS shell', async ({ page }) => {
    await page.goto('/');
    await page.locator('button.nav[data-app="web"]').click();
    await expect(page.getByRole('heading', { name: 'JARVIS Browser', exact: true })).toBeVisible();
    await expect(page.locator('#browserFrame')).toBeVisible();
    await expect(page.locator('.os')).toBeVisible();
  });

  test('browser address bar navigates without creating a page', async ({ page }) => {
    await page.goto('/');
    await page.locator('button.nav[data-app="web"]').click();
    const pagesBefore = page.context().pages().length;
    await page.locator('#browserAddress').fill('https://example.com');
    await page.locator('#browserGo').click();
    // Keep the user-entered origin-only URL stable in the JARVIS address bar.
    await expect(page.locator('#browserAddress')).toHaveValue('https://example.com');
    expect(page.context().pages().length).toBe(pagesBefore);
    await expect(page.locator('.os')).toBeVisible();
  });

  test('browser search provider remains inside the shell', async ({ page }) => {
    await page.goto('/');
    await page.locator('button.nav[data-app="web"]').click();
    const pagesBefore = page.context().pages().length;
    await page.locator('#browserAddress').fill('latest AI news');
    // Bing is the only search provider exposed by JARVIS because the other
    // providers were removed after proving unreliable inside the shell.
    await page.locator('button[data-provider="bing"]').click();
    expect(page.context().pages().length).toBe(pagesBefore);
    await expect(page.locator('#browserFrame')).toBeVisible();
  });

  test('back, forward and reload controls are present', async ({ page }) => {
    await page.goto('/');
    await page.locator('button.nav[data-app="web"]').click();
    for (const selector of ['#browserBack', '#browserForward', '#browserReload', '#browserGo', '#browserAddress']) {
      await expect(page.locator(selector)).toBeVisible();
    }
  });
});
