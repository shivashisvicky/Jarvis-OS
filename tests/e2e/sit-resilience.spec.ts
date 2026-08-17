import { test, expect } from '@playwright/test';

async function retryStep(page: any, _name: string, action: () => Promise<void>) {
  let last: unknown;
  for (let i = 0; i < 3; i++) {
    try { await action(); return; } catch (e) { last = e; if (i === 2) throw last; }
  }
}

async function expectInternalApp(page: any, app: string, heading: string) {
  const pagesBefore = page.context().pages().length;
  const urlBefore = page.url();
  await retryStep(page, `${app}-open`, async () => {
    await page.locator(`button.nav[data-app="${app}"]`).first().click();
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  });
  expect(page.context().pages().length, `${app} opened a new browser page`).toBe(pagesBefore);
  expect(page.url(), `${app} changed the browser URL`).toBe(urlBefore);
}

test.describe('JARVIS internal-app and recovery SIT', () => {
  test('video search resolves keyword results and has a real player path', async ({ page }) => {
    const cors = { 'access-control-allow-origin': '*' };
    const result = {
      type: 'video', title: 'SAP Cloud Integration Tutorial', videoId: 'dQw4w9WgXcQ',
      author: 'JARVIS Test Channel', viewCount: 12345, publishedText: 'today', lengthSeconds: 212,
      videoThumbnails: [{ quality: 'medium', url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', width: 480, height: 360 }]
    };
    await page.route('**/api/v1/search*', async route => route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify([result]) }));
    await page.route('**/api/v1/videos/dQw4w9WgXcQ*', async route => route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ videoId: 'dQw4w9WgXcQ', videoThumbnails: [], formatStreams: [] }) }));
    await page.route('**/pipedapi.*/search*', async route => route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ items: [result] }) }));
    await page.route('**/pipedapi.*/streams/dQw4w9WgXcQ*', async route => route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ videoStreams: [] }) }));

    await expectInternalApp(page, 'media', 'Media Center');
    await expect(page.locator('#mediaState, #jvcStatus').first()).toBeVisible({ timeout: 3000 });
    await page.locator('#videoQuery').fill('SAP CPI tutorial');
    await page.locator('#videoSearch').click();
    await expect(page.getByText('SAP Cloud Integration Tutorial', { exact: true })).toBeVisible({ timeout: 8000 });
    await expect(page.locator('#mediaState, #jvcStatus').first()).toContainText('RESULTS');
    await expect(page.locator('#videoResults .jvc-card')).toHaveCount(1);

    await page.locator('#videoResults .jvc-card').click();
    await expect(page.locator('#jarvisPlayer iframe, #jarvisPlayer video')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('#mediaState, #jvcStatus').first()).not.toContainText(/DEGRADED|INDEX UNAVAILABLE|NO REDIRECT/i);
    expect(page.context().pages().length).toBe(1);
  });

  test('video search stays playable inside JARVIS when every public index fails', async ({ page }) => {
    await page.route('**/pipedapi.*/**', route => route.abort());
    await page.route('**/api/v1/**', route => route.abort());
    await page.route('https://commons.wikimedia.org/**', route => route.abort());
    await page.route('https://api.allorigins.win/**', route => route.abort());
    await page.route('https://corsproxy.io/**', route => route.abort());

    await expectInternalApp(page, 'media', 'Media Center');
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();

    // This is intentionally a positive contract: provider failure must never
    // strand the user on an error state. JARVIS must always expose a playable
    // in-house result and must never create a new browser tab.
    await expect(page.locator('#videoResults .jvc-card')).toHaveCount(1, { timeout: 10000 });
    await expect(page.getByText(/JARVIS playable fallback/i)).toBeVisible();
    await expect(page.locator('#mediaState, #jvcStatus').first()).toContainText('IN-HOUSE');
    await expect(page.getByText(/No public video index responded|NO REDIRECT|VIDEO INDEX OFFLINE/i)).toHaveCount(0);

    await page.locator('#videoResults .jvc-card').click();
    await expect(page.locator('#jarvisPlayer iframe, #jarvisPlayer video')).toBeVisible({ timeout: 8000 });
    expect(page.context().pages().length).toBe(1);
    expect(page.url()).not.toMatch(/youtube\.com|bing\.com/i);
  });

  test('dashboard Find Video opens the media search with a real query', async ({ page }) => {
    await page.locator('.jmc-action').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Media Center', exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#videoQuery')).toHaveValue('trending videos India', { timeout: 5000 });
  });

  test('critical shell survives repeated app switching', async ({ page }) => {
    for (let i = 0; i < 2; i++) {
      await expectInternalApp(page, 'web', 'Search Hub');
      await expectInternalApp(page, 'maps', 'Maps');
      await expectInternalApp(page, 'media', 'Media Center');
    }
  });
});
