import { chromium } from 'playwright';

const base = process.env.MEDIA_DEMO_URL || 'http://127.0.0.1:8765';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.locator('#query').fill('cats');
  await page.locator('#searchForm').evaluate(form => form.requestSubmit());
  await page.locator('#status').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelector('#player')?.src);

  const result = await page.evaluate(() => ({
    status: document.querySelector('#status')?.textContent || '',
    title: document.querySelector('#results .result strong')?.textContent || '',
    webpageUrl: document.querySelector('#results .result div')?.textContent || '',
    mediaUrl: document.querySelector('#player')?.src || '',
    readyState: document.querySelector('#player')?.readyState ?? 0,
  }));

  if (!result.title) throw new Error('no real search result was rendered');
  if (!result.webpageUrl.includes('youtube.com') && !result.webpageUrl.includes('youtu.be')) {
    throw new Error(`unexpected result URL: ${result.webpageUrl}`);
  }
  if (!result.mediaUrl.startsWith('http')) throw new Error('no playable media URL was assigned');

  await page.locator('#player').evaluate(player => {
    player.addEventListener('error', () => {});
  });
  await page.waitForFunction(() => {
    const player = document.querySelector('#player');
    return player && (player.readyState >= 1 || player.networkState === 3);
  }, null, { timeout: 15000 });

  const finalState = await page.locator('#player').evaluate(player => ({
    readyState: player.readyState,
    networkState: player.networkState,
    error: player.error ? { code: player.error.code, message: player.error.message } : null,
  }));

  if (finalState.error) throw new Error(`HTML5 media error ${finalState.error.code}: ${finalState.error.message}`);
  console.log(JSON.stringify({ ok: true, result, finalState }, null, 2));
} finally {
  await browser.close();
}
