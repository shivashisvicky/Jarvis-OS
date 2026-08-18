import { expect, test } from '@playwright/test';

test('production media search returns real open-platform results and player', async ({ page }) => {
  const baseURL = process.env.JARVIS_LIVE_URL;
  if (!baseURL) throw new Error('JARVIS_LIVE_URL is required');

  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await page.locator('button.nav[data-app="media"]').click();
  await expect(page.locator('#videoQuery')).toBeVisible();

  await page.locator('#videoQuery').fill('cats');
  await page.locator('#videoSearch').click();

  const firstCard = page.locator('.jyt-card.video-result').first();
  await expect(firstCard).toBeVisible({ timeout: 45000 });

  const firstTitles = await page.locator('.jyt-card.video-result .card-title').allTextContents();
  expect(firstTitles.length).toBeGreaterThan(0);
  expect(firstTitles.join(' ').toLowerCase()).not.toContain('fallback');

  const embedUrl = await firstCard.getAttribute('data-embed-url');
  expect(embedUrl).toMatch(/\/videos\/embed\//);

  await firstCard.click();
  await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute(
    'src',
    /\/videos\/embed\//,
    { timeout: 10000 }
  );

  await page.locator('#videoQuery').fill('NASA Artemis');
  await page.locator('#videoSearch').click();
  await expect(page.locator('.jyt-card.video-result').first()).toBeVisible({ timeout: 45000 });

  const secondTitles = await page.locator('.jyt-card.video-result .card-title').allTextContents();
  expect(secondTitles.length).toBeGreaterThan(0);
  expect(secondTitles.join(' ')).not.toBe(firstTitles.join(' '));
});
