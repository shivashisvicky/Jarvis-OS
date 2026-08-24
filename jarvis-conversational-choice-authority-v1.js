(()=>{
'use strict';
if(window.__JARVIS_CONVERSATIONAL_CHOICE_AUTHORITY_V3__)return;
window.__JARVIS_CONVERSATIONAL_CHOICE_AUTHORITY_V3__=true;
const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
const cleanOption=s=>normalize(s).replace(/^["'“”‘’]+|["'“”‘’]+$/g,'').replace(/[.!?]+$/,'').trim();
const parseChoice=text=>{
 const q=normalize(text).replace(/[.!?]+$/,'').trim();
 let m=q.match(/^\s*(?:please\s+)?(?:pick|choose|select)\s+(?:one\s+|between\s+)?(.+?)\s+(?:or|versus|vs\.?|\/)\s+(.+)$/i);
 if(!m)m=q.match(/^\s*(?:which|what)\s+(?:should|would)\s+i\s+(?:pick|choose|select)\s+(.+?)\s+(?:or|versus|vs\.?|\/)\s+(.+)$/i);
 // Natural follow-up: "black or blue" must remain conversational instead
 // of falling through to the generic web-search router.
 if(!m)m=q.match(/^\s*([^,]{1,48}?)\s+(?:or|versus|vs\.?|\/)\s+([^,]{1,48})\s*$/i);
 if(!m)return null;
 const a=cleanOption(m[1]),b=cleanOption(m[2]);
 if(!a||!b||a.length>80||b.length>80)return null;
 if(/^(search|look up|find|show me|where|what|how|why)\b/i.test(q)||/[?]/.test(q))return null;
 return {a,b};
};
let lastChoice=null;
const releaseRecognitionOnly=()=>{
 try{window.jarvisStopAllVoiceSessions?.()}catch{}
 try{window.jarvisStopIOSVoice?.()}catch{}
 try{window.jarvisStopVoiceRecognitionOnly?.()}catch{}
};
const speakReply=text=>{
 // Safari/iOS can drop an utterance if recognition is still winding down.
 // Release recognition first, then start speech on the next task turn.
 window.setTimeout(()=>{
   try{window.jarvisMarkSpokenResponse?.(text)}catch{}
   try{
     const speak=window.jarvisVoiceAuthoritySpeak||window.jarvisCinematicSpeak||window.jarvisSpeak;
     if(typeof speak==='function')speak(text);
   }catch{}
 },140);
};
const reply=text=>{
 const el=document.querySelector('#jarvisReply');
 if(el){el.textContent=text;el.classList.add('visible')}
 speakReply(text);
};
const choose=({a,b})=>Math.random()<0.5?a:b;
const handle=raw=>{
 const q=normalize(raw);if(!q)return false;
 const options=parseChoice(q);
 if(options){
   const picked=choose(options);
   lastChoice={picked,other:picked===options.a?options.b:options.a};
   releaseRecognitionOnly();
   reply(`I choose ${picked}.`);
   return true;
 }
 const why=q.match(/^\s*(?:why|why did you choose|why did you pick)\s+(.+?)[.!?]*$/i);
 if(why&&lastChoice){releaseRecognitionOnly();reply(`I chose ${lastChoice.picked}. There is no special reason, I simply picked it this time.`);return true}
 return false;
};
const submit=e=>{const form=e.target;if(!(form instanceof HTMLFormElement)||form.id!=='commandForm')return;const input=form.querySelector('#commandInput');const raw=input instanceof HTMLInputElement?input.value:'';if(handle(raw)){e.preventDefault();e.stopImmediatePropagation()}};
const voice=e=>{if(handle(e.detail?.text)){e.preventDefault?.();e.stopImmediatePropagation?.()}};
document.addEventListener('submit',submit,true);
window.addEventListener('jarvis:voice-command',voice,true);
})();
