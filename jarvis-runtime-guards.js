(() => {
  'use strict';
  if (window.__JARVIS_RUNTIME_GUARDS__) return;
  window.__JARVIS_RUNTIME_GUARDS__ = true;

  const nativeFetch = window.fetch.bind(window);
  const blockedHosts = /(?:pipedapi|invidious|allorigins|corsproxy)\./i;
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (blockedHosts.test(url)) {
      return Promise.reject(new Error('Legacy browser media provider disabled: local media authority is active'));
    }
    return nativeFetch(input, init);
  };

  let repairTimer = 0;
  const repairMedia = () => {
    const results = document.querySelector('#videoResults');
    if (!results) return;
    const legacy = results.querySelectorAll(
      '.jyt-card,.jvc-card,.jff-video,.jff-video-results,.jarvis-video-card,' +
      '.jarvis-video-result,.jarvis-final-card,.jarvis-video-results,' +
      '.video-result[data-video-id],.video-results-grid,[data-video-index]'
    );
    if (!legacy.length) return;
    legacy.forEach(node => node.remove());
    console.warn('[JARVIS MEDIA GUARD] Removed legacy browser-rendered media results', { count: legacy.length });
    if (!results.querySelector('.media-local-success,.media-degraded-state,.media-loading-indicator')) {
      const empty = document.createElement('div');
      empty.className = 'empty media-authority-ready';
      empty.textContent = 'LOCAL MEDIA AUTHORITY ACTIVE · SEARCH TO BEGIN';
      results.replaceChildren(empty);
    }
  };
  const scheduleRepair = () => {
    clearTimeout(repairTimer);
    repairTimer = window.setTimeout(repairMedia, 25);
  };
  const boot = () => {
    repairMedia();
    const observer = new MutationObserver(scheduleRepair);
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
