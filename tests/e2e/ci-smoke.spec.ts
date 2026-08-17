import { expect, test, type Page } from '@playwright/test';

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

  test('keyword video search returns a real result card', async ({ page }) => {
    await page.route('https://pipedapi.kavin.rocks/search**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [{
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: 'Live test video result',
          uploader: 'Test Channel',
          duration: 42,
          views: 1234,
          thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        }] }),
      });
    });
    await openMedia(page);
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await expect(page.locator('.video-result')).toHaveCount(1);
    await expect(page.locator('.video-result strong')).toHaveText('Live test video result');
  });

  test('selected video resolves to an in-shell player', async ({ page }) => {
    await page.route('https://pipedapi.kavin.rocks/search**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [{
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: 'Playable test video',
          uploader: 'Test Channel',
          duration: 42,
          views: 1234,
          thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        }] }),
      });
    });
    await page.route('https://pipedapi.kavin.rocks/streams/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'Playable test video',
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
    });
    await openMedia(page);
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await page.locator('.video-result').click();
    await expect(page.locator('#jarvisPlayer video')).toHaveAttribute('src', 'https://cdn.example.test/video.mp4');
    await expect(page.locator('.media-keyword-status').last()).toContainText('PLAYING');
    expect(page.url()).toMatch(/\/$/);
  });

  test('failed live indexes do not invent playable results', async ({ page }) => {
    await page.route('https://pipedapi.kavin.rocks/**', route => route.abort('failed'));
    await page.route('https://pipedapi.tokhmi.xyz/**', route => route.abort('failed'));
    await page.route('https://pipedapi.syncpundit.io/**', route => route.abort('failed'));
    await openMedia(page);
    await page.locator('#videoQuery').fill('unreachable test query');
    await page.locator('#videoSearch').click();
    await expect(page.locator('#videoResults')).toContainText('VIDEO SEARCH DEGRADED');
    await expect(page.locator('#videoResults')).not.toContainText('JARVIS playable fallback');
    expect(page.url()).toMatch(/\/$/);
  });
});
