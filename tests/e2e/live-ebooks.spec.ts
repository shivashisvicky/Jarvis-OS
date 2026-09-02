import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;

async function assertReaderLoaded(page: any) {
  await expect(page.locator('.jbe14')).toBeVisible({ timeout: 5_000 });
  await expect(page.locator('#jbe14Paper')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#jbe14Paper')).not.toContainText('JARVIS could not open this item.', { timeout: 30_000 });
  await expect(page.locator('#jbe14Paper')).not.toBeEmpty({ timeout: 30_000 });
  await expect(page.locator('#jbe14Count')).toHaveText(/1 \/ \d+/, { timeout: 30_000 });
}

test('bare text command "Beowulf" opens Gutenberg and returns the required ebook result list', async ({ page }) => {
  await page.goto(LIVE_URL || '/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#app')).toBeVisible({ timeout: 15_000 });
  await expect.poll(async () => page.evaluate(() => document.readyState)).toBe('complete', { timeout: 15_000 });
  const input = page.locator('#commandInput');
  await expect(input).toBeVisible({ timeout: 15_000 });
  await input.fill('Beowulf');
  await input.press('Enter');
  await expect(page.locator('.nav[data-app="files"]')).toHaveClass(/selected/, { timeout: 15_000 });
  await expect(page.locator('#jbe6Panel')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#jbe6Query')).toHaveValue('Beowulf', { timeout: 10_000 });
  const results = page.locator('#jbe6Results .jbe6-book');
  await expect(results.first()).toBeVisible({ timeout: 25_000 });
  await expect(results).not.toHaveCount(0);
  await expect(results.first().locator('.jbe6-name')).toContainText(/Beowulf/i);
  await expect(page.locator('#jbe6Results')).toContainText(/Beowulf/i);
  await expect(page.locator('#jbe6StatusLine')).toContainText(/GUTENBERG/i);
  const titles = await results.locator('.jbe6-name').allTextContents();
  expect(new Set(titles.map(t => t.replace(/^\d+\.\s*/, '').trim().toLowerCase())).size).toBe(titles.length);
});

test('Beowulf first result opens readable text and preserves chapter navigation', async ({ page }) => {
  await page.goto(LIVE_URL || '/', { waitUntil: 'domcontentloaded' });
  await page.locator('.nav[data-app="files"]').click();
  await expect(page.locator('.workspace h1')).toHaveText('Files');
  await page.locator('#jarvisFilesV4 .jf4-opt[data-tab="ebooks"]').click();
  await expect(page.locator('#jbe6Panel')).toBeVisible({ timeout: 10_000 });
  await page.locator('#jbe6Query').fill('Beowulf');
  await page.locator('#jbe6Search').click();
  await expect(page.locator('#jbe6Results .jbe6-book').first()).toBeVisible({ timeout: 25_000 });
  await expect(page.locator('#jbe6Results .jbe6-book').first().locator('.jbe6-name')).toContainText(/Beowulf/i);
  await page.locator('#jbe6Results .jbe6-book').first().locator('[data-read]').click();
  await assertReaderLoaded(page);
  await page.locator('#jbe14Chapters').click();
  await expect.poll(async () => page.locator('#jbe14ChaptersList .jbe14-chapter').count(), { timeout: 10_000 }).toBeGreaterThan(1);
  await page.locator('#jbe14Next').click();
  await expect(page.locator('#jbe14Count')).toHaveText(/2 \/ \d+/);
});

test('canonical Gutenberg reader opens a different real book and paginates', async ({ page }) => {
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
  const read = page.locator('[data-read]').first();
  await expect(read).toBeVisible();
  await expect(read).toHaveAttribute('data-title', /Frankenstein/i);
  await read.click();
  await assertReaderLoaded(page);
  await page.locator('#jbe14Chapters').click();
  expect(await page.locator('#jbe14ChaptersList .jbe14-chapter').count()).toBeGreaterThan(1);
  await page.locator('#jbe14Next').click();
  await expect(page.locator('#jbe14Count')).toHaveText(/2 \/ \d+/);
});

test('John Henry Newman resolves as a Gutenberg author and can open a book', async ({ page }) => {
  await page.goto(LIVE_URL || '/', { waitUntil: 'domcontentloaded' });
  const input = page.locator('#commandInput');
  await expect(input).toBeVisible({ timeout: 10_000 });
  await input.fill('John Henry Newman');
  await input.press('Enter');
  await expect.poll(async () => page.evaluate(() => (window as any).__JARVIS_ENTITY__?.type || ''), { timeout: 20_000 }).toMatch(/^(BOOK_AUTHOR|PERSON)$/);
  await expect(page.locator('.nav[data-app="files"]')).toHaveClass(/selected/, { timeout: 15_000 });
  await expect(page.locator('#jbe6Panel')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#jbe6Results .jbe6-book').first()).toBeVisible({ timeout: 25_000 });
  await expect(page.locator('#jbe6Results')).toContainText(/Newman/i);
  await page.locator('#jbe6Results .jbe6-book').first().locator('[data-read]').click();
  await assertReaderLoaded(page);
});

test('author names never fall through to generic web search', async ({ page }) => {
  await page.goto(LIVE_URL || '/', { waitUntil: 'domcontentloaded' });
  const input = page.locator('#commandInput');
  await expect(input).toBeVisible({ timeout: 10_000 });
  await input.fill('Charles Dickens');
  await input.press('Enter');
  await expect.poll(async () => page.evaluate(() => (window as any).__JARVIS_ENTITY__?.type || ''), { timeout: 20_000 }).toMatch(/^(PERSON|BOOK_AUTHOR)$/);
  await expect(page.locator('.nav[data-app="web"]')).not.toHaveClass(/selected/);
});
