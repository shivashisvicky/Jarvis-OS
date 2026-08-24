(()=>{
'use strict';
if(window.__JARVIS_COMMAND_CHOICE_VOICE_V2__)return;
window.__JARVIS_COMMAND_CHOICE_VOICE_V2__=true;

// Choice intent is conversational. Do not hard-stop the response voice after
// recognition: on iOS the hard-stop authority arms a release window and can
// cancel the very speech response we are about to start.
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
const cancelCurrentSpeech=()=>{try{window.speechSynthesis?.cancel()}catch{}};
const reply=text=>{
 const el=document.querySelector('#jarvisReply');
 if(el){el.textContent=text;el.classList.add('visible')}
 // Let the iOS voice authority speak normally. Recognition has already ended;
 // do not invoke jarvisStopIOSVoice/jarvisForceStopVoice here.
 try{window.jarvisMarkSpokenResponse?.(text)}catch{}
 try{if(typeof window.jarvisSpeak==='function')window.jarvisSpeak(text);else if(typeof window.jarvisCinematicSpeak==='function')window.jarvisCinematicSpeak(text)}catch{}
};
const choose=({a,b})=>Math.random()<0.5?a:b;
const handle=raw=>{
 const q=normalize(raw); if(!q)return false;
 const options=parseChoice(q);
 if(options){
   cancelCurrentSpeech();
   const picked=choose(options);
   lastChoice={picked,other:picked===options.a?options.b:options.a};
   reply(`I choose ${picked}.`);
   return true;
 }
 const why=q.match(/^\s*(?:why|why did you choose|why did you pick)\s+(.+?)[.!?]*$/i);
 if(why&&lastChoice){
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
