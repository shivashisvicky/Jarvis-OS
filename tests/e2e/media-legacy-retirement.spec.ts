import { expect, test } from '@playwright/test';

test('media center never mounts the retired browser video index', async ({ page }) => {
  await page.goto('/');
  await page.locator('button.nav[data-app="media"]').click();
  await expect(page.locator('#videoQuery')).toBeVisible();
  await expect(page.locator('#videoResults')).toBeVisible();

  // The retired setupMedia() runtime used to auto-load four trending fixtures.
  // The unified authority must leave the result area clean until a real search
  // is submitted to the local media service.
  await page.waitForTimeout(750);
  await expect(page.locator('#videoResults .video-result, #videoResults .jyt-card')).toHaveCount(0);
  await expect(page.locator('#videoResults')).not.toContainText(/SAP CPI fixture tutorial|Nyan Cat|NASA Live|India 2026/i);
});
