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
const primeSpeechFromGesture=()=>{
 try{
   if(typeof window.jarvisPrimeSpeech==='function')window.jarvisPrimeSpeech();
   if('speechSynthesis'in window){window.speechSynthesis.resume();const u=new SpeechSynthesisUtterance('.');u.volume=0;u.rate=1;u.lang='en-GB';window.speechSynthesis.speak(u);window.setTimeout(()=>{try{window.speechSynthesis.cancel();window.speechSynthesis.resume()}catch{}},120)}
 }catch{}
};
const stop=()=>{const r=recognition;recognition=null;if(r){try{r.stop()}catch{try{r.abort()}catch{}}}setState(false)};
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
 // This MUST happen in the original user activation. The recognition result
 // callback runs later and iOS Safari may otherwise reject TTS from it.
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
