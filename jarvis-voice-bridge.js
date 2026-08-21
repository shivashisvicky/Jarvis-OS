/* J.A.R.V.I.S. voice bridge
 * Compatibility layer for any legacy shell that still calls jarvisCinematicSpeak.
 * Speech rate is always resolved from the single global JARVIS speech setting.
 */
(() => {
  'use strict';
  if (window.jarvisCinematicSpeak) return;

  const getRate = () => {
    try {
      const getter = window.jarvisGetSpeechRate || window.jarvisGetEffectiveSpeechRate;
      if (typeof getter === 'function') return Number(getter()) || 0.92;
    } catch {}
    return 0.92;
  };

  window.jarvisCinematicSpeak = (text, options = {}) => {
    if (!('speechSynthesis' in window) || !text) return false;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(String(text));
      utterance.rate = getRate();
      utterance.pitch = Number(options.pitch ?? 0.54);
      utterance.volume = Number(options.volume ?? 0.96);
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
})();
