(() => {
  'use strict';
  if (window.__JARVIS_VOICE_RESPONSE_AUTHORITY__) return;
  window.__JARVIS_VOICE_RESPONSE_AUTHORITY__ = true;

  // The command pipeline is already the authoritative speaker. This bridge is
  // intentionally passive so a DOM mutation cannot re-speak the same reply
  // after the original utterance has finished. That was the source of the
  // delayed second "local time" response on iOS.
  let lastText = '';
  let lastAt = 0;

  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();

  window.jarvisMarkSpokenResponse = value => {
    const text = clean(value);
    if (!text) return false;
    lastText = text;
    lastAt = Date.now();
    return true;
  };

  // Kept as a compatibility API for older bridges, but it deliberately does
  // not speak. Normal command execution owns speech now.
  window.jarvisAnnounceResponse = value => {
    const text = clean(value);
    if (!text) return false;
    lastText = text;
    lastAt = Date.now();
    return true;
  };

  window.jarvisGetLastSpokenResponse = () => ({ text: lastText, at: lastAt });
})();
