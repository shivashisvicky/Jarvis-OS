(() => {
  // World News bridge: keep the existing main.ts UI, but never let the browser call GDELT directly.
  // The request is proxied through the JARVIS Intelligence Gateway, which can fall back to Google News RSS.
  const GATEWAY = 'https://jarvis-intelligence.shivashisvicky112.workers.dev/api/search';
  const originalFetch = window.fetch.bind(window);
  const originalSetTimeout = window.setTimeout.bind(window);

  const toArticles = (payload) => ({
    articles: (Array.isArray(payload?.results) ? payload.results : []).map((item) => ({
      title: item?.title || '',
      url: item?.link || '',
      domain: item?.source || 'LIVE NEWS',
      seendate: item?.published || ''
    })).filter((item) => item.title && /^https?:\/\//i.test(item.url))
  });

  window.fetch = async (input, init) => {
    const raw = typeof input === 'string' ? input : input?.url || '';
    if (!/^https:\/\/api\.gdeltproject\.org\/api\/v2\/doc\/doc(?:\?|$)/i.test(raw)) {
      return originalFetch(input, init);
    }

    const source = new URL(raw);
    const query = source.searchParams.get('query') || 'world news';
    const target = new URL(GATEWAY);
    target.searchParams.set('q', query);

    const controller = new AbortController();
    const timer = originalSetTimeout(() => controller.abort(), 12000);
    try {
      const response = await originalFetch(target.toString(), {
        cache: 'no-store',
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      const text = await response.text();
      let payload = {};
      try { payload = JSON.parse(text); } catch {}
      if (!response.ok) {
        const detail = payload?.providers?.length
          ? payload.providers.map((p) => `${p.provider}: ${p.code || p.status}`).join(' | ')
          : payload?.error || `HTTP ${response.status}`;
        throw new Error(`News gateway HTTP ${response.status}: ${detail}`);
      }
      const normalized = toArticles(payload);
      if (!normalized.articles.length) throw new Error('News gateway returned zero usable articles');
      return new Response(JSON.stringify(normalized), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
      });
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error('News gateway timeout after 12s');
      throw error;
    } finally {
      clearTimeout(timer);
    }
  };

  console.info('[JARVIS] World News browser bridge active: GDELT -> Intelligence Gateway');
})();
