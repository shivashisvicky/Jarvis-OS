(() => {
  'use strict';
  if (window.__JARVIS_VOICE_RESPONSE_AUTHORITY__) return;
  window.__JARVIS_VOICE_RESPONSE_AUTHORITY__ = true;

  let lastText = '';
  let lastAt = 0;
  let observer = null;
  let timer = 0;
  let speaking = false;
  let voiceLoad = null;

  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();

  const ensureVoice = async () => {
    if (typeof window.jarvisVoiceAuthoritySpeak === 'function' || typeof window.jarvisSpeak === 'function') return true;
    if (voiceLoad) return voiceLoad;
    const loader = window.jarvisLoadFeature;
    if (typeof loader !== 'function') return false;
    voiceLoad = Promise.resolve(loader('voice')).then(() => {
      return typeof window.jarvisVoiceAuthoritySpeak === 'function' || typeof window.jarvisSpeak === 'function';
    }).catch(() => false).finally(() => { voiceLoad = null; });
    return voiceLoad;
  };

  const authority = async text => {
    const ready = await ensureVoice();
    if (!ready) return false;
    const fn = window.jarvisVoiceAuthoritySpeak || window.jarvisCinematicSpeak || window.jarvisSpeak;
    if (typeof fn !== 'function') return false;
    try {
      const result = fn(text);
      speaking = result !== false;
      return result !== false;
    } catch {
      speaking = false;
      return false;
    }
  };

  const announce = value => {
    const text = clean(value);
    if (!text || (text === lastText && Date.now() - lastAt < 2500)) return false;
    lastText = text;
    lastAt = Date.now();
    void authority(text);
    return true;
  };

  window.jarvisAnnounceResponse = announce;

  const inspect = () => {
    const reply = document.querySelector('#jarvisReply');
    if (!reply || !reply.classList.contains('visible')) return;
    const text = clean(reply.textContent);
    if (!text) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (text !== lastText || Date.now() - lastAt >= 2500) announce(text);
    }, 140);
  };

  const boot = () => {
    if (observer || !document.body) return;
    observer = new MutationObserver(inspect);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class']
    });
    inspect();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
  window.setTimeout(boot, 500);
  window.setTimeout(boot, 1500);
})();
