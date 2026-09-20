import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL || '/';

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
  expect(await results.count()).toBeGreaterThan(5);

  // The ordinal means "the sixth result in the result set that JARVIS
  // actually rendered". Gutenberg ranking/order can legitimately change as
  // the public catalogue changes, so the regression must not hard-code a
  // historical title or ID as the sixth item.
  const sixthResult = results.nth(5);
  await expect(sixthResult).toBeVisible({ timeout: 15_000 });
  const sixthTitle = (await sixthResult.locator('.jbe6-name').innerText()).replace(/^6\.\s*/, '').trim();
  const sixthId = await sixthResult.getAttribute('data-book-id');
  expect(sixthTitle.length).toBeGreaterThan(0);
  expect(sixthId).toBeTruthy();

  // The final observable contract is the actual JARVIS Reader, not merely
  // a matching result card or a successful route/page load.
  const reader = page.locator('.jbe11');
  await expect(reader).toBeVisible({ timeout: 20_000 });
  await expect(reader.locator('.jbe11-title')).toHaveText(sixthTitle, { timeout: 15_000 });
  await expect(reader.locator('#jbe11Counter')).toHaveText(/1 \/ \d+/, { timeout: 30_000 });
  await expect(reader.locator('#jbe11Page')).not.toBeEmpty({ timeout: 30_000 });

  // Use the Reader's visible "OPEN GUTENBERG" action as stable proof that the
  // exact sixth result, not merely a similarly named book, was opened.
  const popupPromise = page.waitForEvent('popup');
  await reader.getByRole('button', { name: 'OPEN GUTENBERG' }).click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(new RegExp(`/ebooks/${sixthId}(?:[/?#]|$)`));
  await popup.close();
});
