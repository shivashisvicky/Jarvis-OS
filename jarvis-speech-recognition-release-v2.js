(()=>{
'use strict';
if(window.__JARVIS_SPEECH_RECOGNITION_RELEASE_V3__)return;
window.__JARVIS_SPEECH_RECOGNITION_RELEASE_V3__=true;
const C=window.SpeechRecognition||window.webkitSpeechRecognition;
if(!C)return;
const active=new Set();
const nativeStart=C.prototype.start;
const nativeStop=C.prototype.stop;
const nativeAbort=C.prototype.abort;
let commandReleaseLatch=false;
let releaseGeneration=0;

const trace=(event,extra={})=>{try{window.__JARVIS_VOICE_TRACE__={event,at:Date.now(),...extra};console.debug('[JARVIS voice release]',event,extra)}catch{}};

C.prototype.start=function(...args){
  // Fail closed after a command has been delivered. This specifically blocks
  // continuous/onend auto-restart from reopening the microphone. A deliberate
  // user press on the voice button clears the latch before the next session.
  if(commandReleaseLatch){
    trace('start-blocked-after-command',{generation:releaseGeneration});
    try{nativeAbort.apply(this,args)}catch{}
    active.delete(this);
    return undefined;
  }
  active.add(this);
  try{return nativeStart.apply(this,args)}catch(e){active.delete(this);throw e}
};
C.prototype.stop=function(...args){
  let out;
  try{out=nativeStop.apply(this,args)}catch{}
  active.delete(this);
  try{nativeAbort.apply(this,args)}catch{}
  return out;
};
C.prototype.abort=function(...args){try{return nativeAbort.apply(this,args)}finally{active.delete(this)}};

const release=(reason='release')=>{
  releaseGeneration++;
  for(const r of Array.from(active)){try{nativeAbort.call(r)}catch{}active.delete(r)}
  trace(reason,{generation:releaseGeneration});
};
const armCommandRelease=()=>{
  commandReleaseLatch=true;
  release('command-complete');
  try{window.speechSynthesis?.cancel()}catch{}
};
const allowNextSession=()=>{
  if(!commandReleaseLatch)return;
  commandReleaseLatch=false;
  trace('voice-user-gesture-release',{generation:releaseGeneration});
};

window.jarvisStopVoiceRecognitionOnly=()=>release('explicit-stop');
window.jarvisStopAllVoiceSessions=()=>{release('stop-all');try{window.speechSynthesis?.cancel()}catch{}};
window.jarvisArmVoiceRelease=(ms=2500)=>{
  commandReleaseLatch=true;
  release('armed-release');
  if(ms>0)window.setTimeout(()=>{if(commandReleaseLatch){commandReleaseLatch=false;trace('release-timeout')}} ,ms);
};
window.jarvisVoiceRecognitionTrace=()=>({...window.__JARVIS_VOICE_TRACE__,commandReleaseLatch,activeSessions:active.size,generation:releaseGeneration});

// This is the authority boundary: once the application publishes a completed
// voice command, recognition is released and cannot restart until a real user
// gesture requests another voice session.
window.addEventListener('jarvis:voice-command',armCommandRelease,true);
document.addEventListener('pointerdown',e=>{
  const t=e.target;
  if(t instanceof Element && t.closest('#voiceBtn,#testVoice'))allowNextSession();
},true);
document.addEventListener('touchstart',e=>{
  const t=e.target;
  if(t instanceof Element && t.closest('#voiceBtn,#testVoice'))allowNextSession();
},true);
window.addEventListener('pagehide',()=>release('pagehide'),true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)release('hidden')},true);
})();
