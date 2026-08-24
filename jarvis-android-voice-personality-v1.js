(()=>{
'use strict';
if(window.__JARVIS_ANDROID_VOICE_PERSONALITY_V1__)return;
window.__JARVIS_ANDROID_VOICE_PERSONALITY_V1__=true;
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(isIOS||!('speechSynthesis'in window))return;
const synth=window.speechSynthesis;
const maleNames=['Daniel','Arthur','George','Oliver','James','Alex','Fred','Thomas','Brian','Ryan','Matthew','David','Andrew'];
const pickVoice=()=>{
 const voices=synth.getVoices();
 if(!voices.length)return null;
 const male=voices.find(v=>/^en-(GB|IN|US|AU|CA)/i.test(v.lang)&&maleNames.some(n=>v.name.toLowerCase().includes(n.toLowerCase())));
 if(male)return male;
 const marked=voices.find(v=>/^en-/i.test(v.lang)&&/male|masculine/i.test(v.name));
 if(marked)return marked;
 const nonFemale=voices.find(v=>/^en-GB/i.test(v.lang)&&!/(female|woman|girl|zira|samantha|susan|karen|moira|serena|victoria|google uk english female)/i.test(v.name));
 return nonFemale||voices.find(v=>/^en-GB/i.test(v.lang))||voices.find(v=>/^en-IN/i.test(v.lang))||voices.find(v=>/^en-/i.test(v.lang))||voices[0];
};
const speak=text=>{
 const clean=String(text||'').trim();if(!clean)return false;
 try{
  synth.cancel();
  const u=new SpeechSynthesisUtterance(clean);
  const v=pickVoice();
  if(v){u.voice=v;u.lang=v.lang}else u.lang='en-GB';
  u.rate=.92;u.pitch=.52;u.volume=.98;
  synth.speak(u);return true;
 }catch{return false}
};
const install=()=>{
 const current=window.jarvisCinematicSpeak||window.jarvisSpeak;
 if(current&&!current.__jarvisAndroidVoiceWrapped){
  const wrapped=text=>speak(text);
  wrapped.__jarvisAndroidVoiceWrapped=true;
  window.jarvisCinematicSpeak=wrapped;
  window.jarvisSpeak=wrapped;
 }
};
install();
if(typeof synth.addEventListener==='function')synth.addEventListener('voiceschanged',install);
let n=0;const timer=window.setInterval(()=>{install();if(++n>12)window.clearInterval(timer)},500);
})();
