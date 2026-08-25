import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;
const APP_URL = LIVE_URL || '/';

async function openHome(page) {
  await page.goto(LIVE_URL ? new URL(LIVE_URL).toString() : APP_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.nav[data-app="home"]')).toBeVisible({ timeout: 30_000 });
  await page.locator('.nav[data-app="home"]').click();
}

async function submit(page, text) {
  const input = page.locator('#commandInput');
  await input.fill(text);
  await page.locator('#commandForm').press('Enter');
}

test('context reference authority resolves book result references after returning home', async ({ page }) => {
  await openHome(page);
  await submit(page, 'find Beowulf');
  await expect(page.locator('.page-head h1')).toHaveText(/Files|Ebooks/i, { timeout: 15_000 });
  await expect.poll(async () => page.locator('#jbe6Results .jbe6-book').count(), { timeout: 30_000 }).toBeGreaterThan(0);
  const firstTitle = (await page.locator('#jbe6Results .jbe6-book').first().locator('.jbe6-name').innerText()).trim();
  await page.locator('.nav[data-app="home"]').click();
  await submit(page, 'open the first one');
  await expect(page.locator('#jarvisReply')).not.toContainText(/Search Hub|current location|more context/i);
  await expect(page.locator('#jbe6Panel')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#jbe6Results')).toContainText(firstTitle);
});

test('context reference authority accepts second and numbered book references', async ({ page }) => {
  await openHome(page);
  await submit(page, 'find Beowulf');
  await expect.poll(async () => page.locator('#jbe6Results .jbe6-book').count(), { timeout: 30_000 }).toBeGreaterThan(1);
  await page.locator('.nav[data-app="home"]').click();
  await submit(page, 'open the second one');
  await expect(page.locator('#jarvisReply')).not.toContainText(/Search Hub|current location|more context/i);
});
