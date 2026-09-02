import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;
const APP_URL = LIVE_URL || '/';

async function openHome(page) {
  await page.goto(LIVE_URL ? new URL(LIVE_URL).toString() : APP_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.nav[data-app="home"]')).toBeVisible({ timeout: 30_000 });
  await page.locator('.nav[data-app="home"]').click();
}

async function waitForMapResults(page) {
  await expect.poll(async () => page.locator('#mapResults [data-jarvis-map-v26]').count(), { timeout: 30_000 }).toBeGreaterThan(0);
  await expect(page.locator('#mapFrame')).toBeVisible();
}

async function submitCommand(page, text) {
  const command = page.locator('#commandInput');
  await command.fill(text);
  await page.locator('#commandForm').press('Enter');
}

test('standalone Beowulf command opens Gutenberg and speaks', async ({ page }) => {
  await page.addInitScript(() => {
    const spoken: string[] = [];
    Object.defineProperty(window, '__JARVIS_TEST_SPOKEN__', { value: spoken, configurable: true });
    const original = window.speechSynthesis?.speak?.bind(window.speechSynthesis);
    if (original) {
      window.speechSynthesis.speak = ((utterance: SpeechSynthesisUtterance) => {
        spoken.push(String(utterance.text || ''));
      }) as typeof window.speechSynthesis.speak;
    }
  });
  await openHome(page);
  await submitCommand(page, 'Beowulf');
  await expect(page.locator('.page-head h1')).toHaveText(/Files|Ebooks/i, { timeout: 30_000 });
  await expect.poll(async () => page.locator('#jbe6Results .jbe6-book').count(), { timeout: 30_000 }).toBeGreaterThan(0);
  await expect.poll(async () => page.evaluate(() => (window as any).__JARVIS_TEST_SPOKEN__?.length || 0), { timeout: 8_000 }).toBeGreaterThan(0);
  await expect(page.evaluate(() => (window as any).__JARVIS_TEST_SPOKEN__?.join(' '))).toMatch(/Gutenberg|ebook|library/i);
});

test('MAPS context survives returning home and owns natural nearest follow-ups', async ({ page }) => {
  await openHome(page);
  await submitCommand(page, 'show me restaurants in Jagannath Nagar');
  await expect(page.locator('.page-head h1')).toHaveText('Maps');
  await waitForMapResults(page);

  const firstName = (await page.locator('#mapResults [data-jarvis-map-v26]').first().locator('strong').innerText()).replace(/^\d+\.\s*/, '').trim();

  await page.locator('.nav[data-app="home"]').click();
  await expect(page.locator('#commandInput')).toBeVisible();

  for (const phrase of ['Which one is the nearest one', 'Which is the nearest one', 'The nearest restaurant']) {
    await submitCommand(page, phrase);
    await expect(page.locator('#jarvisReply')).toContainText(/nearest option/i, { timeout: 8_000 });
    await expect(page.locator('#jarvisReply')).toContainText(firstName);
    await expect(page.locator('#jarvisReply')).not.toContainText(/Beowulf|current location|more context/i);
  }
});

test('MAPS selected restaurant resolves contextual take-me-there', async ({ page }) => {
  await openHome(page);
  await submitCommand(page, 'show me restaurants in Jagannath Nagar');
  await expect(page.locator('.page-head h1')).toHaveText('Maps');
  await waitForMapResults(page);

  const firstName = (await page.locator('#mapResults [data-jarvis-map-v26]').first().locator('strong').innerText()).replace(/^\d+\.\s*/, '').trim();
  await submitCommand(page, 'Which one is the nearest one');
  await expect(page.locator('#jarvisReply')).toContainText(firstName, { timeout: 8_000 });

  await submitCommand(page, 'Take me there');
  await expect(page.locator('#jarvisReply')).toContainText(/opening maps/i, { timeout: 8_000 });
  await expect(page.locator('#mapQuery')).toHaveValue(firstName);
  await waitForMapResults(page);
  await expect(page.locator('#mapResults')).toContainText(firstName);
});

test('MAPS context blocks stale book references instead of falling into web search', async ({ page }) => {
  await openHome(page);
  await submitCommand(page, 'show me restaurants in Jagannath Nagar');
  await expect(page.locator('.page-head h1')).toHaveText('Maps');
  await waitForMapResults(page);
  await page.locator('.nav[data-app="home"]').click();

  await submitCommand(page, 'read the first one');
  await expect(page.locator('.nav[data-app="web"]')).not.toHaveClass(/selected/);
  await expect(page.locator('#jarvisReply')).toContainText(/current book result list|search for a book first/i, { timeout: 8_000 });
});

test('BOOKS to MAPS cross-surface sequence keeps latest MAPS ownership', async ({ page }) => {
  await openHome(page);
  await submitCommand(page, 'Beowulf');
  await expect(page.locator('.page-head h1')).toHaveText(/Files|Ebooks/i, { timeout: 30_000 });
  await expect.poll(async () => page.locator('#jbe6Results .jbe6-book').count(), { timeout: 30_000 }).toBeGreaterThan(0);

  await submitCommand(page, 'read the first one');
  await expect(page.locator('#jarvisReply')).not.toContainText(/current book result list|search for a book first/i, { timeout: 8_000 });

  await submitCommand(page, 'show me restaurants in Jagannath Nagar');
  await expect(page.locator('.page-head h1')).toHaveText('Maps', { timeout: 8_000 });
  await waitForMapResults(page);

  await submitCommand(page, 'open the third one');
  await expect.poll(async () => page.locator('#mapFrame iframe').count(), { timeout: 8_000 }).toBeGreaterThan(0);
});

test('BOOKS to MAPS to YOUTUBE transfers ordinal ownership to the latest result list', async ({ page }) => {
  await page.route('**/api/search*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          { id: 'yt-test-001', title: 'Test Video One', channel: 'JARVIS Test', thumbnail: '' },
          { id: 'yt-test-002', title: 'Test Video Two', channel: 'JARVIS Test', thumbnail: '' },
          { id: 'yt-test-003', title: 'Test Video Three', channel: 'JARVIS Test', thumbnail: '' },
        ],
      }),
    });
  });

  await openHome(page);
  await submitCommand(page, 'Beowulf');
  await expect(page.locator('.page-head h1')).toHaveText(/Files|Ebooks/i, { timeout: 30_000 });
  await expect.poll(async () => page.locator('#jbe6Results .jbe6-book').count(), { timeout: 30_000 }).toBeGreaterThan(0);

  await submitCommand(page, 'show me restaurants in Delhi');
  await expect(page.locator('.page-head h1')).toHaveText('Maps', { timeout: 8_000 });
  await waitForMapResults(page);

  await submitCommand(page, 'search YouTube for test videos');
  await expect(page.locator('.nav[data-app="media"]')).toHaveClass(/selected/, { timeout: 15_000 });
  await expect.poll(async () => page.locator('#videoResults [data-jvc-id]').count(), { timeout: 15_000 }).toBe(3);

  await submitCommand(page, 'open the third one');
  await expect(page.locator('.nav[data-app="media"]')).toHaveClass(/selected/, { timeout: 8_000 });
  await expect.poll(async () => page.locator('#jarvisPlayer').getAttribute('data-video-id'), { timeout: 8_000 }).toBe('yt-test-003');
});