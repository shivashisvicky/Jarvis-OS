(() => {
  'use strict';
  if (window.__JARVIS_IOS_YOUTUBE_PLAY_FIX__) return;
  window.__JARVIS_IOS_YOUTUBE_PLAY_FIX__ = true;

  // iOS/WebKit does not propagate a parent-page user gesture into a
  // cross-origin YouTube iframe. Keep the gesture synchronous by navigating
  // the top-level page directly to YouTube on iPhone/iPad. Desktop and Android
  // retain the inline JARVIS player.
  const isAppleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (!isAppleMobile) return;

  const getVideoId = raw => {
    const value = String(raw || '').trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
    try {
      const url = new URL(value);
      const host = url.hostname.replace(/^www\./, '').toLowerCase();
      if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || null;
      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
        if (url.pathname === '/watch') return url.searchParams.get('v');
        const parts = url.pathname.split('/').filter(Boolean);
        if (['shorts', 'live', 'embed'].includes(parts[0])) return parts[1] || null;
      }
    } catch {}
    return null;
  };

  document.addEventListener('click', event => {
    const card = event.target?.closest?.('[data-jvc-id]');
    if (!card) return;
    const id = getVideoId(card.getAttribute('data-jvc-id'));
    if (!id) return;

    // Do this synchronously in the trusted click event. Do not await, timeout,
    // scroll, message an iframe, or call the YouTube IFrame API first.
    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign(`https://www.youtube.com/watch?v=${encodeURIComponent(id)}`);
  }, true);
})();
