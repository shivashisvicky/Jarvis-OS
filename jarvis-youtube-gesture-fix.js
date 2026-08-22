(() => {
  'use strict';
  if (window.__JARVIS_YOUTUBE_GESTURE_FIX__) return;
  window.__JARVIS_YOUTUBE_GESTURE_FIX__ = true;

  const ORIGIN = 'https://shivashisvicky.github.io';
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const embedUrl = (id, muted) => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&mute=${muted ? 1 : 0}&controls=1&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(ORIGIN)}`;

  const addSoundUnlock = host => {
    if (!isIOS || host.querySelector('[data-jv-sound-unlock]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.jvSoundUnlock = '1';
    button.textContent = '🔊 TAP FOR SOUND';
    button.style.cssText = 'position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:5;border:1px solid rgba(85,216,255,.7);border-radius:999px;background:rgba(3,16,24,.94);color:#d9f8ff;padding:10px 16px;font:800 11px/1 system-ui;letter-spacing:.08em;box-shadow:0 4px 18px rgba(0,0,0,.35);';
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const frame = host.querySelector('iframe');
      try {
        frame?.contentWindow?.postMessage(JSON.stringify({event:'command',func:'unMute',args:[]}), 'https://www.youtube-nocookie.com');
        frame?.contentWindow?.postMessage(JSON.stringify({event:'command',func:'playVideo',args:[]}), 'https://www.youtube-nocookie.com');
      } catch {}
      button.remove();
    }, {once:true});
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.appendChild(button);
  };

  document.addEventListener('click', event => {
    const card = event.target?.closest?.('[data-jvc-id]');
    if (!card) return;
    const id = card.getAttribute('data-jvc-id');
    const host = document.querySelector('#jarvisPlayer');
    if (!id || !host) return;
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
    if (isIOS) window.setTimeout(() => addSoundUnlock(host), 250);
  }, true);
})();
