(() => {
  'use strict';
  if (window.__JARVIS_YOUTUBE_GESTURE_FIX__) return;
  window.__JARVIS_YOUTUBE_GESTURE_FIX__ = true;

  const ORIGIN = 'https://shivashisvicky.github.io';
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const embedUrl = (id, muted) => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&mute=${muted ? 1 : 0}&controls=1&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(ORIGIN)}`;

  function ensureHint(host) {
    let hint = host.querySelector('[data-jh-youtube-sound]');
    if (!hint) {
      hint = document.createElement('button');
      hint.type = 'button';
      hint.setAttribute('data-jh-youtube-sound', '');
      hint.textContent = '🔊 TAP THE PLAYER FOR SOUND';
      Object.assign(hint.style, {
        position: 'absolute', left: '50%', bottom: '14px', transform: 'translateX(-50%)',
        zIndex: '20', border: '1px solid rgba(99,220,255,.55)', borderRadius: '999px',
        padding: '9px 13px', background: 'rgba(2,10,15,.92)', color: '#dff8ff',
        font: '700 10px/1 system-ui,sans-serif', letterSpacing: '.05em',
        boxShadow: '0 4px 20px rgba(0,0,0,.35)', cursor: 'pointer',
        touchAction: 'manipulation'
      });
      hint.addEventListener('click', () => hint.remove(), { once: true });
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      host.appendChild(hint);
    }
    return hint;
  }

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
    frame.src = embedUrl(id, isIOS);
    host.dataset.videoId = id;

    if (isIOS) {
      // iOS/WebKit does not transfer a parent-page user gesture into a
      // cross-origin YouTube iframe. Keep the player inside JARVIS and use
      // muted autoplay as the reliable first state. The actual YouTube
      // player remains visible so the user's tap on its controls can start
      // audible playback without leaving the app.
      window.setTimeout(() => {
        if (document.body.contains(host) && host.dataset.videoId === id) ensureHint(host);
      }, 500);
    }
  }, true);
})();
