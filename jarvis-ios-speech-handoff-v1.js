(()=>{
'use strict';
if(window.__JARVIS_IOS_SPEECH_HANDOFF_V1__)return;
window.__JARVIS_IOS_SPEECH_HANDOFF_V1__=true;
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!isIOS||!('speechSynthesis'in window))return;
const synth=window.speechSynthesis;
const nativeSpeak=synth.speak.bind(synth);
let voiceHandoffUntil=0;
let timer=null;
window.addEventListener('jarvis:voice-command',()=>{voiceHandoffUntil=Date.now()+700},true);
const speakSafely=u=>{try{synth.resume()}catch{}try{nativeSpeak(u);return true}catch{return false}};
try{
  synth.speak=function(u){
    if(!u)return;
    const remaining=voiceHandoffUntil-Date.now();
    if(remaining>0){if(timer)clearTimeout(timer);timer=setTimeout(()=>{timer=null;speakSafely(u)},Math.max(260,remaining));return}
    speakSafely(u);
  };
}catch{}
window.jarvisIOSSpeechHandoff=()=>{voiceHandoffUntil=Date.now()+450};
})();
