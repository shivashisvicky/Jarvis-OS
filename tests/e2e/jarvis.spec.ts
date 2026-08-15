import { expect, test, type Page } from '@playwright/test';

const nav = (page: Page, app: string) => page.locator(`button.nav[data-app="${app}"]`);

test('Jarvis boots as a command-centric intelligence workspace', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('J.A.R.V.I.S. OS');
  await expect(page.getByText('J.A.R.V.I.S', { exact: true })).toBeVisible();
  await expect(page.getByText('Command', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('COMMAND CHANNEL', { exact: true })).toBeVisible();
  await expect(page.getByText('Tools at your command', { exact: true })).toBeVisible();
});

test('command palette opens and exposes apps', async ({ page }) => {
  await page.goto('/');
  await page.locator('#paletteBtn').click();
  const palette = page.locator('#paletteHost .palette');
  await expect(palette).toBeVisible();
  await expect(palette.locator('[data-palette-app="api"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(palette).toHaveCount(0);
});

test('calculator works', async ({ page }) => {
  await page.goto('/');
  await nav(page, 'calculator').click();
  await page.getByRole('button', { name: '7' }).click();
  await page.getByRole('button', { name: '+' }).click();
  await page.getByRole('button', { name: '5' }).click();
  await page.getByRole('button', { name: '=' }).click();
  await expect(page.locator('#display')).toHaveValue('12');
});

test('notes persist', async ({ page }) => {
  await page.goto('/');
  await nav(page, 'notes').click();
  await page.locator('#note').fill('Jarvis SIT persistence');
  await page.getByRole('button', { name: 'SAVE NOTE' }).click();
  await expect(page.getByText('Jarvis SIT persistence')).toBeVisible();
});

test('REST API Lab renders and accepts request data', async ({ page }) => {
  await page.goto('/');
  await nav(page, 'api').click();
  await expect(page.getByRole('heading', { name: 'API Lab', exact: true })).toBeVisible();
  await page.locator('#httpUrl').fill('https://example.com/api');
  await page.locator('#httpHeaders').fill('{"Accept":"application/json"}');
  await expect(page.locator('#httpUrl')).toHaveValue('https://example.com/api');
});

test('live news desk renders visual headlines and moving ticker', async ({ page }) => {
  await page.route('https://api.gdeltproject.org/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        articles: [
          { title: 'JARVIS test headline: quantum systems advance', url: 'https://example.com/news/1', socialimage: 'https://example.com/image-1.jpg', domain: 'example.com', sourcecountry: 'US' },
          { title: 'JARVIS test headline: new AI research lands', url: 'https://example.com/news/2', socialimage: 'https://example.com/image-2.jpg', domain: 'example.org', sourcecountry: 'IN' },
        ],
      }),
    });
  });
  await page.goto('/');
  await expect(page.locator('.news-desk')).toBeVisible();
  await expect(page.locator('.news-card strong', { hasText: 'JARVIS test headline: quantum systems advance' })).toBeVisible();
  await expect(page.locator('.news-track')).toBeVisible();
  await expect(page.locator('.news-card img')).toHaveCount(2);
  await expect(page.locator('[data-news-query="AI OR artificial intelligence"]')).toBeVisible();
});

test('media search works from keywords without requiring a URL', async ({ page }) => {
  await page.route('https://pipedapi.kavin.rocks/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/search') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ title: 'SAP CPI tutorial for integration architects', url: '/watch?v=jarvis12345', thumbnail: 'https://example.com/thumb.jpg', uploader: 'JARVIS Labs', duration: 321, views: 12000 }]),
      });
      return;
    }
    if (url.pathname === '/streams/jarvis12345') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'SAP CPI tutorial for integration architects', thumbnailUrl: 'https://example.com/thumb.jpg', videoStreams: [{ url: 'https://cdn.example.com/video.mp4', mimeType: 'video/mp4', format: 'MPEG_4', height: 720, videoOnly: false }] }),
      });
      return;
    }
    await route.continue();
  });
  await page.goto('/');
  await nav(page, 'media').click();
  await page.locator('#videoQuery').fill('SAP CPI tutorial');
  await page.locator('#videoSearch').click();
  await expect(page.locator('.video-result')).toBeVisible();
  await expect(page.getByText('SAP CPI tutorial for integration architects')).toBeVisible();
  await page.locator('.video-result').click();
  await expect(page.locator('#jarvisPlayer video')).toHaveAttribute('src', 'https://cdn.example.com/video.mp4');
});

