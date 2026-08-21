(() => {
  const GDELT = 'https://api.gdeltproject.org/api/v2/doc/doc';
  const originalSetTimeout = window.setTimeout.bind(window);
  let activeRun = 0;

  // Prevent the legacy 650ms World boot call in main.ts from competing with this controller.
  window.setTimeout = ((fn, delay, ...args) => {
    try {
      const source = typeof fn === 'function' ? Function.prototype.toString.call(fn) : '';
      if (delay <= 800 && /loadNews\(['\"]WORLD['\"]\)/.test(source)) return 0;
    } catch {}
    return originalSetTimeout(fn, delay, ...args);
  });

  const esc = (value) => String(value ?? '').replace(/[&<>\"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'
  }[c]));

  const trusted = [
    'reuters.com','bbc.com','bbc.co.uk','apnews.com','aljazeera.com','theguardian.com',
    'nytimes.com','washingtonpost.com','ft.com','dw.com','france24.com','npr.org',
    'cnbc.com','cnn.com','abcnews.go.com','thehindu.com','indianexpress.com'
  ];

  function queryFor(category) {
    if (category === 'INDIA') return '(India OR Indian) sourcelang:English';
    if (category === 'AI') return '("artificial intelligence" OR AI) sourcelang:English';
    if (category === 'TECH') return '(technology OR software) sourcelang:English';
    return '(international OR geopolitics OR "global affairs" OR "world news") sourcelang:English -sports -celebrity -entertainment';
  }

  async function fetchGdelt(query) {
    const controller = new AbortController();
    const timer = originalSetTimeout(() => controller.abort(), 5000);
    const url = new URL(GDELT);
    url.searchParams.set('query', query);
    url.searchParams.set('mode', 'artlist');
    url.searchParams.set('format', 'json');
    url.searchParams.set('maxrecords', '25');
    url.searchParams.set('timespan', '24h');
    url.searchParams.set('sort', 'datedesc');
    try {
      const response = await fetch(url, { cache: 'no-store', signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`GDELT HTTP ${response.status}`);
      const data = await response.json();
      const articles = Array.isArray(data?.articles) ? data.articles : [];
      if (!articles.length) throw new Error('GDELT returned no articles');
      return articles;
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error('GDELT timeout after 5s');
      throw error;
    } finally { clearTimeout(timer); }
  }

  function rank(articles) {
    const cleaned = articles.filter(a => a?.title && /^https?:\/\//i.test(a?.url));
    const good = cleaned.filter(a => trusted.some(d => String(a.domain || '').toLowerCase().endsWith(d)));
    const rest = cleaned.filter(a => !trusted.some(d => String(a.domain || '').toLowerCase().endsWith(d)) && !/wikipedia|facebook|youtube|reddit|quora/i.test(String(a.domain || '')));
    return [...good, ...rest].slice(0, 5);
  }

  function render(cards, articles) {
    const items = rank(articles);
    cards.innerHTML = items.map((a, i) => {
      const rawDate = String(a.seendate || '');
      const date = rawDate.length >= 8 ? `${rawDate.slice(4,6)}/${rawDate.slice(6,8)}` : '';
      return `<a class="news-dense-item" href="${esc(a.url)}" target="_blank" rel="noreferrer"><span class="news-rank">${String(i+1).padStart(2,'0')}</span><span class="news-copy"><strong class="news-title">${esc(a.title)}</strong><span class="news-meta"><span class="news-source">${esc(a.domain || 'LIVE NEWS')}</span>${date ? `<span class="news-country">${date}</span>` : ''}</span></span><span class="news-open">OPEN</span></a>`;
    }).join('') || '<div class="news-empty">No usable live headlines returned.</div>';
    return items.length;
  }

  async function load(category = 'WORLD') {
    const status = document.querySelector('#newsStatus');
    const cards = document.querySelector('#newsCards');
    if (!status || !cards) return;
    const run = ++activeRun;
    status.textContent = 'SCANNING';
    cards.innerHTML = '<div class="news-empty">Fetching live headlines…</div>';
    try {
      const articles = await fetchGdelt(queryFor(category));
      if (run !== activeRun) return;
      const count = render(cards, articles);
      status.textContent = count ? `${count} RESULTS` : 'DEGRADED';
    } catch (error) {
      if (run !== activeRun) return;
      status.textContent = 'DEGRADED';
      cards.innerHTML = `<div class="news-empty"><strong>World News diagnostic</strong><br>${esc(error?.message || 'News request failed')}<br><small>Source: GDELT · 5 second client timeout</small></div>`;
      console.warn('JARVIS World News failed', error);
    }
  }

  function wire() {
    const button = document.querySelector('#refreshNews');
    const select = document.querySelector('#newsGenre');
    const cards = document.querySelector('#newsCards');
    if (!button || !select || !cards || button.dataset.worldNewsBound === '1') return false;
    const replacement = button.cloneNode(true);
    button.replaceWith(replacement);
    replacement.dataset.worldNewsBound = '1';
    replacement.addEventListener('click', () => load(select.value || 'WORLD'));
    originalSetTimeout(() => load(select.value || 'WORLD'), 100);
    return true;
  }

  function boot() {
    if (wire()) return;
    const observer = new MutationObserver(() => { if (wire()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
    originalSetTimeout(() => observer.disconnect(), 15000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
