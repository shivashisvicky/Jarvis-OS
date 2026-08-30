(() => {
  'use strict';
  if (window.__JARVIS_WEB_SEARCH_V5__) return;
  window.__JARVIS_WEB_SEARCH_V5__ = true;
  // Keep the legacy readiness signal for the existing live E2E gate while V5
  // remains the canonical implementation marker.
  window.__JARVIS_WEB_SEARCH_V4__ = true;
  window.__JARVIS_WEB_SEARCH_V3__ = true;

  const esc = s => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const endpoint = () => document.querySelector('meta[name="jarvis-search-endpoint"]')?.content || 'https://jarvis-search.shivashisvicky112.workers.dev/api/search';

  // Canonical search-query extraction. The Search Hub must never send the
  // command wrapper ("search the internet for", "in the internet for", etc.)
  // to the provider. Speech recognition can produce slightly awkward
  // prepositions, so normalize the whole wrapper family consistently.
  function normalizeSearchQuery(raw) {
    let q = String(raw || '').replace(/\s+/g, ' ').trim();
    q = q.replace(/[.!?]+$/, '').trim();

    const prefixes = [
      /^(?:search|look\s+up|find)\s+(?:(?:on|in|from)\s+)?(?:the\s+)?(?:internet|web|world\s+wide\s+web)\s+(?:for|about|on)\s+/i,
      /^(?:(?:on|in|from)\s+)?(?:the\s+)?(?:internet|web|world\s+wide\s+web)\s+(?:for|about|on)\s+/i,
      /^(?:search|look\s+up|find)\s+(?:for|about)?\s*/i,
      /^(?:google|bing)\s+(?:search\s+)?(?:for\s+)?/i,
    ];
    for (const prefix of prefixes) {
      const next = q.replace(prefix, '').trim();
      if (next !== q) {
        q = next;
        break;
      }
    }

    q = q.replace(/\b1st\b/gi, 'first')
         .replace(/\b2nd\b/gi, 'second')
         .replace(/\b3rd\b/gi, 'third')
         .replace(/\b4th\b/gi, 'fourth')
         .replace(/\b5th\b/gi, 'fifth')
         .replace(/\bUSA\b/gi, 'United States')
         .replace(/\bUS\b/gi, 'United States');
    return q.trim();
  }

  window.jarvisNormalizeSearchQuery = normalizeSearchQuery;

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

  function publishContext(items, query, provider) {
    const canonicalQuery = normalizeSearchQuery(query);
    const snapshot = {
      domain: 'SEARCH',
      query: canonicalQuery,
      provider: String(provider || '').toLowerCase(),
      results: Array.isArray(items) ? items.slice(0, 8) : [],
      selected: null,
      updatedAt: Date.now()
    };
    try {
      window.__JARVIS_SEARCH_CONTEXT__ = snapshot;
      window.dispatchEvent(new CustomEvent('jarvis:search-context', { detail: snapshot }));
      window.jarvisContextEngine?.set?.({
        domain: 'SEARCH',
        query: snapshot.query || null,
        results: snapshot.results,
        selected: null
      }, 'merge');
      console.debug('[JARVIS][SEARCH_CONTEXT]', { query: snapshot.query, provider: snapshot.provider, count: snapshot.results.length });
    } catch {}
  }

  function render(items, provider, query, results) {
    const canonicalQuery = normalizeSearchQuery(query);
    const label = String(provider || 'web').toUpperCase();
    if (!items.length) {
      results.innerHTML = `<div class="empty">No web results found. <button class="secondary" id="webExternal">OPEN ${esc(label)} ↗</button></div>`;
      results.querySelector('#webExternal')?.addEventListener('click', () => external(provider, canonicalQuery), { once: true });
      publishContext([], canonicalQuery, provider);
      return;
    }
    const visible = items.slice(0, 8);
    results.innerHTML = visible.map((x, i) => `<article class="web-result" data-jarvis-search-index="${i}"><a href="${esc(x.link)}" target="_blank" rel="noreferrer"><strong>${esc(x.title)}</strong><small>${esc(x.source || label)}${x.snippet ? ` · ${esc(String(x.snippet).slice(0,180))}` : ''}</small></a></article>`).join('');
    publishContext(visible, canonicalQuery, provider);
  }

  async function runSearch(provider, rawQuery, status, results) {
    const query = normalizeSearchQuery(rawQuery);
    if (!query) {
      status.textContent = 'READY';
      results.innerHTML = '<div class="empty">Enter a search query.</div>';
      publishContext([], '', provider);
      return;
    }

    const input = document.querySelector('#webQuery');
    if (input instanceof HTMLInputElement && input.value !== query) {
      input.value = query;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    status.textContent = `SEARCHING ${provider.toUpperCase()}…`;
    results.innerHTML = '<div class="empty">Searching…</div>';
    try {
      const payload = await search(provider, query);
      const actualProvider = payload.provider || provider;
      const providerLabel = actualProvider === 'bing' && payload.fallback ? 'BING FALLBACK' : actualProvider.toUpperCase();
      status.textContent = `${payload.results.length} RESULTS · ${providerLabel}`;
      render(payload.results, actualProvider, query, results);
    } catch {
      status.textContent = 'DEGRADED';
      results.innerHTML = `<div class="empty">JARVIS search is unavailable. <button class="secondary" id="webExternal">OPEN ${esc(provider.toUpperCase())} SEARCH ↗</button></div>`;
      results.querySelector('#webExternal')?.addEventListener('click', () => external(provider, query), { once: true });
      publishContext([], query, provider);
    }
  }

  function runCommandHandoff() {
    try {
      const route = window.__JARVIS_COMMAND_ROUTE__;
      if (!route || route.type !== 'SEARCH' || !route.text || window.__JARVIS_WEB_COMMAND_CONSUMED__ === route.at) return;
      const input = document.querySelector('#webQuery');
      const button = document.querySelector('#webSearch');
      const status = document.querySelector('#jwsStatus');
      const results = document.querySelector('#jwsResults');
      if (!(input instanceof HTMLInputElement) || !(button instanceof HTMLElement) || !status || !results) return;

      const query = normalizeSearchQuery(route.text);
      if (!query) return;

      window.__JARVIS_WEB_COMMAND_CONSUMED__ = route.at;
      input.value = query;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      console.debug('[JARVIS][SEARCH_HANDOFF]', { raw: route.text, normalized: query });
      button.click();
    } catch {}
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
    void runSearch(provider, rawQuery, status, results);
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target?.matches?.('#webQuery')) {
      event.preventDefault();
      document.querySelector('#webSearch')?.click();
    }
  }, true);

  const handoffObserver = new MutationObserver(runCommandHandoff);
  handoffObserver.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(runCommandHandoff, 0);
  window.setTimeout(runCommandHandoff, 120);
  window.setTimeout(runCommandHandoff, 500);
})();
