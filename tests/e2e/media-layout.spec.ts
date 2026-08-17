import { expect, test } from '@playwright/test';

test.describe('JARVIS media presentation flow', () => {
  test('video results render above the player on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await expect(page.getByRole('heading', { name: 'Media Center', exact: true })).toBeVisible();

    await expect(page.locator('.media-workspace.media-flow-ready')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.media-flow-results')).toBeVisible();
    await expect(page.locator('.media-flow-player')).toBeVisible();

    const order = await page.evaluate(() => {
      const results = document.querySelector('.media-flow-results');
      const player = document.querySelector('.media-flow-player');
      if (!results || !player) return null;
      return results.compareDocumentPosition(player) & Node.DOCUMENT_POSITION_FOLLOWING;
    });
    expect(order).toBeTruthy();
  });

  test('results and player remain a single in-house media flow on desktop', async ({ page }) => {
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await expect(page.locator('.media-workspace.media-flow-ready')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.media-flow-search')).toBeVisible();
    await expect(page.locator('.media-flow-results')).toBeVisible();
    await expect(page.locator('.media-flow-player')).toBeVisible();
    expect(page.context().pages()).toHaveLength(1);
  });
});
