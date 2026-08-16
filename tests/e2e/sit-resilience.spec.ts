import { test, expect, type Page } from '@playwright/test';

async function retryStep(page: Page, name: string, action: () => Promise<void>, attempts = 3) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try { await action(); return; }
    catch (error) {
      lastError = error;
      await page.screenshot({ path: `test-results/${name.replace(/\W+/g, '-')}-attempt-${attempt}.png`, fullPage: true }).catch(() => {});
      if (attempt < attempts) await page.waitForTimeout(250 * attempt);
    }
  }
  throw lastError;
}

async function expectInternalApp(page: Page, app: string, heading: string) {
  const pagesBefore = page.context().pages().length;
  const urlBefore = page.url();
  await retryStep(page, `${app}-open`, async () => {
    await page.locator(`button.nav[data-app="${app}"]`).click();
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  });
  expect(page.context().pages().length).toBe(pagesBefore);
  expect(page.url()).toBe(urlBefore);
}

test.describe('JARVIS internal-app and recovery SIT', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('J.A.R.V.I.S', { exact: true })).toBeVisible();
  });

  test('first-party applications remain internal', async ({ page }) => {
    await expectInternalApp(page, 'api', 'API Lab');
    await expectInternalApp(page, 'web', 'Search Hub');
    await expectInternalApp(page, 'maps', 'Maps');
    await expectInternalApp(page, 'media', 'Media Center');
  });

  test('REST client preserves developer input', async ({ page }) => {
    await expectInternalApp(page, 'api', 'API Lab');
    await retryStep(page, 'rest-input', async () => {
      await page.locator('#httpUrl').fill('https://example.com/api');
      await page.locator('#httpHeaders').fill('{"Accept":"application/json"}');
      await expect(page.locator('#httpUrl')).toHaveValue('https://example.com/api');
      await expect(page.locator('#httpHeaders')).toHaveValue('{"Accept":"application/json"}');
    });
  });

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
    await expect(page.locator('#jvcStatus')).toBeVisible({ timeout: 3000 });
    await page.locator('#videoQuery').fill('SAP CPI tutorial');
    await page.locator('#videoSearch').click();
    await expect(page.getByText('SAP Cloud Integration Tutorial', { exact: true })).toBeVisible({ timeout: 8000 });
    await expect(page.locator('#jvcStatus')).toContainText('RESULTS');
    await expect(page.locator('#videoResults .jvc-card')).toHaveCount(1);

    await page.locator('#videoResults .jvc-card').click();
    await expect(page.locator('#jarvisPlayer iframe, #jarvisPlayer video')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('#jvcStatus')).not.toContainText(/DEGRADED|INDEX UNAVAILABLE/i);
  });

  test('video search falls back to real YouTube and Bing keyword search', async ({ page }) => {
    await page.route('**/pipedapi.*/**', route => route.abort());
    await page.route('**/api/v1/**', route => route.abort());
    await expectInternalApp(page, 'media', 'Media Center');
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await expect(page.getByText('LIVE SEARCH READY · CHOOSE A SEARCH ENGINE', { exact: true })).toBeVisible({ timeout: 8000 });
    await expect(page.locator('#jvcYoutube')).toBeVisible();
    await expect(page.locator('#jvcBing')).toBeVisible();
    await expect(page.locator('#jvcStatus')).toContainText('LIVE SEARCH READY');
    await expect(page.locator('#jvcStatus')).not.toContainText(/DEGRADED|INDEX UNAVAILABLE/i);
    await expect(page.locator('#jvcYoutube')).toHaveAttribute('data-search-url', 'https://www.youtube.com/results?search_query=cats');
    await expect(page.locator('#jvcBing')).toHaveAttribute('data-search-url', 'https://www.bing.com/videos/search?q=cats');
    await page.locator('#jvcYoutube').click();
    await page.locator('#jvcBing').click();
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
      await expectInternalApp(page, 'api', 'API Lab');
    }
    await expect(page.locator('.os')).toBeVisible();
  });
});
