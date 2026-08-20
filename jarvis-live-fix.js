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

  async function newsSearch(category) {
    const status = document.querySelector('#newsStatus');
    const cards = document.querySelector('#newsCards');
    if (!status || !cards) return;
    const q = category === 'INDIA' ? 'India OR Indian' : category === 'AI' ? 'artificial intelligence OR AI' : category === 'TECH' ? 'technology OR software' : 'world OR geopolitics';
    status.textContent = 'SCANNING';
    cards.innerHTML = '<div class="empty">JARVIS is fetching live headlines…</div>';
    try {
      const feed = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`;
      const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed)}`;
      const response = await withTimeout(fetch(endpoint, { cache: 'no-store' }), 9000);
      if (!response.ok) throw new Error('news provider');
      const data = await response.json();
      if (data.status !== 'ok' || !Array.isArray(data.items) || !data.items.length) throw new Error('empty');
      cards.innerHTML = data.items.slice(0, 8).map(item => `<article class="news-card"><a href="${esc(item.link || '#')}" target="_blank" rel="noreferrer"><strong>${esc(item.title || 'Untitled')}</strong><small>${esc(item.author || data.feed?.title || 'Google News')}${item.pubDate ? ' · ' + esc(item.pubDate) : ''}</small></a></article>`).join('');
      status.textContent = `${Math.min(8, data.items.length)} RESULTS`;
    } catch {
      status.textContent = 'DEGRADED';
      cards.innerHTML = '<div class="empty">Live news is temporarily unavailable. Try REFRESH.</div>';
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
