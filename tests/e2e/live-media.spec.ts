import { expect, test } from '@playwright/test';

test('production media search returns real live results', async ({ page }) => {
  const baseURL = process.env.JARVIS_LIVE_URL;
  if (!baseURL) throw new Error('JARVIS_LIVE_URL is required');

  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await page.locator('button.nav[data-app="media"]').click();
  await expect(page.locator('#videoQuery')).toBeVisible();

  await page.locator('#videoQuery').fill('cats');
  await page.locator('#videoSearch').click();
  await expect(page.locator('.jmc7-card')).toHaveCount(1, { timeout: 30000 });
  const firstTitles = await page.locator('.jmc7-card strong').allTextContents();
  expect(firstTitles.length).toBeGreaterThan(0);
  expect(firstTitles.join(' ')).not.toContain('JARVIS playable fallback');

  await page.locator('#videoQuery').fill('NASA Artemis');
  await page.locator('#videoSearch').click();
  await expect(page.locator('.jmc7-card')).toHaveCount(1, { timeout: 30000 });
  const secondTitles = await page.locator('.jmc7-card strong').allTextContents();
  expect(secondTitles.length).toBeGreaterThan(0);
  expect(secondTitles.join(' ')).not.toBe(firstTitles.join(' '));
});
