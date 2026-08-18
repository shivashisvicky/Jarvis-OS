import { expect, test, type Page } from '@playwright/test';

const LOCAL_MEDIA = '**/127.0.0.1:8765/**';
const attachMediaDiagnostics = (page: Page) => page.on('console', msg => { if (msg.text().includes('[JARVIS MEDIA')) console.log(`[browser] ${msg.text()}`); });
const dumpMediaDiagnostics = async (page: Page, label: string) => console.log(`[JARVIS MEDIA DIAGNOSTIC] ${JSON.stringify(await page.evaluate(reason => ({ reason, trace: (window as any).__JARVIS_MEDIA_TRACE__ || [], dom: { cards: document.querySelectorAll('.jyt-card').length, degraded: document.querySelectorAll('.media-degraded-state').length, status: document.querySelector('#mediaState, .video-status, .media-status, #videoStatus')?.textContent || null } })), null, 2)}`);

const mockLocalSuccess = async (page: Page, message = "Success: Now playing 'Live PeerTube result'.") => {
  await page.route(LOCAL_MEDIA, async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, message }) });
  });
};
const mockLocalFailure = async (page: Page) => {
  await page.route(LOCAL_MEDIA, async route => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, message: 'Media service unavailable' }) });
  });
};
const openMedia = async (page: Page) => {
  attachMediaDiagnostics(page);
  await page.goto('/');
  await page.locator('button.nav[data-app="media"]').click();
  await expect(page.locator('#videoQuery')).toBeVisible();
  await expect(page.locator('#videoSearch')).toBeVisible();
};

test.describe('JARVIS CI smoke contract', () => {
  test.afterEach(async ({ page }, testInfo) => { if (testInfo.status !== testInfo.expectedStatus) await dumpMediaDiagnostics(page, `${testInfo.title} · ${testInfo.status}`); });

  test('shell boots and media has one runtime authority', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.brand')).toContainText('J.A.R.V.I.S');
    for (const old of ['jarvis-media-core-v7','jarvis-media-authority-v8','jarvis-media-authority-v10','jarvis-media-authority-v11']) await expect(page.locator(`script[src*="${old}"]`)).toHaveCount(0);
    await expect(page.locator('script[src*="jarvis-media-authority.js"]')).toHaveCount(1);
    await page.locator('button.nav[data-app="media"]').click();
    await expect(page.locator('#videoQuery')).toBeVisible();
    await expect(page.locator('#videoSearch')).toBeVisible();
  });

  test('keyword search is delegated to local media service', async ({ page }) => {
    await mockLocalSuccess(page);
    await openMedia(page);
    await page.locator('#videoQuery').fill('lofi hip hop');
    await page.locator('#videoSearch').click();
    await expect(page.locator('#videoResults')).toContainText('Now playing');
    await expect(page.locator('#videoResults')).not.toContainText('Nyan Cat');
  });

  test('direct YouTube Shorts URL is passed unchanged to local extractor', async ({ page }) => {
    let payload: any = null;
    await page.route(LOCAL_MEDIA, async route => {
      payload = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, message: "Success: Now playing 'YouTube Short'." }) });
    });
    await openMedia(page);
    const shorts = 'https://youtube.com/shorts/JbgYndCSv3k?si=FBKBwiQ2HLDCeijY';
    await page.locator('#videoQuery').fill(shorts);
    await page.locator('#videoSearch').click();
    await expect.poll(() => payload?.query).toBe(shorts);
    await expect(page.locator('#videoResults')).toContainText('YouTube Short');
  });

  test('direct YouTube watch URL is passed unchanged to local extractor', async ({ page }) => {
    let payload: any = null;
    await page.route(LOCAL_MEDIA, async route => {
      payload = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, message: "Success: Now playing 'YouTube video'." }) });
    });
    await openMedia(page);
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    await page.locator('#videoQuery').fill(url);
    await page.locator('#videoSearch').click();
    await expect.poll(() => payload?.query).toBe(url);
    await expect(page.locator('#videoResults')).toContainText('YouTube video');
  });

  test('local media service failure never fabricates results', async ({ page }) => {
    await mockLocalFailure(page);
    await openMedia(page);
    await page.locator('#videoQuery').fill('unreachable test query');
    await page.locator('#videoSearch').click();
    await expect(page.locator('.media-degraded-state')).toBeVisible();
    await expect(page.locator('#videoResults')).toContainText('LOCAL MEDIA SERVICE UNAVAILABLE');
    await expect(page.locator('#videoResults')).toContainText('NETWORK DIAGNOSTIC');
    await expect(page.locator('#videoResults')).not.toContainText('Nyan Cat');
  });
});
