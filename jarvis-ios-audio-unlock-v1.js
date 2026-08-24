(()=>{
'use strict';
if(window.__JARVIS_IOS_AUDIO_UNLOCK_V1__)return;
window.__JARVIS_IOS_AUDIO_UNLOCK_V1__=true;
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
const install=()=>{
  if(document.querySelector('#jarvisAudioUnlock'))return;
  const host=document.querySelector('#commandForm');
  if(!(host instanceof HTMLFormElement))return;
  const b=document.createElement('button');
  b.id='jarvisAudioUnlock';b.type='button';b.textContent='🔊';
  b.title='Activate JARVIS voice';b.setAttribute('aria-label','Activate JARVIS voice');
  b.style.cssText='min-width:42px;height:42px;margin-left:6px;border:1px solid rgba(91,214,244,.65);border-radius:10px;background:rgba(7,20,28,.92);color:#bfefff;font:700 15px/1 system-ui;cursor:pointer;touch-action:manipulation;';
  b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();arm();b.textContent='✓';b.title='JARVIS voice active'},true);
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation()},true);
  const run=host.querySelector('#voiceBtn');if(run)run.insertAdjacentElement('afterend',b);
};
const warm=e=>{const t=e.target;if(!(t instanceof Element))return;if(t.closest('#voiceBtn')){try{synth.resume()}catch{}window.jarvisPrimeSpeech?.()}};
document.addEventListener('pointerdown',warm,true);
document.addEventListener('touchstart',warm,true);
const observer=new MutationObserver(install);observer.observe(document.documentElement,{childList:true,subtree:true});
install();
})();
