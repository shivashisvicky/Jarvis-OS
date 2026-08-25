(()=>{
'use strict';
if(window.__JARVIS_VOICE_ECHO_GUARD_V3__)return;
window.__JARVIS_VOICE_ECHO_GUARD_V3__=true;

const normalize=s=>String(s||'').replace(/[“”‘’]/g,'"').replace(/\s+/g,' ').trim().toLowerCase();
let lastReply='',lastReplyAt=0;
const TTS_TAIL_MS=3500;
const markTts=()=>{
  window.__JARVIS_VOICE_TTS_GUARD_ACTIVE__=true;
  window.__JARVIS_VOICE_TTS_GUARD_UNTIL__=Date.now()+TTS_TAIL_MS;
  try{window.jarvisStopVoiceRecognitionOnly?.()}catch{}
  try{window.jarvisStopIOSVoice?.()}catch{}
  try{window.jarvisStopAllVoiceSessions?.()}catch{}
};
const ttsGuardActive=()=>{
  const until=Number(window.__JARVIS_VOICE_TTS_GUARD_UNTIL__||0);
  const speaking=typeof speechSynthesis!=='undefined'&&speechSynthesis.speaking;
  if(speaking||Date.now()<until)return true;
  window.__JARVIS_VOICE_TTS_GUARD_ACTIVE__=false;
  return false;
};

// iOS can deliver a recognition result after stop() has already been requested.
// Guard the TTS boundary itself, rather than comparing the captured words with
// the last reply. That prevents JARVIS speech from becoming a fresh command.
const installSpeechGuard=()=>{
  const synth=window.speechSynthesis;
  if(!synth||typeof synth.speak!=='function')return;
  if(synth.speak.__jarvisTtsGuard)return;
  const original=synth.speak.bind(synth);
  const wrapped=function(utterance){
    markTts();
    try{
      const oldEnd=utterance?.onend;
      if(utterance){
        utterance.onend=function(event){
          try{oldEnd?.call(this,event)}catch{}
          window.__JARVIS_VOICE_TTS_GUARD_UNTIL__=Date.now()+TTS_TAIL_MS;
          window.__JARVIS_VOICE_TTS_GUARD_ACTIVE__=true;
        };
      }
    }catch{}
    return original(utterance);
  };
  wrapped.__jarvisTtsGuard=true;
  synth.speak=wrapped;
};

const captureReply=()=>{
  const el=document.querySelector('#jarvisReply');
  if(!el)return;
  const text=String(el.textContent||'').replace(/\s+/g,' ').trim();
  if(text&&text!==lastReply){
    lastReply=text;
    lastReplyAt=Date.now();
  }
};

const guard=e=>{
  const text=String(e.detail?.text||'').trim();
  if(!text)return;
  const now=Date.now();
  const reply=normalize(lastReply||document.querySelector('#jarvisReply')?.textContent||'');
  const heard=normalize(text);
  const exactEcho=!!reply&&!!heard&&heard===reply&&now-lastReplyAt<=8000;
  if(ttsGuardActive()||exactEcho){
    e.preventDefault?.();
    e.stopImmediatePropagation?.();
    markTts();
    const input=document.querySelector('#commandInput');
    if(input instanceof HTMLInputElement){
      input.value='';
      input.dispatchEvent(new Event('input',{bubbles:true}));
    }
  }
};

const observe=()=>{
  captureReply();
  installSpeechGuard();
  const root=document.querySelector('#jarvisReply');
  if(root&&!root.__jarvisEchoObserver){
    root.__jarvisEchoObserver=true;
    new MutationObserver(captureReply).observe(root,{childList:true,characterData:true,subtree:true});
  }
};

window.addEventListener('jarvis:voice-command',guard,true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
new MutationObserver(()=>{if(document.querySelector('#jarvisReply'))observe()}).observe(document.documentElement,{childList:true,subtree:true});
// The voice feature is dynamically loaded, so keep the boundary wrapper alive
// long enough to catch its later speechSynthesis override.
const timer=window.setInterval(installSpeechGuard,250);
window.setTimeout(()=>window.clearInterval(timer),20000);
})();
