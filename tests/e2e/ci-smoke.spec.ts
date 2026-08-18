import { expect, test, type Page } from '@playwright/test';

const YT_API = 'https://www.googleapis.com/youtube/v3';

const mockYouTube = async (page: Page, title: string, secondTitle = title) => {
  await page.addInitScript(() => localStorage.setItem('jarvis.youtubeApiKey', 'ci-test-key'));
  await page.route(`${YT_API}/**`, async route => {
    const url = new URL(route.request().url());
    const path = url.pathname.split('/').pop();
    if (path === 'search') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [{ id: { videoId: 'dQw4w9WgXcQ' }, snippet: { title, channelTitle: 'Test Channel', thumbnails: { high: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' } } } }] }) });
      return;
    }
    if (path === 'videos') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [{ id: 'dQw4w9WgXcQ', snippet: { title: secondTitle, channelTitle: 'Test Channel', thumbnails: { high: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' } } }, status: { embeddable: true }, contentDetails: {} }] }) });
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

  test('YouTube keyword search returns live API metadata', async ({ page }) => {
    await mockYouTube(page, 'Live YouTube result');
    await openMedia(page);
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await expect(page.locator('.jyt-card')).toHaveCount(1);
    await expect(page.locator('.jyt-card strong')).toHaveText('Live YouTube result');
    await expect(page.locator('#videoResults')).not.toContainText('LOCAL INDEX');
  });

  test('selected result opens the official YouTube embed in-shell', async ({ page }) => {
    await mockYouTube(page, 'Playable YouTube result');
    await openMedia(page);
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await page.locator('.jyt-card[data-video-id="dQw4w9WgXcQ"]').click();
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /youtube\.com\/embed\/dQw4w9WgXcQ/);
    await expect(page.locator('#mediaState')).toContainText('PLAYING · YOUTUBE EMBED');
    expect(page.url()).toMatch(/\/$/);
  });

  test('direct YouTube URL plays without search', async ({ page }) => {
    await openMedia(page);
    await page.locator('#videoUrl').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.locator('#playVideo').click();
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /youtube\.com\/embed\/dQw4w9WgXcQ/);
    await expect(page.locator('#mediaState')).toContainText('PLAYING · YOUTUBE EMBED');
  });

  test('missing API key is explicit and never fabricates results', async ({ page }) => {
    await openMedia(page);
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await expect(page.locator('#videoResults')).toContainText('YouTube search needs a Data API key');
    await expect(page.locator('#videoResults')).not.toContainText('Nyan Cat');
    await expect(page.locator('#videoResults')).not.toContainText('JARVIS playable fallback');
  });
});
