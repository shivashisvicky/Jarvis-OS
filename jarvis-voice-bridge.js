/* J.A.R.V.I.S. voice bridge
 * Kept as a tiny compatibility layer for the browser shell and E2E gate.
 * The main application owns voice recognition and configuration in src/jarvis.ts.
 */
(() => {
  'use strict';
  if (window.jarvisCinematicSpeak) return;

  window.jarvisCinematicSpeak = (text, options = {}) => {
    if (!('speechSynthesis' in window) || !text) return false;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(String(text));
      utterance.rate = Number(options.rate ?? 0.84);
      utterance.pitch = Number(options.pitch ?? 0.54);
      utterance.volume = Number(options.volume ?? 0.96);
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
