(() => {
  'use strict';
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (window.__JARVIS_SPEECH_AUTHORITY_V2__) return;
  window.__JARVIS_SPEECH_AUTHORITY_V2__ = true;

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

  const getAccent = () => {
    try {
      const value = window.localStorage?.getItem('jarvisSpeechAccent');
      return /^en-(GB|IN)$/i.test(value || '') ? value : 'en-GB';
    } catch { return 'en-GB'; }
  };

  // Android Chrome can report a changing/empty voice list during startup. Never
  // fall back to an arbitrary device voice. Prefer a known English voice and
  // keep the utterance language pinned to the selected JARVIS accent.
  const selectVoice = voices => {
    const accent = getAccent().toLowerCase();
    const exact = voices.filter(v => String(v.lang || '').toLowerCase() === accent);
    const preferred = /en-gb/i.test(accent)
      ? /Daniel|Arthur|George|Oliver|James|Thomas|Google UK English|English United Kingdom|Natural|Enhanced|Premium/i
      : /Google|Natural|Enhanced|Premium|India|English India/i;
    return exact.find(v => preferred.test(String(v.name || '')))
      || exact.find(v => /natural|enhanced|premium|google/i.test(String(v.name || '')))
      || exact[0]
      || voices.find(v => /^en-(GB|IN)$/i.test(String(v.lang || '')))
      || voices.find(v => /^en-/i.test(String(v.lang || '')))
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
      utterance.pitch = isAndroid ? 1 : (Number.isFinite(Number(options.pitch)) ? Number(options.pitch) : .54);
      utterance.volume = Number.isFinite(Number(options.volume)) ? Number(options.volume) : .96;
      utterance.lang = selected?.lang || getAccent();
      if (selected) utterance.voice = selected;
      nativeSpeak(utterance);
      return true;
    } catch { return false; }
  };

  window.jarvisSpeak = speak;

  // On Android, own the native speech call so other legacy bridges cannot inject
  // a random Samsung/Russian voice or overwrite the configured rate.
  if (isAndroid && !isIOS) {
    synth.speak = utterance => speak(utterance?.text || '', utterance || {});
  }

  // Wait briefly for Android's asynchronous voice registry before the first real
  // response. This avoids selecting a transient/default voice during startup.
  synth.addEventListener?.('voiceschanged', () => { if (!warmed) return; });
  document.addEventListener('pointerdown', prime, { capture: true, passive: true });
  document.addEventListener('touchstart', prime, { capture: true, passive: true });
})();
