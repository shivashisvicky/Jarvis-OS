import { expect, test } from '@playwright/test';

test('media search starts empty and renders only returned live results', async ({ page }) => {
  await page.route('https://peertube.cpy.re/api/v1/search/videos**', async route => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get('search');
    expect(query).toBe('cats');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          { uuid: 'live-test-1', name: 'Live Cats Result', duration: 91, videoChannel: { displayName: 'Live Channel' }, thumbnailPath: '' },
          { uuid: 'live-test-2', name: 'Second Live Result', duration: 42, videoChannel: { displayName: 'Second Channel' }, thumbnailPath: '' }
        ]
      })
    });
  });

  await page.goto('/');
  await page.locator('button.nav[data-app="media"]').click();
  await expect(page.locator('#videoQuery')).toBeVisible();
  await expect(page.locator('#videoResults')).toBeVisible();

  await expect(page.locator('#videoResults .jyt-card')).toHaveCount(0);
  await expect(page.locator('#videoResults')).not.toContainText(/SAP CPI fixture tutorial|Nyan Cat|NASA Live|India 2026/i);

  await page.locator('#videoQuery').fill('cats');
  await page.locator('#videoSearch').click();

  await expect(page.locator('#videoResults .jyt-card')).toHaveCount(2);
  await expect(page.locator('#videoResults')).toContainText('Live Cats Result');
  await expect(page.locator('#videoResults')).toContainText('Second Live Result');

  await page.locator('#videoResults .jyt-card').first().click();
  await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /peertube\.cpy\.re\/videos\/embed\/live-test-1/);
});
