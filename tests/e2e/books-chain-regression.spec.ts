import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL || '/';

const SIXTH_TITLE = 'History of English Literature from "Beowulf" to Swinburne';
const SIXTH_ID = '56613';

async function submitCommand(page: any, command: string) {
  const input = page.locator('#commandInput');
  await expect(input).toBeVisible({ timeout: 15_000 });
  await input.fill(command);
  await input.press('Enter');
}

test('Books regression: "Beowulf and open the 6th one" resolves the current Books context', async ({ page }) => {
  await page.goto(LIVE_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#app')).toBeVisible({ timeout: 15_000 });

  // The exact user command is the contract. The first clause must establish
  // a broad Books result set before the ordinal follow-up is resolved.
  await submitCommand(page, 'Beowulf and open the 6th one');

  const results = page.locator('#jbe6Results .jbe6-book');
  await expect(page.locator('#jbe6Panel')).toBeVisible({ timeout: 15_000 });
  await expect(results.first()).toBeVisible({ timeout: 30_000 });
  await expect(results).toHaveCount(6, { timeout: 30_000 });
  await expect(page.locator('#jbe6Results')).toContainText(SIXTH_TITLE);

  // The ordinal target is identified from the Books result context itself.
  // This is deliberately read-only: the test never clicks the sixth card.
  await expect(results.nth(5)).toContainText(SIXTH_TITLE);
  await expect(results.nth(5)).toHaveAttribute('data-book-id', SIXTH_ID);

  // The final observable contract is the actual JARVIS Reader, not merely
  // a matching result card or a successful route/page load.
  await expect(page.locator('.jbe14')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.jbe14-title')).toHaveText(SIXTH_TITLE, { timeout: 15_000 });
  await expect(page.locator('#jbe14Count')).toHaveText(/1 \/ \d+/, { timeout: 30_000 });
  await expect(page.locator('#jbe14Paper')).not.toBeEmpty({ timeout: 30_000 });
});
