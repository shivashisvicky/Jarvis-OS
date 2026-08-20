(() => {
  'use strict';

  const esc = s => String(s).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const clean = s => String(s || '').replace(/\s+/g, ' ').replace(/^[-*•|]+\s*/, '').trim();

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

  // Jina returns the DuckDuckGo HTML results as Markdown-ish text. Extract
  // each result's title, URL and the useful prose immediately following it.
  // The old parser kept only the title, which made the cards look empty.
  const parseJina = text => {
    const lines = String(text || '').split(/\r?\n/).map(clean).filter(Boolean);
    const out = [];
    const seen = new Set();
    const linkRe = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/;

    for (let i = 0; i < lines.length && out.length < 8; i++) {
      const match = lines[i].match(linkRe);
      if (!match) continue;

      const title = clean(match[1]);
      const url = match[2].replace(/[),.;]+$/, '');
      if (!title || seen.has(url) || /r\.jina\.ai|google\.com\/search|bing\.com\/search|duckduckgo\.com\/search/i.test(url)) continue;

      const descriptionParts = [];
      for (let j = i + 1; j < lines.length && descriptionParts.length < 3; j++) {
        const next = lines[j];
        if (linkRe.test(next)) break;
        if (/^(!?\[Image|Images?\b|DuckDuckGo|Web results|Search Results|https?:\/\/)/i.test(next)) continue;
        if (next.length < 25) continue;
        descriptionParts.push(next);
      }

      const description = clean(descriptionParts.join(' ')).slice(0, 260);
      seen.add(url);
      out.push({
        title,
        url,
        description: description || `Open ${title} for the full result.`
      });
    }

    // Some result transports emit a compact inline Markdown stream instead of
    // one link per line. Keep the previous regex fallback so search remains
    // useful across provider formatting changes.
    if (!out.length) {
      const md = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
      let m;
      while ((m = md.exec(String(text || ''))) && out.length < 8) {
        const url = m[2].replace(/[),.;]+$/, '');
        if (seen.has(url) || /r\.jina\.ai|google\.com\/search|bing\.com\/search|duckduckgo\.com\/search/i.test(url)) continue;
        seen.add(url);
        out.push({ title:clean(m[1]), url, description:`Open ${clean(m[1])} for the full result.` });
      }
    }

    return out;
  };

  const instantItems = data => {
    const items = [];
    const add = x => {
      if (!x?.FirstURL || !x?.Text) return;
      items.push({
        title: clean(x.Text),
        url: String(x.FirstURL),
        description: clean(x.Result || x.Text).slice(0, 260)
      });
    };
    (data?.RelatedTopics || []).forEach(x => {
      if (x.Topics) x.Topics.forEach(add); else add(x);
    });
    if (data?.AbstractURL && data?.AbstractText) items.unshift({ title:clean(data.Heading || data.AbstractText), url:String(data.AbstractURL), description:clean(data.AbstractText).slice(0,260) });
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
    x.results.innerHTML = items.map((a,i) => {
      let host = '';
      try { host = new URL(a.url).hostname.replace(/^www\./,''); } catch { host = 'web'; }
      return `
      <article class="jws-runtime-card">
        <div class="jws-runtime-index">${String(i+1).padStart(2,'0')}</div>
        <div class="jws-runtime-copy">
          <strong>${esc(a.title)}</strong>
          <small>${esc(host)}</small>
          <p class="jws-runtime-brief">${esc(a.description || 'No summary was returned for this result.')}</p>
        </div>
        <a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">OPEN ↗</a>
      </article>`;
    }).join('');
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

    try {
      const target = `http://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
      const text = await fetchText(`https://r.jina.ai/${target}`);
      const items = parseJina(text);
      if (items.length) { render(x, items, provider); return; }
    } catch (error) {
      console.warn('JARVIS primary web search unavailable', error);
    }

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
    let s = document.querySelector('#jws-runtime-style');
    if (!s) {
      s = document.createElement('style');
      s.id = 'jws-runtime-style';
      document.head.appendChild(s);
    }
    s.textContent = `
      #jwsStatus.jws-runtime-status{margin:10px 0 8px;padding:8px 10px;border:1px solid rgba(100,220,255,.16);background:rgba(2,10,15,.5);color:#73d9ee;font-size:8px;letter-spacing:.14em}
      .jws-runtime-results{display:grid;gap:7px;margin:8px 0 16px}
      .jws-runtime-card{display:grid;grid-template-columns:30px minmax(0,1fr) auto;align-items:start;gap:10px;padding:13px 12px;border:1px solid rgba(100,220,255,.15);background:linear-gradient(135deg,rgba(8,22,30,.86),rgba(2,8,12,.72));clip-path:polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)}
      .jws-runtime-index{color:#55dcff;font-size:8px;padding-top:3px}.jws-runtime-copy{min-width:0;display:grid;gap:4px}.jws-runtime-copy strong{font-size:11px;color:#dffbff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.jws-runtime-copy small{font-size:7px;color:#638894}.jws-runtime-brief{margin:3px 0 0;color:#89a8b2;font-size:9px;line-height:1.55;max-width:900px;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}.jws-runtime-card a{font-size:7px;letter-spacing:.12em;color:#70e7ff;text-decoration:none;border:1px solid rgba(100,220,255,.22);padding:6px 8px;white-space:nowrap}
      @media(max-width:720px){.jws-runtime-card{grid-template-columns:24px 1fr}.jws-runtime-card a{grid-column:2;justify-self:start}.jws-runtime-brief{font-size:8px}}
    `;
  };

  style();
  document.addEventListener('click', interceptClick, true);
  document.addEventListener('keydown', interceptEnter, true);
  new MutationObserver(() => { style(); ensure(); }).observe(document.documentElement, { childList:true, subtree:true });
})();
