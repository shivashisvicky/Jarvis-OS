import { test, expect } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;

test.describe('Games Experience 2.0', () => {
  test('redesigned hub presents Tetris as the featured launch path without changing the game count', async ({ page }) => {
    if (!LIVE_URL) throw new Error('JARVIS_LIVE_URL is required');

    await page.goto(new URL(LIVE_URL).toString(), { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.nav[data-app="snake"]')).toBeVisible({ timeout: 30_000 });
    await page.locator('.nav[data-app="snake"]').click();

    await expect(page.locator('.arcade')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#games-experience-v2')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#games-experience-v2 h2')).toHaveText('TETRIS');
    await expect(page.locator('#games-feature-play')).toHaveText('PLAY TETRIS');

    await expect(page.locator('.game-card')).toHaveCount(6);
    await expect(page.locator('.game-card').last().locator('#tetrisGame')).toBeVisible();
    await expect(page.locator('#tetBoard')).toBeVisible();

    await page.locator('#games-feature-play').click();
    await expect(page.locator('#tetReset')).toBeFocused();
    await expect(page.locator('#tetBoard')).toBeVisible();
  });
});
