(()=>{
'use strict';
if(window.__JARVIS_IOS_COMMAND_VOICE_FIX_V3__)return;
window.__JARVIS_IOS_COMMAND_VOICE_FIX_V3__=true;
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!isIOS)return;
const C=window.SpeechRecognition||window.webkitSpeechRecognition;
if(!C)return;
let recognition=null;
let stopTimer=0;
let lastSubmitted='';
let lastSubmittedAt=0;
let generation=0;
const button=()=>document.querySelector('#voiceBtn');
const setState=active=>{const b=button();if(b instanceof HTMLElement)b.classList.toggle('listening',Boolean(active));};
const clearWatchdog=()=>{if(stopTimer){window.clearTimeout(stopTimer);stopTimer=0}};
const releaseMic=r=>{if(!r)return;try{r.abort()}catch{try{r.stop()}catch{}}[0,80,250,600].forEach(ms=>window.setTimeout(()=>{try{r.abort()}catch{try{r.stop()}catch{}}},ms))};
const stop=()=>{generation++;clearWatchdog();const r=recognition;recognition=null;if(r){try{r.onresult=null;r.onspeechend=null;r.onerror=null;r.onend=null}catch{}releaseMic(r)}setState(false);};
window.jarvisStopIOSVoice=stop;
window.jarvisStopVoiceRecognitionOnly=stop;
window.jarvisForceStopVoice=()=>{try{window.jarvisStopVoice?.()}catch{};stop()};
window.addEventListener('jarvis:force-stop-voice',window.jarvisForceStopVoice,true);
const primeSpeechFromGesture=()=>{try{if(typeof window.jarvisPrimeSpeech==='function'){window.jarvisPrimeSpeech();return}if('speechSynthesis'in window){const synth=window.speechSynthesis;synth.cancel();synth.resume();const u=new SpeechSynthesisUtterance('.');u.volume=0;u.rate=1;u.lang='en-GB';synth.speak(u);window.setTimeout(()=>{try{synth.cancel();synth.resume()}catch{}},120)}}catch{}};
const submitTranscript=text=>{const input=document.querySelector('#commandInput');const form=document.querySelector('#commandForm');if(!(input instanceof HTMLInputElement)||!(form instanceof HTMLFormElement))return;const normalized=String(text||'').trim().replace(/\s+/g,' ').toLowerCase();const now=Date.now();if(!normalized)return;if(normalized===lastSubmitted&&now-lastSubmittedAt<3500)return;lastSubmitted=normalized;lastSubmittedAt=now;input.value=text;input.dispatchEvent(new Event('input',{bubbles:true}));form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))};
const start=e=>{
 const t=e.target instanceof Element?e.target.closest('#voiceBtn'):null;if(!t)return;
 e.preventDefault();e.stopImmediatePropagation();
 if(recognition){stop();return}
 primeSpeechFromGesture();
 const myGeneration=++generation;
 const r=new C();recognition=r;
 r.lang='en-GB';r.interimResults=true;r.continuous=false;r.maxAlternatives=3;
 r.onstart=()=>{if(recognition!==r||generation!==myGeneration){releaseMic(r);return}setState(true);clearWatchdog();stopTimer=window.setTimeout(()=>{if(recognition===r)stop()},7000)};
 r.onspeechend=()=>{if(recognition===r)window.setTimeout(()=>{if(recognition===r)stop()},100)};
 r.onresult=ev=>{if(recognition!==r)return;let final='';for(let i=ev.resultIndex;i<ev.results.length;i++)if(ev.results[i].isFinal)final+=ev.results[i][0].transcript;if(final.trim()){const text=final.trim();const current=r;stop();submitTranscript(text);releaseMic(current)}};
 r.onerror=()=>{if(recognition===r)stop();else releaseMic(r)};
 r.onend=()=>{if(recognition===r){clearWatchdog();recognition=null;setState(false)}};
 try{r.start()}catch{stop()}
};
// Capture one authoritative tap path. This prevents the React/module handler
// and this iOS fallback from both creating recognition sessions.
document.addEventListener('click',start,true);
document.addEventListener('pointerup',e=>{const t=e.target instanceof Element?e.target.closest('#voiceBtn'):null;if(t){try{e.preventDefault();e.stopImmediatePropagation()}catch{}start(e)}},true);
document.addEventListener('submit',e=>{if(e.target instanceof HTMLFormElement&&e.target.id==='commandForm')stop()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')stop()},true);
window.addEventListener('jarvis:voice-command',()=>stop(),true);
window.addEventListener('pagehide',stop);window.addEventListener('beforeunload',stop);window.addEventListener('pageshow',()=>{stop();setState(false)});window.addEventListener('popstate',()=>{stop();setState(false)});window.addEventListener('hashchange',()=>{stop();setState(false)});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else setState(false)});
})();
