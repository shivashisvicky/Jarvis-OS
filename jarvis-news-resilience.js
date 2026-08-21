(() => {
  'use strict';

  const INTELLIGENCE_HOST = 'jarvis-intelligence.shivashisvicky112.workers.dev';
  const CACHE_PREFIX = 'jarvis-news-cache-v1:';
  const CACHE_TTL = 15 * 60 * 1000;
  const originalFetch = window.fetch.bind(window);

  const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

  const cacheKey = (url) => `${CACHE_PREFIX}${url}`;

  function readCache(url) {
    try {
      const raw = sessionStorage.getItem(cacheKey(url));
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (!entry || Date.now() - Number(entry.time || 0) > CACHE_TTL || !entry.data?.results?.length) {
        sessionStorage.removeItem(cacheKey(url));
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  }

  function writeCache(url, data) {
    if (!data?.results?.length) return;
    try {
      sessionStorage.setItem(cacheKey(url), JSON.stringify({ time: Date.now(), data }));
    } catch {}
  }

  async function gdeltFallback(query) {
    const target = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
    target.searchParams.set('query', query);
    target.searchParams.set('mode', 'artlist');
    target.searchParams.set('maxrecords', '10');
    target.searchParams.set('timespan', '14days');
    target.searchParams.set('format', 'json');
    target.searchParams.set('sort', 'HybridRel');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);
    try {
      const response = await originalFetch(target.toString(), {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`GDELT HTTP ${response.status}`);
      const data = await response.json();
      const results = (Array.isArray(data?.articles) ? data.articles : [])
        .map(article => ({
          title: String(article?.title || '').trim(),
          link: String(article?.url || '').trim(),
          source: String(article?.domain || 'GDELT').trim(),
          snippet: '',
          published: String(article?.seendate || '').trim(),
        }))
        .filter(item => item.title && /^https?:\/\//i.test(item.link))
        .slice(0, 10);
      if (!results.length) throw new Error('GDELT returned no articles');
      return { results, provider: 'gdelt-browser-fallback', query };
    } finally {
      clearTimeout(timer);
    }
  }

  window.fetch = async (input, init) => {
    const requestUrl = typeof input === 'string' ? input : input?.url;
    let url;
    try { url = new URL(requestUrl, location.href); } catch { return originalFetch(input, init); }

    if (url.hostname !== INTELLIGENCE_HOST || url.pathname !== '/api/search') {
      return originalFetch(input, init);
    }

    const originalPromise = originalFetch(input, init);
    const query = url.searchParams.get('q') || '';
    const fallbackPromise = gdeltFallback(query);

    try {
      const winner = await Promise.race([
        originalPromise.then(async response => {
          if (!response.ok) throw new Error(`gateway HTTP ${response.status}`);
          const data = await response.clone().json();
          if (!Array.isArray(data?.results) || !data.results.length) throw new Error('gateway returned no results');
          writeCache(url.toString(), data);
          return response;
        }),
        fallbackPromise.then(data => {
          writeCache(url.toString(), data);
          return jsonResponse(data);
        }),
      ]);
      return winner;
    } catch (error) {
      try {
        const data = await fallbackPromise;
        writeCache(url.toString(), data);
        return jsonResponse(data);
      } catch {
        const cached = readCache(url.toString());
        if (cached) return jsonResponse({ ...cached, provider: 'cached-news', stale: true });
        return originalPromise.catch(() => jsonResponse({ error: String(error?.message || 'News unavailable'), code: 'NEWS_CLIENT_UNAVAILABLE', results: [], query }, 502));
      }
    }
  };
})();
