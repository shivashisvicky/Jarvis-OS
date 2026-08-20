(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const proxies = [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
  ];
  const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
  async function getText(url) {
    let last;
    for (const makeProxy of proxies) {
      try {
        const r = await Promise.race([fetch(makeProxy(url), {headers:{'Accept':'text/html,application/rss+xml,application/xml;q=0.9,text/plain;q=0.8'}}), timeout(7000)]);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const text = await r.text();
        if (text && text.length > 100) return text;
      } catch (e) { last = e; }
    }
    throw last || new Error('proxy');
  }
  function rssItems(text) {
    const doc = new DOMParser().parseFromString(text, 'text/xml');
    return [...doc.querySelectorAll('item')].slice(0, 10).map(item => ({
      title: item.querySelector('title')?.textContent?.trim() || 'Untitled result',
      link: item.querySelector('link')?.textContent?.trim() || '#',
      source: item.querySelector('source')?.textContent?.trim() || 'Web result',
      snippet: item.querySelector('description')?.textContent?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || ''
    })).filter(x => x.link !== '#');
  }
  function htmlItems(text, provider) {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const seen = new Set();
    const out = [];
    for (const a of [...doc.querySelectorAll('a[href]')]) {
      const href = a.href || a.getAttribute('href');
      const title = a.textContent?.replace(/\s+/g, ' ').trim();
      if (!title || title.length < 8 || !href || !/^https?:\/\//i.test(href)) continue;
      if (/^(search\.brave\.com|www\.bing\.com|bing\.com|brave\.com)$/i.test(new URL(href).hostname)) continue;
      if (/^(Images|Videos|News|Maps|Shopping|More|Sign in|Tools|Settings)$/i.test(title)) continue;
      const key = href.split('#')[0];
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({title, link:key, source:provider, snippet:''});
      if (out.length >= 10) break;
    }
    return out;
  }
  async function search(provider, query) {
    if (provider === 'brave') {
      const url = `https://search.brave.com/search?q=${encodeURIComponent(query)}&source=web`;
      return htmlItems(await getText(url), 'Brave');
    }
    const url = `https://www.bing.com/search?format=rss&q=${encodeURIComponent(query)}`;
    const rss = rssItems(await getText(url));
    if (rss.length) return rss.map(x => ({...x, source:'Bing'}));
    return htmlItems(await getText(`https://www.bing.com/search?q=${encodeURIComponent(query)}`), 'Bing');
  }
  function render(items, provider, query, results) {
    if (!items.length) {
      results.innerHTML = `<div class="empty">No web results found for “${esc(query)}”. <button class="secondary" id="webExternal">OPEN ${esc(provider.toUpperCase())} ↗</button></div>`;
      results.querySelector('#webExternal')?.addEventListener('click', () => window.open(provider === 'brave' ? `https://search.brave.com/search?q=${encodeURIComponent(query)}` : `https://www.bing.com/search?q=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer'), {once:true});
      return;
    }
    results.innerHTML = items.map(x => `<article class="web-result"><a href="${esc(x.link)}" target="_blank" rel="noreferrer"><strong>${esc(x.title)}</strong><small>${esc(x.source)}${x.snippet ? ` · ${esc(x.snippet.slice(0,220))}` : ''}</small></a></article>`).join('');
  }
  function install() {
    const button = document.querySelector('#webSearch');
    if (!button || button.dataset.liveWebInstalled === '1') return;
    button.dataset.liveWebInstalled = '1';
    button.addEventListener('click', (event) => {
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
      results.innerHTML = '<div class="empty">Searching the live web…</div>';
      search(provider, query).then(items => { status.textContent = `${items.length} RESULTS`; render(items, provider, query, results); }).catch(() => {
        status.textContent = 'DEGRADED';
        results.innerHTML = `<div class="empty">The live provider could not be reached from this browser. <button class="secondary" id="webExternal">OPEN ${provider.toUpperCase()} SEARCH ↗</button></div>`;
        results.querySelector('#webExternal')?.addEventListener('click', () => window.open(provider === 'brave' ? `https://search.brave.com/search?q=${encodeURIComponent(query)}` : `https://www.bing.com/search?q=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer'), {once:true});
      });
    }, true);
    document.querySelector('#webQuery')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') { event.preventDefault(); button.click(); }
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true}); else install();
  new MutationObserver(install).observe(document.body, {subtree:true, childList:true});
})();
