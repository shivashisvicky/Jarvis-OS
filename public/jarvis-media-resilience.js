(() => {
  'use strict';
  const ROUTE = {
    'https://pipedapi.kavin.rocks': 'https://pipedapi.kavin.rocks',
    'https://pipedapi.tokhmi.xyz': 'https://pipedapi.adminforge.de',
    'https://pipedapi.syncpundit.io': 'https://pipedapi.drgns.space'
  };
  const originalFetch = window.fetch.bind(window);
  const timeoutFetch = async (url, init, ms = 5000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try { return await originalFetch(url, {...init, signal: controller.signal}); }
    finally { clearTimeout(timer); }
  };
  window.fetch = async (input, init) => {
    const raw = typeof input === 'string' ? input : input?.url || '';
    const match = Object.keys(ROUTE).find(base => raw.startsWith(base));
    if (!match) return originalFetch(input, init);
    const target = ROUTE[match] + raw.slice(match.length);
    return timeoutFetch(target, init);
  };
})();
