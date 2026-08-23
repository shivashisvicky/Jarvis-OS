(()=>{
'use strict';
if(window.__JARVIS_VOICE_SESSION_AUTHORITY_V3__)return;
window.__JARVIS_VOICE_SESSION_AUTHORITY_V3__=true;
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
const releaseMic=()=>{
 for(const r of Array.from(sessions)){
  try{r.abort()}catch{try{r.stop()}catch{}}
  try{r.stop()}catch{}
 }
 sessions.clear();
 // Normal command completion must release recognition only. Do NOT call
 // jarvisStopIOSVoice/jarvisStopVoice here because those are hard-stop playback
 // authorities and would cancel the response speech that follows recognition.
 try{document.querySelector('#voiceBtn')?.classList.remove('listening')}catch{}
 const stopButton=document.querySelector('#jarvisIOSStopVoice');
 if(stopButton instanceof HTMLElement)stopButton.hidden=true;
};
const stopEverything=()=>{
 releaseMic();
 try{window.jarvisStopIOSVoice?.()}catch{}
 try{window.jarvisStopVoice?.()}catch{}
 try{window.speechSynthesis?.cancel()}catch{}
};
window.jarvisStopAllVoiceSessions=releaseMic;
window.jarvisForceStopVoice=stopEverything;
window.addEventListener('jarvis:force-stop-voice',stopEverything,true);
window.addEventListener('jarvis:voice-command',()=>window.setTimeout(releaseMic,0),true);
document.addEventListener('submit',e=>{if(e.target instanceof HTMLFormElement&&e.target.id==='commandForm')window.setTimeout(releaseMic,0)},true);
window.addEventListener('pagehide',stopEverything,true);
window.addEventListener('beforeunload',stopEverything,true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopEverything()},true);
})();
