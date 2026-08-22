(() => {
  'use strict';
  if (window.__JARVIS_YOUTUBE_GESTURE_FIX__) return;
  window.__JARVIS_YOUTUBE_GESTURE_FIX__ = true;

  const ORIGIN = 'https://shivashisvicky.github.io';
  const embedUrl = id => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&mute=0&controls=1&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(ORIGIN)}`;

  document.addEventListener('click', event => {
    const card = event.target?.closest?.('[data-jvc-id]');
    if (!card) return;
    const id = String(card.getAttribute('data-jvc-id') || '').trim();
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;

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
    frame.src = embedUrl(id);
    host.dataset.videoId = id;
  }, true);
})();
