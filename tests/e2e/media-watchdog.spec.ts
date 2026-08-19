import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL || 'https://shivashisvicky.github.io/Jarvis-OS/';
const QUERY = process.env.JARVIS_WATCHDOG_QUERY || 'cats';
const DIRECT_URL = 'https://www.youtube.com/shorts/JbgYndCSv3k?watchdog=1';
const CARD = '#videoResults .jvc-card';

type Event = { step: string; value: unknown; at: string };

async function snapshot(page, step: string, events: Event[], testInfo: any) {
  const value = await page.evaluate((step) => ({
    step,
    url: location.href,
    state: document.querySelector('#mediaState')?.textContent || '',
    query: (document.querySelector('#videoQuery') as HTMLInputElement | null)?.value || '',
    cards: Array.from(document.querySelectorAll('#videoResults .jvc-card')).map((el) => ({
      id: el.getAttribute('data-jvc-id'),
      title: el.querySelector('strong')?.textContent || '',
      channel: el.querySelector('small')?.textContent || '',
    })),
    player: document.querySelector('#jarvisPlayer iframe')?.getAttribute('src') || '',
    bodyText: document.querySelector('#videoResults')?.textContent?.trim().slice(0, 1000) || '',
  }), step);
  events.push({ step, value, at: new Date().toISOString() });
  await testInfo.attach(`watchdog-${events.length}-${step}.json`, {
    body: JSON.stringify(value, null, 2),
    contentType: 'application/json',
  });
}

async function openMedia(page) {
  await page.goto(`${LIVE_URL}?watchdog=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('button.nav[data-app="media"]')).toBeVisible({ timeout: 30_000 });
  await page.locator('button.nav[data-app="media"]').click();
  await expect(page.locator('#videoQuery')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#videoResults')).toBeVisible();
  await expect(page.locator('#jarvisPlayer')).toBeVisible();
}

test.describe('JARVIS temporary production media watchdog', () => {
  test.setTimeout(90_000);
  test('captures every media transaction stage and fails with evidence', async ({ page }, testInfo) => {
    const events: Event[] = [];
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning') consoleErrors.push(m.text());
    });
    page.on('pageerror', (e) => pageErrors.push(e.message));
    page.on('requestfailed', (r) => failedRequests.push(`${r.method()} ${r.url()} :: ${r.failure()?.errorText || 'unknown'}`));

    await openMedia(page);
    await snapshot(page, '01-media-mounted', events, testInfo);
    await page.screenshot({ path: testInfo.outputPath('01-media-mounted.png'), fullPage: true });

    const input = page.locator('#videoQuery');
    await input.fill(QUERY);
    await snapshot(page, '02-query-populated', events, testInfo);
    await page.screenshot({ path: testInfo.outputPath('02-query-populated.png'), fullPage: true });

    await page.locator('#videoSearch').click();
    await snapshot(page, '03-search-clicked', events, testInfo);

    await expect(page.locator(CARD).first()).toBeVisible({ timeout: 45_000 });
    await snapshot(page, '04-results-populated', events, testInfo);
    await page.screenshot({ path: testInfo.outputPath('04-results-populated.png'), fullPage: true });

    const first = page.locator(CARD).first();
    const videoId = await first.getAttribute('data-jvc-id');
    expect(videoId, 'first result must contain a real YouTube video id').toMatch(/^[A-Za-z0-9_-]{6,}$/);
    const title = await first.locator('strong').textContent();
    expect(title || '').not.toMatch(/fixture|fallback|demo|fake/i);

    await first.click();
    await snapshot(page, '05-result-selected', events, testInfo);
    await expect(page.locator('#jarvisPlayer iframe')).toBeVisible({ timeout: 20_000 });
    const playerSrc = await page.locator('#jarvisPlayer iframe').getAttribute('src');
    expect(playerSrc || '').toContain(`youtube-nocookie.com/embed/${videoId}`);
    await snapshot(page, '06-player-mounted', events, testInfo);
    await page.screenshot({ path: testInfo.outputPath('06-player-mounted.png'), fullPage: true });

    await input.fill(DIRECT_URL);
    await snapshot(page, '07-direct-url-populated', events, testInfo);
    await page.locator('#videoSearch').click();
    await snapshot(page, '08-direct-url-submitted', events, testInfo);
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/JbgYndCSv3k/);
    await snapshot(page, '09-direct-url-player', events, testInfo);

    await testInfo.attach('WATCHDOG-TRANSACTION-TRACE.json', {
      body: JSON.stringify({
        liveUrl: LIVE_URL,
        query: QUERY,
        events,
        consoleErrors,
        pageErrors,
        failedRequests,
      }, null, 2),
      contentType: 'application/json',
    });

    expect(pageErrors, 'page errors during media transaction').toEqual([]);
    expect(consoleErrors.filter((x) => !/favicon|ResizeObserver/i.test(x)), 'console errors during media transaction').toEqual([]);
  });
});
