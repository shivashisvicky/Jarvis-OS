import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;

test('deployed Gutenberg authority resolves a different book and opens a structured reader', async ({ page }) => {
  await page.goto(LIVE_URL || '/', { waitUntil: 'domcontentloaded' });
  await page.locator('.nav[data-app="files"]').click();
  await expect(page.locator('.workspace h1')).toHaveText('Files');
  await expect(page.locator('#jarvisFilesV4 .jf4-opt[data-tab="ebooks"]')).toBeVisible({ timeout: 10_000 });
  await page.locator('#jarvisFilesV4 .jf4-opt[data-tab="ebooks"]').click();
  await expect(page.locator('#jbe6Panel')).toBeVisible({ timeout: 10_000 });

  const query = page.locator('#jbe6Query');
  await query.fill('Frankenstein');
  await page.locator('#jbe6Search').click();
  await expect(page.locator('#jbe6Results')).toContainText(/Frankenstein/i, { timeout: 20_000 });
  await expect(page.locator('#jbe6Results .jbe6-book').first()).toContainText(/Frankenstein/i);

  const read = page.locator('[data-rel-read], [data-final-read], [data-read], [data-native-read]').first();
  await expect(read).toBeVisible();
  await read.click();

  await expect(page.locator('.jber')).toBeVisible({ timeout: 3_000 });
  await expect(page.locator('#jberPage')).toBeVisible({ timeout: 25_000 });
  await expect(page.locator('#jberPage')).not.toBeEmpty({ timeout: 25_000 });
  await expect(page.locator('#jberCounter')).toHaveText(/1 \/ \d+/);
  await expect(page.locator('#jberPage')).not.toContainText(/^CONTENTS\.?$/i);

  const sectionCount = await page.locator('#jberSection option').count();
  expect(sectionCount).toBeGreaterThan(1);

  const jump = page.locator('#jberJump');
  await jump.fill('2');
  await page.locator('#jberGo').click();
  await expect(page.locator('#jberCounter')).toHaveText(/2 \/ \d+/);
  await page.locator('#jberNext').click();
  await expect(page.locator('#jberCounter')).toHaveText(/3 \/ \d+/);
});

test('bare author names resolve as entities instead of falling into web search', async ({ page }) => {
  await page.goto(LIVE_URL || '/', { waitUntil: 'domcontentloaded' });
  const input = page.locator('#commandInput');
  await expect(input).toBeVisible({ timeout: 10_000 });
  await input.fill('Charles Dickens');
  await input.press('Enter');

  await expect.poll(async () => page.evaluate(() => window.__JARVIS_ENTITY__?.type || '')).toBe('PERSON', { timeout: 20_000 });
  await expect.poll(async () => page.evaluate(() => window.__JARVIS_ENTITY__?.name || '')).toBe('Charles Dickens', { timeout: 20_000 });
  await expect(page.locator('.nav[data-app="web"]')).not.toHaveClass(/selected/);
});
