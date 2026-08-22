(() => {
  'use strict';
  if (window.__JARVIS_HOME_INTELLIGENCE_VOICE_BRIDGE__) return;
  window.__JARVIS_HOME_INTELLIGENCE_VOICE_BRIDGE__ = true;
  const speak = text => {
    const clean = String(text || '').trim();
    if (!clean) return;
    const authority = window.jarvisVoiceAuthoritySpeak || window.jarvisCinematicSpeak || window.jarvisSpeak;
    if (typeof authority === 'function') { authority(clean); return; }
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'en-GB'; u.rate = .92; u.pitch = .54; u.volume = .96;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    }
  };
  window.addEventListener('jarvis:intelligence-speak', event => speak(event.detail?.text));
})();
