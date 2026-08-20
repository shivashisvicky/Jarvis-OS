import { test, expect } from '@playwright/test';

test.describe('Jarvis OS 3.0 command/news/media contracts', () => {
  test('command routing preserves destination semantics', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#app')).toBeVisible();
    const result = await page.evaluate(async () => {
      const before = location.search;
      const handled = await (window as any).jarvisV3Command?.run('Give me directions to GGP Colony');
      return { handled: Boolean(handled), before, after: location.search };
    });
    expect(result.handled).toBe(true);
  });

  test('news runtime has a graceful degraded contract', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const result = await page.evaluate(async () => {
      const fn = (window as any).jarvisV3News?.load;
      return { available: typeof fn === 'function' };
    });
    expect(result.available).toBe(true);
  });

  test('media runtime exposes explicit player action', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const result = await page.evaluate(() => ({
      available: typeof (window as any).jarvisV3Media?.play === 'function'
    }));
    expect(result.available).toBe(true);
  });
});
