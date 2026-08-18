(() => {
  'use strict';
  if (window.__JARVIS_RUNTIME_GUARDS__) return;
  window.__JARVIS_RUNTIME_GUARDS__ = true;
  window.__JARVIS_LEGACY_MEDIA_DISABLED__ = true;

  // The SPA still contains historical media code in some deployed revisions.
  // Quarantine every known legacy provider before it can create a result set.
  const nativeFetch = window.fetch.bind(window);
  const blocked = /^(?:https:\/\/)?(?:pipedapi(?:-[^./]+)?\.[^/]+|api-piped\.[^/]+|inv\.[^/]+|invidious\.[^/]+)(?:\/|$)/i;
  const legacyPath = /\/(?:search|trending|streams)\b/i;
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (blocked.test(url) || (legacyPath.test(url) && /piped|invidious/i.test(url))) {
      return Promise.reject(new Error('Legacy browser video provider disabled: unified local media authority is active'));
    }
    return nativeFetch(input, init);
  };

  const mediaSelectors = '#videoResults,.video-results-container,.jyt-results';
  let repairTimer = 0;
  let rootObserver = null;
  let resultsObserver = null;

  const purgeLegacyResults = () => {
    const results = document.querySelector(mediaSelectors);
    if (!results) return;

    // Anything rendered by the retired SPA media runtime is not allowed to
    // survive. Unified/local results use data-jarvis-local-result.
    const legacyCards = results.querySelectorAll(
      '.video-result:not([data-jarvis-local-result]), .jyt-card:not([data-jarvis-local-result])'
    );
    if (legacyCards.length) legacyCards.forEach(card => card.remove());

    const text = results.textContent || '';
    if (/Loading trending|SEARCHING VIDEO INDEX|Video index unavailable|SEARCH FAILED|TRENDING/i.test(text)
        && !results.querySelector('[data-jarvis-local-result]')) {
      results.replaceChildren();
      const ready = document.createElement('div');
      ready.className = 'empty';
      ready.textContent = 'Ready · search for videos to begin.';
      results.appendChild(ready);
    }
  };

  const scheduleRepair = () => {
    clearTimeout(repairTimer);
    repairTimer = window.setTimeout(purgeLegacyResults, 0);
  };

  const boot = () => {
    purgeLegacyResults();
    rootObserver = new MutationObserver(scheduleRepair);
    rootObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
    const results = document.querySelector(mediaSelectors);
    if (results) {
      resultsObserver?.disconnect();
      resultsObserver = new MutationObserver(purgeLegacyResults);
      resultsObserver.observe(results, { childList: true, subtree: true });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
