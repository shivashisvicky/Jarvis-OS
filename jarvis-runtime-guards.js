(() => {
  'use strict';
  if (window.__JARVIS_RUNTIME_GUARDS__) return;
  window.__JARVIS_RUNTIME_GUARDS__ = true;

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
  let lastRoot = null;
  let repairTimer = 0;
  let observer = null;

  const cloneControl = (root, selector) => {
    const el = root.querySelector(selector);
    if (!el || el.dataset.jarvisGuarded === '1') return;
    const clone = el.cloneNode(true);
    clone.dataset.jarvisGuarded = '1';
    el.replaceWith(clone);
  };

  const repairMedia = () => {
    const root = document.querySelector(mediaSelectors);
    if (!root) return;
    if (root !== lastRoot) {
      lastRoot = root;
      if (observer) observer.disconnect();
      observer = new MutationObserver(() => {
        clearTimeout(repairTimer);
        repairTimer = window.setTimeout(repairMedia, 20);
      });
      observer.observe(root, { childList: true, subtree: true });
    }

    cloneControl(root, '#videoQuery');
    cloneControl(root, '#videoSearch');
    cloneControl(root, '#videoUrl');
    cloneControl(root, '#playVideo');

    const authority = window.JarvisMedia;
    const input = root.querySelector('#videoQuery');
    const results = root.querySelector('#videoResults');
    if (!authority || !input || !results) return;

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

  const boot = () => {
    repairMedia();
    const rootObserver = new MutationObserver(() => {
      clearTimeout(repairTimer);
      repairTimer = window.setTimeout(repairMedia, 30);
    });
    rootObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
