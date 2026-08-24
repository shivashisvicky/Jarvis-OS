(()=>{
'use strict';
if(window.__JARVIS_IOS_COMMAND_VOICE_FIX__)return;
window.__JARVIS_IOS_COMMAND_VOICE_FIX__=true;
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!isIOS)return;
const C=(window).SpeechRecognition||(window).webkitSpeechRecognition;
if(!C)return;
let recognition=null;
const button=()=>document.querySelector('#voiceBtn');
const setState=active=>button()?.classList.toggle('listening',active);
const stop=()=>{const r=recognition;recognition=null;if(r){try{r.abort()}catch{}try{r.stop()}catch{}}setState(false);try{window.jarvisStopAllVoiceSessions?.()}catch{}};
const submitTranscript=text=>{
 const input=document.querySelector('#commandInput');
 const form=document.querySelector('#commandForm');
 if(!(input instanceof HTMLInputElement)||!(form instanceof HTMLFormElement))return;
 input.value=text;
 input.dispatchEvent(new Event('input',{bubbles:true}));
 form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
};
const start=e=>{
 const t=e.target instanceof Element?e.target.closest('#voiceBtn'):null;
 if(!t)return;
 e.preventDefault();e.stopImmediatePropagation();
 if(recognition){stop();return;}
 const r=new C();recognition=r;
 window.__jarvisActiveRecognition=r;
 r.lang='en-GB';r.interimResults=true;r.continuous=false;r.maxAlternatives=3;
 r.onstart=()=>setState(true);
 r.onresult=ev=>{
   let final='';
   for(let i=ev.resultIndex;i<ev.results.length;i++)if(ev.results[i].isFinal)final+=ev.results[i][0].transcript;
   if(final.trim()){
     const text=final.trim();
     // Release iOS microphone ownership before the command starts its
     // speech response. Do not submit while WebKit still owns the mic.
     stop();
     window.setTimeout(()=>submitTranscript(text),160);
   }
 };
 r.onerror=()=>stop();
 r.onend=()=>{if(recognition===r){recognition=null;setState(false)}if(window.__jarvisActiveRecognition===r)window.__jarvisActiveRecognition=null};
 try{r.start()}catch{stop()}
};
// Safari/iOS is much more reliable when SpeechRecognition.start() is called
// from the actual click activation, not from pointerdown followed by click.
document.addEventListener('click',start,true);
window.addEventListener('pagehide',stop);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
})();
