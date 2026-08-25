(() => {
  'use strict';
  if (window.__JARVIS_EBOOK_REENTRY_RELIABILITY_V1__) return;
  window.__JARVIS_EBOOK_REENTRY_RELIABILITY_V1__ = true;

  const GUTENBERG = /^https:\/\/gutendex\.com\/books\/(?:\?|$)/i;
  const JINA = 'https://r.jina.ai/';
  const nativeFetch = window.fetch.bind(window);

  const isCatalogRequest = (input) => {
    try {
      const url = typeof input === 'string' ? input : input?.url;
      return GUTENBERG.test(String(url || ''));
    } catch { return false; }
  };

  const fallbackCatalog = async (url, init) => {
    const u = new URL(url);
    const candidates = [
      `${JINA}https://${u.host}${u.pathname}${u.search || ''}`,
      `${JINA}http://${u.host}${u.pathname}${u.search || ''}`,
    ];
    for (const candidate of candidates) {
      try {
        const response = await nativeFetch(candidate, {
          ...init,
          cache: 'no-store',
          headers: { ...(init?.headers || {}), Accept: 'application/json,text/plain;q=0.9,*/*;q=0.1' }
        });
        if (!response.ok) continue;
        const text = await response.text();
        const json = JSON.parse(text);
        if (!json || !Array.isArray(json.results)) continue;
        return new Response(JSON.stringify(json), {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      } catch { /* try the next controlled fallback */ }
    }
    return null;
  };

  window.fetch = async function jarvisEbookFetch(input, init = {}) {
    if (!isCatalogRequest(input)) return nativeFetch(input, init);
    const originalUrl = typeof input === 'string' ? input : input?.url;
    let originalResponse = null;
    try {
      originalResponse = await nativeFetch(input, init);
      if (originalResponse.ok) return originalResponse;
    } catch { /* fall through to the bounded catalog fallback */ }
    const fallback = await fallbackCatalog(originalUrl, init);
    return fallback || originalResponse || nativeFetch(input, init);
  };

  const isFiles = () => document.querySelector('.workspace h1')?.textContent?.trim() === 'Files';
  const root = () => document.querySelector('#jarvisFilesV4');
  const activeTab = () => root()?.querySelector('.jf4-opt.active')?.dataset.tab || '';
  const repairedEntries = new WeakSet();
  let repairInFlight = false;

  const repairMissingPanel = () => {
    if (repairInFlight || !isFiles() || activeTab() !== 'ebooks') return;
    const r = root();
    if (!r || r.querySelector('#jbe6Panel')) return;
    const tabs = [...r.querySelectorAll('.jf4-opt[data-tab]')];
    const ebooks = tabs.find((tab) => tab.dataset.tab === 'ebooks');
    const other = tabs.find((tab) => tab.dataset.tab !== 'ebooks');
    if (!ebooks || !other) return;
    repairInFlight = true;
    other.click();
    window.setTimeout(() => ebooks.click(), 60);
    window.setTimeout(() => { repairInFlight = false; }, 350);
  };

  const retryFailedPanel = () => {
    if (!isFiles() || activeTab() !== 'ebooks') return;
    const panel = document.querySelector('#jbe6Panel');
    if (!panel || repairedEntries.has(panel)) return;
    const status = panel.querySelector('#jbe6StatusLine')?.textContent?.trim().toUpperCase() || '';
    const results = panel.querySelector('#jbe6Results');
    if (!/^(OFFLINE|SEARCH ERROR)$/.test(status) || results?.children.length) return;
    const button = panel.querySelector('#jbe6Search');
    if (!button) return;
    repairedEntries.add(panel);
    window.setTimeout(() => button.click(), 700);
  };

  const scan = () => {
    repairMissingPanel();
    retryFailedPanel();
  };
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  window.setInterval(scan, 500);
  scan();
})();
