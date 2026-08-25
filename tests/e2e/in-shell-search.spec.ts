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
});
