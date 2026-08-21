(() => {
  'use strict';
  if (window.__JARVIS_WEB_SEARCH__) return;
  window.__JARVIS_WEB_SEARCH__ = true;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const endpoint = () => document.querySelector('meta[name="jarvis-search-endpoint"]')?.content || 'https://jarvis-intelligence.shivashisvicky112.workers.dev/api/search';

  async function search(provider, query) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    try {
      const response = await fetch(`${endpoint()}?provider=${encodeURIComponent(provider)}&q=${encodeURIComponent(query)}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return Array.isArray(data?.results) ? data.results : [];
    } finally { clearTimeout(timer); }
  }

  function external(provider, query) {
    window.open(provider === 'brave' ? `https://search.brave.com/search?q=${encodeURIComponent(query)}` : `https://www.bing.com/search?q=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
  }

  function render(items, provider, query, results) {
    if (!items.length) {
      results.innerHTML = `<div class="empty">No web results found. <button class="secondary" id="webExternal">OPEN ${esc(provider.toUpperCase())} ↗</button></div>`;
      results.querySelector('#webExternal')?.addEventListener('click', () => external(provider, query), { once: true });
      return;
    }
    results.innerHTML = items.slice(0, 8).map(x => `<article class="web-result"><a href="${esc(x.link)}" target="_blank" rel="noreferrer"><strong>${esc(x.title)}</strong><small>${esc(x.source || provider)}${x.snippet ? ` · ${esc(String(x.snippet).slice(0,180))}` : ''}</small></a></article>`).join('');
  }

  document.addEventListener('click', event => {
    const button = event.target?.closest?.('#webSearch');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const input = document.querySelector('#webQuery');
    const providerEl = document.querySelector('#webProvider');
    const status = document.querySelector('#jwsStatus');
    const results = document.querySelector('#jwsResults');
    const query = input?.value?.trim() || '';
    const provider = providerEl?.value === 'brave' ? 'brave' : 'bing';
    if (!status || !results) return;
    if (!query) { status.textContent = 'READY'; results.innerHTML = '<div class="empty">Enter a search query.</div>'; return; }
    status.textContent = `SEARCHING ${provider.toUpperCase()}…`;
    results.innerHTML = '<div class="empty">Searching…</div>';
    search(provider, query)
      .then(items => { status.textContent = `${items.length} RESULTS`; render(items, provider, query, results); })
      .catch(() => {
        status.textContent = 'DEGRADED';
        results.innerHTML = `<div class="empty">JARVIS search is unavailable. <button class="secondary" id="webExternal">OPEN ${esc(provider.toUpperCase())} SEARCH ↗</button></div>`;
        results.querySelector('#webExternal')?.addEventListener('click', () => external(provider, query), { once: true });
      });
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target?.matches?.('#webQuery')) {
      event.preventDefault();
      document.querySelector('#webSearch')?.click();
    }
  }, true);
})();
