import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;

async function openCommand(page: any, text: string) {
  const input = page.locator('#commandInput');
  await expect(input).toBeVisible({ timeout: 15_000 });
  await input.fill(text);
  await input.press('Enter');
}

async function assertReader(page: any) {
  await expect(page.locator('.jbe24')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#e24pg')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#e24pg')).not.toBeEmpty({ timeout: 30_000 });
  await expect(page.locator('#e24cnt')).toHaveText(/1 \/ \d+/, { timeout: 10_000 });
}

test('John Henry Newman resolves on the first command attempt', async ({ page }) => {
  await page.goto(LIVE_URL || '/', { waitUntil: 'domcontentloaded' });
  await openCommand(page, 'John Henry Newman');
  await expect.poll(async () => page.evaluate(() => (window as any).__JARVIS_ENTITY__?.type || ''), { timeout: 30_000 }).toBe('BOOK_AUTHOR');
  await expect(page.locator('.nav[data-app="files"]')).toHaveClass(/selected/, { timeout: 20_000 });
  await expect(page.locator('#jbe6Results .jbe6-book').first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#jbe6Results')).toContainText(/Newman/i);
});

test('ebook ordinal follow-up opens the exact third visible result without re-searching', async ({ page }) => {
  await page.goto(LIVE_URL || '/', { waitUntil: 'domcontentloaded' });
  await openCommand(page, 'Beowulf');
  await expect(page.locator('#jbe6Results .jbe6-book').nth(2)).toBeVisible({ timeout: 30_000 });
  const thirdTitle = (await page.locator('#jbe6Results .jbe6-book').nth(2).locator('.jbe6-name').innerText()).replace(/^3\.\s*/, '').trim();
  await openCommand(page, 'open the third one');
  await assertReader(page);
  await expect(page.locator('.jbe24-title')).toContainText(thirdTitle.slice(0, 50), { timeout: 10_000 });
});

test('Gutenberg search retries when the first response is irrelevant', async ({ page }) => {
  await page.goto(LIVE_URL || '/', { waitUntil: 'domcontentloaded' });
  await openCommand(page, 'Frankenstein');
  await expect(page.locator('#jbe6Results .jbe6-book').first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#jbe6Results .jbe6-book').first().locator('.jbe6-name')).toContainText(/Frankenstein/i);
});
