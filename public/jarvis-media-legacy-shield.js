(() => {
  'use strict';
  // main.ts still contains the retired media owner. Keep it from racing the
  // v7 authority until that legacy path is removed from the TypeScript shell.
  const RETIRED_RESULT = '.video-result';
  let recovering = false;
  let lastQuery = '';

  const recover = () => {
    const input = document.querySelector('#videoQuery');
    const results = document.querySelector('#videoResults');
    if (!input || !results || !results.querySelector(RETIRED_RESULT)) return;
    const query = input.value.trim();
    if (!query || recovering || query === lastQuery) return;
    const search = window.jarvisVideoSearch;
    if (typeof search !== 'function') return;
    recovering = true;
    lastQuery = query;
    queueMicrotask(() => {
      try { void search(query); }
      finally { recovering = false; }
    });
  };

  const boot = () => {
    const observer = new MutationObserver(recover);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    recover();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
