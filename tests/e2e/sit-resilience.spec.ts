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
  return page.route('**/search**', async route => {
    const url = new URL(route.request().url());
    const q = (url.searchParams.get('q') || '').toLowerCase();
    if (q.includes('sap cpi')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [
        { type:'video', videoId:'dQw4w9WgXcQ', title:'SAP CPI fixture tutorial', author:'JARVIS Lab' },
      ]}) });
    }
    if (q.includes('cats')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [
        { type:'video', videoId:'J---aiyznGQ', title:'Cats live result', author:'Cat Channel' },
        { type:'video', videoId:'aqz-KE-bpKQ', title:'Cats and kittens', author:'Animals Now' },
        { type:'video', videoId:'QH2-TGUlwu4', title:'Cat classic', author:'Pets Now' },
        { type:'video', videoId:'21X5lGlDOfg', title:'Animal live feed', author:'Animal TV' },
      ]}) });
    }
    if (q.includes('trending videos india')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [
        { type:'video', videoId:'limjpmSRrdE', title:'India live result', author:'JARVIS Live' },
        { type:'video', videoId:'21X5lGlDOfg', title:'NASA live result', author:'NASA' },
        { type:'video', videoId:'kJQP7kiw5Fk', title:'Music live result', author:'Music Now' },
        { type:'video', videoId:'aqz-KE-bpKQ', title:'Animation live result', author:'Blender' },
      ]}) });
    }
    return route.abort();
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

  test('video search resolves keyword results and has a real player path', async ({ page }) => {
    await mockVideoSearch(page);
    await expectInternalApp(page, 'media', 'Media Center');
    await expect(page.locator('#mediaState, #jvcStatus').first()).toBeVisible({ timeout: 3000 });
    await page.locator('#videoQuery').fill('SAP CPI tutorial');
    await page.locator('#videoSearch').click();
    await expect(page.getByText('SAP CPI fixture tutorial', { exact: true })).toBeVisible({ timeout: 8000 });
    await expect(page.locator('#mediaState, #jvcStatus').first()).toContainText('RESULTS');
    await expect(page.locator('#videoResults .jvc-card')).toHaveCount(1);
    await page.locator('#videoResults .jvc-card').click();
    await expect(page.locator('#jarvisPlayer iframe, #jarvisPlayer video')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /dQw4w9WgXcQ/);
    expect(page.context().pages().length).toBe(1);
  });

  test('pasted mobile YouTube URL resolves to the same internal player resource', async ({ page }) => {
    await expectInternalApp(page, 'media', 'Media Center');
    await page.locator('#videoUrl').fill('https://m.youtube.com/watch?v=limjpmSRrdE&si=1t1qckOxWZmxUGmZ');
    await page.locator('#playVideo').click();
    await expect(page.locator('#jarvisPlayer iframe')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /limjpmSRrdE/);
    expect(page.context().pages().length).toBe(1);
  });

  test('video outage never fabricates a canned result or redirects', async ({ page }) => {
    await page.route('**/search**', route => route.abort());
    await page.route('**/pipedapi.*/**', route => route.abort());
    await page.route('**/api/v1/**', route => route.abort());
    await page.route('https://commons.wikimedia.org/**', route => route.abort());
    await page.route('https://api.allorigins.win/**', route => route.abort());
    await page.route('https://corsproxy.io/**', route => route.abort());
    await page.route('https://r.jina.ai/**', route => route.abort());
    await expectInternalApp(page, 'media', 'Media Center');
    await page.locator('#videoQuery').fill('quantum waffles 987654321');
    await page.locator('#videoSearch').click();
    await expect(page.locator('#videoResults')).toContainText('NO LIVE MATCHES', { timeout: 10000 });
    await expect(page.locator('#videoResults')).not.toContainText('Big Buck Bunny');
    await expect(page.locator('#videoResults')).not.toContainText('Nyan Cat');
    await expect(page.locator('#videoResults')).not.toContainText('NASA Live');
    await expect(page.locator('#videoResults')).not.toContainText('India 2026');
    await expect(page.getByText(/No public video index responded|NO REDIRECT|VIDEO INDEX OFFLINE/i)).toHaveCount(0);
    expect(page.context().pages().length).toBe(1);
  });

  test('trending is dynamic and stays inside JARVIS', async ({ page }) => {
    await mockVideoSearch(page);
    await expectInternalApp(page, 'media', 'Media Center');
    await page.getByRole('button', { name: 'TRENDING', exact: true }).click();
    await expect(page.locator('#videoQuery')).toHaveValue('trending videos India');
    await expect(page.locator('#videoResults .jvc-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#videoResults .jvc-card')).toHaveCount(4);
    await expect(page.locator('#mediaState, #jvcStatus').first()).toContainText('RESULTS');
    await page.locator('#videoResults .jvc-card').first().click();
    await expect(page.locator('#jarvisPlayer iframe, #jarvisPlayer video')).toBeVisible({ timeout: 8000 });
    expect(page.context().pages().length).toBe(1);
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
