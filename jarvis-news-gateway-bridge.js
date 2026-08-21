(() => {
  'use strict';
  const GATEWAY = 'https://jarvis-intelligence.shivashisvicky112.workers.dev/api/search';
  const RSS_PROXY_HOST = 'api.rss2json.com';
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    let url = '';
    try { url = typeof input === 'string' ? input : input?.url || ''; } catch {}
    try {
      const parsed = new URL(url, window.location.href);
      if (parsed.hostname === RSS_PROXY_HOST && parsed.pathname === '/v1/api.json') {
        const rssUrl = parsed.searchParams.get('rss_url') || '';
        let query = 'world news when:1d -sports -entertainment -celebrity';
        try {
          const feed = new URL(rssUrl);
          query = feed.searchParams.get('q') || query;
        } catch {}
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 9000);
        try {
          const gateway = new URL(GATEWAY);
          gateway.searchParams.set('q', `(${query})`);
          const response = await nativeFetch(gateway.toString(), {
            ...init,
            cache: 'no-store',
            signal: init?.signal || controller.signal,
            headers: { Accept: 'application/json', ...(init?.headers || {}) },
          });
          const raw = await response.text();
          let data = {};
          try { data = raw ? JSON.parse(raw) : {}; } catch {}
          if (!response.ok) {
            return new Response(JSON.stringify({ status: 'error', message: data?.error || data?.code || `Gateway HTTP ${response.status}`, items: [] }), {
              status: response.status,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          const items = Array.isArray(data?.results) ? data.results.map((item) => ({
            title: String(item?.title || '').trim(),
            link: String(item?.link || '').trim(),
            author: String(item?.source || 'LIVE NEWS').trim(),
            pubDate: String(item?.published || '').trim(),
          })).filter((item) => item.title && /^https?:\/\//i.test(item.link)) : [];
          console.info('[JARVIS NEWS BRIDGE]', { provider: data?.provider || 'multi-source-rss', query, count: items.length, diagnostics: data?.diagnostics || null });
          return new Response(JSON.stringify({ status: 'ok', items, feed: { title: 'JARVIS Live News' } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          });
        } finally {
          window.clearTimeout(timer);
        }
      }
    } catch (error) {
      console.error('[JARVIS NEWS BRIDGE FAILED]', error);
    }
    return nativeFetch(input, init);
  };
})();
