(()=>{
'use strict';
if(window.__JARVIS_CONVERSATIONAL_CHOICE_AUTHORITY_V9__)return;
window.__JARVIS_CONVERSATIONAL_CHOICE_AUTHORITY_V9__=true;
const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
const jokes=[
 'Why did the developer go broke? Because they used up all their cache.',
 'I told my computer I needed a break. It said, “I will go to sleep.”',
 'There are only 10 kinds of people: those who understand binary and those who do not.'
];
let lastJokeIndex=-1;
let lastTopic=null;
const isDifferentFollowup=q=>/^(?:please\s+)?(?:tell|give|show)\s+me\s+(?:a\s+)?(?:different|another)\s+(?:one|joke)\s*$/i.test(q)||/^(?:a\s+)?(?:different|another)\s+(?:one|joke)\s*$/i.test(q);
const isJokeRequest=q=>/\b(?:tell|give|make)\s+me\s+(?:a\s+)?joke\b/i.test(q)||/\bmake\s+me\s+laugh\b/i.test(q);
const isJokeAcknowledgement=q=>/^(?:nice|good|great|funny)(?:\s+one)?$|^(?:that|that was)\s+(?:funny|a good one|a great one)$|^(?:haha+|lol+)$|^i\s+(?:like|liked)\s+(?:that|it)$/i.test(q);
const rememberLastJoke=()=>{
 const text=normalize(document.querySelector('#jarvisReply')?.textContent||'');
 const i=jokes.findIndex(j=>normalize(j)===text);
 if(i>=0)lastJokeIndex=i;
};
const stopRecognition=()=>{
 try{window.jarvisStopAllVoiceSessions?.()}catch{}
 try{window.jarvisStopIOSVoice?.()}catch{}
 try{window.jarvisStopVoiceRecognitionOnly?.()}catch{}
 try{window.jarvisStopVoice?.()}catch{}
};
const speakWithProductionVoice=text=>{
 const clean=normalize(text);if(!clean)return;
 const reply=document.querySelector('#jarvisReply');
 if(reply){reply.textContent=clean;reply.classList.add('visible')}
 try{
   if(typeof window.jarvisCinematicSpeak==='function'){
     window.jarvisCinematicSpeak(clean);
     return;
   }
 }catch{}
 try{
   if(!('speechSynthesis'in window))return;
   window.speechSynthesis.cancel();
   const voices=window.speechSynthesis.getVoices();
   const preferred=['Daniel','Arthur','George','Oliver','James','Alex','Fred','Thomas'];
   const voice=voices.find(v=>preferred.some(n=>v.name.toLowerCase().includes(n.toLowerCase()))&&/^en-GB/i.test(v.lang))
     ||voices.find(v=>/^en-GB/i.test(v.lang)&&/male|natural|enhanced|premium/i.test(v.name))
     ||voices.find(v=>/^en-GB/i.test(v.lang))
     ||voices.find(v=>/^en-IN/i.test(v.lang)&&/male|natural|enhanced|premium/i.test(v.name))
     ||voices[0];
   const u=new SpeechSynthesisUtterance(clean);
   u.rate=.92;u.pitch=.54;u.volume=.96;u.lang=voice?.lang||'en-GB';
   if(voice)u.voice=voice;
   window.speechSynthesis.speak(u);
 }catch{}
};
const answerDifferentJoke=()=>{
 rememberLastJoke();
 const choices=jokes.map((_,i)=>i).filter(i=>i!==lastJokeIndex);
 const index=choices.length?choices[0]:0;
 lastJokeIndex=index;
 lastTopic='joke';
 stopRecognition();
 window.setTimeout(()=>speakWithProductionVoice(jokes[index]),80);
};
const answerJokeAcknowledgement=()=>{
 stopRecognition();
 window.setTimeout(()=>speakWithProductionVoice('Glad you liked it.'),60);
};
const handleVoice=e=>{
 const raw=normalize(e.detail?.text);if(!raw)return;
 if(isDifferentFollowup(raw)){
   e.preventDefault?.();
   e.stopImmediatePropagation?.();
   answerDifferentJoke();
   return;
 }
 if(lastTopic==='joke'&&isJokeAcknowledgement(raw)){
   e.preventDefault?.();
   e.stopImmediatePropagation?.();
   answerJokeAcknowledgement();
   return;
 }
 if(isJokeRequest(raw)){
   lastTopic='joke';
   window.setTimeout(rememberLastJoke,250);
 }
};
const handleSubmit=e=>{
 const form=e.target;if(!(form instanceof HTMLFormElement)||form.id!=='commandForm')return;
 const input=form.querySelector('#commandInput');
 const raw=input instanceof HTMLInputElement?normalize(input.value):'';
 if(!raw)return;
 if(isDifferentFollowup(raw)){
   e.preventDefault();
   e.stopImmediatePropagation();
   answerDifferentJoke();
   if(input instanceof HTMLInputElement){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}))}
   return;
 }
 if(lastTopic==='joke'&&isJokeAcknowledgement(raw)){
   e.preventDefault();
   e.stopImmediatePropagation();
   answerJokeAcknowledgement();
   if(input instanceof HTMLInputElement){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}))}
   return;
 }
 if(isJokeRequest(raw)){
   lastTopic='joke';
   window.setTimeout(rememberLastJoke,250);
 }
};
document.addEventListener('submit',handleSubmit,true);
window.addEventListener('jarvis:voice-command',handleVoice,true);
})();
