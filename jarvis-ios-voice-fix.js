(() => {
  'use strict';
  if (window.__JARVIS_IOS_VOICE_FIX__) return;
  window.__JARVIS_IOS_VOICE_FIX__ = true;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIOS || !('speechSynthesis' in window)) return;

  const synth = window.speechSynthesis;
  const nativeSpeak = synth.speak.bind(synth);
  const nativeCancel = synth.cancel.bind(synth);
  let audioContext = null;

  const primeAudio = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioContext || audioContext.state === 'closed') audioContext = new Ctx({ latencyHint: 'interactive' });
      if (audioContext.state === 'suspended' || audioContext.state === 'interrupted') void audioContext.resume();
      const buffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
      source.onended = () => { try { source.disconnect(); } catch {} };
    } catch {}
  };

  // The command surface already owns the STOP VOICE control.
  // Do not inject a second floating control on iOS.
  const locateStop = () => [...document.querySelectorAll('button,[role="button"]')].find(el => /\bstop\s+voice\b/i.test(`${el.textContent||''} ${el.getAttribute?.('aria-label')||''}`)) || null;
  const setSpeaking = value => { const b = locateStop(); if (b instanceof HTMLElement) b.dataset.jarvisSpeaking = value ? '1' : '0'; };

  const speakNative = (text, options = {}) => {
    const clean = String(text || '').trim();
    if (!clean) return false;
    try {
      nativeCancel();
      primeAudio();
      try { synth.resume(); } catch {}
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
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      nativeSpeak(utterance);
      return true;
    } catch (error) {
      console.warn('[JARVIS iOS voice] native speech failed', error);
      setSpeaking(false);
      return false;
    }
  };

  const originalSpeak = synth.speak.bind(synth);
  synth.speak = utterance => {
    try { synth.resume(); } catch {}
    if (utterance) {
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
    }
    return originalSpeak(utterance);
  };

  const install = () => {
    window.jarvisVoiceAuthoritySpeak = speakNative;
    window.jarvisCinematicSpeak = speakNative;
    window.jarvisSpeak = speakNative;
  };

  const warm = event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest('#commandInput, #commandForm, #voiceBtn, #testVoice, #jhcActions, [data-jhc]')) return;
    primeAudio();
    try { synth.resume(); } catch {}
    install();
  };

  install();
  document.addEventListener('pointerdown', warm, true);
  document.addEventListener('touchstart', warm, true);
  const timer = window.setInterval(install, 250);
  window.setTimeout(() => window.clearInterval(timer), 15000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { primeAudio(); install(); } });
})();
