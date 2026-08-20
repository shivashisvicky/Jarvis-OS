import { expect, test } from '@playwright/test';

test('home command surface supports local time and India PM queries', async ({ page }) => {
  await page.goto('/');
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
  await page.goto('/');
  await expect(page.locator('script[src*="jarvis-voice-bridge.js"]')).toHaveCount(1);
  expect(await page.evaluate(() => typeof (window as any).jarvisCinematicSpeak)).toBe('function');
});
