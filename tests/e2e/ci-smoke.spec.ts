import { expect, test, type Page } from '@playwright/test';

const LIVE_HOSTS = [
  'pipedapi.tokhmi.xyz','pipedapi.moomoo.me','piped-api.garudalinux.org','api.piped.privacydev.net',
  'pipedapi.smnz.de','pipedapi.adminforge.de','pipedapi.qdi.fi','piped-api.hostux.net',
  'inv.nadeko.net','invidious.nerdvpn.de','yt.chocolatemoo53.com','invidious.tiekoetter.com',
  'invidious.f5.si','inv.zoomerville.com','corsproxy.io','api.allorigins.win','www.youtube.com',
];

const openMedia = async (page: Page) => {
  await page.goto('/');
  await page.locator('button.nav[data-app="media"]').click();
  await expect(page.locator('#videoQuery')).toBeVisible();
  await expect(page.locator('#videoSearch')).toBeVisible();
};

const blockLiveHosts = async (page: Page) => {
  for (const host of LIVE_HOSTS) await page.route(`https://${host}/**`, route => route.abort('failed'));
};

const mockPiped = async (page: Page, resolver: (query: string) => unknown[]) => {
  await blockLiveHosts(page);
  await page.unroute('https://pipedapi.tokhmi.xyz/**');
  await page.route('https://pipedapi.tokhmi.xyz/search**', async route => {
    const query = new URL(route.request().url()).searchParams.get('q') || '';
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: resolver(query) }) });
  });
};

test.describe('JARVIS live media contract', () => {
  test('shell boots and media stays inside JARVIS', async ({ page }) => {
    await openMedia(page);
    expect(page.url()).toMatch(/\/$/);
    expect(page.context().pages()).toHaveLength(1);
  });

  test('keyword-specific live results change with the query', async ({ page }) => {
    await mockPiped(page, query => query.toLowerCase().includes('cats')
      ? [{ videoId:'dQw4w9WgXcQ', title:'Cats live result', uploaderName:'Test Channel', type:'stream' }]
      : [{ videoId:'J---aiyznGQ', title:'Dogs live result', uploaderName:'Test Channel', type:'stream' }]);
    await openMedia(page);

    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await expect(page.locator('.jvs-card')).toHaveCount(1);
    await expect(page.locator('.jvs-card strong')).toHaveText('Cats live result');

    await page.locator('#videoQuery').fill('dogs');
    await page.locator('#videoSearch').click();
    await expect(page.locator('.jvs-card')).toHaveCount(1);
    await expect(page.locator('.jvs-card strong')).toHaveText('Dogs live result');
    await expect(page.locator('.jvs-card')).not.toContainText('Cats live result');
  });

  test('ALL / VIDEOS / SHORTS are real filters and preserve the canonical URL contract', async ({ page }) => {
    await mockPiped(page, () => [
      { videoId:'dQw4w9WgXcQ', title:'Normal live video', uploaderName:'Test Channel', type:'stream' },
      { videoId:'J---aiyznGQ', title:'Live short result', uploaderName:'Test Channel', type:'short' },
    ]);
    await openMedia(page);
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();

    await expect(page.locator('#jvsFilters')).toBeVisible();
    await expect(page.locator('#jvsFilters button')).toHaveText(['ALL','VIDEOS','SHORTS']);
    await expect(page.locator('.jvs-card')).toHaveCount(2);

    await page.locator('[data-jvs-mode="videos"]').click();
    await expect(page.locator('.jvs-card')).toHaveCount(1);
    await expect(page.locator('.jvs-card strong')).toHaveText('Normal live video');

    await page.locator('[data-jvs-mode="shorts"]').click();
    await expect(page.locator('.jvs-card')).toHaveCount(1);
    await expect(page.locator('.jvs-card strong')).toHaveText('Live short result');

    await page.locator('[data-jvs-mode="all"]').click();
    await expect(page.locator('.jvs-card')).toHaveCount(2);

    const urls = await page.evaluate(() => {
      const fn = (window as unknown as { jarvisVideoSearchUrl?: (q: string) => string }).jarvisVideoSearchUrl!;
      return [fn('cats'), fn('cats & kittens')];
    });
    expect(urls[0]).toBe('https://www.youtube.com/results?search_query=cats');
    expect(urls[1]).toBe('https://www.youtube.com/results?search_query=cats%20%26%20kittens');
  });

  test('selected result plays inside the JARVIS player', async ({ page }) => {
    await mockPiped(page, () => [{ videoId:'dQw4w9WgXcQ', title:'Playable live result', uploaderName:'Test Channel', type:'stream' }]);
    await openMedia(page);
    await page.locator('#videoQuery').fill('cats');
    await page.locator('#videoSearch').click();
    await page.locator('.jvs-card').click();
    await expect(page.locator('#jarvisPlayer iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
    await expect(page.locator('#mediaState')).toContainText('PLAYING');
    expect(page.context().pages()).toHaveLength(1);
    expect(page.url()).toMatch(/\/$/);
  });

  test('provider exhaustion never invents a canned or static result', async ({ page }) => {
    await blockLiveHosts(page);
    await openMedia(page);
    await page.locator('#videoQuery').fill('unreachable test query');
    await page.locator('#videoSearch').click();
    await expect(page.locator('#videoResults')).toContainText('NO LIVE RESULTS', { timeout: 15000 });
    await expect(page.locator('#videoResults .jvs-card')).toHaveCount(0);
    await expect(page.locator('#videoResults')).not.toContainText('SAP CPI fixture tutorial');
    await expect(page.locator('#videoResults')).not.toContainText('Nyan Cat');
    await expect(page.locator('#videoResults')).not.toContainText('Big Buck Bunny');
  });
});
