(() => {
  'use strict';
  if (window.__JARVIS_VOICE_RESPONSE_AUTHORITY__) return;
  window.__JARVIS_VOICE_RESPONSE_AUTHORITY__ = true;

  // One speaker for every response that reaches the central reply surface.
  // Local commands already speak explicitly, so remember recently announced
  // text and only fill the gaps left by async feature/intelligence handlers.
  let lastText = '';
  let lastAt = 0;
  let observer = null;
  let timer = 0;

  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const authority = text => {
    const fn = window.jarvisVoiceAuthoritySpeak || window.jarvisCinematicSpeak || window.jarvisSpeak;
    if (typeof fn !== 'function') return false;
    try { fn(text); return true; } catch { return false; }
  };

  const announce = value => {
    const text = clean(value);
    if (!text || text === lastText && Date.now() - lastAt < 2500) return;
    lastText = text;
    lastAt = Date.now();
    authority(text);
  };

  // Expose one response API so future modules do not need their own speaker.
  window.jarvisAnnounceResponse = announce;

  const inspect = () => {
    const reply = document.querySelector('#jarvisReply');
    if (!reply || !reply.classList.contains('visible')) return;
    const text = clean(reply.textContent);
    if (!text) return;
    // Give the command/intelligence pipeline a chance to announce explicitly.
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (text !== lastText || Date.now() - lastAt >= 2500) announce(text);
    }, 140);
  };

  const boot = () => {
    if (observer || !document.body) return;
    observer = new MutationObserver(inspect);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class'] });
    inspect();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
  window.setTimeout(boot, 500);
  window.setTimeout(boot, 1500);
})();
