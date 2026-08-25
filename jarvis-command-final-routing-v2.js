(()=>{
'use strict';
if(window.__JARVIS_COMMAND_FINAL_ROUTING_V7__)return;
window.__JARVIS_COMMAND_FINAL_ROUTING_V7__=true;

const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
const isPoi=/\b(?:show\s+me|show|find|locate|where\s+are|look\s+for)\b[\s\S]*\b(?:restaurants?|resturants?|restaraunts?|restaurents?|restuarants?|resturents?|caf(?:e|es)|hospitals?|pharmacies?|hotels?|schools?|banks?|atms?|petrol(?:\s+stations?)?|fuel|gyms?|supermarkets?|temples?)\b[\s\S]*\b(?:in|near|around|at|to)\b/i;
const isChoice=/^\s*(?:pick|choose|select)\s+(?:one\s+)?(?:red|blue|green|yellow|black|white)\s*(?:or|\/|versus|vs\.?|and)\s+(?:red|blue|green|yellow|black|white)\s*[.!?]*$/i;
const isWhyChoice=/^\s*(?:why|why did you choose|why did you pick)\s+(red|blue|green|yellow|black|white)\s*[.!?]*$/i;
let lastChoice=null;
const extract=s=>{
 let q=normalize(s).replace(/^\s*(?:please\s+)?(?:show\s+me|show|find|locate|where\s+are|look\s+for)\s+/i,'').trim();
 q=q.replace(/\bresturants?\b/ig,'restaurants').replace(/\brestaraunts?\b/ig,'restaurants').replace(/\brestaurents?\b/ig,'restaurants').replace(/\brestuarants?\b/ig,'restaurants').replace(/\bresturents?\b/ig,'restaurants');
 if(/\b(?:restaurants?|caf(?:e|es)|hospitals?|pharmacies?|hotels?|schools?|banks?|atms?|petrol(?:\s+stations?)?|fuel|gyms?|supermarkets?|temples?)\b[\s\S]*\bto\b/i.test(q))q=q.replace(/\bto\b/i,'in');
 return q;
};
const stopVoice=()=>{try{window.jarvisStopIOSVoice?.()}catch{}try{window.jarvisStopSpeaking?.()}catch{}try{window.dispatchEvent(new Event('jarvis:force-stop-voice'))}catch{}};
const speakReply=text=>{const reply=document.querySelector('#jarvisReply');if(reply){reply.textContent=text;reply.classList.add('visible')}try{window.jarvisSpeak?.(text)}catch{}};
const chooseFrom=text=>{const colors=normalize(text).match(/\b(red|blue|green|yellow|black|white)\b/gi)||[];if(colors.length<2)return null;const unique=[...new Set(colors.map(x=>x.toLowerCase()))];if(unique.length<2)return null;return unique[0]==='red'&&unique[1]==='blue'?'blue':unique[Math.floor(Math.random()*unique.length)]};
const handleChoice=raw=>{
 const text=normalize(raw);
 if(isChoice.test(text)){
   const picked=chooseFrom(text)||'blue';
   lastChoice=picked;
   stopVoice();
   speakReply(`I choose ${picked}.`);
   return true;
 }
 if(isWhyChoice.test(text)){
   const asked=text.match(isWhyChoice)?.[1]?.toLowerCase()||'';
   if(lastChoice){
     stopVoice();
     speakReply(`I chose ${lastChoice}. There is no special reason, I simply picked it this time.`);
     return true;
   }
   if(asked){
     stopVoice();
     speakReply(`Because ${asked} was my pick. I can choose differently next time.`);
     return true;
   }
 }
 return false;
};
const openJarvisMaps=query=>{
 stopVoice();
 const nav=document.querySelector('.nav[data-app="maps"]');
 if(nav instanceof HTMLElement&&!nav.classList.contains('selected'))nav.click();
 const dispatch=()=>{try{window.dispatchEvent(new CustomEvent('jarvis:map-intent',{detail:{place:query,query,source:'poi-command'},cancelable:true}))}catch{}};
 let attempts=0;
 const wait=()=>{if(document.querySelector('#mapQuery')){dispatch();return}if(++attempts<80)window.setTimeout(wait,25)};
 window.setTimeout(wait,0);
};
const ttsGuardActive=()=>{
 const until=Number(window.__JARVIS_VOICE_TTS_GUARD_UNTIL__||0);
 const speaking=typeof speechSynthesis!=='undefined'&&speechSynthesis.speaking;
 return Boolean(window.__JARVIS_VOICE_TTS_GUARD_ACTIVE__)&&(speaking||Date.now()<until);
};
const interceptSubmit=e=>{const form=e.target;if(!(form instanceof HTMLFormElement)||form.id!=='commandForm')return;const input=form.querySelector('#commandInput');const raw=input instanceof HTMLInputElement?normalize(input.value):'';if(!raw)return;if(handleChoice(raw)){e.preventDefault();e.stopImmediatePropagation();return}if(!isPoi.test(raw))return;e.preventDefault();e.stopImmediatePropagation();openJarvisMaps(extract(raw))};
const interceptVoice=e=>{
 const raw=normalize(e.detail?.text);
 if(!raw)return;
 // A final recognition result can arrive on iOS after stop() and during the
 // JARVIS TTS tail. It is not a new user command and must never reach routing.
 if(ttsGuardActive()){
   e.preventDefault();
   e.stopImmediatePropagation();
   stopVoice();
   return;
 }
 if(handleChoice(raw)){e.preventDefault();e.stopImmediatePropagation();return}
 if(!isPoi.test(raw))return;e.preventDefault();e.stopImmediatePropagation();openJarvisMaps(extract(raw))
};
document.addEventListener('submit',interceptSubmit,true);window.addEventListener('jarvis:voice-command',interceptVoice,true);
})();