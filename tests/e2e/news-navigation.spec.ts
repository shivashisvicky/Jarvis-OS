import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;
const APP_URL = LIVE_URL || '/';

async function openApp(page) {
  await page.goto(LIVE_URL ? new URL(LIVE_URL).toString() : APP_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.nav[data-app="home"]')).toBeVisible({ timeout: 30_000 });
  await page.locator('.nav[data-app="home"]').click();
}

test('news reloads after leaving and returning to Command Center', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('#newsCards .news-dense-item')).toHaveCount(5, { timeout: 30_000 });

  await page.locator('.nav[data-app="web"]').click();
  await expect(page.locator('.page-head h1')).toHaveText('Search Hub');

  await page.locator('.nav[data-app="home"]').click();
  await expect(page.locator('#newsDesk')).toBeVisible();
  await expect(page.locator('#newsCards .news-dense-item')).toHaveCount(5, { timeout: 30_000 });
});

test('news reloads after leaving and returning from Media', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('#newsCards .news-dense-item')).toHaveCount(5, { timeout: 30_000 });

  await page.locator('.nav[data-app="media"]').click();
  await expect(page.locator('.page-head h1')).toHaveText('Media');

  await page.locator('.nav[data-app="home"]').click();
  await expect(page.locator('#newsDesk')).toBeVisible();
  await expect(page.locator('#newsCards .news-dense-item')).toHaveCount(5, { timeout: 30_000 });
});
