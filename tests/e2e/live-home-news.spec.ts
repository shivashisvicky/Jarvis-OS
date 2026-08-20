import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;

test.describe('deployed Home + News gate', () => {
  test.skip(!LIVE_URL, 'Production-only live gate');
  test.setTimeout(90_000);

  test('Home loads real live news and supports refresh/category', async ({ page }) => {
    await page.goto(new URL(LIVE_URL!).toString(), { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.nav[data-app="home"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#newsDesk')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#newsCards')).toBeVisible();

    const cards = page.locator('#newsCards > *');
    await expect(cards.first()).toBeVisible({ timeout: 30_000 });
    const initialCount = await cards.count();
    expect(initialCount).toBeGreaterThan(0);

    const initialText = await page.locator('#newsCards').innerText();
    expect(initialText).not.toMatch(/connecting to the global news stream|fixture|canned|placeholder/i);

    await page.locator('#newsGenre').selectOption({ label: 'INDIA' });
    await page.locator('#refreshNews').click();
    await expect(page.locator('#newsCards > *').first()).toBeVisible({ timeout: 30_000 });
    expect(await page.locator('#newsCards > *').count()).toBeGreaterThan(0);
  });

  test('Command input stays in the SPA and executes Maps destinations', async ({ page }) => {
    await page.goto(new URL(LIVE_URL!).toString(), { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#commandInput')).toBeVisible({ timeout: 30_000 });

    const initialUrl = page.url();
    await page.locator('#commandInput').fill('give me directions to GGP Colony');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(initialUrl);

    await page.locator('#commandForm button[type="submit"]').click();
    await expect(page.locator('.nav[data-app="maps"]')).toHaveClass(/selected/, { timeout: 10_000 });
    await expect(page.locator('#mapQuery')).toHaveValue('GGP Colony', { timeout: 10_000 });
    await expect(page.locator('#mapResults')).not.toContainText('Search for a place to begin.', { timeout: 15_000 });
  });

  test('Games is a real arcade and Notes captures natural-language commands', async ({ page }) => {
    await page.goto(new URL(LIVE_URL!).toString(), { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.nav[data-app="snake"]')).toBeVisible({ timeout: 30_000 });

    await page.locator('.nav[data-app="snake"]').click();
    await expect(page.locator('.arcade')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.game-card')).toHaveCount(6);
    await expect(page.locator('#snakeCanvas')).toBeVisible();
    await expect(page.locator('#tetBoard')).toBeVisible();

    await page.locator('.nav[data-app="notes"]').click();
    await expect(page.locator('.notes-shell')).toBeVisible({ timeout: 10_000 });
    await page.locator('#commandInput').count().catch(() => 0);

    await page.locator('.nav[data-app="home"]').click();
    await page.locator('#commandInput').fill('make a note to pay 10 rs to Deepak');
    await page.locator('#commandForm button[type="submit"]').click();
    await expect(page.locator('.nav[data-app="notes"]')).toHaveClass(/selected/, { timeout: 10_000 });
    await expect(page.locator('#notesItems')).toContainText('pay 10 rs to Deepak', { timeout: 10_000 });
  });
});
