import { expect, test } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;

async function waitForShell(page: any) {
  if (!LIVE_URL) throw new Error('JARVIS_LIVE_URL is required');
  await page.goto(LIVE_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#app')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#commandForm')).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => page.evaluate(() => document.readyState)).toBe('complete', { timeout: 20_000 });
}

async function assertVoiceHealthy(page: any, label: string) {
  const state = await page.evaluate(() => {
    const voice = document.querySelector('#voiceBtn');
    const stop = [...document.querySelectorAll('button,[role="button"]')].find(el => /\bstop\s+voice\b/i.test(`${el.textContent || ''} ${el.getAttribute?.('aria-label') || ''}`));
    const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
    return {
      listening: Boolean(voice?.classList.contains('listening') || voice?.getAttribute('aria-pressed') === 'true' || voice?.getAttribute('data-listening') === '1'),
      stopSpeaking: stop?.getAttribute('data-jarvis-speaking') || '0',
      speaking: Boolean(synth?.speaking),
      pending: Boolean(synth?.pending),
      reply: document.querySelector('#jarvisReply')?.textContent?.trim() || ''
    };
  });
  expect(state.listening, `${label}: microphone/listening state stuck`).toBe(false);
  expect(state.stopSpeaking, `${label}: STOP VOICE state stuck`).toBe('0');
  return state;
}

async function submit(page: any, command: string) {
  const input = page.locator('#commandInput');
  await expect(input).toBeVisible({ timeout: 10_000 });
  await input.fill(command);
  await page.locator('#commandForm button[type="submit"]').click();
  await expect.poll(() => page.evaluate(() => ({
    route: (window as any).jarvisCommandAuthority?.get?.()?.type || '',
    text: document.querySelector('#jarvisReply')?.textContent?.trim() || '',
    query: document.querySelector('#jbe6Query')?.value?.trim() || ''
  })), { timeout: 15_000 }).not.toEqual(expect.objectContaining({ text: '' }));
}

async function readFirst(page: any, label: string) {
  await page.locator('#commandInput').fill('read the first one');
  await page.locator('#commandForm button[type="submit"]').click();
  await expect.poll(() => page.evaluate(() => Boolean(document.querySelector('.jbe2-reader,.jber'))), { timeout: 15_000 }).toBe(true);
  await expect.poll(() => page.evaluate(() => {
    const p = document.querySelector('#jbe2Page,#jberPage');
    return (p?.textContent || '').trim().length;
  }), { timeout: 20_000 }).toBeGreaterThan(80);
  const title = await page.evaluate(() => document.querySelector('.jbe2-title,.jber-title')?.textContent?.trim() || '');
  expect(title, `${label}: reader opened without a title`).toBeTruthy();
  await page.locator('.jbe2-reader .jbe2-btn, .jber button').filter({ hasText: /CLOSE/i }).first().click().catch(() => {});
  await page.evaluate(() => document.querySelector('.jbe2-reader,.jber')?.remove());
}

test('POST-DEPLOY REGRESSION GATE: sequential command authority + ebook context + time + voice release', async ({ page }) => {
  await waitForShell(page);

  // 1. Bare title -> Gutenberg result list.
  await submit(page, 'Beowulf');
  await expect(page.locator('#jbe6Panel')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#jbe6Query')).toHaveValue('Beowulf', { timeout: 10_000 });
  await expect(page.locator('#jbe6Results .jbe6-book').first()).toBeVisible({ timeout: 25_000 });
  await expect(page.locator('#jbe6Results .jbe6-name').first()).toContainText(/Beowulf/i);
  await expect(page.locator('#jbe6StatusLine')).toContainText(/GUTENBERG/i);
  await assertVoiceHealthy(page, 'Beowulf');

  // 2. Contextual follow-up must resolve against the current ebook result set.
  await readFirst(page, 'Beowulf -> read first one');
  await assertVoiceHealthy(page, 'Beowulf read first one');

  // 3. Author entity -> Gutenberg author evidence -> ebook list, never UNKNOWN/no-op.
  await page.locator('#commandInput').fill('John Henry Newman');
  await page.locator('#commandForm button[type="submit"]').click();
  await expect.poll(() => page.evaluate(() => ({
    entity: (window as any).__JARVIS_ENTITY__ || null,
    route: (window as any).jarvisCommandAuthority?.get?.()?.type || '',
    query: document.querySelector('#jbe6Query')?.value?.trim() || ''
  })), { timeout: 20_000 }).toMatchObject({ entity: expect.objectContaining({ type: 'BOOK_AUTHOR', source: 'gutenberg' }) });
  await expect(page.locator('#jbe6Panel')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#jbe6Query')).toHaveValue('John Henry Newman', { timeout: 10_000 });
  await expect(page.locator('#jbe6Results .jbe6-book').first()).toBeVisible({ timeout: 25_000 });
  await expect(page.locator('#jbe6Results')).toContainText(/Newman/i);
  await assertVoiceHealthy(page, 'John Henry Newman');

  // 4. The same contextual reference must work after the author search.
  await readFirst(page, 'Newman -> read first one');
  await assertVoiceHealthy(page, 'Newman read first one');

  // 5. Time is a core command and must have a deterministic response even with
  // stale BOOKS context. It must not consume/overwrite the ebook context.
  const beforeContext = await page.evaluate(() => (window as any).jarvisContextEngine?.get?.() || null);
  await submit(page, 'time now');
  await expect.poll(() => page.locator('#jarvisReply').textContent()).toMatch(/The local time is \d{1,2}:\d{2}:\d{2}/i);
  const afterTime = await page.evaluate(() => ({
    context: (window as any).jarvisContextEngine?.get?.() || null,
    route: (window as any).jarvisCommandAuthority?.get?.()?.type || '',
    reply: document.querySelector('#jarvisReply')?.textContent?.trim() || ''
  }));
  expect(afterTime.route).toBe('TIME');
  expect(afterTime.reply).toMatch(/local time/i);
  expect(afterTime.context?.domain).toBe(beforeContext?.domain || 'BOOKS');
  await assertVoiceHealthy(page, 'time now');

  // 6. Context must survive the core command and resolve "the first one".
  await readFirst(page, 'time now -> read the first one');
  await assertVoiceHealthy(page, 'final read first one');
});

test('POST-DEPLOY VOICE EVENT GATE: time command cannot leave iOS mic state latched', async ({ browser }) => {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  try {
    await waitForShell(page);
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('jarvis:voice-command', { detail: { text: 'time now' }, cancelable: true }));
    });
    await expect(page.locator('#jarvisReply')).toContainText(/local time/i, { timeout: 10_000 });
    await page.waitForTimeout(1_200);
    const state = await page.evaluate(() => ({
      listening: Boolean(document.querySelector('#voiceBtn')?.classList.contains('listening')),
      pressed: document.querySelector('#voiceBtn')?.getAttribute('aria-pressed'),
      speaking: 'speechSynthesis' in window ? window.speechSynthesis.speaking : false,
      pending: 'speechSynthesis' in window ? window.speechSynthesis.pending : false,
      reliability: typeof (window as any).jarvisVoiceReliability?.release === 'function'
    }));
    expect(state.reliability).toBe(true);
    expect(state.listening).toBe(false);
    expect(state.pressed).not.toBe('true');
    expect(state.speaking).toBe(false);
    expect(state.pending).toBe(false);
  } finally {
    await context.close();
  }
});
