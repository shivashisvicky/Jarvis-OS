import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;

test('Files workspace supports import, search, preview and delete', async ({ page }) => {
  await page.goto(LIVE_URL || '/', { waitUntil: 'domcontentloaded' });
  await page.locator('.nav[data-app="files"]').click();
  await expect(page.locator('.workspace h1')).toHaveText('Files');
  await expect(page.locator('#filesImport')).toBeVisible();
  await expect(page.locator('#filesSearch')).toBeVisible();
  await expect(page.locator('#filesDrop')).toBeVisible();

  const fileInput = page.locator('#filesInput');
  await fileInput.setInputFiles({ name: 'jarvis-test.txt', mimeType: 'text/plain', buffer: Buffer.from('JARVIS local file test') });
  await expect(page.locator('.file-row')).toHaveCount(1);
  await expect(page.locator('.file-name')).toHaveText('jarvis-test.txt');

  await page.locator('[data-preview]').click();
  await expect(page.locator('.files-text-preview')).toContainText('JARVIS local file test');
  await page.locator('.files-preview-close').click();

  await page.locator('#filesSearch').fill('jarvis-test');
  await expect(page.locator('.file-row')).toHaveCount(1);
  await page.locator('[data-delete]').click();
  await expect(page.locator('.file-row')).toHaveCount(0);
});
