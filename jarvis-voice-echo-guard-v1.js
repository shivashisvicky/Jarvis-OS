(()=>{
'use strict';
if(window.__JARVIS_VOICE_ECHO_GUARD_V4__)return;
window.__JARVIS_VOICE_ECHO_GUARD_V4__=true;
const normalize=s=>String(s||'').replace(/[“”‘’]/g,'"').replace(/\s+/g,' ').trim().toLowerCase();
let lastReply='',lastReplyAt=0;const TTS_TAIL_MS=3500;
const markTts=()=>{window.__JARVIS_VOICE_TTS_GUARD_ACTIVE__=true;window.__JARVIS_VOICE_TTS_GUARD_UNTIL__=Date.now()+TTS_TAIL_MS;try{window.jarvisStopVoiceRecognitionOnly?.()}catch{}try{window.jarvisStopIOSVoice?.()}catch{}try{window.jarvisStopAllVoiceSessions?.()}catch{}};
const installSpeechGuard=()=>{const synth=window.speechSynthesis;if(!synth||typeof synth.speak!=='function'||synth.speak.__jarvisTtsGuard)return;const original=synth.speak.bind(synth);const wrapped=function(utterance){markTts();try{const oldEnd=utterance?.onend;if(utterance)utterance.onend=function(event){try{oldEnd?.call(this,event)}catch{}window.__JARVIS_VOICE_TTS_GUARD_UNTIL__=Date.now()+TTS_TAIL_MS;window.__JARVIS_VOICE_TTS_GUARD_ACTIVE__=true}}catch{}return original(utterance)};wrapped.__jarvisTtsGuard=true;synth.speak=wrapped};
const captureReply=()=>{const el=document.querySelector('#jarvisReply');if(!el)return;const text=String(el.textContent||'').replace(/\s+/g,' ').trim();if(text&&text!==lastReply){lastReply=text;lastReplyAt=Date.now()}};
const guard=e=>{const text=String(e.detail?.text||'').trim();if(!text)return;const now=Date.now(),reply=normalize(lastReply||document.querySelector('#jarvisReply')?.textContent||''),heard=normalize(text),exactEcho=!!reply&&!!heard&&heard===reply&&now-lastReplyAt<=8000;if(exactEcho){e.preventDefault?.();e.stopImmediatePropagation?.();markTts();const input=document.querySelector('#commandInput');if(input instanceof HTMLInputElement){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}))}}else{window.__JARVIS_VOICE_TTS_GUARD_ACTIVE__=false}};
const observe=()=>{captureReply();installSpeechGuard();const root=document.querySelector('#jarvisReply');if(root&&!root.__jarvisEchoObserver){root.__jarvisEchoObserver=true;new MutationObserver(captureReply).observe(root,{childList:true,characterData:true,subtree:true})}};
window.addEventListener('jarvis:voice-command',guard,true);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();new MutationObserver(()=>{if(document.querySelector('#jarvisReply'))observe()}).observe(document.documentElement,{childList:true,subtree:true});const timer=window.setInterval(installSpeechGuard,250);window.setTimeout(()=>window.clearInterval(timer),20000);
})();
