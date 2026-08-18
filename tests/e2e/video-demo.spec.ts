import { expect, test } from '@playwright/test';

const demo = '/video-demo/';

test.describe('isolated keyword video player', () => {
  test('starts clean, searches real API shape, and plays the resolved file', async ({ page }) => {
    await page.route('https://archive.org/advancedsearch.php**', async route => {
      const url = new URL(route.request().url());
      expect(url.searchParams.get('output')).toBe('json');
      expect(url.searchParams.get('q')).toContain('mediatype:movies');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: {
            docs: [
              { identifier: 'jarvis-demo-one', title: 'Live Demo Video', creator: 'Demo Archive', date: '2026' },
              { identifier: 'jarvis-demo-two', title: 'Second Demo Video', creator: 'Demo Archive', date: '2025' }
            ]
          }
        })
      });
    });

    await page.route('https://archive.org/metadata/jarvis-demo-one', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ metadata: { title: 'Live Demo Video', creator: 'Demo Archive' }, files: [{ name: 'demo.mp4', format: 'MPEG4', size: '12345' }] })
      });
    });

    await page.route('https://archive.org/metadata/jarvis-demo-two', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ metadata: { title: 'Second Demo Video', creator: 'Demo Archive' }, files: [{ name: 'demo.webm', format: 'WebM', size: '12345' }] })
      });
    });

    await page.goto(demo);
    await expect(page.locator('#results')).toContainText('Search first');
    await expect(page.locator('#video')).toHaveCount(0);

    await page.locator('#query').fill('cats');
    await page.locator('#searchButton').click();
    await expect(page.locator('.card')).toHaveCount(2);
    await expect(page.locator('.card').first()).toContainText('Live Demo Video');

    await page.locator('.card').first().click();
    await expect(page.locator('#video')).toBeVisible();
    await expect(page.locator('#video')).toHaveAttribute('src', 'https://archive.org/download/jarvis-demo-one/demo.mp4');
    await expect(page.locator('#nowPlaying')).toContainText('Live Demo Video');
  });

  test('never invents a playable result when metadata has no browser video', async ({ page }) => {
    await page.route('https://archive.org/advancedsearch.php**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ response: { docs: [{ identifier: 'no-video', title: 'Text Only', creator: 'Archive' }] } })
      });
    });
    await page.route('https://archive.org/metadata/no-video', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ metadata: { title: 'Text Only' }, files: [{ name: 'book.pdf', format: 'Text PDF' }] })
      });
    });

    await page.goto(demo);
    await page.locator('#query').fill('nothing');
    await page.locator('#searchButton').click();
    await expect(page.locator('#results')).toContainText('none exposed a browser-playable MP4/WebM');
    await expect(page.locator('.card')).toHaveCount(0);
  });

  test('LIVE GATE: keyword search resolves an actual archive video', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Run the external-network gate once in Chromium');
    test.setTimeout(45_000);

    await page.goto(demo);
    await page.locator('#query').fill('Apollo 11');
    await page.locator('#searchButton').click();
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 30_000 });
    await page.locator('.card').first().click();
    await expect(page.locator('#video')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#video')).toHaveAttribute('src', /^https:\/\/archive\.org\/download\//);
  });
});
