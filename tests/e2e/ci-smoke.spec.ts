import { expect, test, type Page } from '@playwright/test';

const mockVideoProvider = async (page: Page, title = 'Live video result') => {
  await page.route('https://pipedapi.kavin.rocks/search**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [{
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title,
        uploader: 'Test Channel',
        views: 1234,
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      }] }),
    });
  });
};

const failVideoProviders = async (page: Page) => {
  for (const host of [
    'https://pipedapi.kavin.rocks/**',
    'https://pipedapi.tokhmi.xyz/**',
    'https://pipedapi.adminforge.de/**',
    'https://pipedapi.rivo.lol/**',
    'https://inv.nadeko.net/**',
    'https://yewtu.be/**',
  ]) await page.route(host, route => route.abort('failed'));
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

  test('keyword video search returns a real normalized result card', async ({ page }) => {
    await mockVideoProvider(page, 'Live video result');
    await openMedia(page);
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await expect(page.locator('.jyt-card')).toHaveCount(1);
    await expect(page.locator('.jyt-card strong')).toHaveText('Live video result');
    await expect(page.locator('#videoResults')).not.toContainText('LOCAL INDEX');
  });

  test('selected result opens the official YouTube embed in-shell', async ({ page }) => {
    await mockVideoProvider(page, 'Playable video result');
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

  test('provider outage never fabricates a result and gives authoritative fallback', async ({ page }) => {
    await failVideoProviders(page);
    await openMedia(page);
    await page.locator('#videoQuery').fill('unreachable test query');
    await page.locator('#videoSearch').click();
    await expect(page.locator('#videoResults')).toContainText('VIDEO SEARCH DEGRADED');
    await expect(page.locator('#videoResults a[href*="youtube.com/results"]')).toHaveAttribute('href', /search_query=unreachable%20test%20query/);
    await expect(page.locator('#videoResults')).not.toContainText('JARVIS playable fallback');
    await expect(page.locator('#videoResults')).not.toContainText('Nyan Cat');
  });
});
