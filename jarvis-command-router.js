(() => {
  'use strict';
  if (window.__JARVIS_COMMAND_ROUTER__) return;
  window.__JARVIS_COMMAND_ROUTER__ = true;
  const normalize = (s) => String(s || '').trim();
  const stripMap = (text) => normalize(text).replace(/^(?:give me\s+)?(?:directions?|navigate|take me)\s+(?:to|for)\s+/i, '').trim();
  const stripMedia = (text) => normalize(text).replace(/\b(play|open|watch|find|search|show(?: me)?|youtube|video|videos|on)\b/gi, ' ').replace(/\s+/g, ' ').trim();
  const stripNote = (text) => {
    const patterns = [
      /\bmake\s+(?:me\s+)?a\s+note\s+(?:to|that|saying)\s+(.+)/i,
      /\bmake\s+note\s+(?:to|that|saying)\s+(.+)/i,
      /\bwrite\s+(?:me\s+)?a\s+note\s+(?:to|that|saying)\s+(.+)/i,
      /\bremember\s+(?:to\s+)?(.+)/i,
      /\bremind\s+me\s+(?:to\s+)?(.+)/i
    ];
    for (const p of patterns) { const m = text.match(p); if (m?.[1]) return m[1].replace(/[.!?]+$/, '').trim(); }
    return null;
  };
  const appFor = (text) => {
    const q = text.toLowerCase();
    if (/\b(note|notes|remember|remind me|make a note)\b/.test(q)) return 'notes';
    if (/\b(map|maps|directions?|navigate|take me to|go to)\b/.test(q)) return 'maps';
    if (/\b(youtube|video|videos|play|media|movie|movies)\b/.test(q)) return 'media';
    if (/\b(game|games|arcade|snake|tetris|2048|tic tac toe|minesweeper|memory)\b/.test(q)) return 'snake';
    return null;
  };
  const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
  window.addEventListener('jarvis:core-command', (e) => {
    const text = normalize(e.detail?.text);
    if (!text) return;
    const app = appFor(text);
    if (!app) return;
    e.preventDefault?.();
    if (app === 'maps') emit('jarvis:maps', { place: stripMap(text), query: text });
    else if (app === 'media') emit('jarvis:media', { query: stripMedia(text), raw: text });
    else if (app === 'notes') { const note = stripNote(text); emit('jarvis:create-note', { text: note || text, source: 'command' }); }
    else emit('jarvis:open-app', { app, query: text });
  }, true);
})();
