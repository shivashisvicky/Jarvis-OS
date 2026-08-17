import { expect, test } from '@playwright/test';

test.describe('JARVIS CI smoke contract', () => {
  test('video search exposes the real YouTube search URL contract', async ({ page }) => {
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await expect(page.getByRole('heading', { name: 'Media Center', exact: true })).toBeVisible();
    const url = await page.evaluate(() => {
      const fn = (window as unknown as { jarvisVideoSearchUrl?: (q: string) => string }).jarvisVideoSearchUrl;
      return fn?.('cats') ?? '';
    });
    expect(url).toContain('youtube.com');
    expect(url).toContain('search_query=cats');
    expect(url).not.toContain('JARVIS result');
    expect(url).not.toContain('aqz-KE-bpKQ');
  });

  test('live video result renders and plays inside JARVIS', async ({ page }) => {
    await page.route('https://pipedapi.tokhmi.xyz/search**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [{
          videoId: 'dQw4w9WgXcQ', title: 'Live test video result', uploaderName: 'Test Channel',
          viewCount: 1234, uploadedDate: 'today', thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', type: 'stream',
        }] }),
      });
    });
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await expect(page.getByRole('heading', { name: 'Media Center', exact: true })).toBeVisible();
    await page.locator('#videoQuery').fill('test video');
    await page.locator('#videoSearch').click();
    await expect(page.locator('.jvs-card')).toHaveCount(1);
    await expect(page.locator('.jvs-card strong')).toHaveText('Live test video result');
    await page.locator('.jvs-card').click();
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
    await expect(page.locator('#mediaState')).toContainText('PLAYING');
  });

  test('video authority does not invent a result when live indexes fail', async ({ page }) => {
    for (const host of [
      'pipedapi.tokhmi.xyz', 'pipedapi.moomoo.me', 'piped-api.garudalinux.org', 'api.piped.privacydev.net',
      'pipedapi.smnz.de', 'pipedapi.adminforge.de', 'pipedapi.qdi.fi', 'piped-api.hostux.net',
      'inv.nadeko.net', 'invidious.nerdvpn.de', 'yt.chocolatemoo53.com', 'invidious.tiekoetter.com',
      'invidious.f5.si', 'inv.zoomerville.com', 'corsproxy.io', 'api.allorigins.win', 'www.youtube.com',
    ]) await page.route(`https://${host}/**`, route => route.abort());
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await page.locator('#videoQuery').fill('unreachable test query');
    await page.locator('#videoSearch').click();
    await expect(page.locator('#videoResults')).toContainText('NO LIVE RESULTS', { timeout: 15000 });
    await expect(page.locator('#videoResults')).not.toContainText('JARVIS playable fallback');
  });

  test('map and media authorities are installed without leaving the shell', async ({ page }) => {
    await page.goto('/');
    await expect.poll(async () => page.evaluate(() => Boolean((window as unknown as { jarvisMapSearch?: unknown }).jarvisMapSearch))).toBe(true);
    await expect.poll(async () => page.evaluate(() => Boolean((window as unknown as { jarvisVideoSearch?: unknown }).jarvisVideoSearch))).toBe(true);
    expect(page.context().pages()).toHaveLength(1);
    expect(page.url()).toMatch(/\/$/);
  });
});
