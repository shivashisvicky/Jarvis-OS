(()=>{
'use strict';
if(window.__JARVIS_IOS_COMMAND_VOICE_FIX__)return;
window.__JARVIS_IOS_COMMAND_VOICE_FIX__=true;
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!isIOS)return;
let recognition=null;
let owned=false;
const C=(window).SpeechRecognition||(window).webkitSpeechRecognition;
if(!C)return;
const button=()=>document.querySelector('#voiceBtn');
const setState=active=>button()?.classList.toggle('listening',active);
const stop=()=>{const r=recognition;recognition=null;owned=false;if(r){try{r.stop()}catch{try{r.abort()}catch{}}}setState(false)};
const start=e=>{
 const t=e.target instanceof Element?e.target.closest('#voiceBtn'):null;
 if(!t)return;
 e.preventDefault();e.stopImmediatePropagation();
 if(recognition){stop();return;}
 const r=new C();recognition=r;owned=true;
 r.lang='en-GB';r.interimResults=true;r.continuous=false;r.maxAlternatives=3;
 r.onstart=()=>setState(true);
 r.onresult=ev=>{
   let final='';
   for(let i=ev.resultIndex;i<ev.results.length;i++)if(ev.results[i].isFinal)final+=ev.results[i][0].transcript;
   if(!final.trim())return;
   const text=final.trim();
   const input=document.querySelector('#commandInput');
   const form=document.querySelector('#commandForm');
   if(input instanceof HTMLInputElement){
     input.value=text;
     input.dispatchEvent(new Event('input',{bubbles:true}));
     if(form instanceof HTMLFormElement)form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
   }
   stop();
 };
 r.onerror=()=>stop();
 r.onend=()=>{if(recognition===r){recognition=null;owned=false;setState(false)}};
 try{r.start()}catch{stop()}
};
const blockClick=e=>{if(e.target instanceof Element&&e.target.closest('#voiceBtn')){e.preventDefault();e.stopImmediatePropagation()}};
document.addEventListener('pointerdown',start,true);
document.addEventListener('click',blockClick,true);
window.addEventListener('pagehide',stop);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
})();
