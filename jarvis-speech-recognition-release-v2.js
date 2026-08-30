(()=>{
'use strict';
if(window.__JARVIS_SPEECH_RECOGNITION_RELEASE_V5__)return;
window.__JARVIS_SPEECH_RECOGNITION_RELEASE_V5__=true;
const C=window.SpeechRecognition||window.webkitSpeechRecognition;
if(!C)return;
const active=new Set();
let commandReleaseLatch=false;
let releaseGeneration=0;
let nativeStart=C.prototype.start;
let nativeStop=C.prototype.stop;
let nativeAbort=C.prototype.abort;

const trace=(event,extra={})=>{try{window.__JARVIS_VOICE_TRACE__={event,at:Date.now(),...extra};console.debug('[JARVIS voice release]',event,extra)}catch{}};

const release=(reason='release')=>{
  releaseGeneration++;
  for(const r of Array.from(active)){try{nativeAbort.call(r)}catch{}active.delete(r)}
  trace(reason,{generation:releaseGeneration});
};

const armCommandRelease=()=>{
  commandReleaseLatch=true;
  release('command-complete');
};

const hardReleaseAfterFinalResult=r=>{
  commandReleaseLatch=true;
  release('final-result-mic-release');
  // Deliberately do not touch speechSynthesis here. The command's response is
  // produced after the recognition result reaches the normal command handler.
};

const attachFinalResultGuard=r=>{
  try{
    r.addEventListener('result',event=>{
      try{
        for(let i=event.resultIndex;i<event.results.length;i++){
          if(event.results[i]?.isFinal){
            // Capture-phase guard runs before the application's onresult handler.
            // This closes the microphone and latches recognition before media,
            // navigation, or any later onend restart can reopen it.
            hardReleaseAfterFinalResult(r);
            return;
          }
        }
      }catch{}
    },true);
  }catch{}
};

const patchPrototype=()=>{
  const proto=C.prototype;
  if(!proto)return;
  if(!proto.start?.__jarvisReleaseAuthority){
    nativeStart=proto.start;
    nativeStop=proto.stop;
    nativeAbort=proto.abort;
    const start=function(...args){
      if(commandReleaseLatch){
        trace('start-blocked-after-command',{generation:releaseGeneration});
        try{nativeAbort.apply(this,args)}catch{}
        active.delete(this);
        return undefined;
      }
      active.add(this);
      attachFinalResultGuard(this);
      try{return nativeStart.apply(this,args)}catch(e){active.delete(this);throw e}
    };
    const stop=function(...args){
      let out;
      try{out=nativeStop.apply(this,args)}catch{}
      active.delete(this);
      try{nativeAbort.apply(this,args)}catch{}
      return out;
    };
    const abort=function(...args){try{return nativeAbort.apply(this,args)}finally{active.delete(this)}};
    start.__jarvisReleaseAuthority=true;
    stop.__jarvisReleaseAuthority=true;
    abort.__jarvisReleaseAuthority=true;
    proto.start=start;
    proto.stop=stop;
    proto.abort=abort;
    trace('authority-installed');
  }
};

const allowNextSession=()=>{
  if(!commandReleaseLatch)return;
  commandReleaseLatch=false;
  trace('voice-user-gesture-release',{generation:releaseGeneration});
  patchPrototype();
};

window.jarvisStopVoiceRecognitionOnly=()=>release('explicit-stop');
window.jarvisStopAllVoiceSessions=()=>{release('stop-all');try{window.speechSynthesis?.cancel()}catch{}};
window.jarvisArmVoiceRelease=(ms=2500)=>{
  commandReleaseLatch=true;
  release('armed-release');
  if(ms>0)window.setTimeout(()=>{if(commandReleaseLatch){commandReleaseLatch=false;trace('release-timeout')}},ms);
};
window.jarvisVoiceRecognitionTrace=()=>({...window.__JARVIS_VOICE_TRACE__,commandReleaseLatch,activeSessions:active.size,generation:releaseGeneration});
window.jarvisVoiceReliability={release,arm:armCommandRelease,allow:allowNextSession,trace:window.jarvisVoiceRecognitionTrace};

// Permanent authority boundary: a FINAL recognition result is the hard stop
// point. This runs at the recognition event boundary, before the app's normal
// result handler, so navigation/media/text processing cannot keep the mic open
// or restart recognition. Only a deliberate tap on the voice button opens the
// next recognition session.
window.addEventListener('jarvis:voice-command',armCommandRelease,true);
document.addEventListener('pointerdown',e=>{const t=e.target;if(t instanceof Element&&t.closest('#voiceBtn,#testVoice'))allowNextSession()},true);
document.addEventListener('touchstart',e=>{const t=e.target;if(t instanceof Element&&t.closest('#voiceBtn,#testVoice'))allowNextSession()},true);
window.addEventListener('pagehide',()=>release('pagehide'),true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)release('hidden')},true);
patchPrototype();
window.setInterval(patchPrototype,250);
})();
