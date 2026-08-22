(() => {
  'use strict';
  if (window.__JARVIS_IOS_VOICE_FIX__) return;
  window.__JARVIS_IOS_VOICE_FIX__ = true;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIOS || !('speechSynthesis' in window)) return;

  const synth = window.speechSynthesis;
  const nativeSpeak = synth.speak.bind(synth);
  const nativeCancel = synth.cancel.bind(synth);
  let installed = false;

  const speakNative = (text, options = {}) => {
    const clean = String(text || '').trim();
    if (!clean) return false;
    try {
      nativeCancel();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = Math.min(1.2, Math.max(.8, Number(options.rate) || .92));
      utterance.pitch = Number.isFinite(Number(options.pitch)) ? Number(options.pitch) : .54;
      utterance.volume = Number.isFinite(Number(options.volume)) ? Number(options.volume) : .96;
      utterance.lang = options.language || 'en-GB';
      const voices = synth.getVoices();
      const voice = voices.find(v => /en-GB/i.test(v.lang) && /Daniel|Arthur|George|Oliver|James|Thomas/i.test(v.name))
        || voices.find(v => /en-GB/i.test(v.lang))
        || voices.find(v => /en-IN/i.test(v.lang))
        || voices[0];
      if (voice) utterance.voice = voice;
      nativeSpeak(utterance);
      return true;
    } catch (error) {
      console.warn('[JARVIS iOS voice] native speech failed', error);
      return false;
    }
  };

  const install = () => {
    if (installed || typeof window.jarvisVoiceAuthoritySpeak !== 'function') return;
    const iosSpeak = (text, options = {}) => speakNative(text, options);
    window.jarvisVoiceAuthoritySpeak = iosSpeak;
    window.jarvisCinematicSpeak = iosSpeak;
    window.jarvisSpeak = iosSpeak;
    installed = true;
    console.info('[JARVIS iOS voice] native speech authority installed');
  };

  const timer = window.setInterval(() => {
    install();
    if (installed) window.clearInterval(timer);
  }, 50);
  window.setTimeout(() => window.clearInterval(timer), 15000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) install(); });
})();
