(()=>{
'use strict';
if(window.__JARVIS_FINAL_MIC_RELEASE_V4__)return;
window.__JARVIS_FINAL_MIC_RELEASE_V4__=true;
const C=window.SpeechRecognition||window.webkitSpeechRecognition;
const sessions=new Set();
let timers=[];
const hide=()=>{try{const b=document.querySelector('#voiceBtn');if(b instanceof HTMLElement){b.classList.remove('listening');b.setAttribute('aria-pressed','false');b.dataset.listening='0'}}catch{}try{const b=document.querySelector('#jarvisIOSStopVoice');if(b instanceof HTMLElement)b.hidden=true}catch{}};
const abortOnly=r=>{try{r?.abort()}catch{}};
const release=()=>{for(const r of Array.from(sessions))abortOnly(r);sessions.clear();hide()};
const releaseSoon=()=>{for(const t of timers)clearTimeout(t);timers=[];release();[40,180,450,900,1600].forEach(ms=>timers.push(window.setTimeout(release,ms)))};
if(C?.prototype){try{const nativeStart=C.prototype.start;C.prototype.start=function(...args){sessions.add(this);try{this.addEventListener('end',()=>sessions.delete(this),{once:true})}catch{}try{this.addEventListener('error',()=>sessions.delete(this),{once:true})}catch{}return nativeStart.apply(this,args)}}catch{}}
window.jarvisStopAllVoiceSessions=release;
window.jarvisForceStopVoice=release;
window.jarvisArmVoiceRelease=release;
window.addEventListener('jarvis:force-stop-voice',release,true);
// Recognition completion must release the microphone without touching speech synthesis.
// iOS/WebKit can deliver the final result before the recognition session has actually
// released the audio input route, so use a short abort-only settling window.
window.addEventListener('jarvis:voice-command',releaseSoon,true);
document.addEventListener('submit',e=>{if(e.target instanceof HTMLFormElement&&e.target.id==='commandForm')releaseSoon()},true);
window.addEventListener('pagehide',release,true);
window.addEventListener('beforeunload',release,true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)release()},true);
})();
