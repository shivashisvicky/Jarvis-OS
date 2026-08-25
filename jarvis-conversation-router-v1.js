(()=>{
'use strict';
if(window.__JARVIS_CONVERSATION_ROUTER_V1__)return;
window.__JARVIS_CONVERSATION_ROUTER_V1__=true;

const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
const lower=s=>normalize(s).toLowerCase().replace(/[.!?]+$/,'').trim();
let lastUserText='';
let lastTopic=null;
let lastAt=0;

const explicitCommand=q=>{
 const s=lower(q);
 if(!s)return false;
 return /\b(?:search|look up|find|browse|google|bing|play|open|show me|take me|navigate|go to|directions|map|calculate|what time|what's the time|weather|news|tell me|give me|read|book|books|restaurant|restaurants|hotel|hospital|youtube|video|music|game|games)\b/i.test(s)
   ||/\b(?:how|what|where|when|who|why)\b/i.test(s)&&/[?]|\b(?:is|are|was|were|can|could|would|does|do)\b/i.test(s);
};

const joke=q=>/\b(?:tell|give|make)\s+me\s+(?:a\s+)?joke\b/i.test(q)||/\bmake\s+me\s+laugh\b/i.test(q);
const ack=q=>/^(?:nice|good|great|awesome|cool|perfect|brilliant)(?:\s+one)?$|^(?:that|that was)\s+(?:funny|good|great|awesome|perfect)$|^(?:haha+|lol+|lmao+)$|^i\s+(?:like|liked)\s+(?:that|it)$|^(?:thanks|thank you|thx)$|^(?:that was|you are)\s+(?:good|great|funny)$/i.test(q);
const cancel=q=>/^(?:cancel|never mind|nevermind|forget it|stop|that's enough|thats enough)$/.test(q);
const repeat=q=>/^(?:say that again|repeat that|repeat|say it again)$/.test(q);
const continuation=q=>/^(?:show me )?(?:more|next|the next one|another one|different one|a different one|more like that)$/.test(q);

const speak=text=>{
 const clean=normalize(text); if(!clean)return;
 const el=document.querySelector('#jarvisReply'); if(el){el.textContent=clean;el.classList.add('visible')}
 window.setTimeout(()=>{try{
   if(typeof window.jarvisCinematicSpeak==='function'){window.jarvisCinematicSpeak(clean);return}
   if(typeof window.jarvisVoiceAuthoritySpeak==='function'){window.jarvisVoiceAuthoritySpeak(clean);return}
   window.jarvisSpeak?.(clean);
 }catch{}},80);
};
const stop=()=>{try{window.jarvisStopAllVoiceSessions?.()}catch{}try{window.jarvisStopIOSVoice?.()}catch{}try{window.jarvisStopVoiceRecognitionOnly?.()}catch{}};

const contextualTopic=()=>{
 if(Date.now()-lastAt>120000)return null;
 return lastTopic;
};

const handleVoice=e=>{
 const raw=normalize(e.detail?.text); if(!raw)return;
 const q=lower(raw);
 const topic=contextualTopic();

 // Never interfere with a clearly new command. Search remains a fallback only
 // for utterances that are not conversational and not owned by another authority.
 if(explicitCommand(q)){
   lastUserText=raw; lastTopic=joke(q)?'joke':null; lastAt=Date.now(); return;
 }

 if(topic==='joke'&&ack(q)){
   e.preventDefault?.(); e.stopImmediatePropagation?.();
   stop(); speak('Glad you liked it.');
   lastUserText=raw; lastTopic='joke'; lastAt=Date.now(); return;
 }
 if(cancel(q)){
   e.preventDefault?.(); e.stopImmediatePropagation?.();
   stop(); speak('Okay.');
   lastUserText=raw; lastTopic=null; lastAt=Date.now(); return;
 }
 if(topic&&repeat(q)){
   e.preventDefault?.(); e.stopImmediatePropagation?.();
   stop(); speak('I can repeat that.');
   lastUserText=raw; lastAt=Date.now(); return;
 }

 // Do not consume generic continuation phrases here. Feature authorities such
 // as the joke/search/results handlers get first ownership. This router exists
 // primarily to stop harmless conversational acknowledgements from falling
 // through to Search Hub.
 if(topic&&continuation(q)){
   lastUserText=raw; lastAt=Date.now(); return;
 }

 lastUserText=raw;
 lastTopic=joke(q)?'joke':null;
 lastAt=Date.now();
};

window.addEventListener('jarvis:voice-command',handleVoice,true);
document.addEventListener('submit',e=>{
 const form=e.target;if(!(form instanceof HTMLFormElement)||form.id!=='commandForm')return;
 const input=form.querySelector('#commandInput');const raw=input instanceof HTMLInputElement?normalize(input.value):'';if(!raw)return;
 const q=lower(raw);const topic=contextualTopic();
 if(explicitCommand(q)){lastUserText=raw;lastTopic=joke(q)?'joke':null;lastAt=Date.now();return}
 if(topic==='joke'&&ack(q)){e.preventDefault();e.stopImmediatePropagation();stop();speak('Glad you liked it.');if(input instanceof HTMLInputElement)input.value='';lastUserText=raw;lastTopic='joke';lastAt=Date.now()}
},true);
})();
