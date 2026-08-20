(() => {
  'use strict';

  const esc = s => String(s).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));

  const ensure = () => {
    const input = document.querySelector('#webQuery');
    const button = document.querySelector('#webSearch');
    if (!input || !button) return null;
    let status = document.querySelector('#jwsStatus');
    let results = document.querySelector('#jwsResults');
    if (!status) {
      status = document.createElement('div');
      status.id = 'jwsStatus';
      status.className = 'jws-runtime-status';
      button.parentElement?.after(status);
    }
    if (!results) {
      results = document.createElement('div');
      results.id = 'jwsResults';
      results.className = 'jws-runtime-results';
      status.after(results);
    }
    return { input, button, status, results };
  };

  const parseJina = text => {
    const out = [];
    const seen = new Set();
    const md = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
    let m;
    while ((m = md.exec(text)) && out.length < 8) {
      const url = m[2].replace(/[),.;]+$/, '');
      if (seen.has(url) || /r\.jina\.ai|google\.com\/search|bing\.com\/search|duckduckgo\.com\/search/i.test(url)) continue;
      seen.add(url);
      out.push({ title:m[1].replace(/\s+/g,' ').trim(), url });
    }
    return out;
  };

  const instantItems = data => {
    const items = [];
    const add = x => {
      if (!x?.FirstURL || !x?.Text) return;
      items.push({ title:String(x.Text).replace(/\s+/g,' ').trim(), url:String(x.FirstURL) });
    };
    (data?.RelatedTopics || []).forEach(x => {
      if (x.Topics) x.Topics.forEach(add); else add(x);
    });
    if (data?.AbstractURL && data?.AbstractText) items.unshift({ title:String(data.AbstractText).replace(/\s+/g,' ').trim(), url:String(data.AbstractURL) });
    return items.slice(0,8);
  };

  const fetchJson = async (url, ms=7000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const r = await fetch(url, { signal:controller.signal, headers:{Accept:'application/json'} });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } finally { clearTimeout(timer); }
  };

  const fetchText = async (url, ms=9000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const r = await fetch(url, { signal:controller.signal, headers:{Accept:'text/plain'} });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.text();
    } finally { clearTimeout(timer); }
  };

  const render = (x, items, provider) => {
    x.status.textContent = `${items.length} RESULTS · LIVE WEB`;
    x.results.innerHTML = items.map((a,i) => `
      <article class="jws-runtime-card">
        <div class="jws-runtime-index">${String(i+1).padStart(2,'0')}</div>
        <div class="jws-runtime-copy"><strong>${esc(a.title)}</strong><small>${esc(new URL(a.url).hostname)}</small></div>
        <a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">OPEN ↗</a>
      </article>`).join('');
    x.status.dataset.provider = provider;
  };

  const search = async (query, provider) => {
    const x = ensure();
    const q = String(query || '').trim();
    if (!x) return;
    if (!q) {
      x.status.textContent = 'ENTER A SEARCH QUERY';
      x.results.innerHTML = '<div class="empty">Enter a search query.</div>';
      return;
    }

    x.status.textContent = 'SEARCHING · LIVE WEB';
    x.results.innerHTML = '<div class="empty">JARVIS IS SEARCHING THE WEB…</div>';

    // Primary: DuckDuckGo's lightweight HTML endpoint through Jina. This gives
    // real organic links without embedding a search-engine page in the SPA.
    try {
      const target = `http://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
      const text = await fetchText(`https://r.jina.ai/${target}`);
      const items = parseJina(text);
      if (items.length) { render(x, items, provider); return; }
    } catch (error) {
      console.warn('JARVIS primary web search unavailable', error);
    }

    // Secondary: DuckDuckGo Instant Answers. It is intentionally bounded and
    // never allowed to take down the SPA if the service is unavailable.
    try {
      const data = await fetchJson(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&no_redirect=1&skip_disambig=0`);
      const items = instantItems(data);
      if (items.length) { render(x, items, provider); return; }
    } catch (error) {
      console.warn('JARVIS fallback web search unavailable', error);
    }

    x.status.textContent = 'DEGRADED · SEARCH PROVIDER UNAVAILABLE';
    x.results.innerHTML = `<div class="video-context"><strong>${esc(q)}</strong><p>The live provider did not return results. JARVIS is still online.</p><button class="secondary" id="jwsExternalFallback">OPEN ${String(provider).toUpperCase()} SEARCH ↗</button></div>`;
    document.querySelector('#jwsExternalFallback')?.addEventListener('click', () => {
      const url = provider === 'bing'
        ? `https://www.bing.com/search?q=${encodeURIComponent(q)}`
        : `https://search.brave.com/search?q=${encodeURIComponent(q)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }, { once:true });
  };

  const interceptClick = event => {
    const target = event.target?.closest?.('#webSearch, [data-provider]');
    if (!target) return;
    const x = ensure();
    if (!x) return;
    const query = x.input.value;
    const provider = target.dataset.provider || document.querySelector('#webProvider')?.value || 'brave';
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    void search(query, provider);
  };

  const interceptEnter = event => {
    if (event.key !== 'Enter' || event.target?.id !== 'webQuery') return;
    const x = ensure();
    if (!x) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    void search(x.input.value, document.querySelector('#webProvider')?.value || 'brave');
  };

  const style = () => {
    if (document.querySelector('#jws-runtime-style')) return;
    const s = document.createElement('style');
    s.id = 'jws-runtime-style';
    s.textContent = `
      #jwsStatus.jws-runtime-status{margin:10px 0 8px;padding:8px 10px;border:1px solid rgba(100,220,255,.16);background:rgba(2,10,15,.5);color:#73d9ee;font-size:8px;letter-spacing:.14em}
      .jws-runtime-results{display:grid;gap:7px;margin:8px 0 16px}
      .jws-runtime-card{display:grid;grid-template-columns:30px 1fr auto;align-items:center;gap:10px;padding:11px 12px;border:1px solid rgba(100,220,255,.15);background:linear-gradient(135deg,rgba(8,22,30,.86),rgba(2,8,12,.72));clip-path:polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)}
      .jws-runtime-index{color:#55dcff;font-size:8px}.jws-runtime-copy{min-width:0;display:grid;gap:4px}.jws-runtime-copy strong{font-size:11px;color:#dffbff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.jws-runtime-copy small{font-size:7px;color:#638894}.jws-runtime-card a{font-size:7px;letter-spacing:.12em;color:#70e7ff;text-decoration:none;border:1px solid rgba(100,220,255,.22);padding:6px 8px}
    `;
    document.head.appendChild(s);
  };

  style();
  document.addEventListener('click', interceptClick, true);
  document.addEventListener('keydown', interceptEnter, true);
  new MutationObserver(() => { style(); ensure(); }).observe(document.documentElement, { childList:true, subtree:true });
})();
