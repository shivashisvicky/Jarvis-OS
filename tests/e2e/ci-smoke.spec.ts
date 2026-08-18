import { expect, test, type Page } from '@playwright/test';

const VIDEO_API = '**/api/v1/search/videos*';
const ALL_ORIGINS = '**/api.allorigins.win/**';
const CORS_PROXY = '**/corsproxy.io/**';
const VIDEO_ID = '9c9de5e8-0a1e-484a-b099-e80766180a6d';
const EMBED_URL = `https://sepiasearch.org/videos/embed/${VIDEO_ID}`;
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Accept,Content-Type',
};

const providerPayload = (title: string) => ({
  data: [{
    uuid: VIDEO_ID,
    name: title,
    duration: 95,
    views: 1234,
    publishedAt: '2026-08-18T00:00:00Z',
    thumbnailPath: '/lazy-static/previews/test.jpg',
    channel: { displayName: 'PeerTube Test Channel' },
    embedUrl: EMBED_URL,
  }],
});

const fulfillJson = async (route: any, payload: unknown) => {
  await route.fulfill({
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
};

const mockPeerTube = async (page: Page, title: string) => {
  const payload = providerPayload(title);

  // Mock only the search API. Never intercept the provider host globally.
  await page.route(VIDEO_API, async route => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }
    await fulfillJson(route, payload);
  });

  // The production authority may fall back to public CORS relays when direct
  // browser CORS is unavailable. Keep those relays deterministic in CI too.
  await page.route(ALL_ORIGINS, async route => {
    await fulfillJson(route, payload);
  });
  await page.route(CORS_PROXY, async route => {
    await fulfillJson(route, payload);
  });
};

const blockVideoNetwork = async (page: Page) => {
  await page.route(VIDEO_API, async route => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }
    await route.fulfill({
      status: 503,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Service Unavailable' }),
    });
  });

  // Block both proxy paths so a degraded-state test cannot escape to the
  // public internet and accidentally obtain real video results.
  await page.route(ALL_ORIGINS, route => route.abort('failed'));
  await page.route(CORS_PROXY, route => route.abort('failed'));
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
    await expect(page.locator('script[src*="jarvis-media-authority-v10"]')).toHaveCount(0);
    await expect(page.locator('script[src*="jarvis-media-authority-v11"]')).toHaveCount(0);
    await expect(page.locator('script[src*="jarvis-media-authority.js"]')).toHaveCount(1);
    await page.locator('button.nav[data-app="media"]').click();
    await expect(page.locator('#videoQuery')).toBeVisible();
    await expect(page.locator('#videoSearch')).toBeVisible();
    expect(page.url()).toMatch(/\/$/);
    expect(page.context().pages()).toHaveLength(1);
  });

  test('keyword search returns dynamic PeerTube metadata', async ({ page }) => {
    await mockPeerTube(page, 'Live PeerTube result');
    await openMedia(page);
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await expect(page.locator('.jyt-card')).toHaveCount(1);
    await expect(page.locator('.jyt-card .card-title')).toHaveText('Live PeerTube result');
    await expect(page.locator('.jyt-card .card-author')).toHaveText('PeerTube Test Channel');
    await expect(page.locator('#videoResults')).not.toContainText('LOCAL INDEX');
  });

  test('selected PeerTube result opens the official in-shell embed', async ({ page }) => {
    await mockPeerTube(page, 'Playable PeerTube result');
    await openMedia(page);
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await page.locator('.jyt-card').first().click();
    await expect(page.locator('iframe.jarvis-video-frame')).toHaveAttribute('src', EMBED_URL);
    expect(page.url()).toMatch(/\/$/);
  });

  test('direct YouTube URL remains a supported fallback player', async ({ page }) => {
    await openMedia(page);
    await page.locator('#videoQuery').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.locator('#videoSearch').click();
    await expect(page.locator('iframe.jarvis-video-frame')).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
    );
    expect(page.url()).toMatch(/\/$/);
  });

  test('failed video services never fabricate results', async ({ page }) => {
    await blockVideoNetwork(page);
    await openMedia(page);
    await page.locator('#videoQuery').fill('unreachable test query');
    await page.locator('#videoSearch').click();
    await expect(page.locator('.media-degraded-state')).toBeVisible();
    await expect(page.locator('#videoResults')).toContainText('No video index responded');
    await expect(page.locator('#videoResults')).toContainText('NETWORK DIAGNOSTIC');
    await expect(page.locator('#videoResults')).not.toContainText('Nyan Cat');
    await expect(page.locator('#videoResults')).not.toContainText('JARVIS playable fallback');
  });
});
