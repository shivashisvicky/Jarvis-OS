(() => {
  'use strict';
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (window.__JARVIS_SPEECH_AUTHORITY_V3__) return;
  window.__JARVIS_SPEECH_AUTHORITY_V3__ = true;

  const MIN = 0.80;
  const MAX = 1.20;
  const DEFAULT = 1.08;
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

  const getAccent = () => {
    try {
      const value = window.localStorage?.getItem('jarvisSpeechAccent');
      return /^en-(GB|IN)$/i.test(value || '') ? String(value) : 'en-GB';
    } catch { return 'en-GB'; }
  };

  const badVoice = name => /russian|рус|русский|ru[-_ ]?ru/i.test(String(name || ''));
  const maleVoice = name => /male|man|guy|daniel|arthur|george|oliver|james|thomas|alex|fred|google uk english male|english united kingdom male/i.test(String(name || ''));
  const premiumVoice = name => /natural|enhanced|premium|neural|google/i.test(String(name || ''));
  const selectVoice = voices => {
    const accent = getAccent().toLowerCase();
    const usable = voices.filter(v => !badVoice(v.name));
    const exact = usable.filter(v => String(v.lang || '').toLowerCase() === accent);
    const exactMale = exact.filter(v => maleVoice(v.name));
    const exactPremiumMale = exactMale.filter(v => premiumVoice(v.name));
    if (exactPremiumMale[0]) return exactPremiumMale[0];
    if (exactMale[0]) return exactMale[0];
    const exactPremium = exact.filter(v => premiumVoice(v.name));
    if (exactPremium[0]) return exactPremium[0];
    if (exact[0]) return exact[0];

    // Samsung/Android devices may expose only a female UK voice. Prefer a
    // clearly male English voice over silently accepting the wrong timbre.
    const englishMale = usable.find(v => /^en-(GB|IN|US)/i.test(String(v.lang || '')) && maleVoice(v.name));
    if (englishMale) return englishMale;
    return usable.find(v => /^en-GB/i.test(String(v.lang || '')))
      || usable.find(v => /^en-IN/i.test(String(v.lang || '')))
      || usable.find(v => /^en-US/i.test(String(v.lang || '')))
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
      const voices = synth.getVoices();
      const selected = selectVoice(voices);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = getRate();
      utterance.pitch = isAndroid ? 0.92 : (Number.isFinite(Number(options.pitch)) ? Number(options.pitch) : .54);
      utterance.volume = Number.isFinite(Number(options.volume)) ? Number(options.volume) : .96;
      utterance.lang = selected?.lang || getAccent();
      if (selected) utterance.voice = selected;
      nativeSpeak(utterance);
      return true;
    } catch { return false; }
  };

  window.jarvisSpeak = speak;

  if (isAndroid && !isIOS) {
    synth.speak = utterance => speak(utterance?.text || '', utterance || {});
  }

  synth.addEventListener?.('voiceschanged', () => { /* selection is performed per utterance */ });
  document.addEventListener('pointerdown', prime, { capture: true, passive: true });
  document.addEventListener('touchstart', prime, { capture: true, passive: true });
})();
