(()=>{
'use strict';
if(window.__JARVIS_IOS_AUDIO_UNLOCK_V2__)return;
window.__JARVIS_IOS_AUDIO_UNLOCK_V2__=true;
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!isIOS||!('speechSynthesis'in window))return;
const synth=window.speechSynthesis;
let ctx=null;
const resumeAudio=()=>{try{const C=window.AudioContext||window.webkitAudioContext;if(C){if(!ctx||ctx.state==='closed')ctx=new C({latencyHint:'interactive'});if(ctx.state!=='running')void ctx.resume();}}catch{}};
const chime=()=>{try{resumeAudio();if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=880;g.gain.setValueAtTime(.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.045,ctx.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.09);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.1)}catch{}};
const chooseVoice=()=>{const vs=synth.getVoices();return vs.find(v=>/^en-GB/i.test(v.lang)&&/Daniel|Arthur|George|Oliver|James|Thomas/i.test(v.name))||vs.find(v=>/^en-GB/i.test(v.lang))||vs.find(v=>/^en-IN/i.test(v.lang))||vs[0]};
const speakUnlock=button=>{resumeAudio();chime();try{synth.cancel();synth.resume();const u=new SpeechSynthesisUtterance('JARVIS voice channel ready.');u.lang='en-GB';u.rate=.92;u.pitch=.54;u.volume=.96;const v=chooseVoice();if(v){u.voice=v;u.lang=v.lang}u.onstart=()=>{button.textContent='✓';button.dataset.active='1'};u.onerror=()=>{button.textContent='!';button.dataset.active='0'};u.onend=()=>{button.textContent='✓';button.dataset.active='1'};synth.speak(u);return true}catch{button.textContent='!';return false}};
window.jarvisPrimeSpeech=()=>{resumeAudio();try{synth.resume()}catch{}return true};
const install=()=>{const old=document.querySelector('#jarvisAudioUnlock');if(!(old instanceof HTMLButtonElement))return;if(old.dataset.v2==='1')return;const b=old.cloneNode(true);if(!(b instanceof HTMLButtonElement))return;b.dataset.v2='1';b.textContent='🔊';b.title='Activate JARVIS voice';b.setAttribute('aria-label','Activate JARVIS voice');b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();speakUnlock(b)},true);old.replaceWith(b)};
const observer=new MutationObserver(install);observer.observe(document.documentElement,{childList:true,subtree:true});install();
})();
