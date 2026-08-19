import { expect, test } from '@playwright/test';

test.describe('JARVIS media smoke contract', () => {
  test('shell boots with one media authority and no canned results', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.brand')).toContainText('J.A.R.V.I.S');
    await expect(page.locator('script[src*="jarvis-media-final.js"]')).toHaveCount(1);
    for (const old of ['jarvis-media-core-v7', 'jarvis-media-authority-v8', 'jarvis-media-authority-v10', 'jarvis-media-authority-v11', 'jarvis-media-authority.js', 'jarvis-media-runtime-watchdog.js']) {
      await expect(page.locator(`script[src*="${old}"]`)).toHaveCount(0);
    }
    await page.locator('button.nav[data-app="media"]').click();
    await expect(page.locator('#videoQuery')).toBeVisible();
    await expect(page.locator('#videoSearch')).toBeVisible();
    await expect(page.locator('#videoResults')).toBeVisible();
    await expect(page.locator('#jarvisPlayer')).toBeVisible();
    await expect(page.locator('.jvc-card')).toHaveCount(0);
    await expect(page.locator('#videoResults')).not.toContainText(/SAP CPI fixture tutorial|Nyan Cat|NASA Live|India 2026/i);
  });

  test('provider adapter renders returned IDs and official YouTube player', async ({ page }) => {
    const fixture = {
      items: [
        { type: 'video', videoId: 'M7lc1UVf-VE', title: 'Cats live provider result', uploaderName: 'Live Provider', thumbnail: 'https://i.ytimg.com/vi/M7lc1UVf-VE/mqdefault.jpg' },
        { type: 'video', videoId: 'dQw4w9WgXcQ', title: 'Second provider result', uploaderName: 'Second Provider', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg' }
      ]
    };
    await page.route('**/search**', async route => {
      const url = route.request().url();
      if (/piped|invidious/i.test(url)) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) });
        return;
      }
      await route.continue();
    });
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await expect(page.locator('.jvc-card')).toHaveCount(2, { timeout: 10000 });
    await expect(page.locator('.jvc-card').first()).toHaveAttribute('data-jvc-id', 'M7lc1UVf-VE');
    await expect(page.locator('.jvc-card').first()).toContainText('Cats live provider result');
    await page.locator('.jvc-card').first().click();
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/M7lc1UVf-VE/);
  });

  test('direct YouTube URL goes straight to the player', async ({ page }) => {
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await page.locator('#videoQuery').fill('https://youtube.com/shorts/JbgYndCSv3k?si=ci');
    await page.locator('#videoSearch').click();
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/JbgYndCSv3k/);
  });

  test('LIVE: real YouTube search is reachable and JARVIS returns non-fixture results', async ({ page }) => {
    test.setTimeout(45000);
    const response = await page.request.get('https://www.youtube.com/results?search_query=cats', { timeout: 20000 });
    expect(response.ok()).toBeTruthy();
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await expect(page.locator('.jvc-card').first()).toBeVisible({ timeout: 30000 });
    const count = await page.locator('.jvc-card').count();
    expect(count).toBeGreaterThanOrEqual(4);
    const ids = await page.locator('.jvc-card').evaluateAll(cards => cards.map(card => card.getAttribute('data-jvc-id')).filter(Boolean));
    expect(new Set(ids).size).toBeGreaterThanOrEqual(4);
    await expect(page.locator('#videoResults')).not.toContainText(/fixture|fake|demo|canned/i);
    await page.locator('.jvc-card').first().click();
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}/);
  });
});
