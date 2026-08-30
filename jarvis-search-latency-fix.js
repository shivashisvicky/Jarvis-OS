(() => {
  'use strict';
  if (window.__JARVIS_SEARCH_LATENCY_FIX__) return;
  window.__JARVIS_SEARCH_LATENCY_FIX__ = true;

  // This shim is loaded before jarvis-module-loader.js, which is deferred.
  // jarvisLoadFeature therefore may not exist yet. Install query normalization
  // immediately, then attach the loader hook as soon as the loader appears.
  const normalizeSearchInput = raw => {
    let q = String(raw || '').replace(/\s+/g, ' ').trim();
    q = q.replace(/[.!?]+$/, '').trim();
    const prefixes = [
      /^(?:search|look\s+up|find)\s+(?:(?:on|in|from)\s+)?(?:the\s+)?(?:internet|web|world\s+wide\s+web)\s+(?:for|about|on)\s+/i,
      /^(?:(?:on|in|from)\s+)?(?:the\s+)?(?:internet|web|world\s+wide\s+web)\s+(?:for|about|on)\s+/i,
      /^(?:search|look\s+up|find)\s+(?:for|about)?\s*/i,
      /^(?:google|bing)\s+(?:search\s+)?(?:for\s+)?/i,
    ];
    for (const prefix of prefixes) {
      const next = q.replace(prefix, '').trim();
      if (next !== q) {
        q = next;
        break;
      }
    }
    return q.trim();
  };

  const canonicalizeInput = input => {
    if (!(input instanceof HTMLInputElement)) return;
    const normalized = normalizeSearchInput(input.value);
    if (normalized && normalized !== input.value.trim()) {
      input.value = normalized;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  // Critical path: these listeners must exist even when the deferred module
  // loader has not initialized yet.
  document.addEventListener('click', event => {
    const button = event.target?.closest?.('#webSearch');
    if (!button) return;
    canonicalizeInput(document.querySelector('#webQuery'));
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.target?.id !== 'webQuery') return;
    canonicalizeInput(event.target);
  }, true);

  const warm = original => {
    try { void original('web'); } catch {}
  };

  let loaderHookInstalled = false;
  let waitForLoader = 0;
  const installLoaderHook = () => {
    if (loaderHookInstalled || typeof window.jarvisLoadFeature !== 'function') return;
    const original = window.jarvisLoadFeature;
    window.jarvisLoadFeature = feature => {
      if (feature !== 'web') return original(feature);
      const pending = original(feature).catch(error => {
        console.warn('JARVIS web feature background load failed', error);
      });
      window.__JARVIS_WEB_FEATURE_LOADING__ = pending;
      return Promise.resolve();
    };
    loaderHookInstalled = true;
    if (waitForLoader) window.clearInterval(waitForLoader);
    warm(original);
  };

  installLoaderHook();
  waitForLoader = window.setInterval(installLoaderHook, 50);
  window.setTimeout(() => window.clearInterval(waitForLoader), 10_000);
})();
