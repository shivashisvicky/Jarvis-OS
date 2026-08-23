(()=>{
'use strict';
if(window.__JARVIS_FINAL_MIC_RELEASE_V2__)return;
window.__JARVIS_FINAL_MIC_RELEASE_V2__=true;
const C=window.SpeechRecognition||window.webkitSpeechRecognition;
let blockedUntil=0;
const sessions=new Set();
const hide=()=>{try{document.querySelector('#voiceBtn')?.classList.remove('listening')}catch{}try{const b=document.querySelector('#jarvisIOSStopVoice');if(b instanceof HTMLElement)b.hidden=true}catch{}};
const abort=r=>{try{r?.abort()}catch{}try{r?.stop()}catch{}};
const hardStop=()=>{for(const r of Array.from(sessions))abort(r);sessions.clear();hide()};
const release=(ms=3500)=>{blockedUntil=Math.max(blockedUntil,Date.now()+ms);hardStop();[0,50,150,300,600,1000,1800,3000].forEach(t=>setTimeout(()=>{if(Date.now()<blockedUntil||t>=ms)hardStop()},t))};
if(C?.prototype){try{const nativeStart=C.prototype.start;C.prototype.start=function(...args){if(Date.now()<blockedUntil){hide();return}sessions.add(this);try{this.addEventListener('end',()=>sessions.delete(this),{once:true})}catch{}try{this.addEventListener('error',()=>sessions.delete(this),{once:true})}catch{}return nativeStart.apply(this,args)}}catch{}}
window.jarvisStopAllVoiceSessions=hardStop;
window.jarvisForceStopVoice=hardStop;
window.jarvisArmVoiceRelease=release;
window.addEventListener('jarvis:force-stop-voice',hardStop,true);
window.addEventListener('jarvis:voice-command',()=>release(),true);
document.addEventListener('submit',e=>{if(e.target instanceof HTMLFormElement&&e.target.id==='commandForm')release()},true);
window.addEventListener('pagehide',hardStop,true);
window.addEventListener('beforeunload',hardStop,true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)hardStop()},true);
})();
