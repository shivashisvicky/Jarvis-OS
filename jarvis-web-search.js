(() => {
  'use strict';
  if (window.__JARVIS_WEB_SEARCH_V3__) return;
  window.__JARVIS_WEB_SEARCH_V3__ = true;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const endpoint = () => document.querySelector('meta[name="jarvis-search-endpoint"]')?.content || 'https://jarvis-search.shivashisvicky112.workers.dev/api/search';
  const stopWords = new Set(['who','what','when','where','which','is','are','was','were','the','a','an','of','in','on','for','to','and','or','does','do','did','can','could','would','should','how']);

  function normalizeSearchQuery(raw) {
    let q = String(raw || '').replace(/\s+/g, ' ').trim();
    q = q.replace(/^(?:open|search|find|show|lookup|look\s+up)\s+(?:for\s+)?/i, '');
    q = q.replace(/^(?:the\s+)?(?:internet|web|world\s+wide\s+web)\s+(?:for|about|on)\s+/i, '');
    q = q.replace(/^search\s+(?:the\s+)?(?:internet|web|world\s+wide\s+web)\s+(?:for|about|on)\s+/i, '');
    q = q.replace(/^look\s+up\s+(?:on\s+)?(?:the\s+)?(?:internet|web)\s+(?:for|about)\s+/i, '');
    q = q.replace(/\b1st\b/gi,'first').replace(/\b2nd\b/gi,'second').replace(/\b3rd\b/gi,'third').replace(/\b4th\b/gi,'fourth').replace(/\b5th\b/gi,'fifth');
    q = q.replace(/\bUS\b/gi,'United States').replace(/\bUSA\b/gi,'United States');
    return q.trim();
  }

  async function search(provider, query) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${endpoint()}?provider=${encodeURIComponent(provider)}&q=${encodeURIComponent(query)}`, {
        headers: { Accept: 'application/json' }, cache: 'no-store', signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return {
        results: Array.isArray(data?.results) ? data.results : [],
        provider: String(data?.provider || provider).toLowerCase(),
        requestedProvider: String(data?.requestedProvider || provider).toLowerCase(),
        fallback: Boolean(data?.fallback),
      };
    } finally { clearTimeout(timer); }
  }

  function external(provider, query) {
    window.open(provider === 'brave' ? `https://search.brave.com/search?q=${encodeURIComponent(query)}` : `https://www.bing.com/search?q=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
  }

  function render(items, provider, query, results) {
    const label = String(provider || 'web').toUpperCase();
    if (!items.length) {
      results.innerHTML = `<div class="empty">No web results found. <button class="secondary" id="webExternal">OPEN ${esc(label)} ↗</button></div>`;
      results.querySelector('#webExternal')?.addEventListener('click', () => external(provider, query), { once: true });
      return;
    }
    results.innerHTML = items.slice(0,8).map(x => `<article class="web-result"><a href="${esc(x.link)}" target="_blank" rel="noreferrer"><strong>${esc(x.title)}</strong><small>${esc(x.source || label)}${x.snippet ? ` · ${esc(String(x.snippet).slice(0,180))}` : ''}</small></a></article>`).join('');
  }

  async function runSearch(provider, rawQuery) {
    const query = normalizeSearchQuery(rawQuery);
    if (!query) return { results: [], provider, requestedProvider: provider, fallback: false, query };
    const payload = await search(provider, query);
    return { ...payload, query };
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
    const rawQuery = input?.value?.trim() || '';
    const provider = providerEl?.value === 'brave' ? 'brave' : 'bing';
    if (!status || !results) return;
    if (!rawQuery) {
      status.textContent = 'READY';
      results.innerHTML = '<div class="empty">Enter a search query.</div>';
      return;
    }
    status.textContent = `SEARCHING ${provider.toUpperCase()}…`;
    results.innerHTML = '<div class="empty">Searching…</div>';
    runSearch(provider, rawQuery).then(payload => {
      const actualProvider = payload.provider || provider;
      const providerLabel = actualProvider === 'bing' && payload.fallback ? 'BING FALLBACK' : actualProvider.toUpperCase();
      status.textContent = `${payload.results.length} RESULTS · ${providerLabel}`;
      render(payload.results, actualProvider, payload.query, results);
    }).catch(() => {
      status.textContent = 'DEGRADED';
      results.innerHTML = `<div class="empty">JARVIS search is unavailable. <button class="secondary" id="webExternal">OPEN ${esc(provider.toUpperCase())} SEARCH ↗</button></div>`;
      results.querySelector('#webExternal')?.addEventListener('click', () => external(provider, rawQuery), { once: true });
    });
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target?.matches?.('#webQuery')) {
      event.preventDefault();
      document.querySelector('#webSearch')?.click();
    }
  }, true);
})();
