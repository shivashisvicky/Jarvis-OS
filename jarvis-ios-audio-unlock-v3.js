(()=>{
'use strict';
if(window.__JARVIS_IOS_AUDIO_UNLOCK_V9__)return;
window.__JARVIS_IOS_AUDIO_UNLOCK_V9__=true;
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!isIOS||!('speechSynthesis'in window))return;
const synth=window.speechSynthesis;
let armed=false;
const arm=()=>{
  try{synth.resume()}catch{}
  try{const u=new SpeechSynthesisUtterance('Voice channel ready.');u.lang='en-GB';u.rate=.92;u.pitch=1;u.volume=.72;u.onend=()=>{armed=true};synth.cancel();synth.resume();synth.speak(u);armed=true;return true}catch{return false}
};
window.jarvisPrimeSpeech=()=>{try{synth.resume()}catch{};armed=true;return true};
window.jarvisIsSpeechArmed=()=>armed;
const showUnlock=()=>{
  let b=document.querySelector('#jarvisAudioUnlock');
  if(b instanceof HTMLElement)return b;
  b=document.createElement('button');b.id='jarvisAudioUnlock';b.type='button';b.textContent='🔊';
  b.title='Activate JARVIS voice';b.setAttribute('aria-label','Activate JARVIS voice');
  b.style.cssText='position:fixed;right:18px;bottom:154px;z-index:2147483000;width:46px;height:46px;border:1px solid rgba(91,214,244,.72);border-radius:50%;background:rgba(4,16,22,.96);color:#bfefff;font:700 20px/1 system-ui;box-shadow:0 0 20px rgba(71,201,236,.22);touch-action:manipulation;pointer-events:auto;cursor:pointer';
  b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();arm();b.textContent='✓';b.title='JARVIS voice active'},true);
  b.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();arm();b.textContent='✓';b.title='JARVIS voice active'},true);
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation()},true);
  document.body.appendChild(b);return b;
};
const warm=e=>{const t=e.target;if(!(t instanceof Element))return;if(t.closest('#voiceBtn')){try{synth.resume()}catch{}window.jarvisPrimeSpeech?.()}};
document.addEventListener('pointerdown',warm,true);
document.addEventListener('touchstart',warm,true);
const install=()=>showUnlock();
new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
install();
})();
