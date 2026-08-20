(() => {
  'use strict';
  if (typeof window === 'undefined' || window.__JARVIS_INTELLIGENCE_RUNTIME__) return;
  window.__JARVIS_INTELLIGENCE_RUNTIME__ = true;

  const ENDPOINT = document.querySelector('meta[name="jarvis-intelligence-endpoint"]')?.getAttribute('content') || '/api/openai-intelligence';
  const reply = text => {
    const el = document.querySelector('#jarvisReply');
    if (el) { el.textContent = text; el.classList.add('visible'); }
    if (typeof window.jarvisSpeak === 'function') window.jarvisSpeak(text);
    else if ('speechSynthesis' in window) { speechSynthesis.cancel(); speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(text), { rate: .84, pitch: .54, lang: 'en-GB' })); }
  };
  const isIntelligenceQuery = raw => {
    const q = String(raw || '').trim().toLowerCase();
    if (!q) return false;
    if (/\b(time|clock|date|today|weather|temperature|forecast|my name|who am i|joke|sing|maps?|directions?|navigate|note|notes|remember|remind me|youtube|play|video|games?|snake|calculator|settings|files|sftp|api lab)\b/.test(q)) return false;
    return /\b(explain|summari[sz]e|compare|why|how|best|recommend|find|research|tell me about|what is|what are|who is|latest|current|today's|analy[sz]e|which|should i|is it|can you)\b/.test(q) || q.length > 55;
  };
  const ask = async query => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      reply('JARVIS intelligence is researching that…');
      const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ query }), signal: controller.signal, cache: 'no-store' });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || `Gateway HTTP ${r.status}`);
      if (!data?.text) throw new Error('No intelligence response');
      reply(data.text);
      window.dispatchEvent(new CustomEvent('jarvis:intelligence-result', { detail: data }));
      return true;
    } catch (error) {
      const message = error?.name === 'AbortError' ? 'The intelligence gateway timed out.' : String(error?.message || error);
      if (/404|failed to fetch|network|gateway/i.test(message)) reply('The JARVIS Intelligence Gateway is not connected yet. The local command core is still online.');
      else reply(`Intelligence gateway unavailable: ${message}`);
      window.dispatchEvent(new CustomEvent('jarvis:intelligence-error', { detail: { error: message, query } }));
      return false;
    } finally { clearTimeout(timer); }
  };
  const intercept = event => {
    const form = event.target?.closest?.('#commandForm');
    if (!form) return;
    const input = form.querySelector('#commandInput');
    const query = input?.value?.trim() || '';
    if (!isIntelligenceQuery(query)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void ask(query);
  };
  document.addEventListener('submit', intercept, true);
  window.addEventListener('jarvis:voice-command', event => {
    const query = String(event.detail?.text || '').trim();
    if (!isIntelligenceQuery(query)) return;
    event.preventDefault();
    void ask(query);
  });
  window.jarvisIntelligence = { ask, available: () => true, endpoint: ENDPOINT };
})();
