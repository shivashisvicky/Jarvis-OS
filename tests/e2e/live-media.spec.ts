import { expect, test } from '@playwright/test';

test('production media search returns real open-platform results and player', async ({ page }) => {
  const baseURL = process.env.JARVIS_LIVE_URL;
  if (!baseURL) throw new Error('JARVIS_LIVE_URL is required');

  await page.goto(baseURL, { waitUntil:'domcontentloaded' });
  await page.locator('button.nav[data-app="media"]').click();
  await expect(page.locator('#videoQuery')).toBeVisible();

  await page.locator('#videoQuery').fill('cats');
  await page.locator('#videoSearch').click();
  await expect(page.locator('.jom-card')).toHaveCount(1, { timeout:30000 });
  const firstTitles=await page.locator('.jom-card strong').allTextContents();
  expect(firstTitles.length).toBeGreaterThan(0);
  expect(firstTitles.join(' ')).not.toContain('fallback');
  await page.locator('.jom-card').first().click();
  await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /(?:peertube|invidious)/, { timeout:10000 });

  await page.locator('#videoQuery').fill('NASA Artemis');
  await page.locator('#videoSearch').click();
  await expect(page.locator('.jom-card')).toHaveCount(1, { timeout:30000 });
  const secondTitles=await page.locator('.jom-card strong').allTextContents();
  expect(secondTitles.length).toBeGreaterThan(0);
  expect(secondTitles.join(' ')).not.toBe(firstTitles.join(' '));
});
