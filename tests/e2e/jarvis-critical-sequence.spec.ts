import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL || '/';

async function command(page: any, text: string) {
  const input = page.locator('#commandInput');
  await expect(input).toBeVisible({ timeout: 15_000 });
  await input.fill(text);
  await input.press('Enter');
}

async function waitForBookResults(page: any, title: RegExp) {
  await expect(page.locator('#jbe6Panel')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#jbe6Results .jbe6-book').first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#jbe6Results')).toContainText(title);
}

test('critical JARVIS sequence remains stable in one browser session', async ({ page }) => {
  await page.goto(LIVE_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#app')).toBeVisible({ timeout: 15_000 });
  await expect.poll(async () => page.evaluate(() => document.readyState)).toBe('complete', { timeout: 15_000 });
  await page.waitForTimeout(1_000);

  // Beowulf: entity -> Gutenberg list -> context.
  await command(page, 'Beowulf');
  await waitForBookResults(page, /Beowulf/i);
  await expect.poll(async () => page.evaluate(() => (window as any).__JARVIS_ENTITY__?.type || ''), { timeout: 20_000 }).toMatch(/^(BOOK|BOOK_AUTHOR)$/);

  // Read first: must use the existing BOOKS context and open the actual reader.
  await page.locator('#commandInput').fill('read the first one');
  await page.locator('#commandInput').press('Enter');
  await expect(page.locator('.jber')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.jber-title')).toContainText(/Beowulf/i, { timeout: 15_000 });
  await expect(page.locator('#jberPage')).not.toBeEmpty({ timeout: 30_000 });

  // Return home without destroying context, then resolve a different author.
  await page.locator('.brand[data-app="home"]').click();
  await expect(page.locator('#commandInput')).toBeVisible({ timeout: 10_000 });
  await command(page, 'Charles Dickens');
  await expect.poll(async () => page.evaluate(() => (window as any).__JARVIS_ENTITY__?.type || ''), { timeout: 25_000 }).toMatch(/^(PERSON|BOOK_AUTHOR)$/);
  await expect.poll(async () => page.evaluate(() => (window as any).__JARVIS_ENTITY__?.name || ''), { timeout: 25_000 }).toBe('Charles Dickens');
  await expect(page.locator('.nav[data-app="web"]')).not.toHaveClass(/selected/);

  // Author result path should be Gutenberg-owned when ebook evidence exists.
  await waitForBookResults(page, /Dickens|Christmas|Oliver|Great Expectations/i);

  // Contextual read must still resolve after the author search.
  await page.locator('#commandInput').fill('read the first one');
  await page.locator('#commandInput').press('Enter');
  await expect(page.locator('.jber')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#jberPage')).not.toBeEmpty({ timeout: 30_000 });

  // Explicit time must win over stale book/author context.
  await page.locator('.brand[data-app="home"]').click();
  await command(page, 'time now');
  await expect(page.locator('#jarvisReply')).toContainText(/local time is/i, { timeout: 10_000 });
  await expect(page.locator('.nav[data-app="web"]')).not.toHaveClass(/selected/);
  await expect(page.locator('.nav[data-app="files"]')).not.toHaveClass(/selected/);

  // A stale read reference without a current BOOKS context must never hang the command surface.
  await page.locator('#commandInput').fill('read the first one');
  await page.locator('#commandInput').press('Enter');
  await expect(page.locator('#commandInput')).toBeVisible({ timeout: 10_000 });

  // The page must remain a single live document throughout the sequence.
  const pages = page.context().pages();
  expect(pages.length).toBe(1);
  expect(await page.evaluate(() => performance.getEntriesByType('navigation').length)).toBe(1);
});
