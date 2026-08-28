(() => {
  'use strict';
  if (window.__JARVIS_EBOOK_REENTRY_RELIABILITY_V2__) return;
  window.__JARVIS_EBOOK_REENTRY_RELIABILITY_V2__ = true;

  const GUTENBERG = /^https:\/\/gutendex\.com\/books\/(?:\?|$)/i;
  const GUTENBERG_WEB = /^https:\/\/www\.gutenberg\.org\//i;
  const JINA = 'https://r.jina.ai/';
  const nativeFetch = window.fetch.bind(window);
  const trace = (event, detail = {}) => {
    try { console.info('[JARVIS:EBOOK_REENTRY_TRACE]', event, detail); } catch {}
  };

  const getUrl = input => typeof input === 'string' ? input : input?.url || '';
  const isCatalogRequest = input => GUTENBERG.test(String(getUrl(input)));
  const isGutenbergTextRequest = input => {
    const url = String(getUrl(input));
    return GUTENBERG_WEB.test(url) && /(?:\/cache\/epub\/|\/files\/).*(?:\.txt|\.txt\.utf8|\.html)(?:$|\?)/i.test(url);
  };

  const proxy = async (url, init, accept) => {
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
          headers: { ...(init?.headers || {}), Accept: accept }
        });
        if (!response.ok) continue;
        const text = await response.text();
        if (text.trim().length < 100) continue;
        return new Response(text, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      } catch (error) {
        trace('PROXY_ERROR', { url, error: String(error?.message || error) });
      }
    }
    return null;
  };

  const fallbackCatalog = async (url, init) => {
    const response = await proxy(url, init, 'application/json,text/plain;q=0.9,*/*;q=0.1');
    if (!response) return null;
    try {
      const json = JSON.parse(await response.text());
      if (!json || !Array.isArray(json.results)) return null;
      return new Response(JSON.stringify(json), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    } catch { return null; }
  };

  window.fetch = async function jarvisEbookFetch(input, init = {}) {
    const url = String(getUrl(input));
    if (isGutenbergTextRequest(input)) {
      trace('TEXT_PROXY_START', { url });
      const proxied = await proxy(url, init, 'text/plain,text/html;q=0.9,*/*;q=0.1');
      if (proxied) { trace('TEXT_PROXY_SUCCESS', { url }); return proxied; }
      trace('TEXT_PROXY_FALLBACK_DIRECT', { url });
      return nativeFetch(input, init);
    }
    if (!isCatalogRequest(input)) return nativeFetch(input, init);
    let originalResponse = null;
    try {
      originalResponse = await nativeFetch(input, init);
      if (originalResponse.ok) return originalResponse;
    } catch { /* bounded fallback below */ }
    const fallback = await fallbackCatalog(url, init);
    return fallback || originalResponse || nativeFetch(input, init);
  };

  const isFiles = () => document.querySelector('.workspace h1')?.textContent?.trim() === 'Files';
  const root = () => document.querySelector('#jarvisFilesV4');
  const activeTab = () => root()?.querySelector('.jf4-opt.active')?.dataset.tab || '';
  const retryState = new WeakMap();
  let repairInFlight = false;

  const repairMissingPanel = () => {
    if (repairInFlight || !isFiles() || activeTab() !== 'ebooks') return;
    const r = root();
    if (!r || r.querySelector('#jbe6Panel')) return;
    const tabs = [...r.querySelectorAll('.jf4-opt[data-tab]')];
    const ebooks = tabs.find(tab => tab.dataset.tab === 'ebooks');
    const other = tabs.find(tab => tab.dataset.tab !== 'ebooks');
    if (!ebooks || !other) return;
    repairInFlight = true;
    other.click();
    window.setTimeout(() => ebooks.click(), 120);
    window.setTimeout(() => { repairInFlight = false; }, 700);
    trace('PANEL_REPAIRED');
  };

  const retrySearch = (panel, query, reason, state) => {
    if (state.attempts >= 4 || Date.now() - state.lastRetryAt < 1800) return;
    state.attempts += 1;
    state.lastRetryAt = Date.now();
    trace('SEARCH_RETRY', { query, reason, attempt: state.attempts });
    window.setTimeout(() => {
      if (!document.body.contains(panel)) return;
      const input = panel.querySelector('#jbe6Query');
      if (!input || input.value.trim() !== query) return;
      const authority = window.jarvisEbookSearchAuthority;
      if (authority?.search) authority.search(query);
      else panel.querySelector('#jbe6Search')?.click();
    }, 100);
  };

  const retryFailedPanel = () => {
    if (!isFiles() || activeTab() !== 'ebooks') return;
    const panel = document.querySelector('#jbe6Panel');
    if (!panel) return;
    const status = panel.querySelector('#jbe6StatusLine')?.textContent?.trim().toUpperCase() || '';
    const results = panel.querySelector('#jbe6Results');
    const input = panel.querySelector('#jbe6Query');
    const query = input?.value?.trim() || '';
    if (!query || !results || !input) return;

    let state = retryState.get(panel);
    if (!state) { state = { attempts: 0, startedAt: Date.now(), lastRetryAt: 0 }; retryState.set(panel, state); }
    const elapsed = Date.now() - state.startedAt;
    const searching = status === 'SEARCHING';
    const failed = /^(OFFLINE|SEARCH ERROR)$/.test(status);
    const resultText = results.textContent || '';
    const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const isBeowulf = normalizedQuery === 'beowulf';
    const staleDefault = isBeowulf && results.children.length > 0 && !/beowulf/i.test(resultText) && elapsed >= 1500;

    if (failed) return retrySearch(panel, query, status, state);
    if (searching && elapsed >= 4500) return retrySearch(panel, query, 'SEARCH_STALE', state);
    if (staleDefault) return retrySearch(panel, query, 'STALE_DEFAULT_RESULTS', state);
  };

  const scan = () => { repairMissingPanel(); retryFailedPanel(); };
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  window.setInterval(scan, 500);
  scan();
})();
