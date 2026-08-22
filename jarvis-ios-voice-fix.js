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
      // Do not use a low pitch or depend on getVoices() on iOS. Both have caused
      // Safari to report a speaking utterance while producing no audible output.
      utterance.rate = Math.min(1.05, Math.max(.85, Number(options.rate) || .95));
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.lang = 'en-GB';
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = error => { console.warn('[JARVIS iOS voice] speech synthesis error', error); setSpeaking(false); };
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
      utterance.onerror = error => { console.warn('[JARVIS iOS voice] speech error', error); setSpeaking(false); };
    }
    return originalSpeak(utterance);
  };

  const install = () => {
    ensureStop();
    window.jarvisVoiceAuthoritySpeak = speakNative;
    window.jarvisCinematicSpeak = speakNative;
    window.jarvisSpeak = speakNative;
    installed = true;
  };

  const warm = event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest('#commandInput, #commandForm, #voiceBtn, #testVoice, #jhcActions, [data-jhc]')) return;
    try { synth.resume(); } catch {}
    install();
  };

  ensureStop();
  install();
  document.addEventListener('pointerdown', warm, true);
  document.addEventListener('touchstart', warm, true);
  const timer = window.setInterval(() => install(), 250);
  window.setTimeout(() => window.clearInterval(timer), 15000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { try { synth.resume(); } catch {} install(); } });
})();
