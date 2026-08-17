import { expect, test } from '@playwright/test';

async function expectResultsAbovePlayer(page: import('@playwright/test').Page) {
  const results = page.locator('#videoResults');
  const player = page.locator('#jarvisPlayer');
  await expect(results).toBeVisible({ timeout: 5000 });
  await expect(player).toBeVisible({ timeout: 5000 });

  const positions = await page.evaluate(() => {
    const results = document.querySelector('#videoResults')?.getBoundingClientRect();
    const player = document.querySelector('#jarvisPlayer')?.getBoundingClientRect();
    return results && player ? { resultsTop: results.top, playerTop: player.top } : null;
  });
  expect(positions).not.toBeNull();
  expect(positions!.resultsTop).toBeLessThan(positions!.playerTop);
}

test.describe('JARVIS media presentation flow', () => {
  test('video results render above the player on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await expect(page.getByRole('heading', { name: 'Media Center', exact: true })).toBeVisible();
    await expectResultsAbovePlayer(page);
  });

  test('results and player remain a single in-house media flow on desktop', async ({ page }) => {
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await expect(page.getByRole('heading', { name: 'Media Center', exact: true })).toBeVisible();
    await expectResultsAbovePlayer(page);
    expect(page.context().pages()).toHaveLength(1);
  });
});
