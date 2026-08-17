import { test, expect } from '@playwright/test';

test.describe('JARVIS dynamic intelligence authority', () => {
  test('video keyword search is query-sensitive and stays in-house', async ({ page }) => {
    await page.route('**/search**', async route => {
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
    expect(page.context().pages()).toHaveLength(1);
  });

  test('generic map search uses non-hardcoded provider chain and changes location', async ({ page }) => {
    await page.route('https://photon.komoot.io/api/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ features: [{ geometry:{coordinates:[2.2945,48.8584]}, properties:{name:'Eiffel Tower',city:'Paris',country:'France'} }] }) }));
    await page.goto('/');
    await page.locator('button.nav[data-app="maps"]').click();
    await page.locator('#mapQuery').fill('Eiffel Tower');
    await page.locator('#mapSearch').click();
    await expect(page.locator('.jv4-place').first()).toContainText('Eiffel Tower');
    await expect(page.locator('.jv4-provider')).toContainText('CARTO tiles');
    await expect(page.locator('#jv4MapHost')).toBeVisible();
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
