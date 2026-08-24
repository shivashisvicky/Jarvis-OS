(()=>{
'use strict';
if(window.__JARVIS_IOS_AUDIO_UNLOCK_V4__)return;
window.__JARVIS_IOS_AUDIO_UNLOCK_V4__=true;
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!isIOS||!('speechSynthesis'in window))return;
const synth=window.speechSynthesis;
let ctx=null;
let primedAt=0;
const prime=()=>{
  const now=Date.now();
  if(now-primedAt<1500)return;
  primedAt=now;
  try{synth.cancel();synth.resume()}catch{}
  try{
    const u=new SpeechSynthesisUtterance('.');
    u.volume=0;
    u.rate=1;
    u.pitch=1;
    u.lang='en-GB';
    synth.speak(u);
    window.setTimeout(()=>{try{synth.cancel();synth.resume()}catch{}},120);
  }catch{}
  try{
    const C=window.AudioContext||window.webkitAudioContext;
    if(C){if(!ctx||ctx.state==='closed')ctx=new C({latencyHint:'interactive'});if(ctx.state!=='running')void ctx.resume()}
  }catch{}
};
const bind=()=>{
  const b=document.querySelector('#voiceBtn');
  if(!(b instanceof HTMLElement)||b.dataset.jarvisAudioPrimed==='v4')return;
  b.dataset.jarvisAudioPrimed='v4';
  const primeFromGesture=()=>prime();
  b.addEventListener('pointerdown',primeFromGesture,true);
  b.addEventListener('touchstart',primeFromGesture,true);
  b.addEventListener('click',primeFromGesture,true);
};
const hideLegacy=()=>{const b=document.querySelector('#jarvisAudioUnlock');if(b instanceof HTMLElement)b.remove()};
const install=()=>{hideLegacy();bind()};
const observer=new MutationObserver(install);observer.observe(document.documentElement,{childList:true,subtree:true});
install();
window.jarvisPrimeSpeech=()=>{prime();return true};
})();
