(() => {
  'use strict';
  if (window.__JARVIS_RUNTIME_GUARDS__) return;
  window.__JARVIS_RUNTIME_GUARDS__ = true;

  // Legacy Piped instances are no longer part of the media authority.
  // Keep the network quarantine, but do not clone/replace media controls.
  // Replacing #videoQuery/#videoSearch can detach the unified authority's
  // direct listeners and creates a timing race in the SPA render cycle.
  const nativeFetch = window.fetch.bind(window);
  const blocked = /^https:\/\/pipedapi(?:-[^./]+)?\.[^/]+/i;
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (blocked.test(url)) {
      return Promise.reject(new Error('Legacy Piped media provider disabled: unified media authority is active'));
    }
    return nativeFetch(input, init);
  };

  const mediaSelectors = '#media-center,[data-app-container="media"],.media-center-root,section[data-app="media"],#media';
  let repairTimer = 0;
  let rootObserver = null;

  const repairMedia = () => {
    const root = document.querySelector(mediaSelectors);
    if (!root) return;

    const authority = window.JarvisMedia;
    const input = root.querySelector('#videoQuery');
    const results = root.querySelector('#videoResults');
    if (!authority || !input || !results) return;

    // Only clean up output produced by a legacy renderer. Never replace the
    // input/search controls because the unified authority owns those nodes.
    const legacyCards = results.querySelectorAll('.video-result[data-video-id]:not([data-embed-url])');
    const legacyState = /Loading trending|SEARCHING VIDEO INDEX|Video index unavailable|SEARCH FAILED/i.test(results.textContent || '');
    if (legacyCards.length || legacyState) {
      results.replaceChildren();
      if (input.value.trim()) {
        void authority.executeSearch(input.value.trim());
      } else {
        const ready = document.createElement('div');
        ready.className = 'empty';
        ready.textContent = 'Ready · search for videos to begin.';
        results.appendChild(ready);
      }
    }
  };

  const scheduleRepair = () => {
    clearTimeout(repairTimer);
    repairTimer = window.setTimeout(repairMedia, 20);
  };

  const boot = () => {
    repairMedia();
    rootObserver = new MutationObserver(scheduleRepair);
    rootObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
