import { expect, test } from '@playwright/test';

test('production media search returns real open-platform results and player', async ({ page }) => {
  const baseURL = process.env.JARVIS_LIVE_URL;
  if (!baseURL) throw new Error('JARVIS_LIVE_URL is required');

  await page.goto(baseURL, { waitUntil:'domcontentloaded' });
  await page.locator('button.nav[data-app="media"]').click();
  await expect(page.locator('#videoQuery')).toBeVisible();

  await page.locator('#videoQuery').fill('cats');
  await page.locator('#videoSearch').click();
  await expect(page.locator('.jyt-card').first()).toBeVisible({ timeout:30000 });
  const firstTitles=await page.locator('.jyt-card strong').allTextContents();
  expect(firstTitles.length).toBeGreaterThan(0);
  expect(firstTitles.join(' ')).not.toContain('fallback');
  await page.locator('.jyt-card').first().click();
  await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /peertube\.cpy\.re\/videos\/embed\//, { timeout:10000 });

  await page.locator('#videoQuery').fill('NASA Artemis');
  await page.locator('#videoSearch').click();
  await expect(page.locator('.jyt-card').first()).toBeVisible({ timeout:30000 });
  const secondTitles=await page.locator('.jyt-card strong').allTextContents();
  expect(secondTitles.length).toBeGreaterThan(0);
  expect(secondTitles.join(' ')).not.toBe(firstTitles.join(' '));
});
