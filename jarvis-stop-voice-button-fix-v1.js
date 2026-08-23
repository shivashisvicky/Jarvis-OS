(()=>{
  'use strict';
  if(window.__JARVIS_STOP_VOICE_BUTTON_FIX_V10__)return;
  window.__JARVIS_STOP_VOICE_BUTTON_FIX_V10__=true;

  const synth=window.speechSynthesis||null;
  let stopping=false;
  let lastTap=0;

  const cancelSpeech=()=>{
    try{window.jarvisStopSpeechImmediately?.()}catch{}
    try{window.jarvisStopSpeaking?.()}catch{}
    try{window.jarvisCinematicStop?.()}catch{}
    try{window.jarvisVoiceAuthorityStop?.()}catch{}
    try{synth?.cancel()}catch{}
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
    cancelSpeech();
    stopMic();
    try{window.dispatchEvent(new CustomEvent('jarvis:voice-stop',{detail:{source:'stop-button-v10'}}))}catch{}
    window.setTimeout(cancelSpeech,80);
    window.setTimeout(cancelSpeech,220);
    window.setTimeout(cancelSpeech,500);
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
    if(!(button instanceof HTMLElement)||button.dataset.jarvisStopBound==='v10')return;
    button.dataset.jarvisStopBound='v10';
    button.style.webkitTapHighlightColor='transparent';
    button.style.touchAction='manipulation';
    const down=event=>{
      const now=Date.now();
      if(now-lastTap<150)return;
      lastTap=now;
      event.preventDefault();
      event.stopImmediatePropagation();
      button.classList.add('jarvis-stop-pressed');
      button.setAttribute('aria-pressed','true');
      window.setTimeout(()=>button.classList.remove('jarvis-stop-pressed'),180);
      hardStop();
    };
    const up=()=>button.classList.remove('jarvis-stop-pressed');
    button.addEventListener('pointerdown',down,{capture:true,passive:false});
    button.addEventListener('touchstart',down,{capture:true,passive:false});
    button.addEventListener('mousedown',down,{capture:true,passive:false});
    button.addEventListener('pointerup',up,{capture:true});
    button.addEventListener('touchend',up,{capture:true});
    button.addEventListener('click',up,{capture:true});
  };

  const scan=()=>document.querySelectorAll('button,[role="button"],input').forEach(el=>{if(isStop(el))bind(el)});
  scan();
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
})();
