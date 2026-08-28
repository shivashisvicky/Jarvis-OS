import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;
const READER = '.jarvis-ebook-reader';
const reader = (page: any) => page.locator(READER);

test('deployed Gutenberg ebook reader searches, renders, navigates, and survives Command re-entry', async ({ page }) => {
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
  await expect(read).toHaveAttribute('data-title', /Beowulf/i);
  await read.click();

  await expect(reader(page)).toBeVisible({ timeout: 5_000 });
  await expect(reader(page).locator('.jbe11-title')).toContainText(/Beowulf/i, { timeout: 5_000 });
  await expect(reader(page).locator('#jbe11Page')).toBeVisible({ timeout: 25_000 });
  await expect(reader(page).locator('#jbe11Page')).not.toBeEmpty({ timeout: 25_000 });
  await expect(reader(page).locator('#jbe11Page')).toContainText(/Beowulf|Hw[aæ]t|Scyld/i, { timeout: 25_000 });
  await expect(reader(page).locator('#jbe11Counter')).toHaveText(/1 \/ \d+/);

  await reader(page).locator('#jbe11Jump').fill('2');
  await reader(page).locator('#jbe11Go').click();
  await expect(reader(page).locator('#jbe11Counter')).toHaveText(/2 \/ \d+/);
  await expect(reader(page).locator('#jbe11Page')).not.toBeEmpty();

  await reader(page).locator('#jbe11Next').click();
  await expect(reader(page).locator('#jbe11Counter')).toHaveText(/3 \/ \d+/);

  await reader(page).locator('#jbe11Close').click();
  await page.locator('.nav[data-app="home"]').click();
  await expect(page.locator('.workspace h1')).toHaveText(/Command/i);
  await page.locator('#commandInput').fill('read the first one');
  await page.locator('#commandForm').press('Enter');
  await expect(reader(page)).toBeVisible({ timeout: 7_000 });
  await expect(reader(page).locator('.jbe11-title')).toContainText(/Beowulf/i, { timeout: 5_000 });
  await reader(page).locator('#jbe11Close').click();
});
