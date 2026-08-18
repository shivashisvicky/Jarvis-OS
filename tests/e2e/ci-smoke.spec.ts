import { test, expect } from '@playwright/test';

test.describe('JARVIS CI smoke contract', () => {
  test('video search is dynamic and selected results stay in the JARVIS player', async ({ page }) => {
    await page.route('**/__jarvis/video/search**', async route => {
      const q = (new URL(route.request().url()).searchParams.get('q') || '').toLowerCase();
      const items = q.includes('cats')
        ? [{ videoId:'J---aiyznGQ', title:'Cats live result', author:'Cat Channel' }]
        : [{ videoId:'21X5lGlDOfg', title:'Dogs live result', author:'Dog Channel' }];
      await route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ items }) });
    });
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await expect(page.locator('.jv4-video-card').first()).toContainText('Cats live result');
    const cats = await page.locator('.jv4-video-card').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-jv4-video')));
    await page.locator('#videoQuery').fill('dogs');
    await page.locator('#videoSearch').click();
    await expect(page.locator('.jv4-video-card').first()).toContainText('Dogs live result');
    const dogs = await page.locator('.jv4-video-card').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-jv4-video')));
    expect(dogs).not.toEqual(cats);
    await page.locator('.jv4-video-card').first().click();
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/21X5lGlDOfg/);
    expect(page.context().pages()).toHaveLength(1);
  });

  test('TRENDING is dynamic and does not use the canned four-video catalog', async ({ page }) => {
    await page.route('**/__jarvis/video/trending**', route => route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ items:[{ videoId:'aqz-KE-bpKQ', title:'Live trending acceptance result', author:'Live Channel' }] }) }));
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await page.getByRole('button', { name:'TRENDING', exact:true }).click();
    await expect(page.locator('.jv4-video-card').first()).toContainText('Live trending acceptance result');
    await expect(page.locator('#videoResults')).not.toContainText('Big Buck Bunny');
    await expect(page.locator('#videoResults')).not.toContainText('Nyan Cat');
  });

  test('provider exhaustion shows a real unavailable state instead of static videos or redirect', async ({ page }) => {
    await page.route('**/*', async route => {
      const u = route.request().url();
      if (/__jarvis\/video\/(search|trending)|pipedapi|piped-api|invidious|youtube\.com\/results/.test(u)) return route.abort();
      return route.continue();
    });
    await page.goto('/');
    await page.locator('button.nav[data-app="media"]').click();
    await page.locator('#videoQuery').fill('quantum waffles 987654321');
    await page.locator('#videoSearch').click();
    await expect(page.locator('#videoResults')).toContainText('LIVE VIDEO INDEX UNAVAILABLE', { timeout:15000 });
    await expect(page.locator('#videoResults .jv4-video-card')).toHaveCount(0);
    expect(page.url()).not.toMatch(/youtube\.com|bing\.com/i);
  });

  test('maps, Command and Research stay inside JARVIS', async ({ page }) => {
    await page.route('**/__jarvis/geo**', route => route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ items:[{lat:48.8584,lon:2.2945,name:'Eiffel Tower',detail:'Eiffel Tower, Paris, France'}] }) }));
    await page.route('https://api.duckduckgo.com/**', route => route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ AbstractText:'An API gateway is a service that fronts backend APIs.' }) }));
    await page.goto('/');
    await page.locator('button.nav[data-app="maps"]').click();
    await page.locator('#mapQuery').fill('Eiffel Tower');
    await page.locator('#mapSearch').click();
    await expect(page.locator('.jv4-place').first()).toContainText('Eiffel Tower');
    await expect(page.locator('#mapFrame iframe')).toHaveCount(1);
    await page.locator('button.nav[data-app="home"]').click();
    await page.locator('#commandInput').fill('What is an API gateway?');
    await page.locator('#commandForm button[type="submit"]').click();
    await expect(page.locator('#jarvisReply')).toContainText('IN-HOUSE');
    await expect(page.locator('#jarvisReply')).toContainText('An API gateway is a service');
    await expect(page.locator('#jarvisReply')).toContainText('SEARCH INTERNET');
    await page.locator('.command-chips button[data-command="Search the web for AI news"]').click();
    await expect(page.getByRole('heading', { name:'Search Hub', exact:true })).toBeVisible();
    expect(page.context().pages()).toHaveLength(1);
  });

  test('news text, Snake mobile controls, 2048 and Tetris render without destructive refresh', async ({ page }) => {
    await page.route('https://api.gdeltproject.org/**', route => route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ articles:[{ title:'Text-only headline', url:'https://example.test/1', domain:'example.test' }] }) }));
    await page.goto('/');
    await expect(page.locator('#newsCards')).toContainText('Text-only headline');
    await page.locator('button.nav[data-app="snake"]').click();
    await expect(page.locator('#snakeCanvas')).toBeVisible();
    await expect(page.locator('.snake-pad [data-d="up"]')).toBeVisible();
    await page.locator('#jarvisGamesNav').click();
    await expect(page.locator('#g2048')).toBeVisible();
    await expect(page.locator('#tet')).toBeVisible();
    await expect(page.locator('.jgame-pad')).toHaveCount(2);
    const before = await page.url();
    await page.waitForTimeout(1600);
    expect(page.url()).toBe(before);
    await expect(page.locator('#g2048')).toBeVisible();
    await expect(page.locator('#tet')).toBeVisible();
  });
});
