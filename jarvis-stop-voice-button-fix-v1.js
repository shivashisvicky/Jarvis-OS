(()=>{
  'use strict';
  if(window.__JARVIS_STOP_VOICE_BUTTON_FIX_V1__)return;
  window.__JARVIS_STOP_VOICE_BUTTON_FIX_V1__=true;

  const isStopVoiceButton=target=>{
    const el=target?.closest?.('button,[role="button"],input');
    if(!el)return false;
    const label=`${el.textContent||''} ${el.getAttribute?.('aria-label')||''} ${el.getAttribute?.('id')||''}`.replace(/\s+/g,' ').trim();
    return /\bstop\s+voice\b/i.test(label);
  };

  const hardStop=()=>{
    try{window.jarvisArmVoiceRelease?.(5000)}catch{}
    try{window.jarvisStopAllVoiceSessions?.()}catch{}
    try{window.jarvisForceStopVoice?.()}catch{}
    try{window.jarvisStopIOSVoice?.()}catch{}
    try{window.speechSynthesis?.cancel()}catch{}
    try{window.speechSynthesis?.pause()}catch{}
    try{document.querySelector('#voiceBtn')?.classList.remove('listening')}catch{}
    try{
      const b=document.querySelector('#jarvisIOSStopVoice');
      if(b instanceof HTMLElement)b.hidden=true;
    }catch{}
    try{window.dispatchEvent(new CustomEvent('jarvis:force-stop-voice'))}catch{}
  };

  document.addEventListener('click',event=>{
    if(!isStopVoiceButton(event.target))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    hardStop();
  },true);
  document.addEventListener('pointerup',event=>{
    if(isStopVoiceButton(event.target))hardStop();
  },true);
})();
