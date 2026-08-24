(()=>{
'use strict';
if(window.__JARVIS_IOS_AUDIO_UNLOCK_V9__)return;
window.__JARVIS_IOS_AUDIO_UNLOCK_V9__=true;
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
    const u=new SpeechSynthesisUtterance('Voice channel ready.');
    u.lang='en-GB';u.rate=.95;u.pitch=1;u.volume=.01;
    u.onstart=()=>{priming=false};u.onend=()=>{priming=false};u.onerror=()=>{priming=false};
    synth.speak(u);
    return true;
  }catch{priming=false;try{synth.resume()}catch{};return false}
};
const showUnlock=()=>{
  let b=document.querySelector('#jarvisAudioUnlock');
  if(b instanceof HTMLElement)return b;
  b=document.createElement('button');b.id='jarvisAudioUnlock';b.type='button';b.textContent='🔊';
  b.setAttribute('aria-label','Activate JARVIS voice');b.title='Activate JARVIS voice';
  b.style.cssText='position:fixed;right:18px;bottom:230px;z-index:2147483000;width:46px;height:46px;border:1px solid rgba(91,214,244,.72);border-radius:50%;background:rgba(4,16,22,.96);color:#bfefff;font-size:20px;box-shadow:0 0 20px rgba(71,201,236,.22);touch-action:manipulation;pointer-events:auto;cursor:pointer';
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();prime();},true);
  document.body.appendChild(b);return b;
};
const bindMic=()=>{
  const b=document.querySelector('#voiceBtn');
  if(!(b instanceof HTMLElement)||b.dataset.jarvisAudioPrimed==='v9')return;
  b.dataset.jarvisAudioPrimed='v9';
  b.addEventListener('pointerdown',()=>{try{synth.resume()}catch{}},true);
  b.addEventListener('touchstart',()=>{try{synth.resume()}catch{}},true);
  b.addEventListener('click',()=>{try{prime()}catch{}},true);
};
const install=()=>{showUnlock();bindMic()};
new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
install();
window.jarvisPrimeSpeech=prime;
})();
