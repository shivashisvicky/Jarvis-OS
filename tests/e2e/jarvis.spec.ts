import { expect, test, type Page } from '@playwright/test';

const nav = (page: Page, app: string) => page.locator(`button.nav[data-app="${app}"]`);

test('Jarvis boots as a command-centric intelligence workspace', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('J.A.R.V.I.S. OS');
  await expect(page.getByText('J.A.R.V.I.S', { exact: true })).toBeVisible();
  await expect(page.getByText('Command', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Command channel', { exact: true })).toBeVisible();
  await expect(page.getByText('Tools at your command', { exact: true })).toBeVisible();
});

test('command palette opens and exposes apps', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+KeyK');
  await expect(page.getByRole('dialog', { name: 'JARVIS command palette' })).toBeVisible();
  await expect(page.getByRole('button', { name: /API Lab/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'JARVIS command palette' })).toHaveCount(0);
});

test('calculator works', async ({ page }) => {
  await page.goto('/');
  await nav(page, 'calculator').click();
  await page.getByRole('button', { name: '7' }).click();
  await page.getByRole('button', { name: '+' }).click();
  await page.getByRole('button', { name: '5' }).click();
  await page.getByRole('button', { name: '=' }).click();
  await expect(page.locator('#display')).toHaveValue('12');
});

test('notes persist', async ({ page }) => {
  await page.goto('/');
  await nav(page, 'notes').click();
  await page.locator('#note').fill('Jarvis SIT persistence');
  await page.getByRole('button', { name: 'SAVE NOTE' }).click();
  await expect(page.getByText('Jarvis SIT persistence')).toBeVisible();
});

test('REST API Lab renders and accepts request data', async ({ page }) => {
  await page.goto('/');
  await nav(page, 'api').click();
  await expect(page.getByRole('heading', { name: 'API Lab', exact: true })).toBeVisible();
  await page.locator('#httpUrl').fill('https://example.com/api');
  await page.locator('#httpHeaders').fill('{"Accept":"application/json"}');
  await expect(page.locator('#httpUrl')).toHaveValue('https://example.com/api');
});

test('search, maps and media stay inside the JARVIS shell until external search is requested', async ({ page }) => {
  await page.goto('/');
  await nav(page, 'web').click();
  await expect(page.getByRole('heading', { name: 'Search Hub', exact: true })).toBeVisible();
  await expect(page.locator('#webQuery')).toBeVisible();

  await nav(page, 'maps').click();
  await expect(page.getByRole('heading', { name: 'Maps', exact: true })).toBeVisible();
  await expect(page.locator('#mapFrame')).toBeVisible();

  await nav(page, 'media').click();
  await expect(page.getByRole('heading', { name: 'Media Center', exact: true })).toBeVisible();
  await expect(page.locator('#jarvisPlayer')).toBeVisible();
});

test('settings exposes voice and search configuration', async ({ page }) => {
  await page.goto('/');
  await nav(page, 'settings').click();
  await expect(page.locator('#searchEngine')).toBeVisible();
  await expect(page.locator('#voiceRate')).toBeVisible();
  await expect(page.locator('#voicePitch')).toBeVisible();
  await expect(page.locator('#voiceVolume')).toBeVisible();
});
