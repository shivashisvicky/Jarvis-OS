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
