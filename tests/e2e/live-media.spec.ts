import { expect, test } from '@playwright/test';

const CARD = '#videoResults .jvc-card';

test('media search starts empty and renders only returned live results', async ({ page }) => {
  await page.route('https://peertube.cpy.re/api/v1/search/videos**', async route => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get('search');
    expect(query).toBe('cats');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          { uuid: 'live-test-1', name: 'Live Cats Result', duration: 91, videoChannel: { displayName: 'Live Channel' }, thumbnailPath: '' },
          { uuid: 'live-test-2', name: 'Second Live Result', duration: 42, videoChannel: { displayName: 'Second Channel' }, thumbnailPath: '' }
        ]
      })
    });
  });

  await page.goto('/');
  await page.locator('button.nav[data-app="media"]').click();
  await expect(page.locator('#videoQuery')).toBeVisible();
  await expect(page.locator('#videoResults')).toBeVisible();

  await expect(page.locator(CARD)).toHaveCount(0);
  await expect(page.locator('#videoResults')).not.toContainText(/SAP CPI fixture tutorial|Nyan Cat|NASA Live|India 2026/i);

  await page.locator('#videoQuery').fill('cats');
  await page.locator('#videoSearch').click();

  await expect(page.locator(CARD)).toHaveCount(2);
  await expect(page.locator('#videoResults')).toContainText('Live Cats Result');
  await expect(page.locator('#videoResults')).toContainText('Second Live Result');

  await page.locator(CARD).first().click();
  await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /peertube\.cpy\.re\/videos\/embed\/live-test-1/);
});

// Production finish-line gate. It is intentionally not mocked and runs only
// against the deployed Pages URL. A real "cats" query must produce a real
// result and an in-JARVIS player without a redirect or canned content.
test('DEPLOYED GATE: cats returns a real result and plays inside JARVIS', async ({ page }) => {
  test.skip(!process.env.JARVIS_LIVE_URL, 'Production-only live gate');
  test.setTimeout(60_000);

  await page.goto('/');
  await page.locator('button.nav[data-app="media"]').click();
  await expect(page.locator('#videoQuery')).toBeVisible();
  await expect(page.locator('#videoResults')).toBeVisible();
  await expect(page.locator(CARD)).toHaveCount(0);

  await page.locator('#videoQuery').fill('cats');
  await page.locator('#videoSearch').click();

  await expect(page.locator(CARD).first()).toBeVisible({ timeout: 45_000 });
  const first = page.locator(CARD).first();
  await expect(first).toHaveAttribute('data-jvc-id', /^[A-Za-z0-9_-]{6,}$/);
  await expect(first.locator('strong')).not.toHaveText(/fixture|fallback|demo|fake/i);

  await first.click();
  const iframe = page.locator('#jarvisPlayer iframe');
  const video = page.locator('#jarvisPlayer video');
  await expect(iframe.or(video)).toBeVisible({ timeout: 20_000 });

  expect(page.url()).toMatch(/shivashisvicky\.github\.io\/Jarvis-OS/);
});
