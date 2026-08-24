(()=>{
'use strict';
if(window.__JARVIS_IOS_AUDIO_UNLOCK_V5__)return;
window.__JARVIS_IOS_AUDIO_UNLOCK_V5__=true;
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!isIOS||!('speechSynthesis'in window))return;
const synth=window.speechSynthesis;
let ctx=null;
let priming=false;
const prime=()=>{
  if(priming)return true;
  priming=true;
  try{synth.cancel();synth.resume()}catch{}
  try{
    const C=window.AudioContext||window.webkitAudioContext;
    if(C){if(!ctx||ctx.state==='closed')ctx=new C({latencyHint:'interactive'});if(ctx.state!=='running')void ctx.resume()}
  }catch{}
  try{
    const u=new SpeechSynthesisUtterance('\u200b');
    u.lang='en-GB';u.rate=1;u.pitch=1;u.volume=0.01;
    u.onend=()=>{priming=false;try{synth.resume()}catch{}};
    u.onerror=()=>{priming=false;try{synth.resume()}catch{}};
    synth.speak(u);
    window.setTimeout(()=>{try{synth.cancel();synth.resume()}catch{}priming=false},140);
    return true;
  }catch{priming=false;try{synth.resume()}catch{};return false}
};
const bind=()=>{
  const b=document.querySelector('#voiceBtn');
  if(!(b instanceof HTMLElement)||b.dataset.jarvisAudioPrimed==='v5')return;
  b.dataset.jarvisAudioPrimed='v5';
  const primeFromGesture=()=>prime();
  b.addEventListener('pointerdown',primeFromGesture,true);
  b.addEventListener('touchstart',primeFromGesture,true);
  b.addEventListener('click',primeFromGesture,true);
};
const hideLegacy=()=>{const b=document.querySelector('#jarvisAudioUnlock');if(b instanceof HTMLElement)b.remove()};
const install=()=>{hideLegacy();bind()};
const observer=new MutationObserver(install);observer.observe(document.documentElement,{childList:true,subtree:true});
install();
window.jarvisPrimeSpeech=()=>prime();
})();
