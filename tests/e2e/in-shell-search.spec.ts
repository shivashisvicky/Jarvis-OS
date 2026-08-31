import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;

test.describe('deployed in-shell search', () => {
  test.skip(!LIVE_URL, 'Production-only live gate');
  test.setTimeout(90_000);

  test('web search does not navigate away and renders live result cards', async ({ page }) => {
    await page.goto(new URL(LIVE_URL!).toString(), { waitUntil: 'domcontentloaded' });
    await page.locator('.nav[data-app="web"]').click();
    await expect(page.locator('#webQuery')).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(() => Boolean((window as Window & { __JARVIS_WEB_SEARCH_V3__?: boolean }).__JARVIS_WEB_SEARCH_V3__), null, { timeout: 30_000 });
    const before = page.url();
    await page.locator('#webQuery').fill('latest AI news');
    await page.locator('#webSearch').click();
    await expect(page.locator('#jwsStatus')).toContainText(/RESULTS|NO RESULTS|DEGRADED/, { timeout: 45_000 });
    expect(page.url()).toBe(before);
    await expect(page.locator('#jwsResults')).toBeVisible();
    const text = await page.locator('#jwsResults').innerText();
    expect(text).not.toMatch(/OPEN A BROWSER SEARCH|External results open/i);
  });

  test('spoken internet-search wrappers are reduced to the actual query', async ({ page }) => {
    await page.goto(new URL(LIVE_URL!).toString(), { waitUntil: 'domcontentloaded' });
    await page.locator('.nav[data-app="web"]').click();
    await expect(page.locator('#webQuery')).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(() => typeof (window as Window & { jarvisNormalizeSearchQuery?: (value: string) => string }).jarvisNormalizeSearchQuery === 'function', null, { timeout: 30_000 });

    const normalized = await page.evaluate(() => {
      const normalize = (window as Window & { jarvisNormalizeSearchQuery?: (value: string) => string }).jarvisNormalizeSearchQuery!;
      return [
        normalize('search the internet for black shoes'),
        normalize('in the internet for black shoes'),
        normalize('on the internet for black shoes'),
        normalize('search the web for black shoes'),
      ];
    });
    expect(normalized).toEqual(['black shoes', 'black shoes', 'black shoes', 'black shoes']);

    await page.locator('#webQuery').fill('in the internet for black shoes');
    await page.locator('#webSearch').click();
    await expect(page.locator('#webQuery')).toHaveValue('black shoes');
  });

  test('search context recognizes numeric result references including no. 2', async ({ page }) => {
    await page.goto(new URL(LIVE_URL!).toString(), { waitUntil: 'domcontentloaded' });
    await page.locator('.nav[data-app="web"]').click();
    await expect(page.locator('#webQuery')).toBeVisible({ timeout: 30_000 });
    await page.locator('#webQuery').fill('black shoes');
    await page.locator('#webSearch').click();
    await expect(page.locator('#jwsStatus')).toContainText(/RESULTS/, { timeout: 45_000 });
    const webResults = page.locator('#jwsResults .web-result');
    await expect.poll(async () => webResults.count(), { timeout: 15_000 }).toBeGreaterThanOrEqual(2);

    await page.locator('.nav[data-app="home"]').click();
    const before = page.url();
    const popupPromise = page.waitForEvent('popup', { timeout: 15_000 });
    await page.locator('#commandInput').fill('open no. 2');
    await page.locator('#commandForm').press('Enter');
    const popup = await popupPromise;
    await expect.poll(async () => popup.url()).not.toBe('about:blank');
    expect(page.url()).toBe(before);
  });
});
