(() => {
  'use strict';
  if (window.__JARVIS_SEARCH_PROVIDER_FIDELITY_V2__) return;
  window.__JARVIS_SEARCH_PROVIDER_FIDELITY_V2__ = true;
  window.__JARVIS_SEARCH_PROVIDER_FIDELITY_V1__ = true;

  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const termsFor = value => clean(value).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(term => term.length > 1);
  const currentQuery = () => clean(document.querySelector('#webQuery')?.value || '');

  // The Search Hub must never present a fallback set that silently answers a
  // different query. This matters especially when Brave falls back to Bing.
  // If the returned set does not contain every meaningful query term, recover
  // using the exact query through the same live web transport used by JARVIS'
  // earlier search path, while keeping the Search context surface unchanged.
  const resultSetMatchesQuery = () => {
    const terms = termsFor(currentQuery());
    if (!terms.length) return true;
    const cards = [...document.querySelectorAll('#jwsResults .web-result')];
    if (!cards.length) return true;
    const haystack = cards.map(card => clean(card.textContent).toLowerCase()).join(' ');
    return terms.every(term => haystack.includes(term));
  };

  const parseRecoveryResults = text => {
    const out = [], seen = new Set();
    const md = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
    let match;
    while ((match = md.exec(String(text || ''))) && out.length < 8) {
      const title = clean(match[1]);
      const link = match[2].replace(/[),.;]+$/, '');
      if (!title || seen.has(link) || /r\.jina\.ai|google\.com\/search|bing\.com\/search|duckduckgo\.com\/search/i.test(link)) continue;
      seen.add(link);
      out.push({ title, link, source: 'WEB', snippet: '' });
    }
    return out;
  };

  const recoverExactQuery = async () => {
    const query = currentQuery();
    const terms = termsFor(query);
    if (!query || !terms.length || resultSetMatchesQuery()) return;

    const status = document.querySelector('#jwsStatus');
    const results = document.querySelector('#jwsResults');
    if (!status || !results) return;

    status.textContent = 'RECOVERING · EXACT QUERY';
    try {
      const target = `http://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await fetch(`https://r.jina.ai/${target}`, {
        headers: { Accept: 'text/plain' },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const items = parseRecoveryResults(await response.text());
      if (!items.length) throw new Error('No recovery results');

      const relevant = items.filter(item => {
        const hay = `${item.title} ${item.snippet}`.toLowerCase();
        return terms.every(term => hay.includes(term));
      });
      const visible = (relevant.length ? relevant : items).slice(0, 8);
      results.innerHTML = visible.map((x, i) => `<article class="web-result" data-jarvis-search-index="${i}"><a href="${String(x.link).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" target="_blank" rel="noreferrer"><strong>${String(x.title).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</strong><small>WEB</small></a></article>`).join('');
      status.textContent = `${visible.length} RESULTS · EXACT QUERY`;

      const snapshot = {
        domain: 'SEARCH',
        query,
        provider: 'web',
        results: visible,
        selected: null,
        updatedAt: Date.now(),
      };
      window.__JARVIS_SEARCH_CONTEXT__ = snapshot;
      window.dispatchEvent(new CustomEvent('jarvis:search-context', { detail: snapshot }));
      window.jarvisContextEngine?.set?.({ domain: 'SEARCH', query, results: visible, selected: null }, 'merge');
      console.debug('[JARVIS][SEARCH_QUERY_RECOVERY]', { query, count: visible.length });
    } catch (error) {
      console.warn('[JARVIS][SEARCH_QUERY_RECOVERY] failed', error);
      // Leave the provider's original results intact rather than breaking the
      // Search Hub when the recovery transport is unavailable.
    }
  };

  const syncProviderLabels = () => {
    const provider = document.querySelector('#webProvider')?.value === 'brave' ? 'BRAVE' : 'BING';
    const status = document.querySelector('#jwsStatus');
    if (status && /RESULTS\s·/i.test(status.textContent || '')) {
      status.textContent = status.textContent.replace(/RESULTS\s·\s*\w+(?:\s+FALLBACK)?/i, `RESULTS · ${provider}`);
    }
    document.querySelectorAll('#jwsResults .web-result small').forEach(node => {
      const text = node.textContent || '';
      const dot = text.indexOf(' · ');
      const snippet = dot >= 0 ? text.slice(dot) : '';
      if (text && !text.startsWith(provider) && text !== 'WEB') node.textContent = provider + snippet;
    });
  };

  let recoveryTimer = 0;
  const observeSearchResults = () => {
    window.clearTimeout(recoveryTimer);
    recoveryTimer = window.setTimeout(() => { void recoverExactQuery(); }, 80);
    syncProviderLabels();
  };

  new MutationObserver(observeSearchResults).observe(document.body, { subtree: true, childList: true, characterData: true });
  document.addEventListener('change', event => {
    if (event.target?.id === 'webProvider') syncProviderLabels();
  }, true);
  document.addEventListener('click', event => {
    if (event.target?.closest?.('#webSearch')) window.setTimeout(() => void recoverExactQuery(), 180);
  }, true);
})();
