import { expect, test } from '@playwright/test';

test('production media UI never fabricates browser-side video results', async ({ page }) => {
  const baseURL = process.env.JARVIS_LIVE_URL;
  if (!baseURL) throw new Error('JARVIS_LIVE_URL is required');

  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await page.locator('button.nav[data-app="media"]').click();
  await expect(page.locator('#videoQuery')).toBeVisible();
  await expect(page.locator('#videoSearch')).toBeVisible();

  await page.locator('#videoQuery').fill('cats');
  await page.locator('#videoSearch').click();

  // GitHub Pages has no access to a developer's local yt-dlp/VLC service.
  // The production contract is therefore an honest degraded state, never
  // fabricated PeerTube/YouTube cards or a fake iframe.
  const degraded = page.locator('.media-degraded-state');
  await expect(degraded).toBeVisible({ timeout: 15000 });
  await expect(degraded).toContainText('LOCAL MEDIA SERVICE UNAVAILABLE');
  await expect(degraded).toContainText('NETWORK DIAGNOSTIC');
  await expect(page.locator('.jyt-card.video-result')).toHaveCount(0);
  await expect(page.locator('#jarvisPlayer iframe')).toHaveCount(0);
});
