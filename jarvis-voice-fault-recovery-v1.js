(()=>{
'use strict';
if(window.__JARVIS_VOICE_FAULT_RECOVERY_V1__)return;
window.__JARVIS_VOICE_FAULT_RECOVERY_V1__=true;

let recovering=false;
let lastStart=0;
const RECOVERY_TIMEOUT=12000;
const reset=()=>{
  if(recovering)return;
  recovering=true;
  try{window.jarvisStopVoiceRecognitionOnly?.()}catch{}
  try{window.jarvisStopIOSVoice?.()}catch{}
  try{window.jarvisStopAllVoiceSessions?.()}catch{}
  window.setTimeout(()=>{recovering=false},120);
};
const startWatchdog=()=>{
  lastStart=Date.now();
  window.setTimeout(()=>{
    if(lastStart&&Date.now()-lastStart>=RECOVERY_TIMEOUT&&!recovering){
      reset();
      lastStart=0;
    }
  },RECOVERY_TIMEOUT+250);
};
window.addEventListener('jarvis:voice-command',()=>{lastStart=0},true);
window.addEventListener('jarvis:voice-error',e=>{
  const code=String(e.detail?.error||e.detail?.code||'').toLowerCase();
  if(code==='no-speech'||code==='aborted'||code==='audio-capture'||code==='network'||code==='not-allowed'||code==='service-not-allowed'||code==='')reset();
},true);
window.addEventListener('jarvis:voice-start',startWatchdog,true);
window.addEventListener('error',e=>{if(/speechrecognition|recognition/i.test(String(e.message||'')))reset()},true);
window.addEventListener('unhandledrejection',e=>{if(/speechrecognition|recognition/i.test(String(e.reason||'')))reset()},true);
window.jarvisRecoverVoiceSession=reset;
})();
