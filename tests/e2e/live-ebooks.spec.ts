import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;

test('deployed Gutenberg ebook reader searches, renders, and navigates', async ({ page }) => {
  await page.goto(LIVE_URL || '/', { waitUntil: 'domcontentloaded' });
  await page.locator('.nav[data-app="files"]').click();
  await expect(page.locator('.workspace h1')).toHaveText('Files');
  await expect(page.locator('#jarvisFilesV4 .jf4-opt[data-tab="ebooks"]')).toBeVisible({ timeout: 10_000 });
  await page.locator('#jarvisFilesV4 .jf4-opt[data-tab="ebooks"]').click();
  await expect(page.locator('#jbe6Panel')).toBeVisible({ timeout: 10_000 });

  const query = page.locator('#jbe6Query');
  await query.fill('Beowulf');
  await page.locator('#jbe6Search').click();
  await expect(page.locator('#jbe6Results')).toContainText(/Beowulf/i, { timeout: 15_000 });

  const read = page.locator('[data-rel-read], [data-final-read], [data-read], [data-native-read]').first();
  await expect(read).toBeVisible();
  await read.click();

  await expect(page.locator('.jbe8')).toBeVisible({ timeout: 3_000 });
  await expect(page.locator('#jbe8Title')).toContainText(/Beowulf/i, { timeout: 5_000 });
  await expect(page.locator('#jbe8Page')).toBeVisible({ timeout: 25_000 });
  await expect(page.locator('#jbe8Page')).not.toBeEmpty({ timeout: 25_000 });
  await expect(page.locator('#jbe8Page')).toContainText(/Beowulf|Hw[aæ]t|Scyld/i, { timeout: 25_000 });
  await expect(page.locator('#jbe8Counter')).toMatchText(/1 \/ \d+/);

  const jump = page.locator('#jbe8Jump');
  await jump.fill('2');
  await page.locator('#jbe8Go').click();
  await expect(page.locator('#jbe8Counter')).toHaveText(/2 \/ \d+/);
  await expect(page.locator('#jbe8Page')).not.toBeEmpty();

  await page.locator('#jbe8Next').click();
  await expect(page.locator('#jbe8Counter')).toHaveText(/3 \/ \d+/);
});
