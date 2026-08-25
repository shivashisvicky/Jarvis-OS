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

async function submitCommand(page, text) {
  const command = page.locator('#commandInput');
  await command.fill(text);
  await page.locator('#commandForm').press('Enter');
}

test('MAPS context survives returning home and owns natural nearest follow-ups', async ({ page }) => {
  await openHome(page);
  await submitCommand(page, 'show me restaurants in Jagannath Nagar');
  await expect(page.locator('.page-head h1')).toHaveText('Maps');
  await waitForMapResults(page);

  const firstName = (await page.locator('#mapResults [data-jarvis-map-v25]').first().locator('strong').innerText()).replace(/^\d+\.\s*/, '').trim();

  await page.locator('.nav[data-app="home"]').click();
  await expect(page.locator('#commandInput')).toBeVisible();

  for (const phrase of ['Which one is the nearest one', 'Which is the nearest one', 'The nearest restaurant']) {
    await submitCommand(page, phrase);
    await expect(page.locator('#jarvisReply')).toContainText(/nearest option/i, { timeout: 8_000 });
    await expect(page.locator('#jarvisReply')).toContainText(firstName);
    await expect(page.locator('#jarvisReply')).not.toContainText(/Beowulf|current location|more context/i);
  }
});

test('MAPS selected restaurant resolves contextual take-me-there', async ({ page }) => {
  await openHome(page);
  await submitCommand(page, 'show me restaurants in Jagannath Nagar');
  await expect(page.locator('.page-head h1')).toHaveText('Maps');
  await waitForMapResults(page);

  const firstName = (await page.locator('#mapResults [data-jarvis-map-v25]').first().locator('strong').innerText()).replace(/^\d+\.\s*/, '').trim();
  await submitCommand(page, 'Which one is the nearest one');
  await expect(page.locator('#jarvisReply')).toContainText(firstName, { timeout: 8_000 });

  await submitCommand(page, 'Take me there');
  await expect(page.locator('#jarvisReply')).toContainText(/opening maps/i, { timeout: 8_000 });
  await expect(page.locator('#mapQuery')).toHaveValue(firstName);
  await waitForMapResults(page);
  await expect(page.locator('#mapResults')).toContainText(firstName);
});
