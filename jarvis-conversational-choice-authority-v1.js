(()=>{
'use strict';
if(window.__JARVIS_CONVERSATIONAL_CHOICE_AUTHORITY_V5__)return;
window.__JARVIS_CONVERSATIONAL_CHOICE_AUTHORITY_V5__=true;
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
const speakReply=text=>{
 window.setTimeout(()=>{
   try{window.jarvisMarkSpokenResponse?.(text)}catch{}
   try{(window.jarvisVoiceAuthoritySpeak||window.jarvisCinematicSpeak||window.jarvisSpeak)?.(text)}catch{}
 },140);
};
const reply=text=>{
 const el=document.querySelector('#jarvisReply');
 if(el){el.textContent=text;el.classList.add('visible')}
 speakReply(text);
};
const choose=({a,b})=>Math.random()<0.5?a:b;
const differentJoke=()=>{
 let i=Math.floor(Math.random()*jokes.length);
 if(jokes.length>1&&i===lastJokeIndex)i=(i+1)%jokes.length;
 lastJokeIndex=i;
 return jokes[i];
};
const isJokeRequest=q=>/\b(?:tell|give|make)\s+me\s+(?:a\s+)?joke\b/i.test(q)||/\bmake\s+me\s+laugh\b/i.test(q);
const isDifferentFollowup=q=>/^(?:please\s+)?(?:tell|give|show)\s+me\s+(?:a\s+)?(?:different|another)\s+(?:one|joke)\s*$/i.test(q)||/^(?:a\s+)?(?:different|another)\s+(?:one|joke)\s*$/i.test(q);
const handle=raw=>{
 const q=normalize(raw);if(!q)return false;
 if(isDifferentFollowup(q)&&lastTopic==='joke'){
   releaseRecognitionOnly();
   const joke=differentJoke();
   lastTopic='joke';
   reply(joke);
   return true;
 }
 const options=parseChoice(q);
 if(options){
   const picked=choose(options);
   lastChoice={picked,other:picked===options.a?options.b:options.a};
   lastTopic=null;
   releaseRecognitionOnly();
   reply(`I choose ${picked}.`);
   return true;
 }
 const why=q.match(/^\s*(?:why|why did you choose|why did you pick)\s+(.+?)[.!?]*$/i);
 if(why&&lastChoice){releaseRecognitionOnly();reply(`I chose ${lastChoice.picked}. There is no special reason, I simply picked it this time.`);return true}
 return false;
};
const observeTopic=raw=>{
 const q=normalize(raw).toLowerCase();
 if(isJokeRequest(q)){lastTopic='joke';return;}
 if(!isDifferentFollowup(q)&&!/^\s*(?:please\s+)?(?:pick|choose|select)\b/i.test(q))lastTopic=null;
};

// Capture phase is required because another voice router can stop propagation
// before a bubble listener sees the command. Record the first joke request at
// capture time, and intercept its conversational follow-up before web routing.
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
