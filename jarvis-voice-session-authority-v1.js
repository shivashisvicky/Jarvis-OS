(()=>{
'use strict';
if(window.__JARVIS_VOICE_SESSION_AUTHORITY_V1__)return;
window.__JARVIS_VOICE_SESSION_AUTHORITY_V1__=true;
const C=window.SpeechRecognition||window.webkitSpeechRecognition;
if(!C||!C.prototype)return;
const sessions=new Set();
const proto=C.prototype;
try{
 const nativeStart=proto.start;
 if(typeof nativeStart==='function'){
  proto.start=function(...args){sessions.add(this);return nativeStart.apply(this,args)};
 }
}catch{}
const stopAll=()=>{
 for(const r of Array.from(sessions)){
  try{r.abort()}catch{try{r.stop()}catch{}}
  try{r.stop()}catch{}
 }
 sessions.clear();
 try{window.jarvisStopIOSVoice?.()}catch{}
 try{window.speechSynthesis?.cancel()}catch{}
 document.querySelector('#voiceBtn')?.classList.remove('listening');
 const stopButton=document.querySelector('#jarvisIOSStopVoice');
 if(stopButton instanceof HTMLElement)stopButton.hidden=true;
};
window.jarvisStopAllVoiceSessions=stopAll;
window.jarvisForceStopVoice=stopAll;
window.addEventListener('jarvis:force-stop-voice',stopAll,true);
window.addEventListener('jarvis:voice-command',()=>window.setTimeout(stopAll,0),true);
document.addEventListener('submit',e=>{if(e.target instanceof HTMLFormElement&&e.target.id==='commandForm')window.setTimeout(stopAll,0)},true);
window.addEventListener('pagehide',stopAll,true);
window.addEventListener('beforeunload',stopAll,true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAll()},true);
})();
