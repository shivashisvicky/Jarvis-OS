(()=>{
'use strict';
if(window.__JARVIS_CONVERSATIONAL_CHOICE_AUTHORITY_V1__)return;
window.__JARVIS_CONVERSATIONAL_CHOICE_AUTHORITY_V1__=true;

// Conversational intent must beat the web-search fallback. This deliberately
// does not know about colours, foods, brands, etc. The two options are data.
const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
const cleanOption=s=>normalize(s).replace(/^["'“”‘’]+|["'“”‘’]+$/g,'').trim();
const parseChoice=text=>{
 const q=normalize(text).replace(/[.!?]+$/,'').trim();
 let m=q.match(/^\s*(?:please\s+)?(?:pick|choose|select)\s+(?:one\s+|between\s+)?(.+?)\s+(?:or|versus|vs\.?|\/|and)\s+(.+)$/i);
 if(!m)m=q.match(/^\s*(?:which|what)\s+(?:should|would)\s+i\s+(?:pick|choose|select)\s+(.+?)\s+(?:or|versus|vs\.?|\/|and)\s+(.+)$/i);
 if(!m)return null;
 const a=cleanOption(m[1]),b=cleanOption(m[2]);
 if(!a||!b||a.length>80||b.length>80)return null;
 return {a,b};
};
let lastChoice=null;
const stopVoice=()=>{try{window.jarvisStopIOSVoice?.()}catch{}try{window.jarvisStopSpeaking?.()}catch{}try{window.dispatchEvent(new Event('jarvis:force-stop-voice'))}catch{}};
const reply=text=>{
 const el=document.querySelector('#jarvisReply');
 if(el){el.textContent=text;el.classList.add('visible')}
 try{window.jarvisSpeak?.(text)}catch{}
};
const choose=({a,b})=>Math.random()<0.5?a:b;
const handle=raw=>{
 const q=normalize(raw);
 if(!q)return false;
 const options=parseChoice(q);
 if(options){
   const picked=choose(options);
   lastChoice={picked,other:picked===options.a?options.b:options.a};
   stopVoice();
   reply(`I choose ${picked}.`);
   return true;
 }
 const why=q.match(/^\s*(?:why|why did you choose|why did you pick)\s+(.+?)[.!?]*$/i);
 if(why&&lastChoice){
   stopVoice();
   reply(`I chose ${lastChoice.picked}. There is no special reason, I simply picked it this time.`);
   return true;
 }
 return false;
};
const submit=e=>{
 const form=e.target;
 if(!(form instanceof HTMLFormElement)||form.id!=='commandForm')return;
 const input=form.querySelector('#commandInput');
 const raw=input instanceof HTMLInputElement?input.value:'';
 if(handle(raw)){e.preventDefault();e.stopImmediatePropagation()}
};
const voice=e=>{if(handle(e.detail?.text)){e.preventDefault?.();e.stopImmediatePropagation?.()}};
document.addEventListener('submit',submit,true);
window.addEventListener('jarvis:voice-command',voice,true);
})();
