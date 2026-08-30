import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;
const APP_URL = LIVE_URL || '/';

async function openHome(page) {
  await page.goto(LIVE_URL ? new URL(LIVE_URL).toString() : APP_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.nav[data-app="home"]')).toBeVisible({ timeout: 30_000 });
  await page.locator('.nav[data-app="home"]').click();
}

async function waitForMapResults(page) {
  await expect.poll(async () => page.locator('#mapResults [data-jarvis-map-v26]').count(), { timeout: 30_000 }).toBeGreaterThan(0);
  await expect(page.locator('#mapFrame')).toBeVisible();
  await expect(page.locator('#mapFrame iframe')).toHaveCount(1);
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

test('navigation phrases stay in the local command router', async ({ page }) => {
  await openHome(page);
  const input = page.locator('#commandInput');
  await input.fill('take me to bhubaneswar');
  await page.locator('#commandForm').press('Enter');
  await expect(page.locator('.page-head h1')).toHaveText('Maps');
  await expect(page.locator('#mapQuery')).toHaveValue(/bhubaneswar/i, { timeout: 15_000 });
  await expect(page.locator('#webQuery')).toHaveCount(0);
});

test('Jagannath Nagar resolves to the Bhubaneswar canonical location and opens its map immediately', async ({ page }) => {
  await openHome(page);
  await page.locator('.nav[data-app="maps"]').click();
  const input = page.locator('#mapQuery');
  await input.fill('Jagannath Nagar');
  await page.locator('#mapSearch').click();
  await expect(page.locator('#mapResults')).toContainText(/Jharapada, Bhubaneswar, Odisha/i);
  await expect(page.locator('#mapResults')).not.toContainText(/Gunupur|Rayagada/i);
  await expect(page.locator('#mapFrame')).toBeVisible();
  await expect(page.locator('#mapFrame iframe')).toHaveAttribute('src', /marker=20\.2923%2C85\.8638/);
  await page.locator('#mapResults .place-result').first().click();
  await expect(page.locator('#mapFrame iframe')).toHaveAttribute('src', /marker=20\.2923%2C85\.8638/);
});

test('Maps has one POI runtime and restaurant keyword search returns only restaurant-category POIs', async ({ page }) => {
  await openHome(page);
  await expect(page.locator('script[src*="jarvis-map-runtime-v24.js"]')).toHaveCount(0);
  await expect(page.locator('script[src*="jarvis-map-absolute-authority-v21.js"]')).toHaveCount(0);
  await expect(page.locator('script[src*="jarvis-map-absolute-authority-v25.js"]')).toHaveCount(1);
  await page.locator('.nav[data-app="maps"]').click();
  const input = page.locator('#mapQuery');
  await input.fill('restaurants in Jagannath Nagar');
  await expect(input).toHaveAttribute('autocorrect', 'off');
  await expect(input).toHaveAttribute('spellcheck', 'false');
  await page.locator('#mapSearch').click();
  await expect(page.locator('#mapResults')).not.toContainText(/1 LOCATION FOUND/i);
  await waitForMapResults(page);
  await expect(page.locator('#mapResults')).toContainText(/SHOWING .*RESTAURANTS/i);
  await expect(page.locator('#mapResults')).not.toContainText(/Hospital|Pharmacy|School|Bank/i);
});

test('restaurant keyword search tolerates common speech-recognition typo without changing the typed field', async ({ page }) => {
  await openHome(page);
  await page.locator('.nav[data-app="maps"]').click();
  const input = page.locator('#mapQuery');
  await input.fill('resturants in Jagannath Nagar');
  await expect(input).toHaveValue('resturants in Jagannath Nagar');
  await page.locator('#mapSearch').click();
  await waitForMapResults(page);
  await expect(page.locator('#mapResults')).toContainText(/RESTAURANTS/i);
  await expect(page.locator('#mapResults')).not.toContainText(/Hospital|Pharmacy|School|Bank/i);
});

test('restaurants-to-place phrasing stays inside Maps and becomes an in-place POI search', async ({ page }) => {
  await openHome(page);
  const command = page.locator('#commandInput');
  await command.fill('show me restaurants to Jagannath Nagar');
  await page.locator('#commandForm').press('Enter');
  await expect(page.locator('.page-head h1')).toHaveText('Maps');
  await expect(page.locator('#mapQuery')).toHaveValue(/restaurants in Jagannath Nagar/i, { timeout: 15_000 });
  await waitForMapResults(page);
  await expect(page.locator('#mapResults')).toContainText(/RESTAURANTS/i);
  await expect(page.locator('#mapResults')).not.toContainText(/Hospital|Pharmacy|School|Bank/i);
  await expect(page.locator('#webQuery')).toHaveCount(0);
});

test('Maps owns nearest follow-ups and never sends an old Books context to intelligence', async ({ page }) => {
  await openHome(page);
  const command = page.locator('#commandInput');
  await command.fill('show me restaurants in Jagannath Nagar');
  await page.locator('#commandForm').press('Enter');
  await expect(page.locator('.page-head h1')).toHaveText('Maps');
  await waitForMapResults(page);
  const firstName = (await page.locator('#mapResults [data-jarvis-map-v26]').first().locator('strong').innerText()).replace(/^\d+\.\s*/, '').trim();
  await command.fill("what's the nearest one");
  await page.locator('#commandForm').press('Enter');
  await expect(page.locator('#jarvisReply')).toContainText(/nearest option/i, { timeout: 8_000 });
  await expect(page.locator('#jarvisReply')).toContainText(firstName);
  await expect(page.locator('#jarvisReply')).not.toContainText(/Beowulf/i);
  await expect(page.locator('#jarvisReply')).not.toContainText(/current location/i);
});

test('Maps ordinal command opens the requested third result, including map-result phrasing', async ({ page }) => {
  await openHome(page);
  await page.locator('.nav[data-app="maps"]').click();
  await page.locator('#mapQuery').fill('restaurants in Jagannath Nagar');
  await page.locator('#mapSearch').click();
  await waitForMapResults(page);
  const thirdName = (await page.locator('#mapResults [data-jarvis-map-v26]').nth(2).locator('strong').innerText()).replace(/^\d+\.\s*/, '').trim();
  await page.locator('#commandInput').fill('open the third map one');
  await page.locator('#commandForm').press('Enter');
  await expect(page.locator('#jarvisReply')).toContainText(new RegExp(thirdName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), { timeout: 8_000 });
  await expect(page.locator('#mapFrame iframe')).toHaveCount(1);
});

test('Maps ordinal context survives returning Home and opens the second result there', async ({ page }) => {
  await openHome(page);
  await page.locator('.nav[data-app="maps"]').click();
  await page.locator('#mapQuery').fill('restaurants in Jagannath Nagar');
  await page.locator('#mapSearch').click();
  await waitForMapResults(page);
  const secondName = (await page.locator('#mapResults [data-jarvis-map-v26]').nth(1).locator('strong').innerText()).replace(/^\d+\.\s*/, '').trim();
  await page.locator('.nav[data-app="home"]').click();
  await expect(page.locator('.page-head h1')).toHaveText('Command Center');
  await page.locator('#commandInput').fill('open the second one');
  await page.locator('#commandForm').press('Enter');
  await expect(page.locator('.page-head h1')).toHaveText('Maps', { timeout: 10_000 });
  await expect(page.locator('#mapResults')).toContainText(secondName, { timeout: 10_000 });
  await expect(page.locator('#jarvisReply')).toContainText(secondName, { timeout: 10_000 });
  await expect(page.locator('#jarvisReply')).not.toContainText(/could not open that map result|current result list/i);
});

test('restaurant results paginate and keep the map synchronized with the visible page', async ({ page }) => {
  await openHome(page);
  await page.locator('.nav[data-app="maps"]').click();
  await page.locator('#mapQuery').fill('restaurants in Jagannath Nagar');
  await page.locator('#mapSearch').click();
  await waitForMapResults(page);
  const next = page.locator('#mapNext');
  if (await next.count()) {
    const first = await page.locator('#mapResults [data-jarvis-map-v26]').first().innerText();
    const firstSrc = await page.locator('#mapFrame iframe').getAttribute('src');
    await next.click();
    await expect(page.locator('#mapResults [data-jarvis-map-v26]').first()).not.toHaveText(first);
    await expect(page.locator('#mapFrame')).toBeVisible();
    await expect(page.locator('#mapFrame iframe')).toHaveCount(1);
    const nextSrc = await page.locator('#mapFrame iframe').getAttribute('src');
    expect(nextSrc).not.toBe(firstSrc);
  }
  await page.locator('#mapResults [data-jarvis-map-v26]').first().click();
  await expect(page.locator('#mapFrame iframe')).toBeVisible();
});

test('command routing does not leave a stale hardcoded map result over a later manual search', async ({ page }) => {
  await openHome(page);
  const command = page.locator('#commandInput');
  await command.fill('take me to Jagannath Nagar');
  await page.locator('#commandForm').press('Enter');
  await expect(page.locator('.page-head h1')).toHaveText('Maps');
  await expect(page.locator('#mapQuery')).toHaveValue(/Jagannath Nagar/i, { timeout: 15_000 });
  await expect(page.locator('#mapResults')).toContainText(/Jharapada, Bhubaneswar, Odisha/i);
  const mapInput = page.locator('#mapQuery');
  await mapInput.fill('Khandagiri');
  await page.locator('#mapSearch').click();
  await expect(page.locator('#mapResults')).toContainText(/Khandagiri/i);
  await expect(page.locator('#mapResults')).not.toContainText(/Jagannath Nagar|Jharapada, Bhubaneswar/i);
  await expect(page.locator('#mapFrame')).toBeVisible();
  await page.locator('#mapResults .place-result').first().click();
  await expect(page.locator('#mapFrame iframe')).toHaveAttribute('src', /marker=/);
  await expect(page.locator('script[src*="jarvis-map-hard-override.js"]')).toHaveCount(0);
});

test('Maps search submits when Return is pressed in the map input', async ({ page }) => {
  await openHome(page);
  await page.locator('.nav[data-app="maps"]').click();
  const input = page.locator('#mapQuery');
  await input.fill('Khandagiri');
  await input.press('Enter');
  await expect(page.locator('#mapResults')).toContainText(/Khandagiri/i, { timeout: 10_000 });
  await expect(page.locator('#mapFrame iframe')).toHaveCount(1);
});

test('lazy voice module loads on demand and owns speech', async ({ page }) => {
  await openHome(page);
  await expect(page.locator('#voiceBtn')).toBeVisible();
  await expect(page.locator('#commandForm')).toBeVisible();
  await expect(page.locator('.brand')).toContainText('J.A.R.V.I.S');
  await page.locator('#voiceBtn').click();
  await expect(page.locator('script[src*="jarvis-voice-authority.js"]')).toHaveCount(1, { timeout: 10_000 });
  await expect(page.locator('script[src*="jarvis-voice-bridge.js"]')).toHaveCount(0);
});

test('mobile viewport keeps the full shell usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page);
  await expect(page.locator('.topbar')).toBeVisible();
  await expect(page.locator('.workspace')).toBeVisible();
  await expect(page.locator('#commandInput')).toBeVisible();
  await expect(page.locator('#voiceBtn')).toBeVisible();
  await expect(page.locator('.rail')).toBeVisible();
  await expect(page.locator('.nav[data-app="maps"]')).toBeVisible();
  await expect(page.locator('.nav[data-app="media"]')).toBeVisible();
});
