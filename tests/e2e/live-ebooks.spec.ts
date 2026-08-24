import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;

test('deployed Gutenberg ebook reader renders the first page immediately and streams the rest', async ({ page }) => {
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

  const read = page.locator('[data-rel-read], [data-final-read], [data-read]').first();
  await expect(read).toBeVisible();
  await read.click();

  await expect(page.locator('.jbe7-reader')).toBeVisible({ timeout: 3_000 });
  await expect(page.locator('#jbe7Title')).toContainText(/Beowulf/i, { timeout: 5_000 });
  await expect(page.locator('#jbe7Page')).toBeVisible({ timeout: 12_000 });
  await expect(page.locator('#jbe7Page')).not.toBeEmpty({ timeout: 12_000 });
  await expect(page.locator('#jbe7Page')).toContainText(/Beowulf|Hw[aæ]t|Scyld/i, { timeout: 12_000 });
  await expect(page.locator('#jbe7Counter')).toContainText(/1 \/|1 \/ …/i);

  await expect(page.locator('#jbe7Next')).toBeEnabled({ timeout: 20_000 });
  await page.locator('#jbe7Next').click();
  await expect(page.locator('#jbe7Page')).not.toBeEmpty();
});
