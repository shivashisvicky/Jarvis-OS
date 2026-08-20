(() => {
  'use strict';

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fetcher = window.fetch.bind(window);
  const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';

  const feedFor = query => {
    const q = String(query || '').toLowerCase();
    if (/ai|tech|technology/.test(q)) return 'https://feeds.bbci.co.uk/news/technology/rss.xml';
    if (/business|market|finance/.test(q)) return 'https://feeds.bbci.co.uk/news/business/rss.xml';
    if (/science|space/.test(q)) return 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml';
    if (/india/.test(q)) return 'https://news.google.com/rss/search?q=India&hl=en-IN&gl=IN&ceid=IN:en';
    if (/world|geopolitic/.test(q)) return 'https://feeds.bbci.co.uk/news/world/rss.xml';
    return 'https://feeds.bbci.co.uk/news/rss.xml';
  };

  const parse = data => (data?.items || []).map(item => ({
    title: item.title,
    url: item.link,
    source: data?.feed?.title || 'LIVE NEWS',
    image: item.thumbnail || '',
    date: item.pubDate || ''
  })).filter(item => item.title && item.url);

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
            <small>${esc(item.date)}</small>
          </div>
        </a>
      </article>`).join('') : '<div class="empty">No live headlines available right now.</div>';

    const status = document.querySelector('#newsStatus');
    if (status) status.textContent = safe.length ? `${safe.length} LIVE HEADLINES` : 'NO HEADLINES';
    const ticker = document.querySelector('#newsTicker');
    if (ticker && safe.length) ticker.innerHTML = safe.slice(0, 5).map(item => `<span>${esc(item.title)}</span>`).join('<b>•</b>');
  };

  const load = async () => {
    const container = document.querySelector('#newsCards');
    if (!container) return false;
    container.dataset.jnews = '1';
    const query = document.querySelector('#newsGenre')?.value || 'AI OR technology';
    const status = document.querySelector('#newsStatus');
    if (status) status.textContent = 'CONNECTING';
    container.innerHTML = '<div class="news-loading"><span></span><span></span><span></span></div>';

    const feed = feedFor(query);
    const endpoint = `${RSS2JSON}${encodeURIComponent(feed)}&count=12`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetcher(endpoint, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error(`RSS2JSON ${response.status}`);
      const data = await response.json();
      if (data?.status !== 'ok') throw new Error(data?.message || 'RSS2JSON unavailable');
      const items = parse(data);
      if (!items.length) throw new Error('No headlines');
      render(container, items);
      return true;
    } catch {
      if (status) status.textContent = 'DEGRADED';
      container.innerHTML = '<div class="empty">Live news is temporarily unavailable. Try refresh again.</div>';
      return false;
    } finally {
      clearTimeout(timer);
    }
  };

  const wire = () => {
    const refresh = document.querySelector('#refreshNews');
    if (refresh && !refresh.dataset.v3News) {
      refresh.dataset.v3News = '1';
      refresh.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        load();
      }, true);
    }
    const genre = document.querySelector('#newsGenre');
    if (genre && !genre.dataset.v3News) {
      genre.dataset.v3News = '1';
      genre.addEventListener('change', () => load(), true);
    }
    const cards = document.querySelector('#newsCards');
    if (cards && !cards.dataset.v3Loaded) {
      cards.dataset.v3Loaded = '1';
      cards.dataset.jnews = '1';
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
      .jarvis-news-copy { min-width:0; display:grid; align-content:start; gap:6px; padding:12px; }
      .jarvis-news-source { font:600 8px/1 ui-monospace,monospace; color:var(--cyan); letter-spacing:.08em; text-transform:uppercase; }
      .jarvis-news-copy strong { font-size:13px; line-height:1.3; font-weight:650; display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden; }
      .jarvis-news-copy small { font-size:8px; color:#66828c; }
      @media (max-width:760px) { #newsCards { grid-template-columns:1fr; } .jarvis-news-card-link { grid-template-columns:96px minmax(0,1fr); min-height:96px; } }
    `;
    document.head.appendChild(tag);
  };

  style();
  wire();
  new MutationObserver(wire).observe(document.documentElement, { childList:true, subtree:true });
  window.addEventListener('jarvis:news', () => load());
  window.jarvisV3News = { load };
})();
