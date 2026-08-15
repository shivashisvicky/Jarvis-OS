import { test, expect, type Page } from '@playwright/test';

/**
 * Resilient SIT helpers.
 *
 * These tests intentionally retry transient UI conditions, but never hide a
 * deterministic product failure. Each retry captures a diagnostic snapshot.
 */
async function retryStep(page: Page, name: string, action: () => Promise<void>, attempts = 3) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await action();
      return;
    } catch (error) {
      lastError = error;
      await page.screenshot({ path: `test-results/${name.replace(/\W+/g, '-')}-attempt-${attempt}.png`, fullPage: true }).catch(() => {});
      if (attempt < attempts) await page.waitForTimeout(250 * attempt);
    }
  }
  throw lastError;
}

async function expectInternalApp(page: Page, app: string, heading: string) {
  const pagesBefore = page.context().pages().length;
  const urlBefore = page.url();

  await retryStep(page, `${app}-open`, async () => {
    await page.locator(`button.nav[data-app="${app}"]`).click();
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  });

  expect(page.context().pages().length, `${app} opened a new browser page`).toBe(pagesBefore);
  expect(page.url(), `${app} left the Jarvis shell`).toBe(urlBefore);
}

test.describe('Jarvis internal-app and recovery SIT', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('JARVIS').first()).toBeVisible();
  });

  test('all first-party apps stay inside the Jarvis shell', async ({ page }) => {
    await expectInternalApp(page, 'api', 'REST Client');
    await expectInternalApp(page, 'web', 'JARVIS Browser');
    await expectInternalApp(page, 'maps', 'Maps');
    await expectInternalApp(page, 'media', 'Media Center');
  });

  test('REST client recovers from transient UI timing and preserves input', async ({ page }) => {
    await expectInternalApp(page, 'api', 'REST Client');
    await retryStep(page, 'rest-input', async () => {
      await page.locator('#httpUrl').fill('https://example.com/api');
      await page.locator('#httpHeaders').fill('{"Accept":"application/json"}');
      await expect(page.locator('#httpUrl')).toHaveValue('https://example.com/api');
      await expect(page.locator('#httpHeaders')).toHaveValue('{"Accept":"application/json"}');
    });
  });

  test('spatial module launch is also internal and recoverable', async ({ page }) => {
    const pagesBefore = page.context().pages().length;
    await retryStep(page, 'spatial-rest', async () => {
      await page.locator('button.module[data-app="api"]').click();
      await expect(page.getByRole('heading', { name: 'REST Client', exact: true })).toBeVisible();
    });
    expect(page.context().pages().length).toBe(pagesBefore);
    expect(page.url()).toMatch(/\/$/);
  });

  test('critical shell survives repeated app switching', async ({ page }) => {
    for (let i = 0; i < 2; i++) {
      await expectInternalApp(page, 'web', 'JARVIS Browser');
      await expectInternalApp(page, 'maps', 'Maps');
      await expectInternalApp(page, 'media', 'Media Center');
      await expectInternalApp(page, 'api', 'REST Client');
    }
    await expect(page.getByText('JARVIS').first()).toBeVisible();
  });
});
