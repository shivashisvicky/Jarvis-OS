(()=>{
'use strict';
if(window.__JARVIS_IOS_AUDIO_UNLOCK_V3__)return;
window.__JARVIS_IOS_AUDIO_UNLOCK_V3__=true;
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!isIOS||!('speechSynthesis' in window))return;
const synth=window.speechSynthesis;
let ctx=null;
const prime=()=>{
  try{synth.resume()}catch{}
  try{
    const C=window.AudioContext||window.webkitAudioContext;
    if(C){if(!ctx||ctx.state==='closed')ctx=new C({latencyHint:'interactive'});if(ctx.state!=='running')void ctx.resume()}
  }catch{}
};
const bind=()=>{
  const b=document.querySelector('#voiceBtn');
  if(!(b instanceof HTMLElement)||b.dataset.jarvisAudioPrimed==='1')return;
  b.dataset.jarvisAudioPrimed='1';
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
