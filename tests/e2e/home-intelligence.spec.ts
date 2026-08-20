import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;
const APP_URL = LIVE_URL || '/';

async function openHome(page) {
  await page.goto(LIVE_URL ? new URL(LIVE_URL).toString() : APP_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.nav[data-app="home"]')).toBeVisible({ timeout: 30_000 });
  await page.locator('.nav[data-app="home"]').click();
}

test('home command surface supports local time and core identity queries', async ({ page }) => {
  await openHome(page);
  const input = page.locator('#commandInput');
  await expect(input).toBeVisible();
  await expect(page.locator('#voiceBtn')).toBeVisible();

  await input.fill('what time is it');
  await page.locator('#commandForm').press('Enter');
  await expect(page.locator('#jarvisReply')).toContainText(/local time/i);

  await input.fill('what is my name');
  await page.locator('#commandForm').press('Enter');
  await expect(page.locator('#jarvisReply')).toContainText(/Shivashis/i);
});

test('current Vite application owns the voice surface', async ({ page }) => {
  await openHome(page);
  await expect(page.locator('#voiceBtn')).toBeVisible();
  await expect(page.locator('#commandForm')).toBeVisible();
  await expect(page.locator('.brand')).toContainText('J.A.R.V.I.S');
  await expect(page.locator('script[src*="jarvis-voice-bridge.js"]')).toHaveCount(0);
  await expect(page.locator('script[src*="jarvis-performance.js"]')).toHaveCount(0);
});
