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
  expect(await results.count()).toBeGreaterThan(1);
  await expect(page.locator('#jbe6Results')).toContainText(SIXTH_TITLE);

  // The ordinal target is identified from the current Books result context.
  // We inspect the sixth result but never click it, so the test does not
  // create a second path around the command/ordinal authority.
  const sixthResult = results.nth(5);
  await expect(sixthResult).toBeVisible({ timeout: 15_000 });
  await expect(sixthResult).toContainText(SIXTH_TITLE);
  await expect(sixthResult).toHaveAttribute('data-book-id', SIXTH_ID);

  // The final observable contract is the actual JARVIS Reader, not merely
  // a matching result card or a successful route/page load.
  const reader = page.locator('.jbe11');
  await expect(reader).toBeVisible({ timeout: 20_000 });
  await expect(reader.locator('.jbe11-title')).toHaveText(SIXTH_TITLE, { timeout: 15_000 });
  await expect(reader.locator('#jbe11Counter')).toHaveText(/1 \/ \d+/, { timeout: 30_000 });
  await expect(reader.locator('#jbe11Page')).not.toBeEmpty({ timeout: 30_000 });

  // Use the Reader's visible "OPEN GUTENBERG" action as the stable proof of
  // the Reader's resolved Gutenberg ID. This replaces the previous brittle
  // assumption that opening a resolved book must fetch /books/:id metadata.
  const popupPromise = page.waitForEvent('popup');
  await reader.getByRole('button', { name: 'OPEN GUTENBERG' }).click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(new RegExp(`/ebooks/${SIXTH_ID}(?:[/?#]|$)`));
  await popup.close();
});
