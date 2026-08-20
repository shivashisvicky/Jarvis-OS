(() => {
  'use strict';
  const root = () => document.querySelector('.os');
  const setMode = mode => {
    const el = root();
    if (!el) return;
    el.classList.toggle('voice-listening', mode === 'listening');
    el.classList.toggle('voice-speaking', mode === 'speaking');
  };

  // Keep the reactor synchronized with browser TTS without changing the
  // existing voice implementation. The visual layer is intentionally passive.
  const synth = window.speechSynthesis;
  if (synth && !synth.__jarvisHudPatched) {
    synth.__jarvisHudPatched = true;
    const originalSpeak = synth.speak.bind(synth);
    const originalCancel = synth.cancel.bind(synth);
    synth.speak = utterance => {
      try {
        utterance.addEventListener?.('start', () => setMode('speaking'));
        utterance.addEventListener?.('end', () => setMode('idle'));
        utterance.addEventListener?.('error', () => setMode('idle'));
      } catch {}
      setMode('speaking');
      originalSpeak(utterance);
    };
    synth.cancel = (...args) => { const r = originalCancel(...args); setMode('idle'); return r; };
  }

  const observeVoiceButton = () => {
    const btn = document.querySelector('#voiceBtn');
    if (!btn || btn.__jarvisHudObserved) return;
    btn.__jarvisHudObserved = true;
    const sync = () => setMode(btn.classList.contains('listening') ? 'listening' : (root()?.classList.contains('voice-speaking') ? 'speaking' : 'idle'));
    new MutationObserver(sync).observe(btn, {attributes:true, attributeFilter:['class']});
    sync();
  };

  const decorateHome = () => {
    const core = document.querySelector('.core-visual');
    if (core && !core.querySelector('.hud-label')) {
      const labels = [
        ['hud-label hud-tl','POWER LEVEL','100%'],
        ['hud-label hud-tr','SYSTEM UPTIME','ONLINE'],
        ['hud-label hud-bl','J.A.R.V.I.S','ACTIVE'],
        ['hud-label hud-br','NETWORK','STABLE']
      ];
      labels.forEach(([cls,a,b]) => { const n=document.createElement('div'); n.className=cls; n.innerHTML=`<small>${a}</small><strong>${b}</strong>`; core.appendChild(n); });
    }
  };

  const boot = () => { observeVoiceButton(); decorateHome(); };
  new MutationObserver(boot).observe(document.documentElement,{childList:true,subtree:true});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
