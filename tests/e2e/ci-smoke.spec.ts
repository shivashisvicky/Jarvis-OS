import { expect, test } from '@playwright/test';

test.describe('JARVIS media smoke contract', () => {
  test('shell boots with one media authority and no canned results', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.brand')).toContainText('J.A.R.V.I.S');
    await expect(page.locator('script[src*="jarvis-media-v2.js"]')).toHaveCount(1);
    for (const old of ['jarvis-media-final.js', 'jarvis-media-core-v7', 'jarvis-media-authority-v8', 'jarvis-media-authority-v10', 'jarvis-media-authority-v11', 'jarvis-media-authority.js', 'jarvis-media-runtime-watchdog.js', 'jarvis-runtime-guards.js']) {
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

  test('direct YouTube URL goes straight to the official player', async ({ page }) => {
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await page.locator('#videoQuery').fill('https://youtube.com/shorts/JbgYndCSv3k?si=ci');
    await page.locator('#videoSearch').click();
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/JbgYndCSv3k/);
  });

  test('LIVE: real YouTube search is reachable and JARVIS returns non-fixture results', async ({ page }) => {
    test.setTimeout(90000);
    const diagnostics: string[] = [];
    page.on('console', msg => diagnostics.push(`console:${msg.type()}:${msg.text()}`));
    page.on('pageerror', err => diagnostics.push(`pageerror:${err.message}`));
    page.on('requestfailed', req => diagnostics.push(`requestfailed:${req.method()} ${req.url()} :: ${req.failure()?.errorText || 'unknown'}`));
    page.on('response', res => {
      if (/jina|allorigins/i.test(res.url())) diagnostics.push(`transport:${res.status()} ${res.url()}`);
    });

    const response = await page.request.get('https://www.youtube.com/results?search_query=cats', { timeout: 20000 });
    expect(response.ok(), `Direct YouTube search HTTP ${response.status()}`).toBeTruthy();

    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();

    try {
      await expect(page.locator('.jvc-card').first()).toBeVisible({ timeout: 60000 });
    } catch (error) {
      await page.screenshot({ path: 'test-results/live-media-failure.png', fullPage: true });
      console.log('LIVE_MEDIA_DIAGNOSTICS_START');
      console.log(diagnostics.join('\n'));
      console.log('LIVE_MEDIA_DIAGNOSTICS_END');
      throw error;
    }

    const count = await page.locator('.jvc-card').count();
    expect(count).toBeGreaterThanOrEqual(4);
    const ids = await page.locator('.jvc-card').evaluateAll(cards => cards.map(card => card.getAttribute('data-jvc-id')).filter(Boolean));
    expect(new Set(ids).size).toBeGreaterThanOrEqual(4);
    await expect(page.locator('#videoResults')).not.toContainText(/fixture|fake|demo|canned/i);
    await page.locator('.jvc-card').first().click();
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}/);
  });
});
