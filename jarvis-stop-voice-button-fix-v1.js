(()=>{
  'use strict';
  if(window.__JARVIS_STOP_VOICE_BUTTON_FIX_V6__)return;
  window.__JARVIS_STOP_VOICE_BUTTON_FIX_V6__=true;
  const C=window.SpeechRecognition||window.webkitSpeechRecognition;
  const sessions=new Set();
  let blockedUntil=0;
  let stopping=false;
  if(C?.prototype){try{const nativeStart=C.prototype.start;C.prototype.start=function(...args){if(Date.now()<blockedUntil)return;sessions.add(this);try{this.addEventListener('end',()=>sessions.delete(this),{once:true})}catch{}try{this.addEventListener('error',()=>sessions.delete(this),{once:true})}catch{}return nativeStart.apply(this,args)}}catch{}}
  const stopRecognition=r=>{if(!r)return;try{r.onresult=null}catch{}try{r.onspeechend=null}catch{}try{r.onerror=null}catch{}try{r.onend=null}catch{}try{r.abort()}catch{}try{r.stop()}catch{}};
  const stopSpeechImmediately=()=>{
    try{window.jarvisVoiceAuthorityStop?.()}catch{}
    try{window.jarvisStopSpeaking?.()}catch{}
    try{window.speechSynthesis?.pause()}catch{}
    try{window.speechSynthesis?.cancel()}catch{}
    try{window.speechSynthesis?.cancel()}catch{}
  };
  const hardStop=()=>{
    if(stopping)return;
    stopping=true;
    try{
      blockedUntil=Date.now()+8000;
      for(const r of Array.from(sessions))stopRecognition(r);
      sessions.clear();
      stopSpeechImmediately();
      try{window.jarvisArmVoiceRelease?.(8000)}catch{}
      try{window.jarvisStopAllVoiceSessions?.()}catch{}
      try{window.jarvisStopVoice?.()}catch{}
      try{window.jarvisForceStopVoice?.()}catch{}
      stopSpeechImmediately();
      try{document.querySelector('#voiceBtn')?.classList.remove('listening')}catch{}
      try{document.querySelector('#jarvisSpeechStop')?.setAttribute('hidden','')}catch{}
      try{const b=document.querySelector('#jarvisIOSStopVoice');if(b instanceof HTMLElement)b.hidden=true}catch{}
      try{window.dispatchEvent(new CustomEvent('jarvis:force-stop-voice'))}catch{}
      stopSpeechImmediately();
    }finally{window.setTimeout(()=>{stopping=false},0)}
  };
  const isStopVoiceButton=target=>{const el=target?.closest?.('button,[role="button"],input');if(!el)return false;const label=`${el.textContent||''} ${el.getAttribute?.('aria-label')||''} ${el.getAttribute?.('id')||''}`.replace(/\s+/g,' ').trim();return /\bstop\s+voice\b/i.test(label)};
  const bindButton=button=>{if(!(button instanceof HTMLElement)||button.dataset.jarvisStopBound==='v6')return;button.dataset.jarvisStopBound='v6';const handler=event=>{event.preventDefault();event.stopImmediatePropagation();hardStop()};for(const type of ['pointerdown','pointerup','touchstart','touchend','mousedown','mouseup','click']){try{button.addEventListener(type,handler,{capture:true,passive:type!=='touchstart'&&type!=='touchend'})}catch{}}};
  const scan=()=>document.querySelectorAll('button,[role="button"],input').forEach(el=>{if(isStopVoiceButton(el))bindButton(el)});
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  scan();
  for(const type of ['pointerdown','pointerup','touchstart','touchend','mousedown','mouseup','click'])document.addEventListener(type,event=>{if(isStopVoiceButton(event.target))hardStop()},true);
  window.addEventListener('jarvis:force-stop-voice',hardStop,true);
  window.jarvisStopSpeechImmediately=stopSpeechImmediately;
})();
