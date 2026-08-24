(()=>{
'use strict';
if(window.__JARVIS_FINAL_MIC_RELEASE_V3__)return;
window.__JARVIS_FINAL_MIC_RELEASE_V3__=true;
const C=window.SpeechRecognition||window.webkitSpeechRecognition;
const sessions=new Set();
const hide=()=>{try{document.querySelector('#voiceBtn')?.classList.remove('listening')}catch{}try{const b=document.querySelector('#jarvisIOSStopVoice');if(b instanceof HTMLElement)b.hidden=true}catch{}};
const abort=r=>{try{r?.abort()}catch{}try{r?.stop()}catch{}};
const release=()=>{for(const r of Array.from(sessions))abort(r);sessions.clear();hide()};
if(C?.prototype){try{const nativeStart=C.prototype.start;C.prototype.start=function(...args){sessions.add(this);try{this.addEventListener('end',()=>sessions.delete(this),{once:true})}catch{}try{this.addEventListener('error',()=>sessions.delete(this),{once:true})}catch{}return nativeStart.apply(this,args)}}catch{}}
window.jarvisStopAllVoiceSessions=release;
window.jarvisForceStopVoice=release;
window.jarvisArmVoiceRelease=release;
window.addEventListener('jarvis:force-stop-voice',release,true);
// Recognition completion must release the microphone, but it must NEVER arm a
// multi-second block or interfere with the speech response that follows.
window.addEventListener('jarvis:voice-command',()=>window.setTimeout(release,0),true);
document.addEventListener('submit',e=>{if(e.target instanceof HTMLFormElement&&e.target.id==='commandForm')window.setTimeout(release,0)},true);
window.addEventListener('pagehide',release,true);
window.addEventListener('beforeunload',release,true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)release()},true);
})();
