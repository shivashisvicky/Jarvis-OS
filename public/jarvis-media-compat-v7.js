(() => {
  'use strict';
  if (window.__JARVIS_MEDIA_COMPAT_V7__) return;
  window.__JARVIS_MEDIA_COMPAT_V7__ = true;

  const sync = () => {
    document.querySelectorAll('#videoResults .jmc7-card').forEach(card => card.classList.add('jv4-video-card'));
  };
  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  sync();
})();
