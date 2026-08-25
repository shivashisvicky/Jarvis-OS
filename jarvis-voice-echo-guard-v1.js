(()=>{
'use strict';
if(window.__JARVIS_VOICE_ECHO_GUARD_V2__)return;
window.__JARVIS_VOICE_ECHO_GUARD_V2__=true;

const normalize=s=>String(s||'').replace(/[“”‘’]/g,'"').replace(/\s+/g,' ').trim().toLowerCase();
let lastReply='',lastReplyAt=0;
let speechGuardUntil=0;
const COOLDOWN_MS=1800;

const stopRecognition=()=>{
  try{window.jarvisStopVoiceRecognitionOnly?.()}catch{}
  try{window.jarvisStopIOSVoice?.()}catch{}
  try{window.jarvisStopAllVoiceSessions?.()}catch{}
};

const captureReply=()=>{
  const el=document.querySelector('#jarvisReply');
  if(!el)return;
  const text=String(el.textContent||'').replace(/\s+/g,' ').trim();
  if(text&&text!==lastReply){
    lastReply=text;
    lastReplyAt=Date.now();
    speechGuardUntil=Date.now()+COOLDOWN_MS;
    stopRecognition();
  }
};

const guard=e=>{
  const text=String(e.detail?.text||'').trim();
  if(!text)return;

  const now=Date.now();
  const synthesisSpeaking=typeof speechSynthesis!=='undefined'&&speechSynthesis.speaking;
  const recentReply=now-lastReplyAt<=COOLDOWN_MS;
  const reply=normalize(lastReply||document.querySelector('#jarvisReply')?.textContent||'');
  const heard=normalize(text);
  const exactEcho=!!reply&&!!heard&&heard===reply&&now-lastReplyAt<=8000;

  // Never let microphone recognition consume JARVIS's own TTS output.
  // iOS can deliver a recognition result even after stop() was requested,
  // so the guard must also cover the active speech window and a short tail.
  if(synthesisSpeaking||recentReply||now<speechGuardUntil||exactEcho){
    e.preventDefault?.();
    e.stopImmediatePropagation?.();
    speechGuardUntil=Math.max(speechGuardUntil,now+COOLDOWN_MS);
    stopRecognition();
    const input=document.querySelector('#commandInput');
    if(input instanceof HTMLInputElement){
      input.value='';
      input.dispatchEvent(new Event('input',{bubbles:true}));
    }
  }
};

const observe=()=>{
  captureReply();
  const root=document.querySelector('#jarvisReply');
  if(root)new MutationObserver(captureReply).observe(root,{childList:true,characterData:true,subtree:true});
};

window.addEventListener('jarvis:voice-command',guard,true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
new MutationObserver(()=>{if(document.querySelector('#jarvisReply'))captureReply()}).observe(document.documentElement,{childList:true,subtree:true});
})();
