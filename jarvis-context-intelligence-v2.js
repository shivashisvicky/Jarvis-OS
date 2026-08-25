(()=>{
'use strict';
if(window.__JARVIS_CONTEXT_INTELLIGENCE_V2__)return;
window.__JARVIS_CONTEXT_INTELLIGENCE_V2__=true;

const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
const lower=s=>normalize(s).toLowerCase().replace(/[.!?]+$/,'').trim();
const now=()=>Date.now();
const TTL=5*60*1000;
const state={intent:null,topic:null,query:null,entity:null,results:null,selected:null,pending:null,lastUserText:null,lastAssistantText:null,updatedAt:0};

const patterns={
 ack:/^(?:nice|good|great|awesome|cool|perfect|brilliant)(?:\s+one)?$|^(?:that|that was)\s+(?:funny|good|great|awesome|perfect)$|^(?:haha+|lol+|lmao+)$|^i\s+(?:like|liked)\s+(?:that|it)$|^(?:thanks|thank you|thx)$/i,
 cancel:/^(?:cancel|never mind|nevermind|forget it|stop|that's enough|thats enough)$/i,
 repeat:/^(?:say that again|repeat that|repeat|say it again)$/i,
 continue:/^(?:show me )?(?:more|next|the next one|another one|different one|a different one|more like that)$/i,
 confirm:/^(?:yes|yeah|yep|yup|sure|do it|go ahead|okay|ok|please do)$/i,
 reject:/^(?:no|nope|not that|not this one)$/i,
 correction:/^(?:no,?\s+)?(?:i meant|i mean|i said|what i meant was)\s+(.+)$/i,
 select:/^(?:the\s+)?(?:first|second|third|fourth|fifth|last|one before that)\s*(?:one)?$/i,
 explain:/^(?:why|how come|what do you mean|tell me more|explain that)$/i
};
const explicit=q=>/\b(?:search|look up|find|browse|google|bing|play|open|show me|take me|navigate|go to|directions|map|calculate|what time|weather|news|read|book|books|restaurant|restaurants|hotel|hospital|youtube|video|music|game|games)\b/i.test(q);
const joke=q=>/\b(?:tell|give|make)\s+me\s+(?:a\s+)?joke\b/i.test(q)||/\bmake\s+me\s+laugh\b/i.test(q);
const valid=()=>state.updatedAt&&now()-state.updatedAt<TTL;
const classify=q=>{
 if(patterns.ack.test(q))return 'ACK';
 if(patterns.cancel.test(q))return 'CANCEL';
 if(patterns.repeat.test(q))return 'REPEAT';
 if(patterns.confirm.test(q))return 'CONFIRM';
 if(patterns.reject.test(q))return 'REJECT';
 if(patterns.correction.test(q))return 'CORRECT';
 if(patterns.select.test(q))return 'SELECT';
 if(patterns.continue.test(q))return 'CONTINUE';
 if(patterns.explain.test(q))return 'EXPLAIN';
 if(explicit(q))return 'NEW_COMMAND';
 return 'UNKNOWN';
};
const publish=(type,text,extra={})=>{
 try{window.dispatchEvent(new CustomEvent('jarvis:conversation-intent',{detail:{type,text,context:{...state},...extra}}))}catch{}
};
const remember=(raw,classification)=>{
 state.lastUserText=raw; state.updatedAt=now();
 if(joke(raw)){state.intent='JOKE';state.topic='joke';state.query=raw;state.pending=null;}
 else if(classification==='NEW_COMMAND'){state.intent='COMMAND';state.topic=null;state.query=raw;state.pending=null;}
};
const clear=()=>{state.intent=null;state.topic=null;state.query=null;state.entity=null;state.results=null;state.selected=null;state.pending=null;state.updatedAt=now()};
const handle=e=>{
 const raw=normalize(e.detail?.text);if(!raw)return;
 const q=lower(raw);const type=classify(q);const inContext=valid();
 // Explicit commands always win. This prevents the context layer from
 // swallowing real Search/Maps/Books/YouTube/Weather commands.
 if(type==='NEW_COMMAND'){remember(raw,type);publish(type,raw);return;}
 if(!inContext){
   if(type==='UNKNOWN'||type==='CONTINUE'||type==='SELECT'||type==='EXPLAIN'||type==='CONFIRM'||type==='REJECT'||type==='CORRECT')publish('AMBIGUOUS',raw,{reason:'no_recent_context'});
   remember(raw,type);return;
 }
 if(type==='ACK'&&state.topic==='joke'){
   e.preventDefault?.();e.stopImmediatePropagation?.();
   try{window.jarvisStopAllVoiceSessions?.()}catch{}
   publish('ACK',raw); state.lastAssistantText='Glad you liked it.'; return;
 }
 if(type==='CANCEL'){
   e.preventDefault?.();e.stopImmediatePropagation?.();
   try{window.jarvisStopAllVoiceSessions?.()}catch{}
   publish('CANCEL',raw); clear(); return;
 }
 // Follow-up intent is published, never executed here. Domain authorities can
 // consume it using their existing production pipelines and voice authority.
 if(['CONTINUE','REPEAT','CONFIRM','REJECT','CORRECT','SELECT','EXPLAIN'].includes(type)){
   publish(type,raw);
   state.pending=type;
   state.updatedAt=now();
   return;
 }
 remember(raw,type);
};

window.addEventListener('jarvis:voice-command',handle,true);
document.addEventListener('submit',e=>{
 const form=e.target;if(!(form instanceof HTMLFormElement)||form.id!=='commandForm')return;
 const input=form.querySelector('#commandInput');const raw=input instanceof HTMLInputElement?normalize(input.value):'';if(!raw)return;
 const fake={detail:{text:raw},preventDefault:()=>e.preventDefault(),stopImmediatePropagation:()=>e.stopImmediatePropagation()};handle(fake);
},true);
window.jarvisContextIntelligence={
 get:()=>({...state,active:valid()}),
 set:(patch={})=>{Object.assign(state,patch,{updatedAt:now()});},
 clear,
 classify
};
})();
