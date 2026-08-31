import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;
const APP_URL = LIVE_URL || '/';

async function openHome(page) {
  await page.goto(LIVE_URL ? new URL(LIVE_URL).toString() : APP_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.nav[data-app="home"]')).toBeVisible({ timeout: 30_000 });
  await page.locator('.nav[data-app="home"]').click();
}

async function submit(page, text) {
  const input = page.locator('#commandInput');
  await input.fill(text);
  await page.locator('#commandForm').press('Enter');
}

async function findBeowulf(page) {
  await submit(page, 'find Beowulf');
  await expect(page.locator('.page-head h1')).toHaveText(/Files|Ebooks/i, { timeout: 15_000 });
  await expect.poll(async () => page.locator('#jbe6Results .jbe6-book').count(), { timeout: 30_000 }).toBeGreaterThan(0);
}

test('context reference authority resolves book result references after returning home', async ({ page }) => {
  await openHome(page);
  await findBeowulf(page);
  const firstTitle = (await page.locator('#jbe6Results .jbe6-book').first().locator('.jbe6-name').innerText()).trim();
  await page.locator('.nav[data-app="home"]').click();
  await submit(page, 'open the first one');
  await expect(page.locator('#jarvisReply')).not.toContainText(/Search Hub|current location|more context/i);
  await expect(page.locator('#jbe6Panel')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#jbe6Results')).toContainText(firstTitle);
});

test('book reference survives opening and closing the native JARVIS reader', async ({ page }) => {
  await openHome(page);
  await findBeowulf(page);
  const firstBook = page.locator('#jbe6Results .jbe6-book').first();
  const firstTitle = (await firstBook.locator('.jbe6-name').innerText()).trim();
  await firstBook.locator('[data-rel-read]').click();
  await expect(page.locator('#jbe6Reader, .jbe6-reader')).toBeVisible({ timeout: 15_000 });
  await page.locator('#jbe6Close').click();
  await page.locator('.nav[data-app="home"]').click();
  await submit(page, 'open the first one');
  await expect(page.locator('#jarvisReply')).not.toContainText(/Search Hub|current location|more context/i);
  await expect(page.locator('#jbe6Panel')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#jbe6Results')).toContainText(firstTitle);
});

test('context reference authority resolves numbered book result references', async ({ page }) => {
  await openHome(page);
  await findBeowulf(page);
  const secondBook = page.locator('#jbe6Results .jbe6-book').nth(1);
  await expect(secondBook).toBeVisible({ timeout: 15_000 });
  const secondTitle = (await secondBook.locator('.jbe6-name').innerText()).trim();
  await page.locator('.nav[data-app="home"]').click();
  await submit(page, 'open result 2');
  await expect(page.locator('#jarvisReply')).not.toContainText(/Search Hub|current location|more context/i);
  await expect(page.locator('#jbe6Panel')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#jbe6Results')).toContainText(secondTitle);
});

test('Search ordinal wins over stale Maps context', async ({ page }) => {
  await openHome(page);
  await page.locator('.nav[data-app="web"]').click();
  await expect(page.locator('#webQuery')).toBeVisible({ timeout: 15_000 });

  await page.evaluate(() => {
    const results = document.querySelector('#jwsResults');
    if (!results) throw new Error('Search results surface missing');
    results.innerHTML = [1, 2, 3].map(i => `<div class="web-result"><a target="_blank" href="https://example.com/search-result-${i}"><strong>Search result ${i}</strong><small>Example</small></a></div>`).join('');
    const staleMaps = { domain: 'MAPS', active: true, results: [{ name: 'Red palm restaurant' }, { name: 'Map result two' }, { name: 'Map result three' }] };
    const w = window as Window & { jarvisContextEngine?: any; jarvisMapAuthority?: any; __JARVIS_SEARCH_CONTEXT__?: any };
    w.jarvisMapAuthority = { getContext: () => staleMaps };
    w.jarvisContextEngine = { get: () => staleMaps, set: () => undefined };
    w.__JARVIS_SEARCH_CONTEXT__ = {
      domain: 'SEARCH',
      active: true,
      query: 'black shoes',
      provider: 'bing',
      results: [1, 2, 3].map(i => ({ index: i - 1, title: `Search result ${i}`, source: 'Example', link: `https://example.com/search-result-${i}`, type: 'WEB_RESULT' }))
    };
  });

  const popupPromise = page.waitForEvent('popup', { timeout: 10_000 });
  await submit(page, 'open the third one');
  const popup = await popupPromise;
  await expect.poll(async () => popup.url()).toContain('search-result-3');
  await expect(page.locator('.nav[data-app="web"]')).toHaveClass(/selected/);
});
