(() => {
  const SEARCH = 'https://jarvis-search.shivashisvicky112.workers.dev/api/search';
  const GATEWAY = 'https://jarvis-intelligence.shivashisvicky112.workers.dev/api/search';
  const originalSetTimeout = window.setTimeout.bind(window);
  let active = 0;

  // The SPA used to start its own news request while this final loader was also
  // starting one. Block only that legacy boot callback. User-triggered refresh
  // is replaced below, so the final loader owns the news surface completely.
  window.setTimeout = ((fn, delay, ...args) => {
    try {
      const source = typeof fn === 'function' ? Function.prototype.toString.call(fn) : '';
      if (delay <= 800 && /loadNews\(['\"]WORLD['\"]\)/.test(source)) return 0;
    } catch {}
    return originalSetTimeout(fn, delay, ...args);
  });

  const esc = (value) => String(value ?? '').replace(/[&<>\"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#039;'
  }[c]));

  const queryFor = (category) => ({
    INDIA: 'India OR Indian latest news',
    AI: 'artificial intelligence OR AI latest news',
    TECH: 'technology OR software latest news',
    WORLD: 'geopolitics OR international OR global latest news'
  }[category] || 'geopolitics OR international OR global latest news');

  const timeoutFetch = async (url, ms = 9000) => {
    const controller = new AbortController();
    const timer = originalSetTimeout(() => controller.abort(), ms);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: controller.signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);
      if (!Array.isArray(data?.results) || !data.results.length) throw new Error('No usable results');
      return data;
    } finally {
      clearTimeout(timer);
    }
  };

  const render = (cards, items) => {
    const usable = items.filter((item) => item && item.title && /^https?:\/\//i.test(item.link)).slice(0, 5);
    cards.innerHTML = usable.map((item, i) => {
      const published = item.published || item.date || '';
      const date = published ? new Date(published).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
      return `<a class="news-dense-item" href="${esc(item.link)}" target="_blank" rel="noreferrer"><span class="news-rank">${String(i + 1).padStart(2, '0')}</span><span class="news-copy"><strong class="news-title">${esc(item.title)}</strong><span class="news-meta"><span class="news-source">${esc(item.source || 'LIVE NEWS')}</span>${date ? `<span class="news-country">${esc(date)}</span>` : ''}</span></span><span class="news-open">OPEN</span></a>`;
    }).join('') || '<div class="news-empty">No live news returned.</div>';
    return usable.length;
  };

  const load = async (category = 'WORLD') => {
    const status = document.querySelector('#newsStatus');
    const cards = document.querySelector('#newsCards');
    if (!status || !cards) return;
    const run = ++active;
    status.textContent = 'SCANNING';
    cards.innerHTML = '<div class="news-empty">Fetching live headlines…</div>';
    const q = queryFor(category);

    // Stable search gateway first, then the intelligence news aggregator.
    // This avoids depending on a single upstream news provider.
    const attempts = [
      `${SEARCH}?provider=bing&q=${encodeURIComponent(q)}`,
      `${GATEWAY}?q=${encodeURIComponent(q)}`,
      `${SEARCH}?provider=brave&q=${encodeURIComponent(`${q} Reuters BBC Guardian Al Jazeera`)}`
    ];

    let lastError = null;
    for (const endpoint of attempts) {
      try {
        const data = await timeoutFetch(endpoint, 9000);
        if (run !== active) return;
        const count = render(cards, data.results || []);
        if (count > 0) {
          status.textContent = `${count} RESULTS`;
          return;
        }
        lastError = new Error('Provider returned no usable articles');
      } catch (error) {
        lastError = error;
      }
    }

    if (run !== active) return;
    cards.innerHTML = '<div class="news-empty">Live news is temporarily unavailable. Tap REFRESH to retry.</div>';
    status.textContent = 'DEGRADED';
    console.warn('JARVIS final news loader failed all providers', lastError);
  };

  const wire = () => {
    const button = document.querySelector('#refreshNews');
    const select = document.querySelector('#newsGenre');
    const cards = document.querySelector('#newsCards');
    if (!button || !select || !cards || button.dataset.finalNewsBound === '1') return false;

    const replacement = button.cloneNode(true);
    button.replaceWith(replacement);
    replacement.dataset.finalNewsBound = '1';
    replacement.addEventListener('click', () => load(select.value || 'WORLD'));

    originalSetTimeout(() => {
      const text = cards.textContent?.trim() || '';
      if (!text || text === 'Loading live intelligence…' || text === 'Fetching headlines…') load(select.value || 'WORLD');
    }, 250);
    return true;
  };

  const boot = () => {
    if (wire()) return;
    const observer = new MutationObserver(() => {
      if (wire()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    originalSetTimeout(() => observer.disconnect(), 15000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
