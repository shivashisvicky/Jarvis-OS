import { expect, test } from '@playwright/test';

const CARD = '#videoResults .jvc-card';
const LIVE_URL = process.env.JARVIS_LIVE_URL;
const APP_URL = LIVE_URL || '/';

async function openApp(page) {
  const target = LIVE_URL ? new URL(LIVE_URL).toString() : APP_URL;
  await page.goto(target, { waitUntil: 'domcontentloaded' });
  if (LIVE_URL) {
    const expected = new URL(LIVE_URL);
    const actual = new URL(page.url());
    expect(actual.origin).toBe(expected.origin);
    expect(actual.pathname).toBe(expected.pathname);
  }
  await expect(page.locator('button.nav[data-app="media"]')).toBeVisible({ timeout: 30_000 });
  await page.locator('button.nav[data-app="media"]').click();
}

async function dumpMediaTransaction(page, label) {
  const state = await page.locator('#mediaState').textContent().catch(() => null);
  const query = await page.locator('#videoQuery').inputValue().catch(() => null);
  const resultsText = await page.locator('#videoResults').innerText().catch(() => '');
  const cards = await page.locator(CARD).count().catch(() => -1);
  const player = await page.locator('#jarvisPlayer iframe').getAttribute('src').catch(() => null);
  const trace = await page.evaluate(() => (window as any).__JARVIS_MEDIA_TRACE__ || []).catch(() => []);
  console.log(JSON.stringify({ label, query, state, cards, resultsText, player, trace }, null, 2));
}

test('media search has no fixed video catalogue', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('#videoQuery')).toBeVisible();
  await expect(page.locator('#videoResults')).toBeVisible();
  await expect(page.locator(CARD)).toHaveCount(0);
  await expect(page.locator('#videoResults')).not.toContainText(/SAP CPI fixture tutorial|Nyan Cat|NASA Live|India 2026/i);
});

test('DEPLOYED GATE: common and multi-word searches return real YouTube results', async ({ page }) => {
  test.skip(!LIVE_URL, 'Production-only live gate');
  test.setTimeout(120_000);
  await openApp(page);
  await expect(page.locator('#videoQuery')).toBeVisible();
  await expect(page.locator('#videoResults')).toBeVisible();

  for (const query of ['cats', 'ironman']) {
    await page.locator('#videoQuery').fill(query);
    await page.locator('#videoSearch').click();
    try {
      await expect(page.locator(CARD).first()).toBeVisible({ timeout: 45_000 });
    } catch (error) {
      await dumpMediaTransaction(page, `${query.toUpperCase()}_RESULTS_TIMEOUT`);
      throw error;
    }

    const cards = page.locator(CARD);
    const count = await cards.count();
    expect(count, `${query} should return multiple live results`).toBeGreaterThanOrEqual(4);
    const ids = await cards.evaluateAll(nodes => nodes.map(node => node.getAttribute('data-jvc-id')).filter(Boolean));
    expect(new Set(ids).size, `${query} should return distinct video IDs`).toBeGreaterThanOrEqual(4);
    await expect(page.locator('#videoResults')).not.toContainText(/fixture|fallback|fake|canned/i);

    const first = cards.first();
    await expect(first).toHaveAttribute('data-jvc-id', /^[A-Za-z0-9_-]{11}$/);
    const videoId = await first.getAttribute('data-jvc-id');
    await first.click();
    try {
      await expect(page.locator('#jarvisPlayer iframe')).toBeVisible({ timeout: 20_000 });
      await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', new RegExp(`youtube-nocookie\\.com/embed/${videoId}`));
    } catch (error) {
      await dumpMediaTransaction(page, `${query.toUpperCase()}_PLAYER_TIMEOUT`);
      throw error;
    }
  }
});
