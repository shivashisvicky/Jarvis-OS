import { test, expect } from '@playwright/test';

test.describe('JARVIS dynamic intelligence authority', () => {
  test('video keyword search is query-sensitive and stays in-house', async ({ page }) => {
    await page.route('**/__jarvis/video/search**', async route => {
      const q = (new URL(route.request().url()).searchParams.get('q') || '').toLowerCase();
      const items = q.includes('cats')
        ? [{ videoId:'J---aiyznGQ', title:'Cats compilation live result', author:'Cat Channel' }]
        : [{ videoId:'21X5lGlDOfg', title:'Dogs training live result', author:'Dog Channel' }];
      await route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ items }) });
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
    expect(page.context().pages()).toHaveLength(1);
  });

  test('provider exhaustion never renders canned videos or redirects', async ({ page }) => {
    await page.route('**/*', async route => {
      const u = route.request().url();
      if (/pipedapi|invidious|youtube\.com\/results|r\.jina\.ai/.test(u)) return route.abort();
      return route.continue();
    });
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await page.locator('#videoQuery').fill('quantum waffles 987654321');
    await page.locator('#videoSearch').click();
    await expect(page.locator('#videoResults')).toContainText('LIVE VIDEO INDEX UNAVAILABLE', { timeout:12000 });
    await expect(page.locator('#videoResults')).not.toContainText('Big Buck Bunny');
    await expect(page.locator('#videoResults')).not.toContainText('Nyan Cat');
    await expect(page.locator('#videoResults')).not.toContainText('NASA Live');
    await expect(page.url()).not.toMatch(/youtube\.com|bing\.com/i);
  });

  test('selected video plays inside the JARVIS player', async ({ page }) => {
    await page.route('**/__jarvis/video/search**', route => route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ items:[{ videoId:'J---aiyznGQ', title:'Playable cats result', author:'Cat Channel' }] }) }));
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await page.locator('.jv4-video-card').first().click();
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/J---aiyznGQ/);
    expect(page.context().pages()).toHaveLength(1);
  });

  test('generic map search uses provider failover and changes location', async ({ page }) => {
    await page.route('**/__jarvis/geo**', route => route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ items:[{lat:48.8584,lon:2.2945,name:'Eiffel Tower',detail:'Eiffel Tower, Paris, France'}] }) }));
    await page.goto('/');
    await page.locator('button.nav[data-app="maps"]').click();
    await page.locator('#mapQuery').fill('Eiffel Tower');
    await page.locator('#mapSearch').click();
    await expect(page.locator('.jv4-place').first()).toContainText('Eiffel Tower');
    await expect(page.locator('.jv4-provider')).toContainText('Photon → ArcGIS → Nominatim');
    await expect(page.locator('#mapFrame iframe')).toHaveCount(1);
  });

  test('dashboard local commands still route to modules', async ({ page }) => {
    await page.goto('/');
    await page.locator('#commandInput').fill('Open API Lab');
    await page.locator('#commandForm').locator('button[type="submit"]').click();
    await expect(page.locator('button.nav[data-app="api"]')).toHaveClass(/selected/);
  });

  test('dashboard knowledge questions render an internal answer', async ({ page }) => {
    await page.route('https://api.duckduckgo.com/**', route => route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ AbstractText:'An API gateway is a service that fronts backend APIs and handles routing, authentication, rate limiting and policy enforcement.' }) }));
    await page.goto('/');
    await page.locator('#commandInput').fill('What is an API gateway?');
    await page.locator('#commandForm').locator('button[type="submit"]').click();
    await expect(page.locator('#jarvisReply')).toContainText('An API gateway is a service');
    await expect(page.locator('#jarvisReply')).toContainText('IN-HOUSE');
    await expect(page.locator('#jarvisReply')).toContainText('SEARCH INTERNET');
  });

  test('Research workspace displays results instead of redirecting', async ({ page }) => {
    await page.route('https://api.duckduckgo.com/**', route => route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ AbstractText:'OAuth 2.0 is an authorization framework used to obtain limited access to protected resources.' }) }));
    await page.goto('/');
    await page.locator('.jmc-action[data-jv3-intent="research"]').click();
    await expect(page.getByRole('heading', { name:'Search Hub', exact:true })).toBeVisible();
    await page.locator('#webQuery').fill('OAuth 2.0');
    await page.locator('#webSearch').click();
    await expect(page.locator('#jv3SearchAnswer, #jv4SearchAnswer').filter({ hasText:'OAuth 2.0 is an authorization framework' })).toBeVisible();
    await expect(page.locator('#jv3SearchAnswer, #jv4SearchAnswer').getByRole('button', { name:'SEARCH INTERNET' })).toBeVisible();
    expect(page.context().pages()).toHaveLength(1);
  });
});
