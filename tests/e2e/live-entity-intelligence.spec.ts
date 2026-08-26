import { expect, test } from '@playwright/test';

test('DEPLOYED GATE: bare Beowulf resolves as a book entity', async ({ page }) => {
  const baseURL = process.env.JARVIS_LIVE_URL;
  if (!baseURL) throw new Error('JARVIS_LIVE_URL is required');

  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => typeof (window as any).jarvisEntityIntelligence?.resolve === 'function')).toBe(true);

  const result = await page.evaluate(async () => {
    const resolved = await (window as any).jarvisEntityIntelligence.resolve('Beowulf');
    (window as any).__JARVIS_ENTITY__ = {
      name: 'Beowulf',
      type: resolved.type,
      score: resolved.score,
      source: resolved.source,
      results: resolved.results || []
    };
    return {
      type: resolved.type,
      score: resolved.score,
      source: resolved.source,
      route: (window as any).jarvisCommandAuthority?.route?.('Beowulf')?.type || null
    };
  });

  expect(result.type).toBe('BOOK');
  expect(result.score).toBeGreaterThanOrEqual(0.9);
  expect(result.route).toBe('BOOKS');
});
