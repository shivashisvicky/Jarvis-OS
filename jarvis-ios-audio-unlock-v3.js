(()=>{
'use strict';
if(window.__JARVIS_IOS_AUDIO_UNLOCK_V6__)return;
window.__JARVIS_IOS_AUDIO_UNLOCK_V6__=true;
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
    // iOS only consistently unlocks the speech route when a real utterance is
    // started from the user's gesture. The previously-hidden zero-volume
    // utterance could be optimized away by WebKit, so use a very short, quiet
    // audible utterance and cancel only after onstart fires.
    const u=new SpeechSynthesisUtterance('.');
    u.lang='en-GB';u.rate=8;u.pitch=1;u.volume=.08;
    let started=false;
    u.onstart=()=>{
      started=true;
      window.setTimeout(()=>{try{synth.cancel();synth.resume()}catch{}priming=false},25);
    };
    u.onend=()=>{priming=false};
    u.onerror=()=>{priming=false};
    synth.speak(u);
    window.setTimeout(()=>{if(!started){try{synth.resume()}catch{}priming=false}},220);
    return true;
  }catch{priming=false;try{synth.resume()}catch{};return false}
};
const bind=()=>{
  const b=document.querySelector('#voiceBtn');
  if(!(b instanceof HTMLElement)||b.dataset.jarvisAudioPrimed==='v6')return;
  b.dataset.jarvisAudioPrimed='v6';
  b.addEventListener('pointerdown',prime,true);
  b.addEventListener('touchstart',prime,true);
  b.addEventListener('click',prime,true);
};
const hideLegacy=()=>{const b=document.querySelector('#jarvisAudioUnlock');if(b instanceof HTMLElement)b.remove()};
const install=()=>{hideLegacy();bind()};
const observer=new MutationObserver(install);observer.observe(document.documentElement,{childList:true,subtree:true});
install();
window.jarvisPrimeSpeech=prime;
})();
