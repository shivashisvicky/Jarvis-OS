import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;

test('Home intelligence actions survive navigation', async ({ page }) => {
  await page.goto(LIVE_URL || '/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.nav[data-app="home"]')).toBeVisible({ timeout: 30_000 });
  await page.locator('.nav[data-app="home"]').click();

  const actions = page.locator('#jhcActions');
  await expect(actions).toBeVisible({ timeout: 10_000 });
  await expect(actions.getByRole('button', { name: "TODAY'S BRIEF" })).toBeVisible();
  await expect(actions.getByRole('button', { name: 'AI INTEL' })).toBeVisible();
  await expect(actions.getByRole('button', { name: 'OPEN MAPS' })).toBeVisible();
  await expect(actions.getByRole('button', { name: 'OPEN MEDIA' })).toBeVisible();
  await expect(actions.getByRole('button', { name: 'CAPABILITIES' })).toBeVisible();

  await page.locator('.nav[data-app="web"]').click();
  await expect(page.locator('.page-head h1')).toHaveText('Search Hub');
  await page.locator('.nav[data-app="home"]').click();

  await expect(page.locator('#jhcActions')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#jhcActions').getByRole('button', { name: "TODAY'S BRIEF" })).toBeVisible();
});
