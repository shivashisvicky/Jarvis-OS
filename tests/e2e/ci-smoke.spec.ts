import { expect, test } from '@playwright/test';

test.describe('JARVIS CI smoke contract', () => {
  test('video search exposes the real YouTube search URL contract', async ({ page }) => {
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await expect(page.getByRole('heading', { name: 'Media Center', exact: true })).toBeVisible();
    const url = await page.evaluate(() => {
      const fn = (window as unknown as { jarvisVideoSearchUrl?: (q: string) => string }).jarvisVideoSearchUrl;
      return fn?.('cats') ?? '';
    });
    expect(url).toContain('youtube.com');
    expect(url).toContain('search_query=cats');
    expect(url).not.toContain('JARVIS result');
  });

  test('map and media authorities are installed without leaving the shell', async ({ page }) => {
    await page.goto('/');
    await expect.poll(async () => page.evaluate(() => Boolean((window as unknown as { jarvisMapSearch?: unknown }).jarvisMapSearch))).toBe(true);
    await expect.poll(async () => page.evaluate(() => Boolean((window as unknown as { jarvisVideoSearch?: unknown }).jarvisVideoSearch))).toBe(true);
    expect(page.context().pages()).toHaveLength(1);
    expect(page.url()).toMatch(/\/$/);
  });
});
