(() => {
  'use strict';
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (window.__JARVIS_SPEECH_AUTHORITY_V4__) return;
  window.__JARVIS_SPEECH_AUTHORITY_V4__ = true;

  const MIN = 0.80;
  const MAX = 1.20;
  const DEFAULT = 1.05;
  const synth = window.speechSynthesis;
  const nativeSpeak = synth.speak.bind(synth);
  const nativeCancel = synth.cancel.bind(synth);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(navigator.userAgent || '');
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

  const getAccent = () => 'en-GB';
  const badVoice = name => /russian|рус|русский|ru[-_ ]?ru/i.test(String(name || ''));
  const preferredVoice = name => /daniel|arthur|george|oliver|james|thomas|alex|fred|google uk english|english united kingdom|natural|enhanced|premium|neural/i.test(String(name || ''));
  const selectVoice = voices => {
    const usable = voices.filter(v => !badVoice(v.name));
    const exact = usable.filter(v => String(v.lang || '').toLowerCase() === 'en-gb');
    return exact.find(v => preferredVoice(v.name))
      || exact.find(v => /natural|enhanced|premium|neural|google/i.test(String(v.name || '')))
      || exact[0]
      || usable.find(v => /^en-GB/i.test(String(v.lang || '')))
      || null;
  };

  const prime = () => {
    if (warmed) return;
    warmed = true;
    try { nativeCancel(); synth.resume(); } catch {}
  };

  window.jarvisPrimeSpeech = prime;
  window.jarvisGetEffectiveSpeechRate = getRate;
  window.jarvisGetSpeechAccent = getAccent;
  window.jarvisStopSpeaking = () => { try { nativeCancel(); } catch {} };

  const speak = (text, options = {}) => {
    const clean = String(text || '').trim();
    if (!clean) return false;
    try {
      prime();
      nativeCancel();
      synth.resume();
      const selected = selectVoice(synth.getVoices());
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = getRate();
      utterance.pitch = isAndroid ? 1 : (Number.isFinite(Number(options.pitch)) ? Number(options.pitch) : .54);
      utterance.volume = Number.isFinite(Number(options.volume)) ? Number(options.volume) : .96;
      utterance.lang = 'en-GB';
      if (selected) utterance.voice = selected;
      nativeSpeak(utterance);
      return true;
    } catch { return false; }
  };

  // iOS has a dedicated native authority loaded before this lazy module.
  // Never replace that authority after the recognition -> response handoff.
  // Text and voice commands must resolve through the same final speaker.
  const existingIOSAuthority = isIOS && typeof window.jarvisSpeak === 'function';
  if (!existingIOSAuthority) {
    window.jarvisVoiceAuthoritySpeak = speak;
    window.jarvisCinematicSpeak = speak;
    window.jarvisSpeak = speak;
  }
  window.jarvisVoiceAuthorityStop = () => {
    try { nativeCancel(); } catch {}
  };

  if (isAndroid && !isIOS) synth.speak = utterance => speak(utterance?.text || '', utterance || {});
  synth.addEventListener?.('voiceschanged', () => {});
  document.addEventListener('pointerdown', prime, { capture: true, passive: true });
  document.addEventListener('touchstart', prime, { capture: true, passive: true });
})();
