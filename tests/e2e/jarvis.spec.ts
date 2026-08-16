import { expect, test } from '@playwright/test';

const nav = (page: any, app: string) => page.locator(`button.nav[data-app="${app}"]`);

test('Jarvis boots as a command-centric intelligence workspace', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('J.A.R.V.I.S. OS');
  await expect(page.getByText('J.A.R.V.I.S', { exact: true })).toBeVisible();
  await expect(page.getByText('COMMAND CHANNEL', { exact: true })).toBeVisible();
});

test('command palette opens and exposes apps', async ({ page }) => {
  await page.goto('/');
  await page.locator('#paletteBtn').click();
  const palette = page.locator('#paletteHost .palette');
  await expect(palette).toBeVisible();
  await expect(palette.locator('[data-palette-app="api"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(palette).toHaveCount(0);
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
  await expect(page.locator('#httpUrl')).toHaveValue('https://example.com/api');
});

test('search, maps and media stay inside the JARVIS shell', async ({ page }) => {
  await page.goto('/');
  await nav(page, 'web').click();
  await expect(page.getByRole('heading', { name: 'Search Hub', exact: true })).toBeVisible();
  await nav(page, 'maps').click();
  await expect(page.getByRole('heading', { name: 'Maps', exact: true })).toBeVisible();
  await nav(page, 'media').click();
  await expect(page.getByRole('heading', { name: 'Media Center', exact: true })).toBeVisible();
  await expect(page.locator('#jarvisPlayer')).toBeVisible();
});

test('settings exposes voice and search configuration', async ({ page }) => {
  await page.goto('/');
  await nav(page, 'settings').click();
  await expect(page.locator('#searchEngine')).toBeVisible();
  await expect(page.locator('#voiceRate')).toBeVisible();
});

test('REAL VIDEO GATE: keyword cats returns a live result and opens an in-house YouTube player', async ({ page }) => {
  await page.goto('/');
  await nav(page, 'media').click();
  await expect(page.getByRole('heading', { name: 'Media Center', exact: true })).toBeVisible();
  await page.locator('#videoQuery').fill('cats');
  await page.locator('#videoSearch').click();

  const card = page.locator('.jvc-card').first();
  await expect(card).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#jvcStatus')).toContainText('RESULTS', { timeout: 20000 });
  await expect(card.locator('strong')).not.toHaveText('');

  await card.click();
  const iframe = page.locator('#jarvisPlayer iframe');
  await expect(iframe).toBeVisible({ timeout: 10000 });
  await expect(iframe).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}/);
  await expect(page.locator('#jvcStatus')).toContainText('PLAYING', { timeout: 5000 });
  expect(page.context().pages()).toHaveLength(1);
});

test('news desk renders visual headlines, ticker and summarized briefs', async ({ page }) => {
  await page.route('https://api.gdeltproject.org/**', async route => {
    const url = route.request().url();
    if (url.includes('/context/context')) return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({articles:[{context:'JARVIS summary: researchers announced a new quantum systems advance, highlighting improved stability and practical applications.'}]})});
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({articles:[{title:'JARVIS quantum systems advance',url:'https://example.com/news/1',socialimage:'https://example.com/news.jpg',domain:'example.com',sourcecountry:'US'},{title:'JARVIS AI research update',url:'https://example.com/news/2',socialimage:'https://example.com/news2.jpg',domain:'example.com',sourcecountry:'US'}]})});
  });
  await page.goto('/');
  await expect(page.locator('.news-desk')).toBeVisible();
  await expect(page.locator('.news-card')).toHaveCount(2);
  await expect(page.locator('.news-card p').first()).toContainText('JARVIS summary: researchers announced');
  await expect(page.locator('.news-track')).toBeVisible();
});
