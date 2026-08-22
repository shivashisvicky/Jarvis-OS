(() => {
  'use strict';
  if (window.__JARVIS_YOUTUBE_GESTURE_FIX__) return;
  window.__JARVIS_YOUTUBE_GESTURE_FIX__ = true;

  const ORIGIN = 'https://shivashisvicky.github.io';
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const embedUrl = (id, muted) => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&mute=${muted ? 1 : 0}&controls=1&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(ORIGIN)}`;

  // iOS/WebKit does not propagate the parent-page gesture into a
  // cross-origin YouTube iframe. The JARVIS card must therefore perform a
  // top-level YouTube navigation synchronously inside the trusted tap.
  const watchUrl = id => `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;

  document.addEventListener('click', event => {
    const card = event.target?.closest?.('[data-jvc-id]');
    if (!card) return;
    const id = card.getAttribute('data-jvc-id');
    if (!id) return;

    if (isIOS) {
      // Do not scroll, await, timeout, postMessage, or call playVideo first.
      // Any of those can move playback outside iOS's transient user gesture.
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(watchUrl(id));
      return;
    }

    const host = document.querySelector('#jarvisPlayer');
    if (!host) return;
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

    try { host.scrollIntoView({ behavior: 'auto', block: 'center' }); } catch {}
    void host.offsetHeight;
    frame.src = embedUrl(id, false);
    host.dataset.videoId = id;
  }, true);
})();
