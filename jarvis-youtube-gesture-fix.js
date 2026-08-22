(() => {
  'use strict';
  if (window.__JARVIS_YOUTUBE_GESTURE_FIX__) return;
  window.__JARVIS_YOUTUBE_GESTURE_FIX__ = true;

  const ORIGIN = 'https://shivashisvicky.github.io';
  const embedUrl = id => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&mute=1&controls=1&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(ORIGIN)}`;

  document.addEventListener('click', event => {
    const card = event.target?.closest?.('[data-jvc-id]');
    if (!card) return;

    const id = card.getAttribute('data-jvc-id');
    const host = document.querySelector('#jarvisPlayer');
    if (!id || !host) return;

    // This capture-phase handler is intentionally the ONLY handler that owns
    // the card click. The old delegated handler would defer playback through
    // scrolling/IntersectionObserver and lose the iOS user-activation token.
    event.preventDefault();
    event.stopImmediatePropagation();

    let frame = host.querySelector('iframe');
    if (!frame) {
      frame = document.createElement('iframe');
      frame.title = 'JARVIS YouTube player';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      frame.style.width = '100%';
      frame.style.height = '100%';
      frame.style.border = '0';
      host.replaceChildren(frame);
    }

    // No smooth scroll, no timeout, no IntersectionObserver, no playVideo().
    // Put the player on screen synchronously, then navigate the iframe in the
    // same trusted click dispatch. Muted autoplay is permitted by Safari while
    // preserving the original user gesture for the iframe navigation.
    try { host.scrollIntoView({ behavior: 'auto', block: 'center' }); } catch {}
    void host.offsetHeight;
    frame.src = embedUrl(id);
    host.dataset.videoId = id;
  }, true);
})();
