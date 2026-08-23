(()=>{
  'use strict';
  if (typeof window === 'undefined' || window.__JARVIS_INTELLIGENCE_RUNTIME__) return;
  window.__JARVIS_INTELLIGENCE_RUNTIME__ = true;

  const ENDPOINT = document.querySelector('meta[name="jarvis-intelligence-endpoint"]')?.getAttribute('content') || '/api/openai-intelligence';
  const SEARCH_ENDPOINT = document.querySelector('meta[name="jarvis-search-endpoint"]')?.getAttribute('content') || '';
  const STATIC_PAGES = /(^|\.)github\.io$/i.test(location.hostname);
  const REMOTE_ENDPOINT = /^https?:\/\//i.test(ENDPOINT);
  const CONTEXT_KEY = 'jarvis-session-context-v2';
  // Keep four user/assistant exchanges available for lightweight follow-ups.
  const MAX_TURNS = 8;
  const MAX_CONTEXT_CHARS = 3200;

  const stopVoiceBeforeProcessing = () => {
    try { window.jarvisStopAllVoiceSessions?.(); } catch {}
    try { window.jarvisForceStopVoice?.(); } catch {}
    try { window.jarvisStopIOSVoice?.(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
  };

  const speechRate = () => {
    try { const getter = window.jarvisGetSpeechRate || window.jarvisGetEffectiveSpeechRate; if (typeof getter === 'function') return Number(getter()) || 0.92; } catch {}
    return 0.92;
  };
  const reply = (text, speak = true) => {
    const el = document.querySelector('#jarvisReply');
    if (el) { el.textContent = text; el.classList.add('visible'); }
    if (!speak) return;
    if (typeof window.jarvisSpeak === 'function') window.jarvisSpeak(text);
    else if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(text); u.rate=speechRate(); u.pitch=.54; u.lang='en-GB'; speechSynthesis.cancel(); speechSynthesis.speak(u); }
  };

  const loadContext = () => { try { const parsed=JSON.parse(sessionStorage.getItem(CONTEXT_KEY)||'[]'); return Array.isArray(parsed)?parsed.slice(-MAX_TURNS):[]; } catch { return []; } };
  let conversation = loadContext();
  const saveContext = () => { try { sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(conversation.slice(-MAX_TURNS))); } catch {} };
  const remember = (role,text) => { const value=String(text||'').trim(); if(!value)return; conversation.push({role,text:value,at:Date.now()}); conversation=conversation.slice(-MAX_TURNS); saveContext(); };
  const contextText = (turns=conversation.slice(-MAX_TURNS)) => {
    let text=turns.map(t=>`${t.role==='user'?'User':'JARVIS'}: ${String(t.text).slice(0,1100)}`).join('\n');
    if(text.length>MAX_CONTEXT_CHARS) text=text.slice(-MAX_CONTEXT_CHARS);
    return text;
  };
  const isFollowUp = q => /^(why|how|what about (it|that|this|them|those)|which one|which is (best|better)|and\s+(why|what|how)|tell me more|go on|continue|what do you mean|what about it)\s*[?.!]*$/i.test(q.trim());
  // Short natural-language replies are contextual when they answer a recent JARVIS question.
  // This is intentionally local and lightweight: no extra network call and no LLM classification.
  const isContextualFragment = q => {
    const s=String(q||'').trim();
    if(!s || !conversation.length || s.length>100 || /[?!]/.test(s)) return false;
    if(/^(?:search|look\s*up|lookup|find|google|bing|web\s+search)\b/i.test(s)) return false;
    if(/^(?:take me|go to|navigate|directions?|open maps?|play|open youtube|youtube)\b/i.test(s)) return false;
    const words=s.split(/\s+/).filter(Boolean).length;
    if(words>8) return false;
    const explicitFragment=/^(?:casual|formal|business|smart casual|summer|winter|spring|autumn|blue|red|green|black|white|the\s+(?:blue|red|green|black|white|first|second|third)|that one|this one|something\s+more|something\s+else|both|either|neither|yes|no|maybe|okay|ok|sure|i\s+(?:want|prefer|like)|make it|go with)\b/i.test(s);
    const last=conversation[conversation.length-1];
    const previousAssistant=conversation.slice().reverse().find(t=>t.role==='assistant');
    const recentQuestion=previousAssistant && /\?\s*$/.test(String(previousAssistant.text).trim());
    return explicitFragment || (recentQuestion && last?.role==='assistant');
  };
  const contextualQuery = query => {
    const context=contextText();
    if(!context) return query;
    if(isFollowUp(query) || isContextualFragment(query)) return `Continue the conversation. Answer the user's follow-up using the recent exchange as context. Treat the current message as a contextual answer or refinement when appropriate. Be concise and do not restate the conversation.\nRecent exchange:\n${context}\nFollow-up: ${query}`;
    return `Use the recent conversation only to resolve references such as “it”, “that”, “which one”, or “why”. Do not repeat the context unless needed.\nRecent conversation:\n${context}\nCurrent request:\n${query}`;
  };
  const clearContext=()=>{conversation=[];try{sessionStorage.removeItem(CONTEXT_KEY)}catch{}};

  const isLocalCommand=raw=>{const q=String(raw||'').trim().toLowerCase();return /\b(time|clock|date|today|weather|temperature|forecast|my name|who am i|joke|sing|maps?|directions?|navigate|navigate me|take me to|go to|open maps?|note|notes|remember|remind me|youtube|play|video|games?|snake|calculator|settings|files|sftp|api lab)\b/.test(q)};
  const isMathExpression=raw=>{const q=String(raw||'').trim().toLowerCase().replace(/[=?]+$/,'').trim();if(!q||q.length>80||!/[+\-*/%]/.test(q))return false;return /^[0-9\s()+\-*/%.]+$/.test(q)};
  const calculate=raw=>{const expression=String(raw||'').trim().replace(/[=?]+$/,'').trim();if(!/^[0-9\s()+\-*/%.]+$/.test(expression))return false;try{const value=Function(`"use strict"; return (${expression})`)();if(typeof value!=='number'||!Number.isFinite(value))return false;reply(`${expression} = ${value}`);return true}catch{return false}};
  const isExplicitWebSearch=raw=>/^(?:search|look\s*up|lookup|find|google|bing|web\s+search)\b/i.test(String(raw||'').trim());
  const isSimpleLookup=raw=>{const q=String(raw||'').trim();if(!q||q.length>80||/[?!]/.test(q)||isLocalCommand(q)||isExplicitWebSearch(q)||isMathExpression(q)||isContextualFragment(q))return false;if(/^(?:take me|go to|navigate|directions?|open maps?)\b/i.test(q))return false;if(!/^[\p{L}\p{N}][\p{L}\p{N} .,'&+\-()]{1,79}$/u.test(q))return false;if(q.split(/\s+/).length>6)return false;return !/^(tell|what|who|why|how|can|could|should|is|are|do|does|will|where|when|which)\b/i.test(q)};
  const isFreshWebQuery=raw=>/\b(latest|breaking|news|headlines|current events|recent|today's news|right now)\b/i.test(String(raw||''));
  const isWebSearchQuery=raw=>!isContextualFragment(raw)&&(isExplicitWebSearch(raw)||isSimpleLookup(raw)||isFreshWebQuery(raw));
  const isIntelligenceQuery=raw=>{const q=String(raw||'').trim().toLowerCase();if(!q||isLocalCommand(q)||isMathExpression(q))return false;if(isContextualFragment(q))return true;if(isWebSearchQuery(q))return true;return /\b(explain|summari[sz]e|compare|why|how|best|recommend|research|tell me about|what(?: is|['’]s| are| was| were)|who(?: is|['’]s)|analy[sz]e|which|should i|is it|can you|could you|do you|does)\b/.test(q)||q.length>55||/\?$/.test(q)};
  const localAnswer=query=>{if(/\btell me about (yourself|you)\b|\bwhat are you\b|\bwho are you\b/.test(query.toLowerCase())){const text='I am JARVIS, your personal intelligence workspace. The local core handles commands, voice, news, web search, maps and tools.';reply(text);remember('user',query);remember('assistant',text);return true}return false};
  const waitForWebSearch=(query,attempts=0)=>{const input=document.querySelector('#webQuery'),button=document.querySelector('#webSearch');if(input&&button){input.value=query;input.dispatchEvent(new Event('input',{bubbles:true}));button.click();return true}if(attempts>=80){reply(`I could not open the web search for “${query}”.`);return false}setTimeout(()=>waitForWebSearch(query,attempts+1),75);return true};
  const searchWeb=query=>{reply(`Searching the web for “${query}”…`,false);const nav=document.querySelector('[data-app="web"]');if(nav)nav.click();else if(!document.querySelector('#webQuery'))return reply('The web search module is unavailable right now.');waitForWebSearch(query);return true;};

  const ask=async query=>{
    query=String(query||'').trim();if(!query)return false;
    stopVoiceBeforeProcessing();
    if(localAnswer(query))return true;
    if(isMathExpression(query)){const ok=calculate(query);if(ok){remember('user',query);remember('assistant',document.querySelector('#jarvisReply')?.textContent||'')}return ok}
    if(isWebSearchQuery(query)){remember('user',query);return searchWeb(query.replace(/^(?:search|look\s*up|lookup|find|google|bing|web\s+search)\s+/i,'').trim())}
    if(STATIC_PAGES&&!REMOTE_ENDPOINT){reply('Remote intelligence is not connected to this deployment yet. The local JARVIS core is still online.');return false}
    const controller=new AbortController();const timeoutMs=isFollowUp(query)||isContextualFragment(query)?30000:20000;const timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      remember('user',query);reply('JARVIS intelligence is researching that…',false);
      const compactContext=conversation.slice(-MAX_TURNS).map(t=>({role:t.role,text:String(t.text).slice(0,1100)}));
      const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({query:contextualQuery(query),context:compactContext}),signal:controller.signal,cache:'no-store'});
      const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data?.error||`Gateway HTTP ${r.status}`);if(!data?.text)throw new Error('No intelligence response');
      reply(data.text);remember('assistant',data.text);window.dispatchEvent(new CustomEvent('jarvis:intelligence-result',{detail:{...data,conversation:conversation.slice(-MAX_TURNS)}}));return true;
    }catch(error){
      conversation=conversation.filter(t=>!(t.role==='user'&&t.text===query));saveContext();
      const message=error?.name==='AbortError'?(isFollowUp(query)||isContextualFragment(query)?'The follow-up took too long to return.':'The intelligence gateway timed out.'):String(error?.message||error);
      reply(`Intelligence gateway unavailable: ${message}`);window.dispatchEvent(new CustomEvent('jarvis:intelligence-error',{detail:{error:message,query}}));return false;
    }finally{clearTimeout(timer)}
  };

  document.addEventListener('jarvis:intelligence-query',event=>{const query=String(event.detail?.query||'').trim();if(query)void ask(query)});
  const intercept=event=>{const form=event.target?.closest?.('#commandForm');if(!form)return;const input=form.querySelector('#commandInput');const query=input?.value?.trim()||'';if(!isIntelligenceQuery(query)&&!isMathExpression(query))return;event.preventDefault();event.stopImmediatePropagation();void ask(query)};
  document.addEventListener('submit',intercept,true);
  window.addEventListener('jarvis:voice-command',event=>{const query=String(event.detail?.text||'').trim();if(!isIntelligenceQuery(query)&&!isMathExpression(query))return;event.preventDefault();stopVoiceBeforeProcessing();void ask(query)});
  window.jarvisIntelligence={ask,available:()=>Boolean(REMOTE_ENDPOINT||SEARCH_ENDPOINT)||!STATIC_PAGES,endpoint:ENDPOINT,getConversation:()=>conversation.slice(-MAX_TURNS),clearConversation:clearContext};
})();
