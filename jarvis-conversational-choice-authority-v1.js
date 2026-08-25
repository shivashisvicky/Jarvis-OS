(()=>{
'use strict';
if(window.__JARVIS_CONVERSATIONAL_CHOICE_AUTHORITY_V7__)return;
window.__JARVIS_CONVERSATIONAL_CHOICE_AUTHORITY_V7__=true;
const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
const cleanOption=s=>normalize(s).replace(/^["'“”‘’]+|["'“”‘’]+$/g,'').replace(/[.!?]+$/,'').trim();
const jokes=[
 'Why did the developer go broke? Because they used up all their cache.',
 'I told my computer I needed a break. It said, “I will go to sleep.”',
 'There are only 10 kinds of people: those who understand binary and those who do not.'
];
let lastChoice=null;
let lastTopic=null;
let lastJokeIndex=-1;
const parseChoice=text=>{
 const q=normalize(text).replace(/[.!?]+$/,'').trim();
 let m=q.match(/^\s*(?:please\s+)?(?:pick|choose|select)\s+(?:one\s+|between\s+)?(.+?)\s+(?:or|versus|vs\.?|\/)\s+(.+)$/i);
 if(!m)m=q.match(/^\s*(?:which|what)\s+(?:should|would)\s+i\s+(?:pick|choose|select)\s+(.+?)\s+(?:or|versus|vs\.?|\/)\s+(.+)$/i);
 if(!m)m=q.match(/^\s*([^,]{1,48}?)\s+(?:or|versus|vs\.?|\/)\s+([^,]{1,48})\s*$/i);
 if(!m)return null;
 const a=cleanOption(m[1]),b=cleanOption(m[2]);
 if(!a||!b||a.length>80||b.length>80)return null;
 if(/^(search|look up|find|show me|where|what|how|why)\b/i.test(q)||/[?]/.test(q))return null;
 return {a,b};
};
const releaseRecognitionOnly=()=>{
 try{window.jarvisStopAllVoiceSessions?.()}catch{}
 try{window.jarvisStopIOSVoice?.()}catch{}
 try{window.jarvisStopVoiceRecognitionOnly?.()}catch{}
};
const isJokeRequest=q=>/\b(?:tell|give|make)\s+me\s+(?:a\s+)?joke\b/i.test(q)||/\bmake\s+me\s+laugh\b/i.test(q);
const isDifferentFollowup=q=>/^(?:please\s+)?(?:tell|give|show)\s+me\s+(?:a\s+)?(?:different|another)\s+(?:one|joke)\s*$/i.test(q)||/^(?:a\s+)?(?:different|another)\s+(?:one|joke)\s*$/i.test(q);
const rememberLastJoke=()=>{
 const text=normalize(document.querySelector('#jarvisReply')?.textContent||'');
 lastJokeIndex=jokes.findIndex(j=>normalize(j)===text);
};
const submitNormalJoke=(previousIndex)=>{
 const input=document.querySelector('#commandInput');
 const form=document.querySelector('#commandForm');
 if(!(input instanceof HTMLInputElement)||!(form instanceof HTMLFormElement))return false;
 input.value='Tell me a joke';
 input.dispatchEvent(new Event('input',{bubbles:true}));
 // Let the original SpeechRecognition result handler finish and stop the mic
 // before re-entering the real Command Center execution path. This avoids
 // overlapping recognition and TTS, and preserves the normal voice profile.
 window.setTimeout(()=>{
   const originalRandom=Math.random;
   Math.random=()=>{
     const choices=jokes.map((_,i)=>i).filter(i=>i!==previousIndex);
     const selected=choices.length?choices[0]:0;
     return (selected+0.01)/jokes.length;
   };
   try{form.requestSubmit()}finally{Math.random=originalRandom}
 },0);
 return true;
};
const handle=raw=>{
 const q=normalize(raw);if(!q)return false;
 if(isDifferentFollowup(q)&&lastTopic==='joke'){
   rememberLastJoke();
   const previousIndex=lastJokeIndex;
   releaseRecognitionOnly();
   return submitNormalJoke(previousIndex);
 }
 const options=parseChoice(q);
 if(options){
   const picked=Math.random()<0.5?options.a:options.b;
   lastChoice={picked,other:picked===options.a?options.b:options.a};
   lastTopic=null;
   releaseRecognitionOnly();
   return false;
 }
 const why=q.match(/^\s*(?:why|why did you choose|why did you pick)\s+(.+?)[.!?]*$/i);
 if(why&&lastChoice)return false;
 return false;
};
const observeTopic=raw=>{
 const q=normalize(raw).toLowerCase();
 if(isJokeRequest(q)){lastTopic='joke';return;}
 if(!isDifferentFollowup(q)&&!/^\s*(?:please\s+)?(?:pick|choose|select)\b/i.test(q))lastTopic=null;
};

// Capture phase records the first joke request before another voice router can
// consume it. On the follow-up we stop the original event and re-enter through
// the real Command Center form, rather than creating a second speech pipeline.
const voiceCapture=e=>{
 const raw=e.detail?.text||'';
 if(handle(raw)){
   e.preventDefault?.();
   e.stopImmediatePropagation?.();
   return;
 }
 observeTopic(raw);
};
const submitCapture=e=>{
 const form=e.target;
 if(!(form instanceof HTMLFormElement)||form.id!=='commandForm')return;
 const input=form.querySelector('#commandInput');
 const raw=input instanceof HTMLInputElement?input.value:'';
 if(handle(raw)){
   e.preventDefault();
   e.stopImmediatePropagation();
   return;
 }
 observeTopic(raw);
};
document.addEventListener('submit',submitCapture,true);
window.addEventListener('jarvis:voice-command',voiceCapture,true);
})();
