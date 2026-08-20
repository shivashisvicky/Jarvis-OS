(() => {
  'use strict';

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fetcher = window.fetch.bind(window);

  const sourceFromUrl = url => {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'Live News'; }
  };

  const parseGdelt = data => (data?.articles || []).map(a => ({
    title: a.title,
    url: a.url || a.urlmobile,
    source: a.domain || a.sourcecountry,
    image: a.socialimage || '',
    date: a.seendate || ''
  })).filter(a => a.title && a.url);

  const parseRss = xml => [...String(xml).matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(m => {
    const body = m[1];
    const get = tag => (body.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i')) || [,''])[1]
      .replace(/<!\[CDATA\[|\]\]>/g, '').trim();
    const url = get('link');
    return { title: get('title'), url, source: get('source') || sourceFromUrl(url), image: '' };
  }).filter(a => a.title && a.url).slice(0, 12);

  const dedupe = items => [...new Map(items.map(item => [item.url, item])).values()];

  const render = (container, items) => {
    const safe = dedupe(items).slice(0, 12);
    container.innerHTML = safe.length ? safe.map(item => `
      <article class="jarvis-news-card">
        <a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" class="jarvis-news-card-link">
          <div class="jarvis-news-thumb">${item.image ? `<img src="${esc(item.image)}" alt="" loading="lazy">` : '<span>NEWS</span>'}</div>
          <div class="jarvis-news-copy">
            <span class="jarvis-news-source">${esc(item.source || 'LIVE')}</span>
            <strong>${esc(item.title)}</strong>
          </div>
        </a>
      </article>`).join('') : '<div class="empty">No live headlines available right now.</div>';

    const status = document.querySelector('#newsStatus');
    if (status) status.textContent = safe.length ? `${safe.length} LIVE HEADLINES` : 'NO HEADLINES';
  };

  const load = async () => {
    const container = document.querySelector('#newsCards');
    if (!container) return false;
    const query = document.querySelector('#newsGenre')?.value || 'technology OR AI';
    const status = document.querySelector('#newsStatus');
    if (status) status.textContent = 'CONNECTING';
    container.innerHTML = '<div class="news-loading"><span></span><span></span><span></span></div>';

    const endpoints = [
      `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(`(${query})`)}&mode=artlist&format=json&maxrecords=20&timespan=24h&sort=datedesc`,
      `https://r.jina.ai/http://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`
    ];

    for (let index = 0; index < endpoints.length; index++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), index === 0 ? 9000 : 12000);
      try {
        const response = await fetcher(endpoints[index], { cache: 'no-store', signal: controller.signal });
        if (!response.ok) continue;
        const text = await response.text();
        const items = index === 0 ? parseGdelt(JSON.parse(text)) : parseRss(text);
        if (items.length) { render(container, items); return true; }
      } catch {}
      finally { clearTimeout(timer); }
    }

    if (status) status.textContent = 'DEGRADED';
    container.innerHTML = '<div class="empty">Live news is temporarily unavailable. Try refresh again.</div>';
    return false;
  };

  const wire = () => {
    const refresh = document.querySelector('#refreshNews');
    if (refresh && !refresh.dataset.v3News) {
      refresh.dataset.v3News = '1';
      refresh.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); load(); }, true);
    }
    const genre = document.querySelector('#newsGenre');
    if (genre && !genre.dataset.v3News) {
      genre.dataset.v3News = '1';
      genre.addEventListener('change', () => load(), true);
    }
    if (document.querySelector('#newsCards') && !document.querySelector('#newsCards').dataset.v3Loaded) {
      document.querySelector('#newsCards').dataset.v3Loaded = '1';
      load();
    }
  };

  const style = () => {
    if (document.querySelector('#jarvis-v3-news-style')) return;
    const tag = document.createElement('style');
    tag.id = 'jarvis-v3-news-style';
    tag.textContent = `
      #newsCards { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
      .jarvis-news-card { min-width:0; border:1px solid var(--line); border-radius:12px; overflow:hidden; background:rgba(5,13,18,.82); transition:transform .16s ease,border-color .16s ease,background .16s ease; }
      .jarvis-news-card:hover { transform:translateY(-2px); border-color:var(--line-strong); background:rgba(10,24,31,.96); }
      .jarvis-news-card-link { display:grid; grid-template-columns:112px minmax(0,1fr); min-height:112px; color:inherit; text-decoration:none; }
      .jarvis-news-thumb { background:linear-gradient(135deg,rgba(39,91,110,.35),rgba(4,9,13,.9)); display:flex; align-items:center; justify-content:center; overflow:hidden; color:var(--cyan); font:700 9px/1 ui-monospace,monospace; }
      .jarvis-news-thumb img { width:100%; height:100%; object-fit:cover; }
      .jarvis-news-copy { min-width:0; display:grid; align-content:start; gap:7px; padding:12px; }
      .jarvis-news-source { font:600 8px/1 ui-monospace,monospace; color:var(--cyan); letter-spacing:.08em; text-transform:uppercase; }
      .jarvis-news-copy strong { font-size:13px; line-height:1.3; font-weight:650; display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden; }
      @media (max-width:760px) { #newsCards { grid-template-columns:1fr; } .jarvis-news-card-link { grid-template-columns:96px minmax(0,1fr); min-height:96px; } }
    `;
    document.head.appendChild(tag);
  };

  style();
  wire();
  new MutationObserver(wire).observe(document.documentElement, { childList:true, subtree:true });
  window.jarvisV3News = { load };
})();
