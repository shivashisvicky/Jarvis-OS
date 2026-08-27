(()=>{
'use strict';
if(window.__JARVIS_SPEECH_RECOGNITION_RELEASE_V1__)return;
window.__JARVIS_SPEECH_RECOGNITION_RELEASE_V1__=true;
const C=window.SpeechRecognition||window.webkitSpeechRecognition;
if(!C)return;
const active=new Set();
const startedAt=new WeakMap();
const timers=new WeakMap();
const MAX_SESSION=15000;
const ABORT_AFTER_STOP=450;
const clearTimer=r=>{const t=timers.get(r);if(t){clearTimeout(t);timers.delete(r)}};
const hardAbort=r=>{try{r.abort()}catch{}clearTimer(r);active.delete(r)};
const armStop=r=>{clearTimer(r);timers.set(r,setTimeout(()=>hardAbort(r),ABORT_AFTER_STOP))};
const proto=C.prototype;
if(proto&&!proto.__jarvisReleasePatched){
 const nativeStart=proto.start;
 const nativeStop=proto.stop;
 const nativeAbort=proto.abort;
 proto.start=function(...args){
   active.add(this);startedAt.set(this,Date.now());clearTimer(this);
   const timer=setTimeout(()=>{if(active.has(this)&&Date.now()-(startedAt.get(this)||0)>=MAX_SESSION)hardAbort(this)},MAX_SESSION+250);
   timers.set(this,timer);
   try{return nativeStart.apply(this,args)}catch(error){active.delete(this);clearTimer(this);throw error}
 };
 proto.stop=function(...args){
   try{const out=nativeStop.apply(this,args);armStop(this);return out}catch(error){armStop(this);try{nativeAbort.apply(this,args)}catch{}throw error}
 };
 proto.abort=function(...args){try{return nativeAbort.apply(this,args)}finally{clearTimer(this);active.delete(this)}};
 proto.__jarvisReleasePatched=true;
}
window.jarvisStopVoiceRecognitionOnly=()=>{for(const r of Array.from(active))hardAbort(r)};
window.jarvisStopAllVoiceSessions=()=>{window.jarvisStopVoiceRecognitionOnly();try{window.speechSynthesis?.cancel()}catch{}};
window.addEventListener('pagehide',()=>window.jarvisStopVoiceRecognitionOnly(),true);
window.addEventListener('visibilitychange',()=>{if(document.hidden)window.jarvisStopVoiceRecognitionOnly()},true);
})();
