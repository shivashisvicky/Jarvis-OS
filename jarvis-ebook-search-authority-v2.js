(() => {
  'use strict';
  if (window.__JARVIS_EBOOK_SEARCH_AUTHORITY_V3__) return;
  window.__JARVIS_EBOOK_SEARCH_AUTHORITY_V3__ = true;

  const API = 'https://gutendex.com/books/';
  const CACHE_PREFIX = 'jarvis:gutenberg:v3:';
  const TIMEOUT_MS = 4500;
  const esc = (s) => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const authors = (b) => (b.authors || []).map(a => a.name).join(', ') || 'Unknown author';
  const cover = (b) => b.formats?.['image/jpeg'] || '';
  const epub = (b) => b.formats?.['application/epub+zip'] || '';

  const request = async (url, ms = TIMEOUT_MS) => {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), ms);
    try {
      const r = await fetch(url, { signal: c.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (!data || !Array.isArray(data.results)) throw new Error('Invalid Gutenberg response');
      return data.results;
    } finally { clearTimeout(t); }
  };

  const cacheKey = (query) => CACHE_PREFIX + query.toLowerCase();
  const readCache = (query) => {
    try {
      const raw = sessionStorage.getItem(cacheKey(query));
      if (!raw) return null;
      const item = JSON.parse(raw);
      if (!item || !Array.isArray(item.results)) return null;
      if (Date.now() - item.savedAt > 30 * 60 * 1000) return null;
      return item.results;
    } catch { return null; }
  };
  const writeCache = (query, results) => {
    try { sessionStorage.setItem(cacheKey(query), JSON.stringify({ savedAt: Date.now(), results })); } catch {}
  };

  const searchRemote = async (query) => {
    const direct = `${API}?search=${encodeURIComponent(query)}&languages=en`;
    const jina = `https://r.jina.ai/http://gutendex.com/books/?search=${encodeURIComponent(query)}&languages=en`;
    try { return await Promise.any([request(direct), request(jina)]); } catch { return []; }
  };

  const render = (results, status, query) => {
    if (!results.length) {
      status.results.innerHTML = '<div class="jbe6-status">GUTENBERG SEARCH TEMPORARILY UNAVAILABLE. <button class="jbe6-link" id="jbe6RetrySearch">RETRY</button></div>';
      if (status.line) status.line.textContent = 'SEARCH ERROR';
      status.results.querySelector('#jbe6RetrySearch')?.addEventListener('click', () => search(query));
      return;
    }
    status.results.innerHTML = results.slice(0, 20).map((b, i) => {
      const img = cover(b) ? `<img class="jbe6-cover" src="${esc(cover(b))}" alt="">` : '<div class="jbe6-cover"></div>';
      const e = epub(b);
      return `<article class="jbe6-book"><div>${img}</div><div><div class="jbe6-name">${i + 1}. ${esc(b.title)}</div><div class="jbe6-author">${esc(authors(b))}</div><div class="jbe6-desc">${esc((b.subjects || []).slice(0, 3).join(' · '))}</div></div><div class="jbe6-actions"><button class="jbe6-link primary" data-rel-read="${esc(b.id)}" data-title="${esc(b.title)}" data-epub="${esc(e)}">READ IN JARVIS</button><a class="jbe6-link" href="https://www.gutenberg.org/ebooks/${encodeURIComponent(b.id)}" target="_blank" rel="noopener">OPEN GUTENBERG</a></div></article>`;
    }).join('');
    if (status.line) status.line.textContent = `${Math.min(20, results.length)} RESULTS · GUTENBERG`;
  };

  const search = async (q) => {
    const query = String(q || '').trim();
    if (!query) return;
    const results = document.querySelector('#jbe6Results');
    const line = document.querySelector('#jbe6StatusLine');
    if (!results) return;
    const status = { results, line };
    const cached = readCache(query);
    if (cached?.length) { render(cached, status, query); return; }
    results.innerHTML = '<div class="jbe6-status">SEARCHING GUTENBERG…</div>';
    if (line) line.textContent = 'SEARCHING';
    const books = await searchRemote(query);
    if (books.length) writeCache(query, books);
    render(books, status, query);
  };

  const intercept = (e) => {
    const btn = e.target?.closest?.('#jbe6Search');
    if (!btn) return;
    const input = document.querySelector('#jbe6Query');
    if (!input) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    search(input.value);
  };

  document.addEventListener('click', intercept, true);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const input = e.target?.closest?.('#jbe6Query');
    if (!input) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    search(input.value);
  }, true);

  // First-run reconciliation: command routing can populate the ebook query while
  // the library is still mounting. If that happens, the library's default books
  // must not win over the command-supplied query. Reconcile once the panel/input
  // exists, without touching ordinary manual searches.
  let reconciledQuery = '';
  let reconcileTimer = null;
  const reconcile = () => {
    const input = document.querySelector('#jbe6Query');
    const results = document.querySelector('#jbe6Results');
    if (!input || !results) return false;
    const query = String(input.value || '').trim();
    if (!query || query.length < 2 || query === reconciledQuery) return false;
    const hasResults = results.querySelector('.jbe6-book');
    const isSearching = /SEARCHING|GUTENBERG/i.test(document.querySelector('#jbe6StatusLine')?.textContent || '') || results.querySelector('.jbe6-status');
    if (hasResults || isSearching) { reconciledQuery = query; return false; }
    reconciledQuery = query;
    search(query);
    return true;
  };
  const scheduleReconcile = () => {
    clearTimeout(reconcileTimer);
    reconcileTimer = setTimeout(() => {
      reconcile();
      setTimeout(reconcile, 120);
      setTimeout(reconcile, 400);
    }, 0);
  };
  const observer = new MutationObserver(scheduleReconcile);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('input', e => { if (e.target?.id === 'jbe6Query') scheduleReconcile(); }, true);
  scheduleReconcile();
})();
