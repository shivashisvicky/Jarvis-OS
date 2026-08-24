/* J.A.R.V.I.S. Voice Authority
 * Primary path: remote TTS on desktop. iOS/Safari deliberately uses the
 * browser speech engine so command responses remain reliable after a
 * microphone recognition callback. This keeps typed and spoken commands on
 * the same response path instead of depending on a post-gesture Web Audio
 * fetch/decode operation.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || window.__JARVIS_VOICE_AUTHORITY__) return;
  window.__JARVIS_VOICE_AUTHORITY__ = true;

  const endpoint = document.querySelector('meta[name="jarvis-intelligence-endpoint"]')?.getAttribute('content') || 'https://jarvis-intelligence.shivashisvicky112.workers.dev/api/openai-intelligence';
  const base = endpoint.replace(/\/api\/(?:openai-intelligence|intelligence)\/?$/, '');
  const ttsEndpoint = `${base}/api/tts`;
  const nativeSpeech = 'speechSynthesis' in window;
  const nativeSpeak = nativeSpeech ? window.speechSynthesis.speak.bind(window.speechSynthesis) : null;
  const nativeCancel = nativeSpeech ? window.speechSynthesis.cancel.bind(window.speechSynthesis) : null;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const requestId = { value: 0 };
  let playing = false;
  let audioContext = null;
  const queue = [];
  const activeSources = new Set();

  const rate = () => {
    try {
      const getter = window.jarvisGetSpeechRate || window.jarvisGetEffectiveSpeechRate;
      if (typeof getter === 'function') return Math.min(1.2, Math.max(.8, Number(getter()) || .92));
      const stored = localStorage.getItem('jarvisSpeechRate');
      if (stored !== null) return Math.min(1.2, Math.max(.8, Number(stored) || .92));
    } catch {}
    return .92;
  };

  const getAudioContext = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      if (!audioContext || audioContext.state === 'closed') {
        try { audioContext = new Ctx({ latencyHint: 'interactive' }); }
        catch { audioContext = new Ctx(); }
      }
      return audioContext;
    } catch { return null; }
  };

  const prime = () => {
    const ctx = getAudioContext();
    if (!ctx) return null;
    try {
      if (ctx.state === 'suspended' || ctx.state === 'interrupted') void ctx.resume();
      const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      source.onended = () => { try { source.disconnect(); } catch {} };
    } catch {}
    return ctx;
  };

  const nativeFallback = (text, options = {}) => {
    if (!nativeSpeak) return false;
    try {
      nativeCancel?.();
      try { window.speechSynthesis.resume(); } catch {}
      const utterance = new SpeechSynthesisUtterance(String(text));
      utterance.rate = rate();
      utterance.pitch = Number.isFinite(Number(options.pitch)) ? Number(options.pitch) : .54;
      utterance.volume = Number.isFinite(Number(options.volume)) ? Number(options.volume) : .96;
      utterance.lang = options.language || 'en-GB';
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => /en-GB/i.test(v.lang) && /Daniel|Arthur|George|Oliver|James|Thomas/i.test(v.name))
        || voices.find(v => /en-GB/i.test(v.lang))
        || voices.find(v => /en-IN/i.test(v.lang))
        || voices[0];
      if (voice) utterance.voice = voice;
      nativeSpeak(utterance);
      return true;
    } catch { return false; }
  };

  const stop = () => {
    requestId.value += 1;
    queue.length = 0;
    for (const source of activeSources) {
      try { source.stop(); } catch {}
      try { source.disconnect(); } catch {}
    }
    activeSources.clear();
    playing = false;
  };

  const playWavFallback = async arrayBuffer => {
    const ctx = prime();
    if (!ctx) throw new Error('Web Audio is unavailable on this device.');
    if (ctx.state === 'suspended' || ctx.state === 'interrupted') await ctx.resume();
    const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 1;
    const gain = ctx.createGain();
    gain.gain.value = .96;
    source.connect(gain);
    gain.connect(ctx.destination);
    activeSources.add(source);
    await new Promise((resolve, reject) => {
      source.onended = () => { activeSources.delete(source); resolve(); };
      try { source.start(0); } catch (error) { reject(error); }
    });
    try { source.disconnect(); gain.disconnect(); } catch {}
  };

  const decodeBase64 = value => {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  const playPcmChunk = (bytes, sampleRate = 24000, channels = 1, state) => {
    const ctx = getAudioContext();
    if (!ctx || !bytes?.byteLength) return false;
    if (ctx.state === 'suspended' || ctx.state === 'interrupted') void ctx.resume();
    const usable = bytes.byteLength - (bytes.byteLength % 2);
    if (!usable) return false;
    const samples = new Int16Array(bytes.buffer, bytes.byteOffset, usable / 2);
    const frameCount = Math.floor(samples.length / channels);
    if (!frameCount) return false;
    const buffer = ctx.createBuffer(channels, frameCount, sampleRate);
    for (let ch = 0; ch < channels; ch += 1) {
      const channel = buffer.getChannelData(ch);
      for (let i = 0; i < frameCount; i += 1) channel[i] = samples[i * channels + ch] / 32768;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 1;
    const gain = ctx.createGain();
    gain.gain.value = .96;
    source.connect(gain);
    gain.connect(ctx.destination);
    activeSources.add(source);
    source.onended = () => { activeSources.delete(source); try { source.disconnect(); gain.disconnect(); } catch {} };
    const now = ctx.currentTime;
    const lead = state.started ? 0.012 : 0.075;
    state.nextTime = Math.max(state.nextTime, now + lead);
    source.start(state.nextTime);
    state.nextTime += buffer.duration;
    state.started = true;
    return true;
  };

  const consumeSse = async (response, id) => {
    if (!response.body) throw new Error('TTS stream has no body.');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let audioSeen = false;
    let carry = new Uint8Array(0);
    const state = { nextTime: 0, started: false };
    const processEvent = raw => {
      const dataLines = raw.split(/\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trim());
      if (!dataLines.length) return;
      const payload = dataLines.join('\n');
      if (payload === '[DONE]') return;
      let event; try { event = JSON.parse(payload); } catch { return; }
      if (event?.event_type !== 'step.delta' || event?.delta?.type !== 'audio' || !event?.delta?.data || id !== requestId.value) return;
      const incoming = decodeBase64(event.delta.data);
      const combined = new Uint8Array(carry.byteLength + incoming.byteLength);
      combined.set(carry, 0); combined.set(incoming, carry.byteLength);
      const usable = combined.byteLength - (combined.byteLength % 2);
      carry = combined.slice(usable);
      if (playPcmChunk(combined.slice(0, usable), Number(event.delta.sample_rate) || 24000, Number(event.delta.channels) || 1, state)) audioSeen = true;
    };
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      let boundary;
      while ((boundary = textBuffer.indexOf('\n\n')) >= 0) {
        const event = textBuffer.slice(0, boundary);
        textBuffer = textBuffer.slice(boundary + 2);
        processEvent(event);
      }
      if (id !== requestId.value) { try { await reader.cancel(); } catch {} return false; }
    }
    textBuffer += decoder.decode();
    if (textBuffer.trim()) processEvent(textBuffer);
    if (!audioSeen) throw new Error('JARVIS TTS returned no audio.');
    if (carry.byteLength) playPcmChunk(carry, 24000, 1, state);
    return true;
  };

  const playNext = async () => {
    if (playing || !queue.length) return;
    playing = true;
    const item = queue.shift();
    const id = item.id;
    try {
      prime();
      const mobileWav = isIOS || isSafari;
      const ttsUrl = `${ttsEndpoint}${mobileWav ? '?format=wav' : ''}`;
      const response = await fetch(ttsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: mobileWav ? 'audio/wav' : 'text/event-stream, audio/wav', ...(mobileWav ? { 'X-JARVIS-TTS-Mode': 'wav' } : {}) },
        body: JSON.stringify({ text: item.text, rate: rate(), stream: !mobileWav }),
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`TTS HTTP ${response.status}`);
      if (id !== requestId.value) return;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream')) await consumeSse(response, id);
      else await playWavFallback(await response.arrayBuffer());
    } catch (error) {
      if (id === requestId.value) {
        const fallbackWorked = nativeFallback(item.text, item.options);
        window.dispatchEvent(new CustomEvent('jarvis:voice-error', { detail: { error: String(error?.message || error), fallback: fallbackWorked, mobileWav: isIOS || isSafari } }));
      }
    } finally {
      playing = false;
      if (id === requestId.value) playNext();
    }
  };

  const speakGenerated = (text, options = {}) => {
    const clean = String(text || '').trim();
    if (!clean) return false;
    if (isIOS || isSafari) {
      stop();
      return nativeFallback(clean, options);
    }
    prime();
    stop();
    queue.push({ id: requestId.value, text: clean, options });
    void playNext();
    return true;
  };

  window.jarvisVoiceAuthoritySpeak = speakGenerated;
  window.jarvisCinematicSpeak = speakGenerated;
  window.jarvisSpeak = speakGenerated;
  window.jarvisVoiceAuthorityStop = stop;

  const unlockOnGesture = () => { prime(); if (nativeSpeech) try { window.speechSynthesis.resume(); } catch {} };
  document.addEventListener('pointerdown', unlockOnGesture, { capture: true, passive: true });
  document.addEventListener('touchstart', unlockOnGesture, { capture: true, passive: true });
  document.addEventListener('keydown', unlockOnGesture, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { prime(); try { window.speechSynthesis?.resume(); } catch {} } });

  if (nativeSpeech) {
    window.speechSynthesis.speak = utterance => {
      const text = utterance?.text || '';
      if (text) speakGenerated(text, { language: utterance?.lang, pitch: utterance?.pitch, volume: utterance?.volume });
    };
    window.speechSynthesis.cancel = () => { stop(); try { nativeCancel?.(); } catch {} };
  }

  window.addEventListener('beforeunload', stop, { once: true });
})();
