(() => {
  'use strict';
  const BASES = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.adminforge.de',
    'https://pipedapi.drgns.space',
    'https://api.piped.yt',
    'https://pipedapi.leptons.xyz',
    'https://piped-api.privacy.com.de'
  ];
  const originalFetch = window.fetch.bind(window);
  const isPiped = url => BASES.some(base => String(url).startsWith(base));
  const pathOf = url => { try { const u = new URL(url); return u.pathname + u.search; } catch { return ''; } };
  const timeoutFetch = async (url, init, ms = 7000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try { return await originalFetch(url, {...init, signal: controller.signal}); }
    finally { clearTimeout(timer); }
  };
  window.fetch = async (input, init) => {
    const raw = typeof input === 'string' ? input : input?.url || '';
    if (!isPiped(raw)) return originalFetch(input, init);
    const path = pathOf(raw);
    let last;
    const requested = BASES.find(base => raw.startsWith(base));
    for (const base of [requested, ...BASES.filter(x => x !== requested)]) {
      try {
        const r = await timeoutFetch(base + path, init);
        if (r.ok) return r;
        last = new Error(`${r.status}`);
      } catch (e) { last = e; }
    }
    throw last || new Error('Video service unavailable');
  };
})();
