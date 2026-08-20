import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;
const APP_URL = LIVE_URL || '/';

async function openHome(page) {
  await page.goto(LIVE_URL ? new URL(LIVE_URL).toString() : APP_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.nav[data-app="home"]')).toBeVisible({ timeout: 30_000 });
  await page.locator('.nav[data-app="home"]').click();
}

test('home command surface supports local time and India PM queries', async ({ page }) => {
  await openHome(page);
  const input = page.locator('#commandInput');
  await expect(input).toBeVisible();

  await input.fill('what time is it');
  await page.locator('#commandForm').press('Enter');
  await expect(page.locator('#jarvisReply')).toContainText(/local time/i);

  await input.fill('who is the prime minister of india');
  await page.locator('#commandForm').press('Enter');
  await expect(page.locator('#jarvisReply')).toContainText(/Narendra Modi/i);
});

test('voice bridge is loaded before the application runtime', async ({ page }) => {
  await openHome(page);
  expect(await page.evaluate(() => typeof (window as any).jarvisCinematicSpeak)).toBe('function');
});
