import { expect, test } from '@playwright/test';

const CARD = '#videoResults .jvc-card';
const APP_URL = process.env.JARVIS_LIVE_URL || '/';

async function openApp(page) {
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('button.nav[data-app="media"]')).toBeVisible({ timeout: 30_000 });
  await page.locator('button.nav[data-app="media"]').click();
}

test('media search has no fixed video catalogue', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('#videoQuery')).toBeVisible();
  await expect(page.locator('#videoResults')).toBeVisible();
  await expect(page.locator(CARD)).toHaveCount(0);
  await expect(page.locator('#videoResults')).not.toContainText(/SAP CPI fixture tutorial|Nyan Cat|NASA Live|India 2026/i);
});

test('DEPLOYED GATE: cats returns real YouTube results and opens the official player', async ({ page }) => {
  test.skip(!process.env.JARVIS_LIVE_URL, 'Production-only live gate');
  test.setTimeout(60_000);

  await openApp(page);
  await expect(page.locator('#videoQuery')).toBeVisible();
  await expect(page.locator('#videoResults')).toBeVisible();
  await expect(page.locator(CARD)).toHaveCount(0);

  await page.locator('#videoQuery').fill('cats');
  await page.locator('#videoSearch').click();

  await expect(page.locator(CARD).first()).toBeVisible({ timeout: 45_000 });
  const first = page.locator(CARD).first();
  await expect(first).toHaveAttribute('data-jvc-id', /^[A-Za-z0-9_-]{6,}$/);
  await expect(first.locator('strong')).not.toHaveText(/fixture|fallback|demo|fake/i);

  const videoId = await first.getAttribute('data-jvc-id');
  await first.click();
  await expect(page.locator('#jarvisPlayer iframe')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', new RegExp(`youtube-nocookie\\.com/embed/${videoId}`));
});
