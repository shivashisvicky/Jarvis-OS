/* J.A.R.V.I.S. Voice Authority
 * One generated voice for every device/browser. The browser's native TTS is
 * intercepted so Samsung, Motorola, iPhone, Chrome, Safari, Edge, etc. all
 * receive the same server-generated JARVIS audio.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || window.__JARVIS_VOICE_AUTHORITY__) return;
  window.__JARVIS_VOICE_AUTHORITY__ = true;

  const endpoint = document.querySelector('meta[name="jarvis-intelligence-endpoint"]')?.getAttribute('content') || '/api/openai-intelligence';
  const base = endpoint.replace(/\/api\/(?:openai-intelligence|intelligence)\/?$/, '');
  const ttsEndpoint = `${base}/api/tts`;
  let currentAudio = null;
  let requestId = 0;
  const queue = [];
  let playing = false;

  const rate = () => {
    try {
      const getter = window.jarvisGetSpeechRate || window.jarvisGetEffectiveSpeechRate;
      if (typeof getter === 'function') return Math.min(1.2, Math.max(.8, Number(getter()) || .92));
      const stored = localStorage.getItem('jarvisSpeechRate');
      if (stored !== null) return Math.min(1.2, Math.max(.8, Number(stored) || .92));
    } catch {}
    return .92;
  };

  const stop = () => {
    requestId += 1;
    queue.length = 0;
    if (currentAudio) {
      try { currentAudio.pause(); } catch {}
      try { currentAudio.removeAttribute('src'); currentAudio.load(); } catch {}
      currentAudio = null;
    }
    playing = false;
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
      if (!response.ok) throw new Error(`TTS HTTP ${response.status}`);
      if (id !== requestId) return;
      const blob = await response.blob();
      if (id !== requestId) return;
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudio = audio;
      audio.preload = 'auto';
      audio.volume = .96;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        currentAudio = null;
        playing = false;
        playNext();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        currentAudio = null;
        playing = false;
        window.dispatchEvent(new CustomEvent('jarvis:voice-error', { detail: { error: 'Generated JARVIS audio could not be played.' } }));
        playNext();
      };
      await audio.play();
    } catch (error) {
      playing = false;
      currentAudio = null;
      if (id === requestId) window.dispatchEvent(new CustomEvent('jarvis:voice-error', { detail: { error: String(error?.message || error) } }));
      playNext();
    }
  };

  const speakGenerated = (text, options = {}) => {
    const clean = String(text || '').trim();
    if (!clean) return false;
    stop();
    queue.push({ id: requestId, text: clean, options });
    void playNext();
    return true;
  };

  window.jarvisVoiceAuthoritySpeak = speakGenerated;
  window.jarvisCinematicSpeak = speakGenerated;
  window.jarvisSpeak = speakGenerated;
  window.jarvisVoiceAuthorityStop = stop;

  if ('speechSynthesis' in window) {
    const nativeSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
    const nativeCancel = window.speechSynthesis.cancel.bind(window.speechSynthesis);
    window.speechSynthesis.speak = utterance => {
      const text = utterance?.text || '';
      if (!speakGenerated(text, { language: utterance?.lang })) nativeSpeak(utterance);
    };
    window.speechSynthesis.cancel = () => {
      stop();
      try { nativeCancel(); } catch {}
    };
  }

  window.addEventListener('beforeunload', stop, { once: true });
})();
