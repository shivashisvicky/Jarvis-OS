(()=>{
'use strict';
if(window.__JARVIS_IOS_AUDIO_UNLOCK_V7__)return;
window.__JARVIS_IOS_AUDIO_UNLOCK_V7__=true;
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
    // This is intentionally the same operation that proved successful when
    // the temporary visible audio-unlock control was used: a real utterance
    // is started directly from the microphone gesture. Do not cancel it from
    // this gesture handler. Leaving the route warm is more reliable on iOS.
    const u=new SpeechSynthesisUtterance('Voice channel ready.');
    u.lang='en-GB';u.rate=.95;u.pitch=1;u.volume=.01;
    u.onstart=()=>{priming=false};
    u.onend=()=>{priming=false};
    u.onerror=()=>{priming=false};
    synth.speak(u);
    return true;
  }catch{priming=false;try{synth.resume()}catch{};return false}
};
const bind=()=>{
  const b=document.querySelector('#voiceBtn');
  if(!(b instanceof HTMLElement)||b.dataset.jarvisAudioPrimed==='v7')return;
  b.dataset.jarvisAudioPrimed='v7';
  // The click is the authoritative gesture. Pointer/touch only prepare the
  // audio context; the actual speech activation is done by click so WebKit
  // sees the same user activation that the known-good visible button used.
  b.addEventListener('pointerdown',()=>{try{synth.resume()}catch{}},true);
  b.addEventListener('touchstart',()=>{try{synth.resume()}catch{}},true);
  b.addEventListener('click',prime,true);
};
const hideLegacy=()=>{const b=document.querySelector('#jarvisAudioUnlock');if(b instanceof HTMLElement)b.remove()};
const install=()=>{hideLegacy();bind()};
const observer=new MutationObserver(install);observer.observe(document.documentElement,{childList:true,subtree:true});
install();
window.jarvisPrimeSpeech=prime;
})();
