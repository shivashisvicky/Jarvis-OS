import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;
const APP_URL = LIVE_URL || '/';

async function openHome(page) {
  await page.goto(LIVE_URL ? new URL(LIVE_URL).toString() : APP_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.nav[data-app="home"]')).toBeVisible({ timeout: 30_000 });
  await page.locator('.nav[data-app="home"]').click();
}

async function waitForMapResults(page) {
  await expect.poll(async () => page.locator('#mapResults [data-jarvis-map-v25]').count(), { timeout: 30_000 }).toBeGreaterThan(0);
  await expect(page.locator('#mapFrame')).toBeVisible();
}

test('MAPS context survives returning home and owns which-one nearest follow-up', async ({ page }) => {
  await openHome(page);
  const command = page.locator('#commandInput');
  await command.fill('show me restaurants in Jagannath Nagar');
  await page.locator('#commandForm').press('Enter');
  await expect(page.locator('.page-head h1')).toHaveText('Maps');
  await waitForMapResults(page);

  const firstName = (await page.locator('#mapResults [data-jarvis-map-v25]').first().locator('strong').innerText()).replace(/^\d+\.\s*/, '').trim();

  await page.locator('.nav[data-app="home"]').click();
  await expect(page.locator('#commandInput')).toBeVisible();
  await page.locator('#commandInput').fill('Which one is the nearest one');
  await page.locator('#commandForm').press('Enter');

  await expect(page.locator('#jarvisReply')).toContainText(/nearest option/i, { timeout: 8_000 });
  await expect(page.locator('#jarvisReply')).toContainText(firstName);
  await expect(page.locator('#jarvisReply')).not.toContainText(/Beowulf|current location|more context/i);
});
