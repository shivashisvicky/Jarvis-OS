(()=>{
  'use strict';
  if(window.__JARVIS_STOP_VOICE_BUTTON_FIX_V8__)return;
  window.__JARVIS_STOP_VOICE_BUTTON_FIX_V8__=true;

  const synth=window.speechSynthesis||null;
  const C=window.SpeechRecognition||window.webkitSpeechRecognition;
  const sessions=new Set();
  let blockedUntil=0;
  let stopping=false;
  let nativeSpeak=null;
  let nativeCancel=null;

  if(synth){
    try{
      nativeSpeak=synth.speak.bind(synth);
      nativeCancel=synth.cancel.bind(synth);
      synth.speak=function(utterance){
        if(Date.now()<blockedUntil)return;
        return nativeSpeak(utterance);
      };
    }catch{}
  }

  if(C?.prototype){
    try{
      const nativeStart=C.prototype.start;
      C.prototype.start=function(...args){
        if(Date.now()<blockedUntil)return;
        sessions.add(this);
        try{this.addEventListener('end',()=>sessions.delete(this),{once:true})}catch{}
        try{this.addEventListener('error',()=>sessions.delete(this),{once:true})}catch{}
        return nativeStart.apply(this,args);
      };
    }catch{}
  }

  const stopRecognition=r=>{
    if(!r)return;
    try{r.onresult=null}catch{}
    try{r.onspeechend=null}catch{}
    try{r.onerror=null}catch{}
    try{r.onend=null}catch{}
    try{r.abort()}catch{}
    try{r.stop()}catch{}
  };

  const cancelSpeech=()=>{
    try{window.jarvisStopSpeechImmediately?.()}catch{}
    try{window.jarvisStopSpeaking?.()}catch{}
    try{window.jarvisCinematicStop?.()}catch{}
    try{window.jarvisVoiceAuthorityStop?.()}catch{}
    if(synth){
      try{nativeCancel?.()}catch{}
      try{synth.pause()}catch{}
      try{synth.cancel()}catch{}
      try{nativeCancel?.()}catch{}
      try{synth.cancel()}catch{}
      try{synth.resume()}catch{}
    }
  };

  const hardStop=()=>{
    if(stopping)return;
    stopping=true;
    blockedUntil=Date.now()+1800;
    try{
      for(const r of Array.from(sessions))stopRecognition(r);
      sessions.clear();
      try{window.jarvisArmVoiceRelease?.(1800)}catch{}
      try{window.jarvisStopAllVoiceSessions?.()}catch{}
      try{window.jarvisStopIOSVoice?.()}catch{}
      try{window.jarvisStopVoice?.()}catch{}
      try{window.jarvisForceStopVoice?.()}catch{}
      cancelSpeech();
      try{window.dispatchEvent(new CustomEvent('jarvis:voice-stop',{detail:{source:'stop-button'},cancelable:false}))}catch{}
      [16,60,150,300,600,1000].forEach(ms=>window.setTimeout(cancelSpeech,ms));
      try{document.querySelector('#voiceBtn')?.classList.remove('listening')}catch{}
      try{document.querySelector('#jarvisSpeechStop')?.setAttribute('hidden','')}catch{}
      try{const b=document.querySelector('#jarvisIOSStopVoice');if(b instanceof HTMLElement)b.hidden=true}catch{}
    }finally{
      window.setTimeout(()=>{stopping=false},0);
    }
  };

  const isStopVoiceButton=target=>{
    const el=target?.closest?.('button,[role="button"],input');
    if(!el)return false;
    const label=`${el.textContent||''} ${el.getAttribute?.('aria-label')||''} ${el.getAttribute?.('id')||''}`.replace(/\s+/g,' ').trim();
    return /\bstop\s+voice\b/i.test(label);
  };

  const bindButton=button=>{
    if(!(button instanceof HTMLElement)||button.dataset.jarvisStopBound==='v8')return;
    button.dataset.jarvisStopBound='v8';
    const handler=event=>{
      event.preventDefault();
      event.stopImmediatePropagation();
      hardStop();
    };
    for(const type of ['pointerdown','touchstart','mousedown','click']){
      try{button.addEventListener(type,handler,{capture:true,passive:false})}catch{}
    }
  };

  const scan=()=>document.querySelectorAll('button,[role="button"],input').forEach(el=>{if(isStopVoiceButton(el))bindButton(el)});
  scan();
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  for(const type of ['pointerdown','touchstart','mousedown','click']){
    document.addEventListener(type,event=>{if(isStopVoiceButton(event.target))hardStop()},true);
  }
})();
