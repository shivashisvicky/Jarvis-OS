import { expect, test } from '@playwright/test';

test.describe('YouTube command grammar authority', () => {
  test('news-on-YouTube phrasing stays in Media and strips the destination preposition', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#commandInput').fill('search war update news on YouTube');
    await page.locator('#commandForm').press('Enter');
    await expect(page.locator('.page-head h1')).toHaveText('Media');
    await expect(page.locator('#videoQuery')).toHaveValue('war update news');
  });

  test('play-in-YouTube phrasing preserves the actual media query', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#commandInput').fill('play new video 2026 in YouTube');
    await page.locator('#commandForm').press('Enter');
    await expect(page.locator('.page-head h1')).toHaveText('Media');
    await expect(page.locator('#videoQuery')).toHaveValue('new video 2026');
  });

  test('YouTube command authority loads once and does not duplicate the normal media runtime', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('script[src*="jarvis-youtube-command-authority-v1.js"]')).toHaveCount(1);
    await expect(page.locator('script[src*="jarvis-live-media.js"]')).toHaveCount(0);
  });
});
