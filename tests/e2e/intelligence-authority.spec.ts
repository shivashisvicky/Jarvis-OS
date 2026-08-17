import { test, expect } from '@playwright/test';

test.describe('JARVIS dynamic intelligence authority', () => {
  test('video keyword search is query-sensitive and stays in-house', async ({ page }) => {
    await page.route('**/__jarvis/video/search**', async route => {
      const url = new URL(route.request().url());
      const q = (url.searchParams.get('q') || '').toLowerCase();
      if (q.includes('cats')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [
          { type:'video', videoId:'J---aiyznGQ', title:'Cats compilation live result', author:'Cat Channel' },
          { type:'video', videoId:'aqz-KE-bpKQ', title:'Cats and kittens', author:'Animals Now' },
        ]}) });
      }
      if (q.includes('dogs')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [
          { type:'video', videoId:'21X5lGlDOfg', title:'Dogs training live result', author:'Dog Channel' },
          { type:'video', videoId:'kJQP7kiw5Fk', title:'Dogs in the park', author:'Pets Now' },
        ]}) });
      }
      return route.abort();
    });
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await expect(page.locator('.jv4-video-card').first()).toContainText('Cats compilation live result');
    const cats = await page.locator('.jv4-video-card').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-jv4-video')));
    await page.locator('#videoQuery').fill('dogs');
    await page.locator('#videoSearch').click();
    await expect(page.locator('.jv4-video-card').first()).toContainText('Dogs training live result');
    const dogs = await page.locator('.jv4-video-card').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-jv4-video')));
    expect(dogs).not.toEqual(cats);
    expect(await page.evaluate(() => (window as any).jarvisVideoSearchUrl('India 2026','all'))).toBe('https://www.youtube.com/results?search_query=India%202026');
    expect(await page.evaluate(() => (window as any).jarvisVideoSearchUrl('Cats','shorts'))).toBe('https://www.youtube.com/results?search_query=Cats');
    expect(page.context().pages()).toHaveLength(1);
  });

  test('provider exhaustion never renders canned videos or redirects', async ({ page }) => {
    await page.route('**/*', async route => {
      const u = route.request().url();
      if (/pipedapi|invidious|youtube\.com\/results|allorigins\.win|corsproxy\.io|r\.jina\.ai/.test(u)) return route.abort();
      return route.continue();
    });
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await page.locator('#videoQuery').fill('quantum waffles 987654321');
    await page.locator('#videoSearch').click();
    await expect(page.locator('#videoResults')).toContainText('LIVE VIDEO INDEX UNAVAILABLE', { timeout: 12000 });
    await expect(page.locator('#videoResults')).not.toContainText('Big Buck Bunny');
    await expect(page.locator('#videoResults')).not.toContainText('Nyan Cat');
    await expect(page.locator('#videoResults')).not.toContainText('NASA Live');
    await expect(page.locator('#videoResults')).not.toContainText('India 2026');
    await expect(page.url()).not.toMatch(/youtube\.com|bing\.com/i);
  });

  test('generic map search uses provider failover and changes location', async ({ page }) => {
    await page.route('**/__jarvis/geo**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [{ lat:48.8584, lon:2.2945, name:'Eiffel Tower', detail:'Eiffel Tower, Paris, France' }] }) }));
    await page.goto('/');
    await page.locator('button.nav[data-app="maps"]').click();
    await page.locator('#mapQuery').fill('Eiffel Tower');
    await page.locator('#mapSearch').click();
    await expect(page.locator('.jv4-place').first()).toContainText('Eiffel Tower');
    await expect(page.locator('.jv4-provider')).toContainText('PHOTON → ARCGIS → NOMINATIM');
    await expect(page.locator('#mapFrame iframe')).toHaveCount(1);
  });

  test('dashboard command search renders an internal answer', async ({ page }) => {
    await page.route('https://api.duckduckgo.com/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ AbstractText:'An API gateway is a service that fronts backend APIs and handles routing, authentication, rate limiting and policy enforcement.', AbstractURL:'https://example.test/api-gateway' }) }));
    await page.goto('/');
    await page.locator('#commandInput').fill('What is an API gateway?');
    await page.locator('#commandForm').locator('button[type="submit"]').click();
    await expect(page.locator('#jarvisReply')).toContainText('An API gateway is a service');
    await expect(page.locator('#jarvisReply')).toContainText('IN-HOUSE');
  });

  test('Research workspace displays results instead of redirecting', async ({ page }) => {
    await page.route('https://api.duckduckgo.com/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ AbstractText:'OAuth 2.0 is an authorization framework used to obtain limited access to protected resources.', AbstractURL:'https://example.test/oauth' }) }));
    await page.goto('/');
    await page.locator('.jmc-action[data-jv3-intent="research"]').click();
    await expect(page.getByRole('heading', { name: 'Search Hub', exact: true })).toBeVisible();
    await page.locator('#webQuery').fill('OAuth 2.0');
    await page.locator('#webSearch').click();
    await expect(page.locator('#jv3SearchAnswer, #jv4SearchAnswer').filter({ hasText: 'OAuth 2.0 is an authorization framework' })).toBeVisible();
    expect(page.context().pages()).toHaveLength(1);
  });
});
