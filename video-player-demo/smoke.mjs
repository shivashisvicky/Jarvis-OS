import { chromium } from 'playwright';

const base = process.env.MEDIA_DEMO_URL || 'http://127.0.0.1:8765';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.locator('#query').fill('cats');
  await page.locator('#searchForm').evaluate(form => form.requestSubmit());
  await page.locator('#results .result').first().waitFor({ state: 'visible', timeout: 60_000 });

  const result = await page.evaluate(() => ({
    status: document.querySelector('#status')?.textContent || '',
    title: document.querySelector('#results .result strong')?.textContent || '',
    webpageUrl: document.querySelector('#results .result div')?.textContent || '',
    embedUrl: document.querySelector('#player iframe')?.getAttribute('src') || '',
  }));

  if (!result.title) throw new Error('no live search result rendered');
  if (!result.webpageUrl.startsWith('https://www.youtube.com/watch?v=')) throw new Error(`unexpected webpage URL: ${result.webpageUrl}`);
  if (!result.embedUrl.startsWith('https://www.youtube-nocookie.com/embed/')) throw new Error(`unexpected embed URL: ${result.embedUrl}`);

  console.log(JSON.stringify({ ok: true, result }, null, 2));
} finally {
  await browser.close();
}
