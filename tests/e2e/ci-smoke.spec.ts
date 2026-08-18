import { expect, test, type Page } from '@playwright/test';

const MEDIA_HOSTS = /^(https:\/\/(?:pipedapi\.kavin\.rocks|pipedapi\.tokhmi\.xyz|pipedapi\.leptons\.xyz|pipedapi\.nosebs\.ru|pipedapi-libre\.kavin\.rocks|piped-api\.privacy\.com\.de|pipedapi\.adminforge\.de|api\.piped\.yt|pipedapi\.drgns\.space|inv\.nadeko\.net|invidious\.nerdvpn\.de|yt\.chocolatemoo53\.com))\//;

const mockMedia = async (page: Page, title: string, playable = false) => {
  await page.route(MEDIA_HOSTS, async route => {
    const url = route.request().url();
    if (url.includes('/search?') && url.includes('pipedapi.kavin.rocks')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ 
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title,
          uploader: 'Test Channel',
          lengthSeconds: 42,
          viewCount: 1234,
          videoThumbnails: [{ quality: 'high', url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' }],
        }]),
      });
      return;
    }
    if (playable && url.includes('/streams/') && url.includes('pipedapi.kavin.rocks')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          title,
          thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
          videoStreams: [{
            url: 'https://cdn.example.test/video.mp4',
            videoOnly: false,
            height: 720,
            format: 'mp4',
            mimeType: 'video/mp4',
          }],
        }),
      });
      return;
    }
    await route.abort('failed');
  });
};

const openMedia = async (page: Page) => {
  await page.goto('/');
  await page.locator('button.nav[data-app="media"]').click();
  await expect(page.locator('#videoQuery')).toBeVisible();
  await expect(page.locator('#videoSearch')).toBeVisible();
};

test.describe('JARVIS CI smoke contract', () => {
  test('shell boots and media remains inside the workspace', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.brand')).toContainText('J.A.R.V.I.S');
    await page.locator('button.nav[data-app="media"]').click();
    await expect(page.locator('#videoQuery')).toBeVisible();
    expect(page.url()).toMatch(/\/$/);
    expect(page.context().pages()).toHaveLength(1);
  });

  test('keyword video search returns dynamic result metadata', async ({ page }) => {
    await mockMedia(page, 'Live test video result');
    await openMedia(page);
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await expect(page.locator('.jv3-video-card')).toHaveCount(1);
    await expect(page.locator('.jv3-video-card strong')).toHaveText('Live test video result');
    await expect(page.locator('#videoResults')).not.toContainText('JARVIS playable fallback');
    await expect(page.locator('#videoResults')).not.toContainText('Nyan Cat');
  });

  test('selected video resolves to an in-shell player', async ({ page }) => {
    await mockMedia(page, 'Playable test video', true);
    await openMedia(page);
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await page.locator('.jv3-video-card[data-video-id="dQw4w9WgXcQ"]').click();
    await expect(page.locator('#jarvisPlayer video source')).toHaveAttribute('src', 'https://cdn.example.test/video.mp4');
    await expect(page.locator('#jvcStatus')).toContainText('PLAYING');
    expect(page.url()).toMatch(/\/$/);
  });

  test('failed live indexes do not invent playable results', async ({ page }) => {
    await page.route(MEDIA_HOSTS, route => route.abort('failed'));
    await page.route('https://api.invidious.io/**', route => route.abort('failed'));
    await openMedia(page);
    await page.locator('#videoQuery').fill('unreachable test query');
    await page.locator('#videoSearch').click();
    await expect(page.locator('#videoResults')).toContainText('No video index responded');
    await expect(page.locator('#videoResults')).not.toContainText('JARVIS playable fallback');
    await expect(page.locator('#videoResults')).not.toContainText('Nyan Cat');
    expect(page.url()).toMatch(/\/$/);
  });
});
