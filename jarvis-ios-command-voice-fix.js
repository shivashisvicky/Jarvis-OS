(()=>{
'use strict';
if(window.__JARVIS_IOS_COMMAND_VOICE_FIX_V2__)return;
window.__JARVIS_IOS_COMMAND_VOICE_FIX_V2__=true;
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!isIOS)return;
const C=window.SpeechRecognition||window.webkitSpeechRecognition;
if(!C)return;
let recognition=null;
let stopTimer=0;
let lastSubmitted='';
let lastSubmittedAt=0;
const button=()=>document.querySelector('#voiceBtn');
const setState=active=>button()?.classList.toggle('listening',active);
const clearWatchdog=()=>{if(stopTimer){window.clearTimeout(stopTimer);stopTimer=0}};
const primeSpeechFromGesture=()=>{
 try{
   if(typeof window.jarvisPrimeSpeech==='function'){
     window.jarvisPrimeSpeech();
     return;
   }
   if('speechSynthesis'in window){
     const synth=window.speechSynthesis;
     synth.cancel();
     synth.resume();
     const u=new SpeechSynthesisUtterance('.');
     u.volume=0;u.rate=1;u.lang='en-GB';
     synth.speak(u);
     window.setTimeout(()=>{try{synth.cancel();synth.resume()}catch{}},120);
   }
 }catch{}
};
const stop=()=>{
 clearWatchdog();
 const r=recognition;
 recognition=null;
 if(r){
   r.onresult=null;
   r.onspeechend=null;
   r.onerror=null;
   r.onend=null;
   try{r.abort()}catch{try{r.stop()}catch{}}
 }
 setState(false);
};
window.jarvisStopIOSVoice=stop;
const submitTranscript=text=>{
 const input=document.querySelector('#commandInput');
 const form=document.querySelector('#commandForm');
 if(!(input instanceof HTMLInputElement)||!(form instanceof HTMLFormElement))return;
 const normalized=String(text||'').trim().replace(/\s+/g,' ').toLowerCase();
 const now=Date.now();
 if(!normalized)return;
 if(normalized===lastSubmitted&&now-lastSubmittedAt<3500)return;
 lastSubmitted=normalized;
 lastSubmittedAt=now;
 input.value=text;
 input.dispatchEvent(new Event('input',{bubbles:true}));
 form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
};
const start=e=>{
 const t=e.target instanceof Element?e.target.closest('#voiceBtn'):null;
 if(!t)return;
 e.preventDefault();e.stopImmediatePropagation();
 if(recognition){stop();return;}
 primeSpeechFromGesture();
 const r=new C();
 recognition=r;
 r.lang='en-GB';
 r.interimResults=true;
 r.continuous=false;
 r.maxAlternatives=3;
 r.onstart=()=>{
   setState(true);
   clearWatchdog();
   // Absolute safety valve. iOS WebKit can occasionally leave a recognition
   // session alive after speechend/onresult. Never allow the page to retain
   // the microphone indefinitely.
   stopTimer=window.setTimeout(stop,10000);
 };
 r.onspeechend=()=>{window.setTimeout(()=>{if(recognition===r)stop()},150)};
 r.onresult=ev=>{
   let final='';
   for(let i=ev.resultIndex;i<ev.results.length;i++)if(ev.results[i].isFinal)final+=ev.results[i][0].transcript;
   if(final.trim()){
     const text=final.trim();
     stop();
     submitTranscript(text);
   }
 };
 r.onerror=()=>stop();
 r.onend=()=>{if(recognition===r){clearWatchdog();recognition=null;setState(false)}};
 try{r.start()}catch{stop()}
};
document.addEventListener('click',start,true);
document.addEventListener('submit',e=>{if((e.target instanceof HTMLFormElement)&&e.target.id==='commandForm')stop()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')stop()},true);
window.addEventListener('jarvis:voice-command',()=>stop(),true);
window.addEventListener('pagehide',stop);
window.addEventListener('beforeunload',stop);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
})();
