(()=>{
'use strict';
if(window.__JARVIS_CONVERSATIONAL_CHOICE_AUTHORITY_V8__)return;
window.__JARVIS_CONVERSATIONAL_CHOICE_AUTHORITY_V8__=true;
const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
const jokes=[
 'Why did the developer go broke? Because they used up all their cache.',
 'I told my computer I needed a break. It said, “I will go to sleep.”',
 'There are only 10 kinds of people: those who understand binary and those who do not.'
];
let lastChoice=null;
let lastJokeIndex=-1;
const isDifferentFollowup=q=>/^(?:please\s+)?(?:tell|give|show)\s+me\s+(?:a\s+)?(?:different|another)\s+(?:one|joke)\s*$/i.test(q)||/^(?:a\s+)?(?:different|another)\s+(?:one|joke)\s*$/i.test(q);
const isJokeRequest=q=>/\b(?:tell|give|make)\s+me\s+(?:a\s+)?joke\b/i.test(q)||/\bmake\s+me\s+laugh\b/i.test(q);
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
 // Prefer the exact production cinematic speaker used by the normal Command
 // Center path. Do not use jarvisVoiceAuthoritySpeak here, which caused the
 // alternate/slow voice on the previous patch.
 try{
   if(typeof window.jarvisCinematicSpeak==='function'){
     window.jarvisCinematicSpeak(clean);
     return;
   }
 }catch{}
 // Fallback matching src/jarvis.ts voice selection and parameters.
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
 stopRecognition();
 window.setTimeout(()=>speakWithProductionVoice(jokes[index]),80);
};
const handleVoice=e=>{
 const raw=normalize(e.detail?.text);if(!raw)return;
 // Stateless by design: “different one” must never fall through to Search Hub,
 // even if iOS drops the previous conversational event.
 if(isDifferentFollowup(raw)){
   e.preventDefault?.();
   e.stopImmediatePropagation?.();
   answerDifferentJoke();
   return;
 }
 if(isJokeRequest(raw))window.setTimeout(rememberLastJoke,250);
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
 if(isJokeRequest(raw))window.setTimeout(rememberLastJoke,250);
};
document.addEventListener('submit',handleSubmit,true);
window.addEventListener('jarvis:voice-command',handleVoice,true);
})();
