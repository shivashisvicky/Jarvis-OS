import { expect, test } from '@playwright/test';

test.describe('JARVIS in-shell media smoke contract', () => {
  test('shell boots with the new in-shell web/media runtimes and no canned results', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.brand')).toContainText('J.A.R.V.I.S');
    await expect(page.locator('script[src*="jarvis-web-shell.js"]')).toHaveCount(1);
    await expect(page.locator('script[src*="jarvis-media-v14.js"]')).toHaveCount(1);
    await expect(page.locator('script[src*="jarvis-video-provider.js"]')).toHaveCount(0);
    for (const old of ['jarvis-media-final.js', 'jarvis-media-core-v7', 'jarvis-media-authority-v8', 'jarvis-media-authority-v10', 'jarvis-media-authority-v11', 'jarvis-media-authority.js', 'jarvis-media-runtime-watchdog.js', 'jarvis-runtime-guards.js', 'jarvis-media-v2.js']) {
      await expect(page.locator(`script[src*="${old}"]`)).toHaveCount(0);
    }
    await page.locator('button.nav[data-app="media"]').click();
    await expect(page.locator('#videoQuery')).toBeVisible();
    await expect(page.locator('#videoSearch')).toBeVisible();
    await expect(page.locator('#videoResults')).toBeVisible();
    await expect(page.locator('#jarvisPlayer')).toBeVisible();
    await expect(page.locator('.jvc-card')).toHaveCount(0);
    await expect(page.locator('#videoResults')).not.toContainText(/SAP CPI fixture tutorial|Nyan Cat|NASA Live|India 2026/i);
  });

  test('direct YouTube URL goes straight to the official in-shell player', async ({ page }) => {
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await page.locator('#videoQuery').fill('https://youtube.com/shorts/JbgYndCSv3k?si=ci');
    await page.locator('#videoSearch').click();
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/JbgYndCSv3k/);
  });
});
