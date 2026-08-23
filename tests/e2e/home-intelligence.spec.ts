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

test('navigation phrases stay in the local command router', async ({ page }) => {
  await openHome(page);
  const input = page.locator('#commandInput');
  await input.fill('take me to bhubaneswar');
  await page.locator('#commandForm').press('Enter');
  await expect(page.locator('.page-head h1')).toHaveText('Maps');
  await expect(page.locator('#mapQuery')).toHaveValue(/bhubaneswar/i);
  await expect(page.locator('#webQuery')).toHaveCount(0);
});

test('Jagannath Nagar resolves to the Bhubaneswar canonical location', async ({ page }) => {
  await openHome(page);
  await page.locator('.nav[data-app="maps"]').click();
  const input = page.locator('#mapQuery');
  await input.fill('Jagannath Nagar');
  await page.locator('#mapSearch').click();
  await expect(page.locator('#mapResults')).toContainText(/Jharapada, Bhubaneswar, Odisha/i);
  await expect(page.locator('#mapResults')).not.toContainText(/Gunupur|Rayagada/i);
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
  await expect.poll(async () => page.locator('#mapResults [data-jarvis-map-v25]').count(), { timeout: 20_000 }).toBeGreaterThan(0);
  await expect(page.locator('#mapResults')).toContainText(/SHOWING .*RESTAURANTS/i);
  await expect(page.locator('#mapResults')).not.toContainText(/Hospital|Pharmacy|School|Bank/i);
  await expect(page.locator('#mapFrame')).toBeHidden();
});

test('restaurant keyword search tolerates common speech-recognition typo without changing the typed field', async ({ page }) => {
  await openHome(page);
  await page.locator('.nav[data-app="maps"]').click();
  const input = page.locator('#mapQuery');
  await input.fill('resturants in Jagannath Nagar');
  await expect(input).toHaveValue('resturants in Jagannath Nagar');
  await page.locator('#mapSearch').click();
  await expect.poll(async () => page.locator('#mapResults [data-jarvis-map-v25]').count(), { timeout: 20_000 }).toBeGreaterThan(0);
  await expect(page.locator('#mapResults')).toContainText(/RESTAURANTS/i);
  await expect(page.locator('#mapResults')).not.toContainText(/Hospital|Pharmacy|School|Bank/i);
  await expect(page.locator('#mapFrame')).toBeHidden();
});

test('restaurants-to-place phrasing stays inside Maps and becomes an in-place POI search', async ({ page }) => {
  await openHome(page);
  const command = page.locator('#commandInput');
  await command.fill('show me restaurants to Jagannath Nagar');
  await page.locator('#commandForm').press('Enter');
  await expect(page.locator('.page-head h1')).toHaveText('Maps');
  await expect(page.locator('#mapQuery')).toHaveValue(/restaurants in Jagannath Nagar/i);
  await expect.poll(async () => page.locator('#mapResults [data-jarvis-map-v25]').count(), { timeout: 20_000 }).toBeGreaterThan(0);
  await expect(page.locator('#mapResults')).toContainText(/RESTAURANTS/i);
  await expect(page.locator('#mapResults')).not.toContainText(/Hospital|Pharmacy|School|Bank/i);
  await expect(page.locator('#webQuery')).toHaveCount(0);
});

test('restaurant results paginate and only reveal the map after selection', async ({ page }) => {
  await openHome(page);
  await page.locator('.nav[data-app="maps"]').click();
  await page.locator('#mapQuery').fill('restaurants in Jagannath Nagar');
  await page.locator('#mapSearch').click();
  await expect.poll(async () => page.locator('#mapResults [data-jarvis-map-v25]').count(), { timeout: 20_000 }).toBeGreaterThan(0);
  const next = page.locator('#mapNext');
  if (await next.count()) {
    await expect(page.locator('#mapFrame')).toBeHidden();
    const first = await page.locator('#mapResults [data-jarvis-map-v25]').first().innerText();
    await next.click();
    await expect(page.locator('#mapResults [data-jarvis-map-v25]').first()).not.toHaveText(first);
    await expect(page.locator('#mapFrame')).toBeHidden();
  }
  await page.locator('#mapResults [data-jarvis-map-v25]').first().click();
  await expect(page.locator('#mapFrame iframe')).toBeVisible();
});

test('command routing does not leave a stale hardcoded map result over a later manual search', async ({ page }) => {
  await openHome(page);
  const command = page.locator('#commandInput');
  await command.fill('take me to Jagannath Nagar');
  await page.locator('#commandForm').press('Enter');
  await expect(page.locator('.page-head h1')).toHaveText('Maps');
  await expect(page.locator('#mapQuery')).toHaveValue(/Jagannath Nagar/i);
  await expect(page.locator('#mapResults')).toContainText(/Jharapada, Bhubaneswar, Odisha/i);
  const mapInput = page.locator('#mapQuery');
  await mapInput.fill('Khandagiri');
  await page.locator('#mapSearch').click();
  await expect(page.locator('#mapResults')).toContainText(/Khandagiri/i);
  await expect(page.locator('#mapResults')).not.toContainText(/Jagannath Nagar|Jharapada, Bhubaneswar/i);
  await expect(page.locator('#mapFrame iframe')).toHaveAttribute('src', /marker=/);
  await expect(page.locator('script[src*="jarvis-map-hard-override.js"]')).toHaveCount(0);
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
