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

  // Capture contextual command fragments before the generic web/simple-lookup
  // classifier can steal them. This script loads before the deferred intelligence
  // runtime, so the window capture handler gets first refusal on form submits.
  const isContextFragment = q => {
    const s = String(q || '').trim().toLowerCase();
    return /^(?:\d+(?:\.\d+)?\s*(?:years?|yrs?|months?|weeks?|days?))$/.test(s)
      || /^(?:for|over|within)\s+\d+(?:\.\d+)?\s*(?:years?|yrs?|months?|weeks?|days?)$/.test(s)
      || /^(?:this|that|it|the first one|the second one|the above|same)$/.test(s);
  };
  const isAiToday = q => /\bai\b/i.test(q) && /\btoday\b/i.test(q) && /\b(?:what(?:'s| is)?|whats|happening|new|latest|update|news|tell me|going on)\b/i.test(q);
  const submitGuard = event => {
    const form = event.target?.closest?.('#commandForm');
    if (!form) return;
    const input = form.querySelector('#commandInput');
    const query = input?.value?.trim() || '';
    if (!query) return;
    let prior = [];
    try { prior = JSON.parse(sessionStorage.getItem('jarvis-session-context-v2') || '[]'); } catch {}
    const hasContext = Array.isArray(prior) && prior.length > 0;
    if ((!hasContext || !isContextFragment(query)) && !isAiToday(query)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.dispatchEvent(new CustomEvent('jarvis:intelligence-query', { detail: { query } }));
  };
  window.addEventListener('submit', submitGuard, true);
})();
