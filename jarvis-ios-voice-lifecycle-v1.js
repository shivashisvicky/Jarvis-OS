(()=>{
'use strict';
if(window.__JARVIS_IOS_VOICE_LIFECYCLE_V1__)return;
window.__JARVIS_IOS_VOICE_LIFECYCLE_V1__=true;
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!isIOS)return;
const C=window.SpeechRecognition||window.webkitSpeechRecognition;
const sessions=new Set();
const timers=new Map();
const clear=(r)=>{const t=timers.get(r);if(t)clearTimeout(t);timers.delete(r);};
const stop=(r)=>{if(!r)return;clear(r);sessions.delete(r);try{r.abort()}catch{}try{r.stop()}catch{}};
const stopAll=()=>{for(const r of Array.from(sessions))stop(r);try{window.jarvisStopAllVoiceSessions?.()}catch{};try{document.querySelector('#voiceBtn')?.classList.remove('listening')}catch{}};
if(C?.prototype){try{
 const nativeStart=C.prototype.start;
 C.prototype.start=function(...args){
   sessions.add(this);clear(this);
   const timer=setTimeout(()=>stop(this),10000);timers.set(this,timer);
   try{this.addEventListener('end',()=>{clear(this);sessions.delete(this)},{once:true})}catch{}
   try{this.addEventListener('error',()=>{clear(this);sessions.delete(this)},{once:true})}catch{}
   return nativeStart.apply(this,args);
 };
}catch{}}
window.jarvisStopIOSRecognition=stopAll;
window.addEventListener('jarvis:voice-command',stopAll,true);
window.addEventListener('pagehide',stopAll,true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAll()},true);
if('speechSynthesis'in window){try{
 const synth=window.speechSynthesis;
 const nativeSpeak=synth.speak.bind(synth);
 if(!synth.__jarvisLifecycleSpeak){
   synth.__jarvisLifecycleSpeak=true;
   synth.speak=(utterance)=>{
     stopAll();
     try{const a=navigator.audioSession;if(a&&'type'in a)a.type='playback'}catch{}
     return nativeSpeak(utterance);
   };
 }
}catch{}}
})();
