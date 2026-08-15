(() => {
  'use strict';
  const CACHE = 'jarvis-net-cache-v1:';
  const NEWS_TTL = 5 * 60 * 1000;
  const VIDEO_TTL = 10 * 60 * 1000;
  const nativeFetch = window.fetch.bind(window);
  const keyFor = url => CACHE + url;
  const isCacheable = url => /api\.rss2json\.com\/v1\/api\.json|pipedapi\.[^/]+\/(trending|search|streams)/i.test(url);
  const ttlFor = url => /rss2json/i.test(url) ? NEWS_TTL : VIDEO_TTL;
  const read = url => { try { const x = JSON.parse(localStorage.getItem(keyFor(url)) || 'null'); return x && x.body && (Date.now() - x.time < ttlFor(url)) ? x : null; } catch { return null; } };
  const write = (url, body) => { try { localStorage.setItem(keyFor(url), JSON.stringify({time:Date.now(), body})); } catch {} };
  window.fetch = async function(input, init = {}) {
    const url = typeof input === 'string' ? input : input.url;
    const get = (init.method || (typeof input !== 'string' && input.method) || 'GET').toUpperCase() === 'GET';
    if (!get || !isCacheable(url)) return nativeFetch(input, init);
    const cached = read(url);
    if (cached) {
      nativeFetch(input, {...init, cache:'no-store'}).then(async r => { if (r.ok) write(url, await r.clone().text()); }).catch(() => {});
      return new Response(cached.body, {status:200, headers:{'content-type':'application/json','x-jarvis-cache':'HIT'}});
    }
    try {
      const r = await nativeFetch(input, init);
      if (r.ok) { const text = await r.clone().text(); write(url, text); }
      return r;
    } catch (e) {
      try { const x=JSON.parse(localStorage.getItem(keyFor(url))||'null'); if (x?.body) return new Response(x.body,{status:200,headers:{'content-type':'application/json','x-jarvis-cache':'STALE'}}); } catch {}
      throw e;
    }
  };
})();
