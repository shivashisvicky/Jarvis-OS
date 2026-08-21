(() => {
  'use strict';
  if (typeof window === 'undefined' || window.__JARVIS_INTELLIGENCE_RUNTIME__) return;
  window.__JARVIS_INTELLIGENCE_RUNTIME__ = true;

  const ENDPOINT = document.querySelector('meta[name="jarvis-intelligence-endpoint"]')?.getAttribute('content') || '/api/openai-intelligence';
  const STATIC_PAGES = /(^|\.)github\.io$/i.test(location.hostname);
  const REMOTE_ENDPOINT = /^https?:\/\//i.test(ENDPOINT);
  const reply = text => {
    const el = document.querySelector('#jarvisReply');
    if (el) { el.textContent = text; el.classList.add('visible'); }
    if (typeof window.jarvisSpeak === 'function') window.jarvisSpeak(text);
    else if ('speechSynthesis' in window) { speechSynthesis.cancel(); speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(text), { rate: .84, pitch: .54, lang: 'en-GB' })); }
  };
  const isLocalCommand = raw => {
    const q = String(raw || '').trim().toLowerCase();
    return /\b(time|clock|date|today|weather|temperature|forecast|my name|who am i|joke|sing|maps?|directions?|navigate|note|notes|remember|remind me|youtube|play|video|games?|snake|calculator|settings|files|sftp|api lab)\b/.test(q);
  };
  const isMathExpression = raw => {
    const q = String(raw || '').trim().toLowerCase().replace(/[=?]+$/,'').trim();
    if (!q || q.length > 80) return false;
    if (!/[+\-*/%]/.test(q)) return false;
    return /^[0-9\s()+\-*/%.]+$/.test(q);
  };
  const calculate = raw => {
    const expression = String(raw || '').trim().replace(/[=?]+$/,'').trim();
    if (!/^[0-9\s()+\-*/%.]+$/.test(expression)) return false;
    try {
      const value = Function(`"use strict"; return (${expression})`)();
      if (typeof value !== 'number' || !Number.isFinite(value)) return false;
      reply(`${expression} = ${value}`);
      return true;
    } catch { return false; }
  };
  const isExplicitWebSearch = raw => /^(?:search|look\s*up|lookup|find|google|bing|web\s+search)\b/i.test(String(raw || '').trim());
  const isSimpleLookup = raw => {
    const q = String(raw || '').trim();
    if (!q || q.length > 80 || /[?!]/.test(q) || isLocalCommand(q) || isExplicitWebSearch(q) || isMathExpression(q)) return false;
    if (!/^[\p{L}\p{N}][\p{L}\p{N} .,'&+\-()]{1,79}$/u.test(q)) return false;
    if (q.split(/\s+/).length > 6) return false;
    return !/^(tell|what|who|why|how|can|could|should|is|are|do|does|will|where|when|which)\b/i.test(q);
  };
  const isFreshWebQuery = raw => /\b(latest|breaking|news|headlines|current events|recent|today's news|right now)\b/i.test(String(raw || ''));
  const isWebSearchQuery = raw => isExplicitWebSearch(raw) || isSimpleLookup(raw) || isFreshWebQuery(raw);
  const isIntelligenceQuery = raw => {
    const q = String(raw || '').trim().toLowerCase();
    if (!q || isLocalCommand(q) || isMathExpression(q)) return false;
    if (isWebSearchQuery(q)) return true;
    return /\b(explain|summari[sz]e|compare|why|how|best|recommend|research|tell me about|what(?: is|['’]s| are| was| were)|who(?: is|['’]s)|analy[sz]e|which|should i|is it|can you|could you|do you|does)\b/.test(q) || q.length > 55 || /\?$/.test(q);
  };
  const localAnswer = query => {
    const q = query.toLowerCase();
    if (/\btell me about (yourself|you)\b|\bwhat are you\b|\bwho are you\b/.test(q)) {
      reply('I am JARVIS, your personal intelligence workspace. The local core handles commands, voice, news, web search, maps, media and tools.');
      return true;
    }
    return false;
  };
  const waitForWebSearch = (query, attempts = 0) => {
    const input = document.querySelector('#webQuery');
    const button = document.querySelector('#webSearch');
    if (input && button) {
      input.value = query;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      button.click();
      return true;
    }
    if (attempts >= 80) {
      reply(`I could not open the web search for “${query}”.`);
      return false;
    }
    setTimeout(() => waitForWebSearch(query, attempts + 1), 75);
    return true;
  };
  const searchWeb = query => {
    reply(`Searching the web for “${query}”…`);
    const nav = document.querySelector('[data-app="web"]');
    if (nav) nav.click();
    else {
      const existing = document.querySelector('#webQuery');
      if (!existing) return reply('The web search module is unavailable right now.');
    }
    waitForWebSearch(query);
    return true;
  };
  const ask = async query => {
    if (localAnswer(query)) return true;
    if (isMathExpression(query)) return calculate(query);
    if (isWebSearchQuery(query)) return searchWeb(query.replace(/^(?:search|look\s*up|lookup|find|google|bing|web\s+search)\s+/i, '').trim());
    if (STATIC_PAGES && !REMOTE_ENDPOINT) {
      reply('Remote intelligence is not connected to this deployment yet. The local JARVIS core is still online.');
      return false;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
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
      reply(`Intelligence gateway unavailable: ${message}`);
      window.dispatchEvent(new CustomEvent('jarvis:intelligence-error', { detail: { error: message, query } }));
      return false;
    } finally { clearTimeout(timer); }
  };
  document.addEventListener('jarvis:intelligence-query', event => {
    const query = String(event.detail?.query || '').trim();
    if (query) void ask(query);
  });
  const intercept = event => {
    const form = event.target?.closest?.('#commandForm');
    if (!form) return;
    const input = form.querySelector('#commandInput');
    const query = input?.value?.trim() || '';
    if (!isIntelligenceQuery(query) && !isMathExpression(query)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void ask(query);
  };
  document.addEventListener('submit', intercept, true);
  window.addEventListener('jarvis:voice-command', event => {
    const query = String(event.detail?.text || '').trim();
    if (!isIntelligenceQuery(query) && !isMathExpression(query)) return;
    event.preventDefault();
    void ask(query);
  });
  window.jarvisIntelligence = { ask, available: () => REMOTE_ENDPOINT || !STATIC_PAGES, endpoint: ENDPOINT };
})();
