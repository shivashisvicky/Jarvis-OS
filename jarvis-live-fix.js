(() => {
  'use strict';

  const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const withTimeout = (promise, ms) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

  async function mapSearch(term) {
    const results = document.querySelector('#mapResults');
    const frame = document.querySelector('#mapFrame');
    if (!results || !frame || !term) return;
    results.innerHTML = '<div class="empty">SEARCHING…</div>';
    try {
      const url = `https://photon.komoot.io/api/?limit=6&q=${encodeURIComponent(term)}`;
      const response = await withTimeout(fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' }), 8000);
      if (!response.ok) throw new Error('map provider');
      const data = await response.json();
      const places = (data.features || []).map(f => {
        const p = f.properties || {};
        const c = f.geometry?.coordinates || [];
        const label = [p.name, p.street, p.city || p.locality, p.state, p.country].filter(Boolean).join(', ');
        return { lat: Number(c[1]), lon: Number(c[0]), label: label || 'Unknown place' };
      }).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lon));
      if (!places.length) {
        results.innerHTML = '<div class="empty">No places found.</div>';
        frame.innerHTML = '<div class="empty">No map result for that place.</div>';
        return;
      }
      results.innerHTML = places.map((p, i) => `<button class="place-result" data-live-map-index="${i}"><strong>${esc(p.label)}</strong></button>`).join('');
      const show = p => {
        const d = 0.035;
        frame.innerHTML = `<iframe title="Map" src="https://www.openstreetmap.org/export/embed.html?bbox=${p.lon-d},${p.lat-d},${p.lon+d},${p.lat+d}&layer=mapnik&marker=${p.lat},${p.lon}"></iframe>`;
      };
      results.querySelectorAll('[data-live-map-index]').forEach(b => b.addEventListener('click', () => show(places[Number(b.dataset.liveMapIndex)])));
      show(places[0]);
    } catch {
      results.innerHTML = '<div class="empty">Map search is temporarily unavailable. Try again.</div>';
      frame.innerHTML = '<div class="empty">Map provider unavailable.</div>';
    }
  }

  function currentMapQuery() {
    return document.querySelector('#mapQuery')?.value?.trim() || '';
  }

  function wireMap() {
    const input = document.querySelector('#mapQuery');
    const button = document.querySelector('#mapSearch');
    if (!input || !button || button.dataset.liveFix) return;
    button.dataset.liveFix = '1';
    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target.closest('#mapSearch') : null;
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      void mapSearch(currentMapQuery());
    }, true);
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void mapSearch(currentMapQuery());
      }
    });
  }

  const NEWS_CACHE_PREFIX = 'jarvis-news-cache-v2:';
  const newsQuery = category => category === 'INDIA'
    ? 'India OR Indian'
    : category === 'AI'
      ? 'artificial intelligence OR AI'
      : category === 'TECH'
        ? 'technology OR software'
        : 'world OR geopolitics';

  const newsDate = value => {
    const raw = String(value || '');
    if (!raw) return '';
    const match = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    if (!match) return raw;
    const d = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6])));
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const installNewsLightStyle = () => {
    if (document.querySelector('#jarvisNewsLightStyle')) return;
    const style = document.createElement('style');
    style.id = 'jarvisNewsLightStyle';
    style.textContent = `
      #newsCards { min-height: 0 !important; height: auto !important; max-height: none !important; overflow: visible !important; }
      #newsDesk { min-height: 0 !important; }
      #newsCards.jarvis-news-compact { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px !important; padding: 10px 12px !important; }
      #newsCards.jarvis-news-compact .news-card { min-height: 0 !important; height: auto !important; margin: 0 !important; padding: 10px 12px !important; }
      #newsCards.jarvis-news-compact .news-card a { display: block !important; text-decoration: none !important; }
      #newsCards.jarvis-news-compact .news-card strong { display: block !important; line-height: 1.3 !important; font-size: 13px !important; }
      #newsCards.jarvis-news-compact .news-meta { display: block !important; margin-top: 6px !important; opacity: .68 !important; font-size: 10px !important; line-height: 1.2 !important; }
      #newsCards.jarvis-news-compact .news-source { opacity: .9 !important; }
      #newsCards.jarvis-news-compact .news-empty { min-height: 0 !important; padding: 18px !important; }
      @media (max-width: 760px) { #newsCards.jarvis-news-compact { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
  };

  const renderNews = (cards, items, source) => {
    const compact = items.slice(0, 6).filter(item => item?.title && item?.url);
    cards.classList.add('jarvis-news-compact');
    cards.style.minHeight = '0';
    cards.style.height = 'auto';
    cards.innerHTML = compact.map(item => {
      const title = esc(item.title);
      const domain = esc(item.domain || source || 'News');
      const date = esc(newsDate(item.seendate || item.pubDate || ''));
      return `<article class="news-card"><a href="${esc(item.url || item.link || '#')}" target="_blank" rel="noreferrer"><strong>${title}</strong><small class="news-meta"><span class="news-source">${domain}</span>${date ? ` · ${date}` : ''}</small></a></article>`;
    }).join('');
    if (!compact.length) throw new Error('empty');
    return compact.length;
  };

  async function fetchGdelt(query) {
    const endpoint = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(`(${query})`)}&mode=artlist&format=json&maxrecords=8&sort=datedesc&timespan=12h`;
    const response = await withTimeout(fetch(endpoint, { headers: { Accept: 'application/json' }, cache: 'no-store' }), 6500);
    if (!response.ok) throw new Error(`GDELT HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.articles) || !data.articles.length) throw new Error('GDELT empty');
    return data.articles;
  }

  async function fetchRss2Json(query) {
    const feed = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
    const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed)}`;
    const response = await withTimeout(fetch(endpoint, { headers: { Accept: 'application/json' }, cache: 'no-store' }), 6500);
    if (!response.ok) throw new Error(`RSS HTTP ${response.status}`);
    const data = await response.json();
    if (data.status !== 'ok' || !Array.isArray(data.items) || !data.items.length) throw new Error('RSS empty');
    return data.items.map(item => ({ title: item.title, url: item.link, domain: item.author || data.feed?.title || 'Google News', pubDate: item.pubDate }));
  }

  function cacheNews(category, items) {
    try { localStorage.setItem(NEWS_CACHE_PREFIX + category, JSON.stringify({ savedAt: Date.now(), items: items.slice(0, 8) })); } catch {}
  }

  function readNewsCache(category) {
    try {
      const cached = JSON.parse(localStorage.getItem(NEWS_CACHE_PREFIX + category) || 'null');
      if (cached?.items?.length) return cached.items;
    } catch {}
    return null;
  }

  async function newsSearch(category) {
    installNewsLightStyle();
    const desk = document.querySelector('#newsDesk');
    const status = document.querySelector('#newsStatus');
    const cards = document.querySelector('#newsCards');
    if (!status || !cards) return;
    const normalizedCategory = String(category || 'WORLD').toUpperCase();
    const query = newsQuery(normalizedCategory);
    status.textContent = 'SCANNING';
    cards.classList.add('jarvis-news-compact');
    cards.style.minHeight = '0';
    cards.style.height = 'auto';
    cards.innerHTML = '<div class="empty news-empty">Fetching live headlines…</div>';
    try {
      let items;
      try {
        items = await fetchGdelt(query);
      } catch {
        items = await fetchRss2Json(query);
      }
      const count = renderNews(cards, items, 'GDELT');
      cacheNews(normalizedCategory, items);
      status.textContent = `${count} RESULTS`;
    } catch {
      const cached = readNewsCache(normalizedCategory);
      if (cached?.length) {
        try {
          const count = renderNews(cards, cached, 'Cached news');
          status.textContent = `${count} CACHED`;
          return;
        } catch {}
      }
      status.textContent = 'DEGRADED';
      cards.classList.add('jarvis-news-compact');
      cards.style.minHeight = '0';
      cards.style.height = 'auto';
      cards.innerHTML = '<div class="empty news-empty">Live news is temporarily unavailable. Try REFRESH.</div>';
    }
  }

  function wireNews() {
    const desk = document.querySelector('#newsDesk');
    const genre = document.querySelector('#newsGenre');
    const refresh = document.querySelector('#refreshNews');
    if (!desk || !genre || !refresh || desk.dataset.liveFix) return;
    desk.dataset.liveFix = '1';
    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target.closest('#refreshNews') : null;
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      void newsSearch(genre.value || 'WORLD');
    }, true);
    document.addEventListener('change', event => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement) || target.id !== 'newsGenre') return;
      event.stopImmediatePropagation();
      void newsSearch(target.value || 'WORLD');
    }, true);
    void newsSearch(genre.value || 'WORLD');
  }

  function syncMapCommand() {
    window.addEventListener('jarvis:maps', event => {
      const value = String(event.detail?.place || '').trim();
      if (!value) return;
      let tries = 0;
      const timer = setInterval(() => {
        tries += 1;
        const input = document.querySelector('#mapQuery');
        if (input instanceof HTMLInputElement) {
          clearInterval(timer);
          input.value = value;
          void mapSearch(value);
        } else if (tries > 50) clearInterval(timer);
      }, 60);
    });
  }

  const observer = new MutationObserver(() => {
    wireMap();
    wireNews();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  syncMapCommand();
  wireMap();
  wireNews();
})();
