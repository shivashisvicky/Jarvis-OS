import { test, expect } from '@playwright/test';

test.describe('JARVIS final resilience acceptance', () => {
  test('live video search is query-sensitive and in-shell', async ({ page }) => {
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
    expect(page.context().pages()).toHaveLength(1);
  });

  test('selected video uses the internal JARVIS player', async ({ page }) => {
    await page.route('**/__jarvis/video/search**', route => route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ items:[{ videoId:'J---aiyznGQ', title:'Playable cats result', author:'Cat Channel' }] }) }));
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await page.locator('.jv4-video-card').first().click();
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/J---aiyznGQ/);
    expect(page.context().pages()).toHaveLength(1);
  });

  test('provider exhaustion does not recycle canned videos', async ({ page }) => {
    await page.route('**/*', async route => {
      const u = route.request().url();
      if (/pipedapi|invidious|r\.jina\.ai|youtube\.com\/results/.test(u)) return route.abort();
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

  test('TRENDING remains an in-house live feed', async ({ page }) => {
    await page.route('**/__jarvis/video/trending**', route => route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ items:[{ videoId:'21X5lGlDOfg', title:'Live trending result', author:'Live Channel' }] }) }));
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await page.getByRole('button', { name:'TRENDING', exact:true }).click();
    await expect(page.locator('#videoQuery')).toHaveValue('trending videos India');
    await expect(page.locator('.jv4-video-card').first()).toContainText('Live trending result');
    await page.locator('.jv4-video-card').first().click();
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/21X5lGlDOfg/);
    expect(page.context().pages()).toHaveLength(1);
  });

  test('mobile YouTube URL resolves to the same internal player', async ({ page }) => {
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await page.locator('#videoUrl').fill('https://m.youtube.com/watch?v=limjpmSRrdE&si=1t1qckOxWZmxUGmZ');
    await page.locator('#playVideo').click();
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/limjpmSRrdE/);
    expect(page.context().pages()).toHaveLength(1);
  });

  test('arbitrary map search uses in-house contract and renders selected location', async ({ page }) => {
    await page.route('**/__jarvis/geo**', route => route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ items:[{lat:48.8584,lon:2.2945,name:'Eiffel Tower',detail:'Eiffel Tower, Paris, France'}] }) }));
    await page.goto('/');
    await page.locator('button.nav[data-app="maps"]').click();
    await page.locator('#mapQuery').fill('Eiffel Tower');
    await page.locator('#mapSearch').click();
    await expect(page.locator('.jv4-place').first()).toContainText('Eiffel Tower');
    await expect(page.locator('.jv4-provider')).toContainText('Photon → ArcGIS → Nominatim');
    await expect(page.locator('#mapFrame iframe')).toHaveAttribute('src', /48\.8234/);
  });

  test('dashboard knowledge questions are answered in-house, while local commands still route', async ({ page }) => {
    await page.route('https://api.duckduckgo.com/**', route => route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ AbstractText:'An API gateway is a service that fronts backend APIs and handles routing, authentication, rate limiting and policy enforcement.' }) }));
    await page.goto('/');
    await page.locator('#commandInput').fill('What is an API gateway?');
    await page.locator('#commandForm').locator('button[type="submit"]').click();
    await expect(page.locator('#jarvisReply')).toContainText('IN-HOUSE');
    await expect(page.locator('#jarvisReply')).toContainText('An API gateway is a service');
    await page.locator('#commandInput').fill('Open API Lab');
    await page.locator('#commandForm').locator('button[type="submit"]').click();
    await expect(page.locator('button.nav[data-app="api"]')).toHaveClass(/selected/);
  });

  test('Research renders results without redirecting and exposes explicit internet fallback', async ({ page }) => {
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
