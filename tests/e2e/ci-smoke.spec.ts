import { expect, test } from '@playwright/test';

test.describe('JARVIS CI smoke contract', () => {
  test('video search exposes the exact canonical YouTube search URL contract', async ({ page }) => {
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await expect(page.getByRole('heading', { name: 'Media Center', exact: true })).toBeVisible();
    const result = await page.evaluate(() => {
      const fn = (window as unknown as { jarvisVideoSearchUrl?: (q: string) => string }).jarvisVideoSearchUrl;
      return {
        all: fn?.('cats') ?? '',
        encoded: fn?.('cats & kittens') ?? '',
      };
    });
    expect(result.all).toBe('https://www.youtube.com/results?search_query=cats');
    expect(result.encoded).toBe('https://www.youtube.com/results?search_query=cats%20%26%20kittens');
    expect(result.all).not.toContain('JARVIS result');
    expect(result.all).not.toContain('aqz-KE-bpKQ');
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

  test('ALL / VIDEOS / SHORTS filters are real UI controls and preserve canonical YouTube URL', async ({ page }) => {
    await page.route('https://pipedapi.tokhmi.xyz/search**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [
          { videoId: 'dQw4w9WgXcQ', title: 'Normal live video', uploaderName: 'Test Channel', type: 'stream' },
          { videoId: 'J---aiyznGQ', title: 'Live short result', uploaderName: 'Test Channel', type: 'short' },
        ] }),
      });
    });
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await expect(page.locator('#jvsFilters')).toBeVisible();
    await expect(page.locator('#jvsFilters button')).toHaveText(['ALL', 'VIDEOS', 'SHORTS']);
    await expect(page.locator('.jvs-card')).toHaveCount(2);
    await page.locator('[data-jvs-mode="videos"]').click();
    await expect(page.locator('.jvs-card')).toHaveCount(1);
    await expect(page.locator('.jvs-card strong')).toHaveText('Normal live video');
    await page.locator('[data-jvs-mode="shorts"]').click();
    await expect(page.locator('.jvs-card')).toHaveCount(1);
    await expect(page.locator('.jvs-card strong')).toHaveText('Live short result');
    const url = await page.evaluate(() => (window as unknown as { jarvisVideoSearchUrl: (q: string) => string }).jarvisVideoSearchUrl('cats'));
    expect(url).toBe('https://www.youtube.com/results?search_query=cats');
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
    await expect(page.locator('#videoResults .jvs-card')).toHaveCount(0);
  });

  test('map and media authorities are installed without leaving the shell', async ({ page }) => {
    await page.goto('/');
    await expect.poll(async () => page.evaluate(() => Boolean((window as unknown as { jarvisMapSearch?: unknown }).jarvisMapSearch))).toBe(true);
    await expect.poll(async () => page.evaluate(() => Boolean((window as unknown as { jarvisVideoSearch?: unknown }).jarvisVideoSearch))).toBe(true);
    expect(page.context().pages()).toHaveLength(1);
    expect(page.url()).toMatch(/\/$/);
  });
});
