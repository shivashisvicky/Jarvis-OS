(() => {
  'use strict';
  if (window.__JARVIS_VOICE_SETTINGS_V1__) return;
  window.__JARVIS_VOICE_SETTINGS_V1__ = true;

  const KEY = 'jarvis.voice.rate';
  const DEFAULT_RATE = 0.92;
  const MIN_RATE = 0.80;
  const MAX_RATE = 1.20;

  const clamp = value => Math.min(MAX_RATE, Math.max(MIN_RATE, Number(value) || DEFAULT_RATE));
  const getRate = () => clamp(localStorage.getItem(KEY) ?? DEFAULT_RATE);
  const setRate = value => {
    const rate = clamp(value);
    localStorage.setItem(KEY, String(rate));
    return rate;
  };

  window.jarvisVoiceRate = getRate;
  window.setJarvisVoiceRate = setRate;

  // Main JARVIS speech uses src/jarvis.ts directly, while some legacy bridges
  // use window.speechSynthesis. Apply one user-controlled rate at the final
  // browser speech boundary so both paths stay in sync.
  try {
    const synth = window.speechSynthesis;
    if (synth && !synth.__jarvisRatePatched) {
      const originalSpeak = synth.speak.bind(synth);
      synth.speak = utterance => {
        try {
          if (utterance && typeof utterance.rate === 'number') utterance.rate = getRate();
        } catch {}
        return originalSpeak(utterance);
      };
      synth.__jarvisRatePatched = true;
    }
  } catch {}

  const style = () => {
    if (document.querySelector('#jarvis-voice-settings-style')) return;
    const s = document.createElement('style');
    s.id = 'jarvis-voice-settings-style';
    s.textContent = `
      .jarvis-voice-rate { margin-top: 16px; }
      .jarvis-voice-rate .rate-head { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:8px; }
      .jarvis-voice-rate .rate-head strong { font-size:13px; letter-spacing:.08em; }
      .jarvis-voice-rate .rate-value { font-variant-numeric:tabular-nums; opacity:.85; }
      .jarvis-voice-rate input[type=range] { width:100%; accent-color:#9deeff; }
      .jarvis-voice-rate .rate-scale { display:flex; justify-content:space-between; margin-top:4px; font-size:10px; opacity:.55; }
    `;
    document.head.appendChild(s);
  };

  const mount = () => {
    const card = [...document.querySelectorAll('.settings-card')]
      .find(el => /\bVoice\b/i.test(el.querySelector('h3')?.textContent || ''));
    if (!card || card.querySelector('.jarvis-voice-rate')) return;

    const wrap = document.createElement('div');
    wrap.className = 'jarvis-voice-rate';
    wrap.innerHTML = `
      <div class="rate-head">
        <strong>SPEECH RATE</strong>
        <span class="rate-value" id="jarvisVoiceRateValue">${getRate().toFixed(2)}×</span>
      </div>
      <input id="jarvisVoiceRate" type="range" min="${MIN_RATE}" max="${MAX_RATE}" step="0.01" value="${getRate()}">
      <div class="rate-scale"><span>Slower</span><span>Natural</span><span>Faster</span></div>
    `;
    card.appendChild(wrap);

    const slider = wrap.querySelector('#jarvisVoiceRate');
    const value = wrap.querySelector('#jarvisVoiceRateValue');
    slider?.addEventListener('input', () => {
      const rate = setRate(slider.value);
      if (value) value.textContent = `${rate.toFixed(2)}×`;
    });
  };

  style();
  mount();
  new MutationObserver(mount).observe(document.documentElement, { childList: true, subtree: true });
})();
