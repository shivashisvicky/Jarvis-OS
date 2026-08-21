(() => {
  const GATEWAY = 'https://jarvis-intelligence.shivashisvicky112.workers.dev/api/search';
  const SEARCH = 'https://jarvis-search.shivashisvicky112.workers.dev/api/search';
  let active = 0;

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
    const timer = setTimeout(() => controller.abort(), ms);
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

  const render = (cards, items, degraded = false) => {
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

    try {
      const data = await timeoutFetch(`${GATEWAY}?q=${encodeURIComponent(q)}`, 9000);
      if (run !== active) return;
      const count = render(cards, data.results || [], false);
      status.textContent = `${count} RESULTS`;
      if (count) return;
      throw new Error('Gateway returned no usable articles');
    } catch (gatewayError) {
      if (run !== active) return;
      try {
        const data = await timeoutFetch(`${SEARCH}?provider=brave&q=${encodeURIComponent(`${q} Reuters BBC Guardian Al Jazeera`)}`, 9000);
        if (run !== active) return;
        const count = render(cards, data.results || [], true);
        status.textContent = count ? `${count} RESULTS · DEGRADED` : 'NO RESULTS · DEGRADED';
      } catch (fallbackError) {
        if (run !== active) return;
        cards.innerHTML = '<div class="news-empty">Live news is temporarily unavailable. Tap REFRESH to retry.</div>';
        status.textContent = 'DEGRADED';
        console.warn('JARVIS final news loader failed', gatewayError, fallbackError);
      }
    }
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

    window.setTimeout(() => {
      const text = cards.textContent?.trim() || '';
      if (!text || text === 'Loading live intelligence…' || text === 'Fetching headlines…') load(select.value || 'WORLD');
    }, 1200);
    return true;
  };

  const boot = () => {
    if (wire()) return;
    const observer = new MutationObserver(() => {
      if (wire()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 15000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
