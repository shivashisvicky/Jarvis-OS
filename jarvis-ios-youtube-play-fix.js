(() => {
  'use strict';
  if (window.__JARVIS_IOS_YOUTUBE_PLAY_FIX__) return;
  window.__JARVIS_IOS_YOUTUBE_PLAY_FIX__ = true;

  const isAppleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (!isAppleMobile) return;

  document.addEventListener('click', event => {
    const card = event.target?.closest?.('[data-jvc-id]');
    if (!card) return;
    const id = String(card.getAttribute('data-jvc-id') || '').trim();
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;

    // Keep the navigation directly inside the trusted iOS tap. A parent-page
    // gesture cannot be transferred into the cross-origin YouTube iframe.
    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign(`https://www.youtube.com/watch?v=${encodeURIComponent(id)}`);
  }, true);
})();
