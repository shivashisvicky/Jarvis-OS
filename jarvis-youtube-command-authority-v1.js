(() => {
  'use strict';
  if (window.__JARVIS_YOUTUBE_COMMAND_AUTHORITY_V3__) return;
  window.__JARVIS_YOUTUBE_COMMAND_AUTHORITY_V3__ = true;
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const isYouTubeCommand = value => {
    const q = clean(value);
    if (/https?:\/\/\S+/i.test(q)) return false;
    return /\b(?:youtube|yt)\b/i.test(q) && /\b(?:search|find|look\s+up|play|watch|show|open|video|videos|news|music|song)\b/i.test(q);
  };
  const isPlayCommand = value => /\b(?:play|watch)\b/i.test(clean(value));
  const queryFromCommand = value => {
    let q = clean(value);
    q = q.replace(/^\s*(?:please\s+)?(?:search|find|look\s+up)\s+(?:for\s+)?/i, '');
    q = q.replace(/^\s*(?:please\s+)?(?:play|watch)\s+/i, '');
    q = q.replace(/\b(?:on|in)\s+(?:youtube|yt)\b/gi, ' ');
    q = q.replace(/\b(?:youtube|yt)\b/gi, ' ');
    q = q.replace(/^\s*(?:for|on|in)\s+/i, '');
    return clean(q).replace(/[.!?]+$/, '').trim();
  };
  const openMedia = (query, playFirst) => {
    const nav = document.querySelector('.nav[data-app="media"]');
    if (nav instanceof HTMLElement && !nav.classList.contains('selected')) nav.click();
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      const input = document.querySelector('#videoQuery');
      const search = document.querySelector('#videoSearch');
      const autoPlay = window.jarvisAutoPlayFirstYouTubeResult;
      if (input instanceof HTMLInputElement && search instanceof HTMLButtonElement && window.__JARVIS_LIVE_MEDIA__) {
        window.clearInterval(timer);
        input.value = query;
        if (playFirst && typeof autoPlay === 'function') void autoPlay(query);
        else search.click();
        return;
      }
      if (tries >= 80) window.clearInterval(timer);
    }, 50);
  };
  const replyText = (query, playFirst) => playFirst
    ? `Playing the first YouTube result for “${query}”.`
    : (query ? `Searching YouTube for “${query}”.` : 'Opening the YouTube media console.');
  const speakOnce = text => {
    try {
      const standard = window.jarvisVoiceAuthoritySpeak || window.jarvisCinematicSpeak || window.jarvisSpeak;
      if (typeof standard === 'function') { standard(text, { rate: 0.92, pitch: 0.54, volume: 0.96, language: 'en-GB' }); return; }
      if (!('speechSynthesis' in window)) return;
      const u = new SpeechSynthesisUtterance(text); u.rate=.92; u.pitch=.54; u.volume=.96; u.lang='en-GB'; window.speechSynthesis.speak(u);
    } catch {}
  };
  const handle = raw => {
    if (!isYouTubeCommand(raw)) return false;
    const query = queryFromCommand(raw), playFirst = isPlayCommand(raw);
    openMedia(query, playFirst);
    const reply = replyText(query, playFirst);
    const replyNode = document.querySelector('#jarvisReply');
    if (replyNode) { replyNode.textContent = reply; replyNode.classList.add('visible'); }
    return reply;
  };
  document.addEventListener('submit', event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== 'commandForm') return;
    const input = form.querySelector('#commandInput');
    const raw = input instanceof HTMLInputElement ? clean(input.value) : '';
    const reply = handle(raw);
    if (!reply) return;
    event.preventDefault(); event.stopImmediatePropagation();
  }, true);
  window.addEventListener('jarvis:voice-command', event => {
    const raw = clean(event.detail?.text);
    if (!isYouTubeCommand(raw)) return;
    const query = queryFromCommand(raw), playFirst = isPlayCommand(raw);
    openMedia(query, playFirst);
    const reply = replyText(query, playFirst);
    event.preventDefault(); event.stopImmediatePropagation();
    window.setTimeout(() => speakOnce(reply), 0);
  }, true);
})();