import { test, expect } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;

test.describe('Games Experience 2.0', () => {
  test('redesigned hub presents Tetris as the featured launch path and adds JARVIS Circuit without dropping existing games', async ({ page }) => {
    if (!LIVE_URL) throw new Error('JARVIS_LIVE_URL is required');

    await page.goto(new URL(LIVE_URL).toString(), { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.nav[data-app="snake"]')).toBeVisible({ timeout: 30_000 });
    await page.locator('.nav[data-app="snake"]').click();

    await expect(page.locator('.arcade')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#games-experience-v2')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#games-experience-v2 h2')).toHaveText('TETRIS');
    await expect(page.locator('#games-feature-play')).toHaveText('PLAY TETRIS');

    await expect(page.locator('.game-card')).toHaveCount(7);
    await expect(page.locator('#tetrisGame').locator('..')).toHaveClass(/game-card/);
    await expect(page.locator('#tetBoard')).toBeVisible();

    await page.locator('#games-feature-play').click();
    await expect(page.locator('#tetReset')).toBeFocused();
    await expect(page.locator('#tetBoard')).toBeVisible();

    await expect(page.locator('#jarvisCircuitGame')).toBeVisible();
    await expect(page.locator('#jarvisCircuitGame h3')).toHaveText('🏎️ JARVIS Circuit');
    await expect(page.locator('#circuitCanvas')).toBeVisible();
    await expect(page.locator('#circuitBest')).toHaveText(/BEST \d+/);
    await expect(page.locator('#circuitStatus')).toHaveText('PRESS START TO RACE');

    await page.locator('#circuitReset').click();
    await expect(page.locator('#circuitStatus')).toHaveText('RACING · DODGE + COLLECT');
    await expect(page.locator('#circuitScore')).toHaveText('SCORE 0');
  });
});