test('media keyword search gives a useful empty-query state', async ({ page }) => {
  await page.goto('/');
  await nav(page, 'media').click();
  await page.locator('#videoSearch').click();
  await expect(page.getByText('Enter keywords and JARVIS will find videos for you.')).toBeVisible();
});

test('search, maps and media stay inside the JARVIS shell until external search is requested', async ({ page }) => {
  await page.goto('/');
  await nav(page, 'web').click();
  await expect(page.getByRole('heading', { name: 'Search Hub', exact: true })).toBeVisible();
  await expect(page.locator('#webQuery')).toBeVisible();

  await nav(page, 'maps').click();
  await expect(page.getByRole('heading', { name: 'Maps', exact: true })).toBeVisible();
  await expect(page.locator('#mapFrame')).toBeVisible();

  await nav(page, 'media').click();
  await expect(page.getByRole('heading', { name: 'Media Center', exact: true })).toBeVisible();
  await expect(page.locator('#jarvisPlayer')).toBeVisible();
});

test('settings exposes voice and search configuration', async ({ page }) => {
  await page.goto('/');
  await nav(page, 'settings').click();
  await expect(page.locator('#searchEngine')).toBeVisible();
  await expect(page.locator('#voiceRate')).toBeVisible();
  await expect(page.locator('#voicePitch')).toBeVisible();
  await expect(page.locator('#voiceVolume')).toBeVisible();
});


test('media auto-loads trending videos and searches by keyword', async ({ page }) => {
  await page.route('https://pipedapi.kavin.rocks/**', async route => {
    const url = route.request().url();
    if (url.includes('/trending')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ title: 'JARVIS fixture video', url: '/watch?v=abc123def45', videoId: 'abc123def45', thumbnail: 'https://example.com/thumb.jpg', uploader: 'JARVIS Lab', uploadedDate: 'today', views: 1234 }]) });
    if (url.includes('/search?')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [{ title: 'SAP CPI fixture tutorial', url: '/watch?v=abc123def45', videoId: 'abc123def45', thumbnail: 'https://example.com/thumb.jpg', uploader: 'JARVIS Lab', uploadedDate: 'today', views: 42 }] }) });
    if (url.includes('/streams/')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ thumbnailUrl: 'https://example.com/thumb.jpg', videoStreams: [{ mimeType: 'video/mp4', videoOnly: false, quality: '360p', height: 360, url: 'https://example.com/video.mp4' }] }) });
    return route.continue();
  });
  await page.goto('/');
  await page.locator('button.nav[data-app="media"]').click();
  await expect(page.locator('.video-result')).toHaveCount(1);
  await page.locator('#videoQuery').fill('SAP CPI tutorial');
  await page.getByRole('button', { name: 'SEARCH', exact: true }).click();
  await expect(page.locator('.video-result')).toContainText('SAP CPI fixture tutorial');
  await page.locator('.video-result').click();
  await expect(page.locator('#jarvisPlayer video')).toBeVisible();
});

test('news desk renders a real JARVIS brief summary', async ({ page }) => {
  await page.route('https://api.gdeltproject.org/**', async route => {
    const url = route.request().url();
    if (url.includes('/context/context')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ articles: [{ context: 'JARVIS summary: researchers announced a new quantum systems advance, highlighting improved stability and practical applications.' }] }) });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ articles: [{ title: 'JARVIS quantum systems advance', url: 'https://example.com/news/1', socialimage: 'https://example.com/news.jpg', domain: 'example.com', sourcecountry: 'US' }, { title: 'JARVIS AI research update', url: 'https://example.com/news/2', socialimage: 'https://example.com/news2.jpg', domain: 'example.com', sourcecountry: 'US' }] }) });
  });
  await page.goto('/');
  await expect(page.locator('.news-card')).toHaveCount(2);
  await expect(page.locator('.news-card p').first()).toContainText('JARVIS summary: researchers announced');
  await expect(page.locator('#newsTicker')).toBeVisible();
});\n