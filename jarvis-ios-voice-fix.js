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

  const ensureStop = () => {
    if (document.querySelector('#jarvisIOSStopVoice')) return;
    const b = document.createElement('button');
    b.id = 'jarvisIOSStopVoice';
    b.type = 'button';
    b.textContent = 'STOP VOICE';
    b.hidden = true;
    b.setAttribute('aria-label', 'Stop JARVIS voice response');
    b.style.cssText = 'position:fixed;right:18px;bottom:86px;z-index:10001;min-height:42px;padding:10px 16px;border:1px solid rgba(91,214,244,.72);border-radius:10px;background:rgba(4,16,22,.97);color:#bfefff;font:700 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;box-shadow:0 0 24px rgba(71,201,236,.18);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)';
    b.addEventListener('click', () => { nativeCancel(); try { synth.resume(); } catch {} b.hidden = true; });
    document.body.appendChild(b);
  };

  const setSpeaking = value => {
    ensureStop();
    const b = document.querySelector('#jarvisIOSStopVoice');
    if (b) b.hidden = !value;
  };

  const speakNative = (text, options = {}) => {
    const clean = String(text || '').trim();
    if (!clean) return false;
    try {
      ensureStop();
      nativeCancel();
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

  // Install immediately so the core JARVIS speak() call is stable on iOS even
  // when the dynamically loaded voice module has not finished loading yet.
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
    ensureStop();
    if (installed || typeof window.jarvisVoiceAuthoritySpeak !== 'function') return;
    const iosSpeak = (text, options = {}) => speakNative(text, options);
    window.jarvisVoiceAuthoritySpeak = iosSpeak;
    window.jarvisCinematicSpeak = iosSpeak;
    window.jarvisSpeak = iosSpeak;
    installed = true;
  };

  ensureStop();
  const timer = window.setInterval(() => {
    install();
    if (installed) window.clearInterval(timer);
  }, 50);
  window.setTimeout(() => window.clearInterval(timer), 15000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) install(); });
})();
