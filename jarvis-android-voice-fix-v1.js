(() => {
  'use strict';
  if (typeof window === 'undefined' || window.__JARVIS_ANDROID_VOICE_FIX_V1__) return;
  window.__JARVIS_ANDROID_VOICE_FIX_V1__ = true;

  const isAndroid = /Android/i.test(navigator.userAgent || '');
  if (!isAndroid || !('speechSynthesis' in window)) return;

  const synth = window.speechSynthesis;
  let queue = [];
  let speaking = false;
  let watchdog = 0;

  const clearWatchdog = () => {
    if (watchdog) {
      window.clearInterval(watchdog);
      watchdog = 0;
    }
  };

  const stop = () => {
    queue = [];
    clearWatchdog();
    speaking = false;
    try { synth.cancel(); } catch {}
  };

  const split = text => {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return [];
    const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
    const chunks = [];
    let current = '';
    for (const sentence of sentences) {
      const s = sentence.trim();
      if (!s) continue;
      if (current && (current.length + s.length + 1) > 180) {
        chunks.push(current);
        current = s;
      } else {
        current = current ? `${current} ${s}` : s;
      }
    }
    if (current) chunks.push(current);
    return chunks;
  };

  const next = () => {
    if (!queue.length) {
      speaking = false;
      clearWatchdog();
      window.dispatchEvent(new CustomEvent('jarvis:speech-state', { detail: { speaking: false } }));
      return;
    }

    const item = queue.shift();
    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.rate = Math.min(1.05, Math.max(.85, Number(item.rate) || .95));
    utterance.pitch = Number.isFinite(Number(item.pitch)) ? Number(item.pitch) : .54;
    utterance.volume = Number.isFinite(Number(item.volume)) ? Number(item.volume) : .98;
    utterance.lang = item.language || 'en-GB';

    const finish = () => {
      if (!speaking) return;
      window.setTimeout(next, 35);
    };
    utterance.onstart = () => {
      speaking = true;
      window.dispatchEvent(new CustomEvent('jarvis:speech-state', { detail: { speaking: true } }));
    };
    utterance.onend = finish;
    utterance.onerror = finish;

    try {
      synth.resume();
      synth.speak(utterance);
    } catch {
      finish();
      return;
    }

    clearWatchdog();
    // Android Chrome can leave speechSynthesis paused after recognition hands
    // control back to the page. Keep it resumed while JARVIS is speaking.
    watchdog = window.setInterval(() => {
      if (!speaking) return;
      try {
        if (synth.paused) synth.resume();
      } catch {}
    }, 250);
  };

  window.jarvisAndroidNativeSpeak = (text, options = {}) => {
    const clean = String(text || '').trim();
    if (!clean) return false;
    stop();
    queue = split(clean).map(chunk => ({
      text: chunk,
      rate: options.rate,
      pitch: options.pitch,
      volume: options.volume,
      language: options.language || 'en-GB',
    }));
    next();
    return true;
  };

  window.jarvisAndroidNativeStop = stop;
})();
