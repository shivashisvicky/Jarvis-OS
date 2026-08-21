/* J.A.R.V.I.S. Voice Authority
 * One generated voice for every device/browser. Native OS voices are not
 * used for JARVIS output. Gemini TTS supplies the voice; Web Audio supplies
 * reliable playback and the exact user-selected speech rate.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || window.__JARVIS_VOICE_AUTHORITY__) return;
  window.__JARVIS_VOICE_AUTHORITY__ = true;

  const endpoint = document.querySelector('meta[name="jarvis-intelligence-endpoint"]')?.getAttribute('content') || '/api/openai-intelligence';
  const base = endpoint.replace(/\/api\/(?:openai-intelligence|intelligence)\/?$/, '');
  const ttsEndpoint = `${base}/api/tts`;
  let currentAudio = null;
  let currentObjectUrl = null;
  let requestId = 0;
  const queue = [];
  let playing = false;
  let audioContext = null;

  const rate = () => {
    try {
      const getter = window.jarvisGetSpeechRate || window.jarvisGetEffectiveSpeechRate;
      if (typeof getter === 'function') return Math.min(1.2, Math.max(.8, Number(getter()) || .92));
      const stored = localStorage.getItem('jarvisSpeechRate');
      if (stored !== null) return Math.min(1.2, Math.max(.8, Number(stored) || .92));
    } catch {}
    return .92;
  };

  const unlockAudio = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      if (!audioContext) audioContext = new Ctx();
      if (audioContext.state === 'suspended') void audioContext.resume();
      return audioContext;
    } catch { return null; }
  };

  const stop = () => {
    requestId += 1;
    queue.length = 0;
    if (currentAudio) {
      try { currentAudio.pause(); } catch {}
      try { currentAudio.src = ''; } catch {}
      currentAudio = null;
    }
    if (currentObjectUrl) {
      try { URL.revokeObjectURL(currentObjectUrl); } catch {}
      currentObjectUrl = null;
    }
    playing = false;
  };

  const playWithWebAudio = async (bytes, playbackRate) => {
    const ctx = unlockAudio();
    if (!ctx) return false;
    try {
      if (ctx.state === 'suspended') await ctx.resume();
      const buffer = await ctx.decodeAudioData(bytes.slice(0));
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = buffer;
      source.playbackRate.value = playbackRate;
      gain.gain.value = .96;
      source.connect(gain);
      gain.connect(ctx.destination);
      currentAudio = source;
      await new Promise((resolve, reject) => {
        source.onended = resolve;
        try { source.start(0); } catch (error) { reject(error); }
      });
      currentAudio = null;
      return true;
    } catch {
      currentAudio = null;
      return false;
    }
  };

  const playWithMediaElement = async (blob, playbackRate) => {
    const url = URL.createObjectURL(blob);
    currentObjectUrl = url;
    const audio = new Audio(url);
    currentAudio = audio;
    audio.preload = 'auto';
    audio.volume = .96;
    audio.playbackRate = playbackRate;
    await audio.play();
    await new Promise((resolve, reject) => {
      audio.onended = resolve;
      audio.onerror = () => reject(new Error('Generated JARVIS audio could not be decoded.'));
    });
    URL.revokeObjectURL(url);
    currentObjectUrl = null;
    currentAudio = null;
  };

  const playNext = async () => {
    if (playing || !queue.length) return;
    playing = true;
    const item = queue.shift();
    const id = item.id;
    try {
      const response = await fetch(ttsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'audio/wav' },
        body: JSON.stringify({ text: item.text, rate: rate() }),
        cache: 'no-store',
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`TTS HTTP ${response.status}${detail ? `: ${detail.slice(0, 180)}` : ''}`);
      }
      if (id !== requestId) return;
      const arrayBuffer = await response.arrayBuffer();
      if (id !== requestId) return;
      const playbackRate = rate();
      const played = await playWithWebAudio(arrayBuffer, playbackRate);
      if (!played) await playWithMediaElement(new Blob([arrayBuffer], { type: 'audio/wav' }), playbackRate);
    } catch (error) {
      if (id === requestId) window.dispatchEvent(new CustomEvent('jarvis:voice-error', { detail: { error: String(error?.message || error) } }));
    } finally {
      playing = false;
      currentAudio = null;
      if (currentObjectUrl) { try { URL.revokeObjectURL(currentObjectUrl); } catch {} currentObjectUrl = null; }
      if (id === requestId) playNext();
    }
  };

  const speakGenerated = (text, options = {}) => {
    const clean = String(text || '').trim();
    if (!clean) return false;
    // This runs synchronously for clicks/taps, satisfying browser audio activation.
    unlockAudio();
    stop();
    queue.push({ id: requestId, text: clean, options });
    void playNext();
    return true;
  };

  window.jarvisVoiceAuthoritySpeak = speakGenerated;
  window.jarvisCinematicSpeak = speakGenerated;
  window.jarvisSpeak = speakGenerated;
  window.jarvisVoiceAuthorityStop = stop;

  window.addEventListener('jarvis:speech-rate-changed', () => {
    if (currentAudio?.playbackRate) currentAudio.playbackRate.value = rate();
  });

  if ('speechSynthesis' in window) {
    const nativeCancel = window.speechSynthesis.cancel.bind(window.speechSynthesis);
    window.speechSynthesis.speak = utterance => {
      const text = utterance?.text || '';
      if (text) speakGenerated(text, { language: utterance?.lang });
    };
    window.speechSynthesis.cancel = () => {
      stop();
      try { nativeCancel(); } catch {}
    };
  }

  window.addEventListener('beforeunload', stop, { once: true });
})();
