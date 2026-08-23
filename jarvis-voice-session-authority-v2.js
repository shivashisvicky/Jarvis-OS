(()=>{
'use strict';
if(window.__JARVIS_VOICE_SESSION_AUTHORITY_V2__)return;
window.__JARVIS_VOICE_SESSION_AUTHORITY_V2__=true;
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
const stopRecognition=()=>{
 for(const r of Array.from(sessions)){
  try{r.abort()}catch{try{r.stop()}catch{}}
  try{r.stop()}catch{}
 }
 sessions.clear();
 try{window.jarvisStopIOSVoice?.()}catch{}
 document.querySelector('#voiceBtn')?.classList.remove('listening');
 const stopButton=document.querySelector('#jarvisIOSStopVoice');
 if(stopButton instanceof HTMLElement)stopButton.hidden=true;
};
const stopEverything=()=>{
 stopRecognition();
 try{window.speechSynthesis?.cancel()}catch{}
};
// A recognized command should release only the microphone. It must never
// cancel the response speech that the command pipeline starts afterwards.
window.jarvisStopAllVoiceSessions=stopRecognition;
window.jarvisForceStopVoice=stopEverything;
window.addEventListener('jarvis:force-stop-voice',stopEverything,true);
window.addEventListener('jarvis:voice-command',()=>window.setTimeout(stopRecognition,0),true);
document.addEventListener('submit',e=>{if(e.target instanceof HTMLFormElement&&e.target.id==='commandForm')window.setTimeout(stopRecognition,0)},true);
window.addEventListener('pagehide',stopEverything,true);
window.addEventListener('beforeunload',stopEverything,true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopEverything()},true);
})();
