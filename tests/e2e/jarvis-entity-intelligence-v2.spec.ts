import { expect, test } from '@playwright/test';

test.describe('JARVIS entity intelligence v2', () => {
  const mockEntityProviders = async (page: any) => {
    await page.route('https://gutendex.com/books/**', async route => {
      const url = new URL(route.request().url());
      const q = (url.searchParams.get('search') || '').toLowerCase();
      const rows = q.includes('beowulf')
        ? [{ id: 16328, title: 'Beowulf', authors: [{ name: 'Unknown' }] }]
        : q.includes('john henry newman')
          ? [{ id: 1, title: 'Apologia Pro Vita Sua', authors: [{ name: 'Newman, John Henry' }] }]
          : [];
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: rows.length, results: rows }) });
    });

    await page.route('https://www.wikidata.org/w/api.php**', async route => {
      const url = new URL(route.request().url());
      const q = (url.searchParams.get('search') || '').toLowerCase();
      const description = q.includes('beowulf') ? 'epic poem' : q.includes('john henry newman') ? 'English cardinal and author' : 'thing';
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ search: [{ id: 'Q1', label: q, description }] }) });
    });
  };

  test('classifies bare Beowulf as a book entity', async ({ page }) => {
    await mockEntityProviders(page);
    await page.goto('/');
    const result = await page.evaluate(async () => (window as any).jarvisEntityIntelligence.resolve('Beowulf'));
    expect(result.type).toBe('BOOK');
    expect(result.score).toBeGreaterThanOrEqual(0.9);
    expect(result.source).toBe('gutenberg');
  });

  test('classifies John Henry Newman as a book-author entity when Gutenberg has the author match', async ({ page }) => {
    await mockEntityProviders(page);
    await page.goto('/');
    const result = await page.evaluate(async () => (window as any).jarvisEntityIntelligence.resolve('John Henry Newman'));
    expect(result.type).toBe('BOOK');
    expect(result.source).toBe('gutenberg');
    expect(result.results?.length).toBeGreaterThan(0);
  });

  test('does not steal ordinary command categories', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(() => {
      const api = (window as any).jarvisEntityIntelligence;
      return ['tell me a joke', 'what time is it', 'search the internet for black or blue', 'take me to Jagannath Nagar']
        .map(text => ({ text, candidate: api.candidate(text) }));
    });
    expect(result.every((x: any) => x.candidate === null)).toBe(true);
  });

  test('command authority promotes a resolved book entity into the Books route', async ({ page }) => {
    await mockEntityProviders(page);
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const entity = await (window as any).jarvisEntityIntelligence.resolve('Beowulf');
      (window as any).__JARVIS_ENTITY__ = { name: 'Beowulf', type: entity.type, score: entity.score, source: entity.source, results: entity.results };
      return (window as any).jarvisCommandAuthority.route('Beowulf');
    });
    expect(result.type).toBe('BOOKS');
    expect(result.entity.type).toBe('BOOK');
  });
});
