(() => {
  'use strict';
  if (window.__JARVIS_SETTINGS_VOICE_CONTROLS_V2__) return;
  window.__JARVIS_SETTINGS_VOICE_CONTROLS_V2__ = true;

  const RATE_KEY = 'jarvisSpeechRate';
  const RATE_VERSION_KEY = 'jarvisSpeechRateVersion';
  const ACCENT_KEY = 'jarvisSpeechAccent';
  const DEFAULT_RATE = 1.05;
  const DEFAULT_ACCENT = 'en-GB';
  const clamp = value => Math.min(1.2, Math.max(.8, Number(value) || DEFAULT_RATE));

  const getRate = () => {
    try {
      const stored = Number(localStorage.getItem(RATE_KEY));
      if (localStorage.getItem(RATE_VERSION_KEY) !== '2' && stored === 0.92) {
        localStorage.setItem(RATE_KEY, String(DEFAULT_RATE));
        localStorage.setItem(RATE_VERSION_KEY, '2');
        return DEFAULT_RATE;
      }
      return Number.isFinite(stored) ? clamp(stored) : DEFAULT_RATE;
    } catch { return DEFAULT_RATE; }
  };
  const setRate = value => {
    const rate = clamp(value);
    try { localStorage.setItem(RATE_KEY, String(rate)); localStorage.setItem(RATE_VERSION_KEY, '2'); } catch {}
    return rate;
  };
  const getAccent = () => {
    try { return /^en-(GB|IN)$/i.test(localStorage.getItem(ACCENT_KEY) || '') ? localStorage.getItem(ACCENT_KEY) : DEFAULT_ACCENT; }
    catch { return DEFAULT_ACCENT; }
  };
  const setAccent = value => {
    const accent = /^en-(GB|IN)$/i.test(String(value)) ? String(value) : DEFAULT_ACCENT;
    try { localStorage.setItem(ACCENT_KEY, accent); } catch {}
    return accent;
  };

  const install = () => {
    const card = [...document.querySelectorAll('.settings-card')].find(c => /\bVoice\b/i.test(c.querySelector('h3')?.textContent || ''));
    if (!card || card.querySelector('#jarvisSpeechRate')) return;

    const style = document.createElement('style');
    style.id = 'jarvis-settings-voice-controls-style';
    style.textContent = `
      .jarvis-voice-control{display:grid;gap:7px;margin-top:14px;padding-top:13px;border-top:1px solid var(--line)}
      .jarvis-voice-control label{font-size:9px;letter-spacing:.12em;color:var(--muted)}
      .jarvis-voice-rate-line{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}
      .jarvis-voice-rate-line input{width:100%;accent-color:var(--cyan)}
      .jarvis-voice-rate-value{min-width:48px;text-align:right;color:var(--cyan2);font-size:11px;font-variant-numeric:tabular-nums}
      .jarvis-voice-accent{width:100%;min-height:42px;border:1px solid var(--line);border-radius:8px;background:rgba(7,18,24,.85);color:var(--text);padding:8px 10px}
      .jarvis-voice-note{font-size:9px;line-height:1.45;color:var(--faint)}
    `;
    document.head.appendChild(style);

    const rate = document.createElement('div');
    rate.className = 'jarvis-voice-control';
    rate.innerHTML = '<label for="jarvisSpeechRate">SPEECH RATE</label><div class="jarvis-voice-rate-line"><input id="jarvisSpeechRate" type="range" min="0.80" max="1.20" step="0.01"><output id="jarvisSpeechRateValue" class="jarvis-voice-rate-value"></output></div>';
    card.appendChild(rate);
    const input = rate.querySelector('#jarvisSpeechRate');
    const output = rate.querySelector('#jarvisSpeechRateValue');
    const syncRate = () => {
      const value = setRate(input.value);
      input.value = value.toFixed(2);
      output.textContent = `${value.toFixed(2)}×`;
      window.dispatchEvent(new CustomEvent('jarvis:speech-rate-changed', { detail: { rate: value } }));
    };
    input.value = getRate().toFixed(2);
    output.textContent = `${getRate().toFixed(2)}×`;
    input.addEventListener('input', syncRate);

    const accent = document.createElement('div');
    accent.className = 'jarvis-voice-control';
    accent.innerHTML = '<label for="jarvisSpeechAccent">JARVIS ACCENT</label><select id="jarvisSpeechAccent" class="jarvis-voice-accent"><option value="en-GB">English (UK) · JARVIS standard</option><option value="en-IN">English (India)</option></select><div class="jarvis-voice-note">The standard JARVIS accent is English (UK). Exact voice timbre depends on the voices installed by the device/browser.</div>';
    card.appendChild(accent);
    const select = accent.querySelector('#jarvisSpeechAccent');
    select.value = getAccent();
    select.addEventListener('change', () => {
      const value = setAccent(select.value);
      window.dispatchEvent(new CustomEvent('jarvis:speech-accent-changed', { detail: { accent: value } }));
    });
  };

  const boot = () => { if (document.querySelector('.settings-card')) install(); };
  new MutationObserver(boot).observe(document.documentElement, { childList: true, subtree: true });
  boot();
})();
