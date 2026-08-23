(()=>{
  'use strict';
  if(window.__JARVIS_STOP_VOICE_BUTTON_FIX_V9__)return;
  window.__JARVIS_STOP_VOICE_BUTTON_FIX_V9__=true;

  const synth=window.speechSynthesis||null;
  let bound=false;
  let stopping=false;
  let blockedUntil=0;
  let lastPointer=0;

  const cancelSpeech=()=>{
    try{window.jarvisStopSpeechImmediately?.()}catch{}
    try{window.jarvisStopSpeaking?.()}catch{}
    try{window.jarvisCinematicStop?.()}catch{}
    try{window.jarvisVoiceAuthorityStop?.()}catch{}
    if(synth){
      try{synth.cancel()}catch{}
    }
  };

  const stopMic=()=>{
    try{window.jarvisStopAllVoiceSessions?.()}catch{}
    try{window.jarvisStopIOSVoice?.()}catch{}
    try{window.jarvisStopVoice?.()}catch{}
    try{window.jarvisForceStopVoice?.()}catch{}
    try{window.jarvisArmVoiceRelease?.(2500)}catch{}
    try{document.querySelector('#voiceBtn')?.classList.remove('listening')}catch{}
  };

  const hardStop=()=>{
    if(stopping)return;
    stopping=true;
    blockedUntil=Date.now()+1500;
    cancelSpeech();
    stopMic();
    try{window.dispatchEvent(new CustomEvent('jarvis:voice-stop',{detail:{source:'stop-button-v9'}}))}catch{}
    window.setTimeout(()=>{cancelSpeech();stopMic()},0);
    window.setTimeout(()=>{cancelSpeech()},80);
    window.setTimeout(()=>{cancelSpeech()},220);
    window.setTimeout(()=>{cancelSpeech()},500);
    try{const b=document.querySelector('#jarvisIOSStopVoice');if(b instanceof HTMLElement)b.hidden=true}catch{}
    try{document.querySelector('#jarvisSpeechStop')?.setAttribute('hidden','')}catch{}
    window.setTimeout(()=>{stopping=false},0);
  };

  const isStop=target=>{
    const el=target?.closest?.('button,[role="button"],input');
    if(!el)return false;
    const text=`${el.textContent||''} ${el.getAttribute?.('aria-label')||''} ${el.getAttribute?.('id')||''}`.replace(/\s+/g,' ').trim();
    return /\bstop\s+voice\b/i.test(text);
  };

  const bind=button=>{
    if(!(button instanceof HTMLElement)||button.dataset.jarvisStopBound==='v9')return;
    button.dataset.jarvisStopBound='v9';
    const handler=e=>{
      const now=Date.now();
      if(now-lastPointer<120)return;
      lastPointer=now;
      e.preventDefault();
      e.stopImmediatePropagation();
      hardStop();
    };
    button.addEventListener('pointerdown',handler,{capture:true,passive:false});
    button.addEventListener('touchstart',handler,{capture:true,passive:false});
    button.addEventListener('mousedown',handler,{capture:true,passive:false});
    button.addEventListener('click',handler,{capture:true,passive:false});
  };

  const scan=()=>document.querySelectorAll('button,[role="button"],input').forEach(el=>{if(isStop(el))bind(el)});
  scan();
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  for(const type of ['pointerdown','touchstart','mousedown','click']){
    document.addEventListener(type,e=>{if(isStop(e.target))hardStop()},true);
  }
})();
