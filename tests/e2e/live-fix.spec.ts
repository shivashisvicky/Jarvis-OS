import { expect, test } from '@playwright/test';

const nav = (page: any, app: string) => page.locator(`button.nav[data-app="${app}"]`);

test('central command executes in-shell without redirecting', async ({ page }) => {
  await page.route('https://api.duckduckgo.com/**', async route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({
      AbstractText: 'SAP Cloud Integration is an integration platform as a service.',
      AbstractURL: 'https://example.com/sap-cpi'
    })
  }));
  await page.goto('/');
  const before = page.url();
  await page.locator('#commandInput').fill('What is SAP CPI?');
  await page.locator('#commandForm').evaluate((form: HTMLFormElement) => form.requestSubmit());
  await expect(page.locator('#jarvisReply')).toContainText('SAP Cloud Integration', { timeout: 8000 });
  expect(page.url()).toBe(before);
});

test('dashboard search stays in JARVIS and offers explicit internet fallback', async ({ page }) => {
  await page.route('https://api.duckduckgo.com/**', async route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) }));
  await page.route('https://en.wikipedia.org/w/api.php**', async route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ query: { search: [{ title: 'SAP Cloud Integration', snippet: 'Integration platform result' }] } })
  }));
  await page.goto('/');
  await nav(page, 'web').click();
  await page.locator('#webQuery').fill('SAP Cloud Integration');
  const before = page.url();
  await page.locator('#webSearch').click();
  await expect(page.locator('.jlf-result').first()).toContainText('SAP Cloud Integration', { timeout: 8000 });
  expect(page.url()).toBe(before);
  await expect(page.locator('#jlfSearchInternet')).toBeVisible();
});

test('maps resolve Bhubaneswar aliases without Nominatim', async ({ page }) => {
  await page.goto('/');
  await nav(page, 'maps').click();
  await page.locator('#mapQuery').fill('GGP Colony');
  await page.locator('#mapSearch').click();
  await expect(page.locator('#mapResults')).toContainText('GGP Colony');
  await expect(page.locator('#mapFrame iframe')).toHaveCount(1);
  await page.locator('#mapQuery').fill('Maa Enclave');
  await page.locator('#mapSearch').click();
  await expect(page.locator('#mapResults')).toContainText('Maa Enclave');
  await expect(page.locator('#mapFrame iframe')).toHaveCount(1);
});

test('snake exposes touch D-pad on mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await nav(page, 'snake').click();
  await expect(page.locator('#snakeCanvas')).toBeVisible();
  await expect(page.locator('.jlf-pad [data-d="up"]')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('.jlf-pad [data-d="left"]')).toBeVisible();
  await expect(page.locator('.jlf-pad [data-d="down"]')).toBeVisible();
  await expect(page.locator('.jlf-pad [data-d="right"]')).toBeVisible();
});

test('arcade has working mobile controls for 2048 and Tetris', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#jarvisGamesNav').click();
  await expect(page.locator('#g2048')).toBeVisible();
  await expect(page.locator('#tet')).toBeVisible();
  await expect(page.locator('#g2048').locator('xpath=..').locator('.jgame-pad [data-d]').first()).toBeVisible();
  await expect(page.locator('#tet').locator('xpath=..').locator('.jgame-pad [data-d]').first()).toBeVisible();
  await page.locator('#g2048New').click();
  await expect(page.locator('#g2048 b').filter({ hasText: /2|4/ }).first()).toBeVisible();
});

test('home workspace does not perform the periodic 15-second destructive render', async ({ page }) => {
  await page.goto('/');
  await page.locator('#commandInput').fill('stability sentinel');
  await page.waitForTimeout(15500);
  await expect(page.locator('#commandInput')).toHaveValue('stability sentinel');
});
