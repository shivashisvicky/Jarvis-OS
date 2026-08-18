import { expect, test, type Page } from '@playwright/test';

const PT = /https:\/\/(?:peertube\.cpy\.re|framatube\.org|peertube\.uno)\//;
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,OPTIONS', 'Access-Control-Allow-Headers': 'Accept,Content-Type' };
const VIDEO_ID = '9c9de5e8-0a1e-484a-b099-e80766180a6d';

const mockPeerTube = async (page: Page, title: string) => {
  await page.route(PT, async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS });
      return;
    }
    if (url.pathname === '/api/v1/search/videos') {
      await route.fulfill({
        status: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [{
          uuid: VIDEO_ID,
          name: title,
          duration: 95,
          views: 1234,
          publishedAt: '2026-08-18T00:00:00Z',
          thumbnailPath: '/lazy-static/previews/test.jpg',
          videoChannel: { displayName: 'PeerTube Test Channel' },
        }] }),
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
  test('shell boots and media has one runtime authority', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.brand')).toContainText('J.A.R.V.I.S');
    await expect(page.locator('script[src*="jarvis-media-core-v7"]')).toHaveCount(0);
    await expect(page.locator('script[src*="jarvis-media-authority-v8"]')).toHaveCount(0);
    await expect(page.locator('script[src*="jarvis-media-authority-v10"]')).toHaveCount(1);
    await page.locator('button.nav[data-app="media"]').click();
    await expect(page.locator('#videoQuery')).toBeVisible();
    expect(page.url()).toMatch(/\/$/);
    expect(page.context().pages()).toHaveLength(1);
  });

  test('keyword search returns dynamic PeerTube metadata', async ({ page }) => {
    await mockPeerTube(page, 'Live PeerTube result');
    await openMedia(page);
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await expect(page.locator('.jyt-card')).toHaveCount(1);
    await expect(page.locator('.jyt-card strong')).toHaveText('Live PeerTube result');
    await expect(page.locator('#videoResults')).not.toContainText('LOCAL INDEX');
  });

  test('selected PeerTube result opens the official in-shell embed', async ({ page }) => {
    await mockPeerTube(page, 'Playable PeerTube result');
    await openMedia(page);
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await page.locator('.jyt-card').first().click();
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /peertube\.cpy\.re\/videos\/embed\/9c9de5e8-0a1e-484a-b099-e80766180a6d/);
    await expect(page.locator('#mediaState')).toContainText('PLAYING');
    expect(page.url()).toMatch(/\/$/);
  });

  test('direct YouTube URL remains a supported fallback player', async ({ page }) => {
    await openMedia(page);
    await page.locator('#videoUrl').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.locator('#playVideo').click();
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
    expect(page.url()).toMatch(/\/$/);
  });

  test('failed PeerTube services never fabricate results', async ({ page }) => {
    await page.route(PT, route => route.abort('failed'));
    await openMedia(page);
    await page.locator('#videoQuery').fill('unreachable test query');
    await page.locator('#videoSearch').click();
    await expect(page.locator('#videoResults')).toContainText('VIDEO SEARCH DEGRADED');
    await expect(page.locator('#videoResults')).not.toContainText('Nyan Cat');
    await expect(page.locator('#videoResults')).not.toContainText('JARVIS playable fallback');
  });
});
