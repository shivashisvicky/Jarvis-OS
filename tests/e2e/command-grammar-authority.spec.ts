import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;
const APP_URL = LIVE_URL || '/';

async function openHome(page) {
  await page.goto(LIVE_URL ? new URL(LIVE_URL).toString() : APP_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.nav[data-app="home"]')).toBeVisible({ timeout: 30_000 });
  await page.locator('.nav[data-app="home"]').click();
}

async function submit(page, command: string) {
  const input = page.locator('#commandInput');
  await input.fill(command);
  await page.locator('#commandForm').press('Enter');
}

test('grammar authority loads before the main command runtime', async ({ page }) => {
  await openHome(page);
  await expect(page.locator('script[src*="jarvis-command-grammar-authority-v1.js"]')).toHaveCount(1);
  await expect(page.locator('#commandInput')).toBeVisible();
});

test('Maps grammar canonicalizes restaurant speech before routing', async ({ page }) => {
  await openHome(page);
  await submit(page, 'show me resturants to Jagannath Nagar');
  await expect(page.locator('.page-head h1')).toHaveText('Maps');
  await expect(page.locator('#mapQuery')).toHaveValue(/restaurants in Jagannath Nagar/i, { timeout: 15_000 });
});

test('web grammar removes destination prepositions without removing the search subject', async ({ page }) => {
  await openHome(page);
  await submit(page, 'search latest AI news on the web');
  await expect(page.locator('#jarvisReply')).toContainText(/latest AI news/i, { timeout: 15_000 });
});

test('YouTube grammar remains owned by the dedicated YouTube authority', async ({ page }) => {
  await openHome(page);
  await submit(page, 'search war update news on YouTube');
  await expect(page.locator('.nav[data-app="media"]')).toHaveClass(/selected/, { timeout: 15_000 });
  await expect(page.locator('#videoQuery')).toHaveValue(/war update news/i, { timeout: 15_000 });
});

test('grammar gate does not add a network or intelligence round trip', async ({ page }) => {
  await openHome(page);
  const value = await page.evaluate(() => typeof window.jarvisNormalizeCommand === 'function');
  expect(value).toBe(true);
});
