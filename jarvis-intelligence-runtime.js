(() => {
  'use strict';
  if (typeof window === 'undefined' || window.__JARVIS_INTELLIGENCE_RUNTIME__) return;
  window.__JARVIS_INTELLIGENCE_RUNTIME__ = true;

  const ENDPOINT = document.querySelector('meta[name="jarvis-intelligence-endpoint"]')?.getAttribute('content') || '/api/openai-intelligence';
  const SEARCH_ENDPOINT = document.querySelector('meta[name="jarvis-search-endpoint"]')?.getAttribute('content') || '';
  const STATIC_PAGES = /(^|\.)github\.io$/i.test(location.hostname);
  const REMOTE_ENDPOINT = /^https?:\/\//i.test(ENDPOINT);
  const CONTEXT_KEY = 'jarvis-session-context-v1';
  const MAX_TURNS = 6;
  const MAX_CONTEXT_CHARS = 6000;

  const speechRate = () => {
    try {
      const getter = window.jarvisGetSpeechRate || window.jarvisGetEffectiveSpeechRate;
      if (typeof getter === 'function') return Number(getter()) || 0.92;
    } catch {}
    return 0.92;
  };

  const reply = (text, speak = true) => {
    const el = document.querySelector('#jarvisReply');
    if (el) { el.textContent = text; el.classList.add('visible'); }
    if (!speak) return;
    if (typeof window.jarvisSpeak === 'function') window.jarvisSpeak(text);
    else if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate(); utterance.pitch = .54; utterance.lang = 'en-GB';
      speechSynthesis.cancel(); speechSynthesis.speak(utterance);
    }
  };

  const loadContext = () => {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(CONTEXT_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.slice(-MAX_TURNS) : [];
    } catch { return []; }
  };
  let conversation = loadContext();

  const saveContext = () => {
    try { sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(conversation.slice(-MAX_TURNS))); } catch {}
  };
  const remember = (role, text) => {
    const value = String(text || '').trim();
    if (!value) return;
    conversation.push({role, text:value, at:Date.now()});
    conversation = conversation.slice(-MAX_TURNS);
    saveContext();
  };
  const contextText = () => {
    if (!conversation.length) return '';
    let text = conversation.map(turn => `${turn.role === 'user' ? 'User' : 'JARVIS'}: ${turn.text}`).join('\n');
    if (text.length > MAX_CONTEXT_CHARS) text = text.slice(-MAX_CONTEXT_CHARS);
    return text;
  };
  const contextualQuery = query => {
    const context = contextText();
    if (!context) return query;
    return `You are JARVIS in an ongoing conversation. Use the recent conversation only to resolve references such as “it”, “that”, “which one”, “why”, “what about it”, or similar follow-ups. Do not repeat the context unless it helps answer the current request.\n\nRecent conversation:\n${context}\n\nCurrent user request:\n${query}`;
  };
  const clearContext = () => { conversation = []; try { sessionStorage.removeItem(CONTEXT_KEY); } catch {} };

  const isLocalCommand = raw => {
    const q = String(raw || '').trim().toLowerCase();
    return /\b(time|clock|date|today|weather|temperature|forecast|my name|who am i|joke|sing|maps?|directions?|navigate|navigate me|take me to|go to|open maps?|note|notes|remember|remind me|youtube|play|video|games?|snake|calculator|settings|files|sftp|api lab)\b/.test(q);
  };
  const isMathExpression = raw => {
    const q = String(raw || '').trim().toLowerCase().replace(/[=?]+$/,'').trim();
    if (!q || q.length > 80 || !/[+\-*/%]/.test(q)) return false;
    return /^[0-9\s()+\-*/%.]+$/.test(q);
  };
  const calculate = raw => {
    const expression = String(raw || '').trim().replace(/[=?]+$/,'').trim();
    if (!/^[0-9\s()+\-*/%.]+$/.test(expression)) return false;
    try { const value = Function(`"use strict"; return (${expression})`)(); if (typeof value !== 'number' || !Number.isFinite(value)) return false; reply(`${expression} = ${value}`); return true; } catch { return false; }
  };
  const isExplicitWebSearch = raw => /^(?:search|look\s*up|lookup|find|google|bing|web\s+search)\b/i.test(String(raw || '').trim());
  const isSimpleLookup = raw => {
    const q = String(raw || '').trim();
    if (!q || q.length > 80 || /[?!]/.test(q) || isLocalCommand(q) || isExplicitWebSearch(q) || isMathExpression(q)) return false;
    if (/^(?:take me|go to|navigate|directions?|open maps?)\b/i.test(q)) return false;
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
    if (/\btell me about (yourself|you)\b|\bwhat are you\b|\bwho are you\b/.test(query.toLowerCase())) {
      const text='I am JARVIS, your personal intelligence workspace. The local core handles commands, voice, news, web search, maps, media and tools.';
      reply(text); remember('user',query); remember('assistant',text); return true;
    }
    return false;
  };
  const waitForWebSearch = (query, attempts = 0) => {
    const input = document.querySelector('#webQuery'); const button = document.querySelector('#webSearch');
    if (input && button) { input.value = query; input.dispatchEvent(new Event('input', { bubbles: true })); button.click(); return true; }
    if (attempts >= 80) { reply(`I could not open the web search for “${query}”.`); return false; }
    setTimeout(() => waitForWebSearch(query, attempts + 1), 75); return true;
  };
  const searchWeb = query => {
    reply(`Searching the web for “${query}”…`, false);
    const nav = document.querySelector('[data-app="web"]'); if (nav) nav.click(); else if (!document.querySelector('#webQuery')) return reply('The web search module is unavailable right now.');
    waitForWebSearch(query); return true;
  };
  const directSearchStatus = async query => {
    if (!SEARCH_ENDPOINT) return null;
    try {
      const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 12000);
      const response = await fetch(`${SEARCH_ENDPOINT}?provider=bing&q=${encodeURIComponent(query)}`, { headers:{Accept:'application/json'}, cache:'no-store', signal:controller.signal });
      clearTimeout(timer); if (!response.ok) return null; const data = await response.json(); return Array.isArray(data?.results) ? data : null;
    } catch { return null; }
  };

  const ask = async query => {
    query = String(query || '').trim();
    if (!query) return false;
    if (localAnswer(query)) return true;
    if (isMathExpression(query)) { const ok=calculate(query); if(ok){remember('user',query);remember('assistant',document.querySelector('#jarvisReply')?.textContent||'');} return ok; }
    if (isWebSearchQuery(query)) { remember('user',query); return searchWeb(query.replace(/^(?:search|look\s*up|lookup|find|google|bing|web\s+search)\s+/i, '').trim()); }
    if (STATIC_PAGES && !REMOTE_ENDPOINT) { reply('Remote intelligence is not connected to this deployment yet. The local JARVIS core is still online.'); return false; }
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 20000);
    try {
      remember('user', query);
      reply('JARVIS intelligence is researching that…', false);
      const r = await fetch(ENDPOINT, { method:'POST', headers:{'Content-Type':'application/json',Accept:'application/json'}, body:JSON.stringify({query:contextualQuery(query), context:conversation.slice(-MAX_TURNS)}), signal:controller.signal, cache:'no-store' });
      const data = await r.json().catch(() => ({})); if (!r.ok) throw new Error(data?.error || `Gateway HTTP ${r.status}`); if (!data?.text) throw new Error('No intelligence response');
      reply(data.text); remember('assistant',data.text); window.dispatchEvent(new CustomEvent('jarvis:intelligence-result',{detail:{...data,conversation:conversation.slice(-MAX_TURNS)}})); return true;
    } catch (error) {
      conversation = conversation.filter(turn => !(turn.role === 'user' && turn.text === query)); saveContext();
      const message = error?.name === 'AbortError' ? 'The intelligence gateway timed out.' : String(error?.message || error);
      reply(`Intelligence gateway unavailable: ${message}`); window.dispatchEvent(new CustomEvent('jarvis:intelligence-error',{detail:{error:message,query}})); return false;
    } finally { clearTimeout(timer); }
  };

  document.addEventListener('jarvis:intelligence-query', event => { const query = String(event.detail?.query || '').trim(); if (query) void ask(query); });
  const intercept = event => { const form = event.target?.closest?.('#commandForm'); if (!form) return; const input = form.querySelector('#commandInput'); const query = input?.value?.trim() || ''; if (!isIntelligenceQuery(query) && !isMathExpression(query)) return; event.preventDefault(); event.stopImmediatePropagation(); void ask(query); };
  document.addEventListener('submit', intercept, true);
  window.addEventListener('jarvis:voice-command', event => { const query = String(event.detail?.text || '').trim(); if (!isIntelligenceQuery(query) && !isMathExpression(query)) return; event.preventDefault(); void ask(query); });

  window.jarvisIntelligence = {
    ask,
    available: () => Boolean(REMOTE_ENDPOINT || SEARCH_ENDPOINT) || !STATIC_PAGES,
    endpoint: ENDPOINT,
    getConversation: () => conversation.slice(-MAX_TURNS),
    clearConversation: clearContext
  };
})();
