(() => {
  'use strict';
  if (window.__JARVIS_SEARCH_LATENCY_FIX__) return;
  window.__JARVIS_SEARCH_LATENCY_FIX__ = true;

  const original = window.jarvisLoadFeature;
  if (typeof original !== 'function') return;

  // Search should render immediately. The feature can finish loading in the
  // background, exactly as the rest of the lazy modules already do.
  window.jarvisLoadFeature = feature => {
    if (feature !== 'web') return original(feature);
    const pending = original(feature).catch(error => {
      console.warn('JARVIS web feature background load failed', error);
    });
    window.__JARVIS_WEB_FEATURE_LOADING__ = pending;
    return Promise.resolve();
  };

  // Normalize spoken search wrappers before the web-search feature receives
  // the query. Voice routing can hand Search Hub a partially stripped phrase
  // such as "the web for black or yellow". That must become "black or yellow",
  // not be sent verbatim to the provider.
  const normalizeSearchInput = raw => {
    let q = String(raw || '').replace(/\s+/g, ' ').trim();
    q = q.replace(/^search\s+(?:the\s+)?(?:internet|web)\s+(?:for|about)\s+/i, '');
    q = q.replace(/^(?:the\s+)?(?:internet|web)\s+(?:for|about)\s+/i, '');
    q = q.replace(/^look\s+up\s+(?:on\s+the\s+)?(?:internet|web)\s+(?:for|about)\s+/i, '');
    q = q.replace(/^find\s+(?:on\s+the\s+)?(?:internet|web)\s+(?:for|about)\s+/i, '');
    return q.trim();
  };

  document.addEventListener('click', event => {
    const button = event.target?.closest?.('#webSearch');
    if (!button) return;
    const input = document.querySelector('#webQuery');
    if (!(input instanceof HTMLInputElement)) return;
    const normalized = normalizeSearchInput(input.value);
    if (normalized && normalized !== input.value.trim()) {
      input.value = normalized;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.target?.id !== 'webQuery') return;
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const normalized = normalizeSearchInput(input.value);
    if (normalized && normalized !== input.value.trim()) {
      input.value = normalized;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, true);

  // Start warming Search while the user is still on the initial shell.
  const warm = () => {
    try { void original('web'); } catch {}
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(warm, { timeout: 1800 });
  } else {
    window.setTimeout(warm, 900);
  }
})();
