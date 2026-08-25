(()=>{
'use strict';
if(window.__JARVIS_VOICE_ECHO_GUARD_V1__)return;
window.__JARVIS_VOICE_ECHO_GUARD_V1__=true;

const normalize=s=>String(s||'').replace(/[“”‘’]/g,'"').replace(/\s+/g,' ').trim().toLowerCase();
let lastReply='',lastReplyAt=0;
const captureReply=()=>{
  const el=document.querySelector('#jarvisReply');
  if(!el)return;
  const text=String(el.textContent||'').replace(/\s+/g,' ').trim();
  if(text&&text!==lastReply){lastReply=text;lastReplyAt=Date.now();}
};
const guard=e=>{
  const text=String(e.detail?.text||'').trim();
  if(!text)return;
  const reply=normalize(lastReply||document.querySelector('#jarvisReply')?.textContent||'');
  const heard=normalize(text);
  if(!reply||!heard||heard!==reply)return;
  const age=Date.now()-lastReplyAt;
  if(age>8000)return;
  e.preventDefault?.();
  e.stopImmediatePropagation?.();
  try{window.jarvisStopVoiceRecognitionOnly?.()}catch{}
  try{window.jarvisStopIOSVoice?.()}catch{}
  try{window.jarvisStopAllVoiceSessions?.()}catch{}
  const input=document.querySelector('#commandInput');
  if(input instanceof HTMLInputElement){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));}
};
const observe=()=>{
  captureReply();
  const root=document.querySelector('#jarvisReply');
  if(root){new MutationObserver(captureReply).observe(root,{childList:true,characterData:true,subtree:true});}
};
window.addEventListener('jarvis:voice-command',guard,true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
new MutationObserver(()=>{if(!document.querySelector('#jarvisReply'))return;captureReply()}).observe(document.documentElement,{childList:true,subtree:true});
})();
