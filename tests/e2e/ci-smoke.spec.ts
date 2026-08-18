import { expect, test, type Page } from '@playwright/test';

const PEERTUBE = /https:\/\/(?:peertube\.cpy\.re|framatube\.org|peertube\.uno)\//;
const PIPED = /https:\/\/(?:pipedapi\.kavin\.rocks|pipedapi\.leptons\.xyz|pipedapi\.nosebs\.ru|pipedapi\.syncpundit\.io|api\.piped\.yt|pipedapi\.adminforge\.de)\//;
const INVIDIOUS = /https:\/\/(?:inv\.nadeko\.net|invidious\.nerdvpn\.de)\//;

const mockOpenVideo = async (page: Page, title: string) => {
  await page.route(PEERTUBE, async route => {
    const url = route.request().url();
    if (url.includes('/api/v1/search/videos')) {
      await route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ data:[{ uuid:'9c9de5e8-0a1e-484a-b099-e80766180a6d', name:title, duration:42, views:1234, publishedAt:'2026-08-18T00:00:00Z', thumbnailPath:'/lazy-static/previews/test.jpg', channel:{displayName:'PeerTube Test Channel'} }] }) }); return;
    }
    await route.abort('failed');
  });
  await page.route(PIPED, async route => {
    const url = route.request().url();
    if (url.includes('/search')) {
      await route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ items:[{ type:'stream', title:'Piped backup result', uploader:'Open Video', duration:55, thumbnail:'https://example.test/thumb.jpg', url:'/watch?v=piped-test-1' }] }) }); return;
    }
    if (url.includes('/streams/piped-test-1')) {
      await route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ title:'Piped backup result', videoStreams:[{ mimeType:'video/mp4', videoOnly:false, quality:'360p', height:360, url:'https://media.example.test/piped-test-1.mp4' }], audioStreams:[] }) }); return;
    }
    await route.abort('failed');
  });
  await page.route(INVIDIOUS, async route => {
    const url = route.request().url();
    if (url.includes('/api/v1/search')) { await route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify([{ type:'video', videoId:'invidious-test-1', title:'Invidious backup result', author:'Open Video', lengthSeconds:55, viewCount:99, videoThumbnails:[] }]) }); return; }
    await route.abort('failed');
  });
};

const openMedia = async (page: Page) => { await page.goto('/'); await page.locator('button.nav[data-app="media"]').click(); await expect(page.locator('#videoQuery')).toBeVisible(); await expect(page.locator('#videoSearch')).toBeVisible(); };

test.describe('JARVIS CI smoke contract', () => {
  test('shell boots and media remains inside the workspace', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.brand')).toContainText('J.A.R.V.I.S');
    await expect(page.locator('script[src*="jarvis-media-legacy-shield"]')).toHaveCount(0);
    await expect(page.locator('script[src*="jarvis-media-core-v7"]')).toHaveCount(1);
    await page.locator('button.nav[data-app="media"]').click();
    await expect(page.locator('#videoQuery')).toBeVisible();
    expect(page.url()).toMatch(/\/$/);
    expect(page.context().pages()).toHaveLength(1);
  });

  test('open-platform keyword search returns dynamic metadata', async ({ page }) => {
    await mockOpenVideo(page, 'Live PeerTube result');
    await openMedia(page);
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await expect(page.locator('.jom-card')).toHaveCount(3);
    await expect(page.locator('.jom-card strong').first()).toHaveText('Live PeerTube result');
    await expect(page.locator('#videoResults')).not.toContainText('LOCAL INDEX');
  });

  test('Piped result resolves a real stream URL and creates native video player', async ({ page }) => {
    await mockOpenVideo(page, 'Playable PeerTube result');
    await openMedia(page);
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await page.locator('.jom-card[data-platform="Piped"]').first().click();
    await expect(page.locator('#jarvisPlayer video')).toHaveAttribute('src', /media\.example\.test\/piped-test-1\.mp4/);
    await expect(page.locator('#mediaState')).toContainText('RESOLVING');
    expect(page.url()).toMatch(/\/$/);
  });

  test('direct YouTube URL remains a supported fallback player', async ({ page }) => {
    await openMedia(page);
    await page.locator('#videoUrl').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.locator('#playVideo').click();
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /youtube\.com\/embed\/dQw4w9WgXcQ/);
    expect(page.url()).toMatch(/\/$/);
  });

  test('failed open indexes never fabricate results', async ({ page }) => {
    await page.route(PEERTUBE, route => route.abort('failed'));
    await page.route(PIPED, route => route.abort('failed'));
    await page.route(INVIDIOUS, route => route.abort('failed'));
    await openMedia(page);
    await page.locator('#videoQuery').fill('unreachable test query');
    await page.locator('#videoSearch').click();
    await expect(page.locator('#videoResults')).toContainText('VIDEO SEARCH TEMPORARILY UNAVAILABLE');
    await expect(page.locator('#videoResults')).not.toContainText('Nyan Cat');
    await expect(page.locator('#videoResults')).not.toContainText('JARVIS playable fallback');
  });
});
