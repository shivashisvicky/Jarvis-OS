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
    await page.locator(`button.nav[data-app="${app}"]`).first().click();
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  });
  expect(page.context().pages().length).toBe(pagesBefore);
  expect(page.url()).toBe(urlBefore);
}

function mockVideoSearch(page: Page) {
  return page.route('**/api/v1/search**', async route => {
    const url = new URL(route.request().url());
    const q = (url.searchParams.get('q') || '').toLowerCase();
    const cats = q.includes('cat');
    const first = cats ? 'J---aiyznGQ' : 'aqz-KE-bpKQ';
    const second = cats ? '21X5lGlDOfg' : 'limjpmSRrdE';
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { type: 'video', videoId: first, title: cats ? 'Cats dynamic result' : 'Shot dynamic result', author: 'Mock YouTube Index', publishedText: 'LIVE TEST INDEX', videoThumbnails: [{ quality: 'medium', url: `https://i.ytimg.com/vi/${first}/hqdefault.jpg` }] },
      { type: 'video', videoId: second, title: cats ? 'Cats second result' : 'Shot second result', author: 'Mock YouTube Index' }
    ]) });
  });
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

  test('video keyword search is dynamic, not a four-item static catalog', async ({ page }) => {
    await mockVideoSearch(page);
    await expectInternalApp(page, 'media', 'Media Center');
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await expect(page.getByText('Cats dynamic result', { exact: true })).toBeVisible({ timeout: 8000 });
    const catsIds = await page.locator('#videoResults .jvc-card').evaluateAll(cards => cards.map(c => c.getAttribute('data-jvc-id')));
    expect(catsIds).toEqual(['J---aiyznGQ', '21X5lGlDOfg']);

    await page.locator('#videoQuery').fill('shot');
    await page.locator('#videoSearch').click();
    await expect(page.getByText('Shot dynamic result', { exact: true })).toBeVisible({ timeout: 8000 });
    const shotIds = await page.locator('#videoResults .jvc-card').evaluateAll(cards => cards.map(c => c.getAttribute('data-jvc-id')));
    expect(shotIds).toEqual(['aqz-KE-bpKQ', 'limjpmSRrdE']);
    expect(shotIds).not.toEqual(catsIds);
    await expect(page.getByText(/No public video index responded|NO REDIRECT|VIDEO INDEX OFFLINE|OPEN YOUTUBE SEARCH|BING VIDEO SEARCH/i)).toHaveCount(0);
  });

  test('dynamic keyword result opens the internal player without navigation', async ({ page }) => {
    await mockVideoSearch(page);
    await expectInternalApp(page, 'media', 'Media Center');
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await page.locator('#videoResults .jvc-card').first().click();
    await expect(page.locator('#jarvisPlayer iframe, #jarvisPlayer video')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /J---aiyznGQ/);
    expect(page.context().pages().length).toBe(1);
    expect(page.url()).not.toMatch(/youtube\.com|bing\.com/i);
  });

  test('pasted mobile YouTube URL resolves to the internal player resource', async ({ page }) => {
    await expectInternalApp(page, 'media', 'Media Center');
    await page.locator('#videoUrl').fill('https://m.youtube.com/watch?v=limjpmSRrdE&si=1t1qckOxWZmxUGmZ');
    await page.locator('#playVideo').click();
    await expect(page.locator('#jarvisPlayer iframe')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /limjpmSRrdE/);
    expect(page.context().pages().length).toBe(1);
  });

  test('all public video indexes failing still leaves one query-specific playable fallback', async ({ page }) => {
    await page.route('**/api/v1/**', route => route.abort());
    await page.route('**/pipedapi.*/**', route => route.abort());
    await page.route('https://commons.wikimedia.org/**', route => route.abort());
    await page.route('https://api.allorigins.win/**', route => route.abort());
    await page.route('https://corsproxy.io/**', route => route.abort());
    await expectInternalApp(page, 'media', 'Media Center');
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await expect(page.locator('#videoResults .jvc-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#videoResults .jvc-card')).toHaveCount(1);
    await expect(page.getByText(/No public video index responded|NO REDIRECT|VIDEO INDEX OFFLINE|OPEN YOUTUBE SEARCH|BING VIDEO SEARCH/i)).toHaveCount(0);
    await expect(page.locator('#videoResults .jvc-card').first()).toContainText('cats');
    await page.locator('#videoResults .jvc-card').first().click();
    await expect(page.locator('#jarvisPlayer iframe, #jarvisPlayer video')).toBeVisible({ timeout: 8000 });
    expect(page.context().pages().length).toBe(1);
  });

  test('trending uses the live in-house index and remains playable', async ({ page }) => {
    await page.route('**/api/v1/trending**', async route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { videoId: '21X5lGlDOfg', title: 'NASA Trending Fixture', author: 'NASA', publishedText: 'LIVE TRENDING' },
      { videoId: 'J---aiyznGQ', title: 'Cats Trending Fixture', author: 'JARVIS', publishedText: 'LIVE TRENDING' }
    ]) }));
    await expectInternalApp(page, 'media', 'Media Center');
    await page.getByRole('button', { name: 'TRENDING', exact: true }).click();
    await expect(page.locator('#videoQuery')).toHaveValue('trending videos India');
    await expect(page.getByText('NASA Trending Fixture', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#videoResults .jvc-card')).toHaveCount(2);
    await page.locator('#videoResults .jvc-card').first().click();
    await expect(page.locator('#jarvisPlayer iframe')).toBeVisible({ timeout: 8000 });
    expect(page.context().pages().length).toBe(1);
  });

  test('dashboard Find Video opens the media search internally', async ({ page }) => {
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
