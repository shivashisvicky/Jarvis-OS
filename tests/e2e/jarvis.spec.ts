import { expect, test, type Page } from '@playwright/test';

const nav = (page: Page, app: string) => page.locator(`button.nav[data-app="${app}"]`);

test('Jarvis boots and renders command center', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Jarvis OS');
  await expect(page.getByText('J.A.R.V.I.S', { exact: true })).toBeVisible();
  await expect(page.getByText('JARVIS COMMAND DECK / CORE 01', { exact: true })).toBeVisible();
  await expect(page.getByText('Good afternoon.', { exact: true })).toBeVisible();
});

test('calculator works', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Calculator').first().click();
  await page.getByRole('button', { name: '7' }).click();
  await page.getByRole('button', { name: '+' }).click();
  await page.getByRole('button', { name: '5' }).click();
  await page.getByRole('button', { name: '=' }).click();
  await expect(page.locator('#display')).toHaveValue('12');
});

test('snake app starts', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Snake').first().click();
  await expect(page.locator('#snakeCanvas')).toBeVisible();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.locator('#score')).toContainText('Score');
});

test('notes persist', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Notes').first().click();
  await page.locator('#note').fill('Jarvis SIT persistence');
  await page.getByRole('button', { name: 'Save note' }).click();
  await expect(page.getByText('Jarvis SIT persistence')).toBeVisible();
  await page.reload();
  await page.getByText('Notes').first().click();
  await expect(page.getByText('Jarvis SIT persistence')).toBeVisible();
});

test('REST client renders and accepts request data', async ({ page }) => {
  await page.goto('/');
  await nav(page, 'api').click();
  await expect(page.getByRole('heading', { name: 'REST Client', exact: true })).toBeVisible();
  await page.locator('#httpUrl').fill('https://example.com/api');
  await page.locator('#httpHeaders').fill('{"Accept":"application/json"}');
  await expect(page.locator('#httpUrl')).toHaveValue('https://example.com/api');
});

test('web, maps, media and news consoles render in-house', async ({ page }) => {
  await page.goto('/');
  await nav(page, 'web').click();
  await expect(page.getByRole('heading', { name: 'JARVIS Browser', exact: true })).toBeVisible();
  await expect(page.locator('#browserFrame')).toBeVisible();

  await nav(page, 'maps').click();
  await expect(page.getByRole('heading', { name: 'JARVIS Maps', exact: true })).toBeVisible();
  await expect(page.getByText('No Google Maps redirect')).toBeVisible();

  await nav(page, 'media').click();
  await expect(page.getByRole('heading', { name: 'JARVIS Player', exact: true })).toBeVisible();
  await expect(page.locator('#jarvisPlayer')).toBeVisible();

  await nav(page, 'news').click();
  await expect(page.getByRole('heading', { name: 'JARVIS News', exact: true })).toBeVisible();
  await expect(page.locator('#jarvisNewsSearch')).toBeVisible();
});

test('dashboard telemetry is interactive', async ({ page }) => {
  await page.goto('/');
  await page.getByText('CORE STATUS', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Core diagnostics', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '×' }).click();
});

test('settings exposes voice and search configuration', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Settings').first().click();
  await expect(page.locator('#searchEngine')).toBeVisible();
  await expect(page.locator('#voiceRate')).toBeVisible();
  await expect(page.locator('#voicePitch')).toBeVisible();
  await expect(page.locator('#voiceVolume')).toBeVisible();
});
