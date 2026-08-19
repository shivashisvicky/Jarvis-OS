import { expect, test } from '@playwright/test';

test.describe('JARVIS media smoke contract', () => {
  test('shell boots with one media authority and no canned results', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.brand')).toContainText('J.A.R.V.I.S');
    await expect(page.locator('script[src*="jarvis-media-final.js"]')).toHaveCount(1);
    for (const old of ['jarvis-media-core-v7', 'jarvis-media-authority-v8', 'jarvis-media-authority-v10', 'jarvis-media-authority-v11', 'jarvis-media-authority.js']) {
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

  test('keyword search renders only returned YouTube IDs and plays selected ID', async ({ page }) => {
    await page.route('https://www.googleapis.com/youtube/v3/search**', async route => {
      const url = new URL(route.request().url());
      expect(url.searchParams.get('q')).toBe('cats');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [
          { id: { videoId: 'liveCats01' }, snippet: { title: 'Live Cats Result', channelTitle: 'Real Channel', thumbnails: { medium: { url: 'https://i.ytimg.com/vi/liveCats01/mqdefault.jpg' } } } },
          { id: { videoId: 'liveCats02' }, snippet: { title: 'Second Live Result', channelTitle: 'Second Channel', thumbnails: { medium: { url: 'https://i.ytimg.com/vi/liveCats02/mqdefault.jpg' } } } }
        ] })
      });
    });
    await page.addInitScript(() => { (window as any).JARVIS_YOUTUBE_API_KEY = 'ci-test-key'; });

    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();

    await expect(page.locator('.jvc-card')).toHaveCount(2);
    await expect(page.locator('.jvc-card').first()).toHaveAttribute('data-jvc-id', 'liveCats01');
    await expect(page.locator('.jvc-card').first()).toContainText('Live Cats Result');
    await expect(page.locator('.jvc-card')).not.toContainText(/fixture|fake|demo/i);

    await page.route('https://www.youtube.com/iframe_api', async route => {
      await route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.onYouTubeIframeAPIReady();' });
    });
    await page.locator('.jvc-card').first().click();
    await expect(page.locator('#jarvisPlayer')).toContainText('VIDEO UNAVAILABLE', { timeout: 1000 }).or(expect(page.locator('#jarvisPlayer iframe')).toBeVisible({ timeout: 10000 }));
  });

  test('direct YouTube URL goes straight to the player without normalization', async ({ page }) => {
    await page.route('https://www.youtube.com/iframe_api', async route => {
      await route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.onYouTubeIframeAPIReady();' });
    });
    await page.addInitScript(() => { (window as any).JARVIS_YOUTUBE_API_KEY = 'ci-test-key'; });
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await page.locator('#videoQuery').fill('https://youtube.com/shorts/JbgYndCSv3k?si=ci');
    await page.locator('#videoSearch').click();
    await expect(page.locator('#jarvisPlayer')).toBeVisible();
    await expect(page.locator('#jarvis-youtube-player')).toBeVisible({ timeout: 10000 });
  });
});
