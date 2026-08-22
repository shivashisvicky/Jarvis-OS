(() => {
  'use strict';
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (window.__JARVIS_SPEECH_AUTHORITY__) return;
  window.__JARVIS_SPEECH_AUTHORITY__ = true;

  const MIN = 0.80;
  const MAX = 1.20;
  const DEFAULT = 0.92;
  const synth = window.speechSynthesis;
  const nativeSpeak = synth.speak.bind(synth);
  const nativeCancel = synth.cancel.bind(synth);
  let speaking = false;
  let warmed = false;

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

  const setSpeaking = value => {
    speaking = Boolean(value);
    window.dispatchEvent(new CustomEvent('jarvis:speech-state', { detail: { speaking } }));
    const stop = document.querySelector('#jarvisSpeechStop');
    if (stop) {
      stop.hidden = !speaking;
      stop.setAttribute('aria-hidden', String(!speaking));
    }
  };

  const ensureStopButton = () => {
    if (document.querySelector('#jarvisSpeechStop')) return;
    const button = document.createElement('button');
    button.id = 'jarvisSpeechStop';
    button.type = 'button';
    button.hidden = true;
    button.setAttribute('aria-label', 'Stop JARVIS voice response');
    button.textContent = '■ STOP VOICE';
    button.style.cssText = 'position:fixed;right:18px;bottom:26px;z-index:9999;min-height:42px;padding:10px 15px;border:1px solid rgba(91,214,244,.72);border-radius:10px;background:rgba(4,16,22,.96);color:#bfefff;font:700 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;box-shadow:0 0 24px rgba(71,201,236,.18);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)';
    button.addEventListener('click', () => {
      nativeCancel();
      setSpeaking(false);
    });
    document.body.appendChild(button);
  };

  // iOS Safari can reject speech created after a microphone-recognition
  // callback unless speechSynthesis was explicitly activated by the original
  // tap. Use a tiny, silent utterance rather than an empty utterance. Empty
  // utterances are ignored by some iOS WebKit versions and do not unlock TTS.
  const prime = () => {
    if (warmed) return;
    warmed = true;
    try {
      nativeCancel();
      synth.resume();
      const unlock = new SpeechSynthesisUtterance('.');
      unlock.volume = 0;
      unlock.rate = 1;
      unlock.pitch = 1;
      unlock.lang = 'en-GB';
      unlock.onend = () => { try { nativeCancel(); synth.resume(); } catch {} };
      unlock.onerror = () => { try { nativeCancel(); synth.resume(); } catch {} };
      nativeSpeak(unlock);
      window.setTimeout(() => { try { nativeCancel(); synth.resume(); } catch {} }, 120);
    } catch {}
  };

  window.jarvisPrimeSpeech = prime;
  window.jarvisStopSpeaking = () => { nativeCancel(); setSpeaking(false); };
  window.jarvisGetEffectiveSpeechRate = getRate;

  synth.speak = utterance => {
    try {
      synth.resume();
      if (utterance && typeof utterance === 'object' && 'rate' in utterance) utterance.rate = getRate();
      if (utterance && typeof utterance === 'object') {
        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
      }
    } catch {}
    return nativeSpeak(utterance);
  };

  window.jarvisSpeak = (text, options = {}) => {
    if (!text) return false;
    try {
      ensureStopButton();
      prime();
      nativeCancel();
      synth.resume();
      const voices = synth.getVoices();
      const utterance = new SpeechSynthesisUtterance(String(text));
      utterance.rate = getRate();
      utterance.pitch = Number.isFinite(Number(options.pitch)) ? Number(options.pitch) : 0.54;
      utterance.volume = Number.isFinite(Number(options.volume)) ? Number(options.volume) : 0.96;
      utterance.lang = options.language || 'en-GB';
      if (options.voiceName) {
        const voice = voices.find(v => v.name === options.voiceName);
        if (voice) utterance.voice = voice;
      }
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      nativeSpeak(utterance);
      return true;
    } catch {
      setSpeaking(false);
      return false;
    }
  };

  synth.addEventListener?.('voiceschanged', () => {});

  const warmOnGesture = event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest('#commandInput, #commandForm, #voiceBtn, #testVoice')) return;
    prime();
    ensureStopButton();
    try { synth.resume(); } catch {}
    document.removeEventListener('pointerdown', warmOnGesture, true);
    document.removeEventListener('touchstart', warmOnGesture, true);
  };
  document.addEventListener('pointerdown', warmOnGesture, true);
  document.addEventListener('touchstart', warmOnGesture, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureStopButton, { once: true });
  else ensureStopButton();
})();
