(() => {
  'use strict';
  if (window.__JARVIS_WEB_SEARCH_V2__) return;
  window.__JARVIS_WEB_SEARCH_V2__ = true;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const endpoint = () => document.querySelector('meta[name="jarvis-search-endpoint"]')?.content || 'https://jarvis-search.shivashisvicky112.workers.dev/api/search';
  const stopWords = new Set(['who','what','when','where','which','is','are','was','were','the','a','an','of','in','on','for','to','and','or','does','do','did','can','could','would','should','how']);

  function normalizeSearchQuery(raw){
    let q = String(raw || '').replace(/\s+/g, ' ').trim();
    q = q.replace(/^(?:open|search|find|show|lookup|look\s+up)\s+(?:for\s+)?/i, '');
    q = q.replace(/^search\s+for\s+/i, '');
    q = q.replace(/\b1st\b/gi,'first').replace(/\b2nd\b/gi,'second').replace(/\b3rd\b/gi,'third').replace(/\b4th\b/gi,'fourth').replace(/\b5th\b/gi,'fifth');
    q = q.replace(/\bUS\b/gi,'United States');
    q = q.replace(/\bUSA\b/gi,'United States');
    return q.trim();
  }

  function needsRewrite(q){
    return /\b(?:\d+(?:st|nd|rd|th)|first|second|third|fourth|fifth)\b/i.test(q) && /\bpresident\b/i.test(q) && /\b(?:US|USA|United States)\b/i.test(q);
  }

  function relevanceScore(query, items){
    const terms = normalizeSearchQuery(query).toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(t=>t.length>2&&!stopWords.has(t));
    if(!terms.length || !items.length)return 0;
    let hits=0, total=0;
    for(const item of items.slice(0,8)){
      const hay=`${item?.title||''} ${item?.snippet||''}`.toLowerCase();
      const matched=terms.filter(t=>hay.includes(t)).length;
      hits += matched >= Math.min(2,terms.length) ? 1 : 0;
      total += matched;
    }
    return hits/items.slice(0,8).length + Math.min(1,total/(items.slice(0,8).length*terms.length));
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
      return { results: Array.isArray(data?.results) ? data.results : [], provider: String(data?.provider || provider).toLowerCase() };
    } finally { clearTimeout(timer); }
  }

  function external(provider, query) {
    window.open(provider === 'brave' ? `https://search.brave.com/search?q=${encodeURIComponent(query)}` : `https://www.bing.com/search?q=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
  }

  function render(items, provider, query, results, rewritten=false) {
    const label = String(provider || 'web').toUpperCase();
    if (!items.length) {
      results.innerHTML = `<div class="empty">No web results found. <button class="secondary" id="webExternal">OPEN ${esc(label)} ↗</button></div>`;
      results.querySelector('#webExternal')?.addEventListener('click', () => external(provider, query), { once: true }); return;
    }
    const badge = rewritten ? '<span style="display:block;margin-bottom:8px;color:#79d9ef;font-size:10px;letter-spacing:.12em">QUERY REFINED FOR RELEVANCE</span>' : '';
    results.innerHTML = badge + items.slice(0, 8).map(x => `<article class="web-result"><a href="${esc(x.link)}" target="_blank" rel="noreferrer"><strong>${esc(x.title)}</strong><small>${esc(x.source || label)}${x.snippet ? ` · ${esc(String(x.snippet).slice(0,180))}` : ''}</small></a></article>`).join('');
  }

  async function runSearch(provider, rawQuery){
    const firstQuery=normalizeSearchQuery(rawQuery);
    const first=await search(provider, firstQuery);
    const firstScore=relevanceScore(firstQuery,first.results);
    if(needsRewrite(firstQuery) && firstScore<0.85){
      const secondQuery='Who was the ' + firstQuery.replace(/\b(?:who\s+is\s+)?/i,'').replace(/\bUnited States\b/i,'United States').trim();
      const refined=await search(provider,secondQuery);
      if(refined.results.length && relevanceScore(secondQuery,refined.results)>=firstScore) return {...refined, query:secondQuery, rewritten:true};
    }
    return {...first, query:firstQuery, rewritten:false};
  }

  document.addEventListener('click', event => {
    const button = event.target?.closest?.('#webSearch'); if (!button) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const input = document.querySelector('#webQuery'), providerEl = document.querySelector('#webProvider'), status = document.querySelector('#jwsStatus'), results = document.querySelector('#jwsResults');
    const rawQuery = input?.value?.trim() || '', provider = providerEl?.value === 'brave' ? 'brave' : 'bing';
    if (!status || !results) return;
    if (!rawQuery) { status.textContent = 'READY'; results.innerHTML = '<div class="empty">Enter a search query.</div>'; return; }
    status.textContent = `SEARCHING ${provider.toUpperCase()}…`; results.innerHTML = '<div class="empty">Searching…</div>';
    runSearch(provider, rawQuery).then(payload => { const actualProvider = payload.provider || provider; status.textContent = `${payload.results.length} RESULTS · ${actualProvider.toUpperCase()}`; render(payload.results, actualProvider, payload.query, results, payload.rewritten); }).catch(() => { status.textContent = 'DEGRADED'; results.innerHTML = `<div class="empty">JARVIS search is unavailable. <button class="secondary" id="webExternal">OPEN ${esc(provider.toUpperCase())} SEARCH ↗</button></div>`; results.querySelector('#webExternal')?.addEventListener('click', () => external(provider, rawQuery), { once: true }); });
  }, true);

  document.addEventListener('keydown', event => { if (event.key === 'Enter' && event.target?.matches?.('#webQuery')) { event.preventDefault(); document.querySelector('#webSearch')?.click(); } }, true);
})();
