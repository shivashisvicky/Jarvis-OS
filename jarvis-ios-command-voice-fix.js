(()=>{
'use strict';
if(window.__JARVIS_IOS_COMMAND_VOICE_FIX__)return;
window.__JARVIS_IOS_COMMAND_VOICE_FIX__=true;
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!isIOS)return;
const C=(window).SpeechRecognition||(window).webkitSpeechRecognition;
if(!C)return;
let recognition=null;
let lastSubmitted='';
let lastSubmittedAt=0;
const button=()=>document.querySelector('#voiceBtn');
const setState=active=>button()?.classList.toggle('listening',active);
const primeSpeechFromGesture=()=>{
 try{
   // Use the single speech authority prime. The previous implementation
   // primed through jarvisPrimeSpeech() and then immediately queued a second
   // silent utterance, which could leave iOS WebKit with duplicate speech work.
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
const stop=()=>{const r=recognition;recognition=null;if(r){try{r.stop()}catch{try{r.abort()}catch{}}}setState(false)};
const submitTranscript=text=>{
 const input=document.querySelector('#commandInput');
 const form=document.querySelector('#commandForm');
 if(!(input instanceof HTMLInputElement)||!(form instanceof HTMLFormElement))return;
 const normalized=String(text||'').trim().replace(/\s+/g,' ').toLowerCase();
 const now=Date.now();
 // iOS can deliver the same final transcript more than once around the
 // recognition shutdown boundary. One command must produce one response.
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
 // Prime once while the original tap is still active. Recognition results
 // arrive asynchronously, so do not attempt another prime there.
 primeSpeechFromGesture();
 const r=new C();recognition=r;
 r.lang='en-GB';r.interimResults=true;r.continuous=false;r.maxAlternatives=3;
 r.onstart=()=>setState(true);
 r.onresult=ev=>{
   let final='';
   for(let i=ev.resultIndex;i<ev.results.length;i++)if(ev.results[i].isFinal)final+=ev.results[i][0].transcript;
   if(final.trim()){const text=final.trim();stop();submitTranscript(text)}
 };
 r.onerror=()=>stop();
 r.onend=()=>{if(recognition===r){recognition=null;setState(false)}};
 try{r.start()}catch{stop()}
};
document.addEventListener('click',start,true);
window.addEventListener('pagehide',stop);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
})();
