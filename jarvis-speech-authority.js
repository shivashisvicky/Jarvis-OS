(() => {
  'use strict';
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (window.__JARVIS_SPEECH_AUTHORITY__) return;
  window.__JARVIS_SPEECH_AUTHORITY__ = true;

  const MIN = 0.80;
  const MAX = 1.20;
  const DEFAULT = 0.92;
  const nativeSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
  const nativeCancel = window.speechSynthesis.cancel.bind(window.speechSynthesis);

  const getRate = () => {
    try {
      const getter = window.jarvisGetSpeechRate;
      if (typeof getter === 'function') {
        const value = Number(getter());
        if (Number.isFinite(value)) return Math.min(MAX, Math.max(MIN, value));
      }
      const stored = Number(window.localStorage?.getItem('jarvisSpeechRate'));
      if (Number.isFinite(stored)) return Math.min(MAX, Math.max(MIN, stored));
    } catch {}
    return DEFAULT;
  };

  window.jarvisGetEffectiveSpeechRate = getRate;

  window.speechSynthesis.speak = (utterance) => {
    try {
      if (utterance && typeof utterance === 'object' && 'rate' in utterance) {
        utterance.rate = getRate();
      }
    } catch {}
    return nativeSpeak(utterance);
  };

  window.jarvisSpeak = (text, options = {}) => {
    if (!text) return false;
    try {
      nativeCancel();
      const utterance = new SpeechSynthesisUtterance(String(text));
      utterance.rate = getRate();
      utterance.pitch = Number.isFinite(Number(options.pitch)) ? Number(options.pitch) : 0.54;
      utterance.volume = Number.isFinite(Number(options.volume)) ? Number(options.volume) : 0.96;
      utterance.lang = options.language || 'en-GB';
      if (options.voiceName) {
        const voice = window.speechSynthesis.getVoices().find(v => v.name === options.voiceName);
        if (voice) utterance.voice = voice;
      }
      window.speechSynthesis.speak(utterance);
      return true;
    } catch {
      return false;
    }
  };

  window.addEventListener('jarvis:speech-rate-changed', () => {
    // New utterances pick up the setting automatically. Do not interrupt speech already in progress.
  });
})();
