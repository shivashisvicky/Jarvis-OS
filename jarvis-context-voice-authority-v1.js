(()=>{
  'use strict';
  if(window.__JARVIS_CONTEXT_VOICE_AUTHORITY_V1__)return;
  window.__JARVIS_CONTEXT_VOICE_AUTHORITY_V1__=true;

  const CONTEXT_KEY='jarvis-session-context-v2';
  const loadContext=()=>{try{const v=JSON.parse(sessionStorage.getItem(CONTEXT_KEY)||'[]');return Array.isArray(v)?v.slice(-8):[]}catch{return[]}};
  const isExplicitCommand=q=>/^(?:search|look\s*up|lookup|find|show\s+me|show|locate|where\s+are|look\s+for|google|bing|web\s+search|take me|go to|navigate|directions?|open\s+(?:maps?|youtube|media|games?|calculator|settings|files|notes?|search)|play|open youtube|youtube)\b/i.test(String(q||'').trim());
  const isLocalCommand=q=>/\b(?:time|clock|date|weather|temperature|forecast|maps?|directions?|navigate|take me to|go to|youtube|play|video|games?|snake|calculator|settings|files|notes?|remember|remind me|sftp|api lab)\b/i.test(String(q||''));
  const isContextAnswer=q=>{
    const s=String(q||'').trim();
    if(!s||s.length>100||/[?!]/.test(s)||isExplicitCommand(s)||isLocalCommand(s))return false;
    if(s.split(/\s+/).filter(Boolean).length>8)return false;
    const context=loadContext();
    if(!context.length)return false;
    const last=context[context.length-1];
    return last?.role==='assistant';
  };

  // Voice recognition in src/jarvis.ts dispatches jarvis:voice-command and then
  // directly calls executeCommand(). That bypasses the commandForm submit event,
  // so the intelligence runtime's submit capture cannot protect contextual replies.
  // Any short natural-language answer following a JARVIS response stays in the
  // conversation unless it is clearly an explicit command or local module command.
  window.addEventListener('jarvis:voice-command',event=>{
    const query=String(event.detail?.text||'').trim();
    if(!isContextAnswer(query))return;
    const intelligence=window.jarvisIntelligence;
    if(!intelligence||typeof intelligence.ask!=='function')return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void intelligence.ask(query);
  },true);
})();
