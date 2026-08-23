(()=>{
  'use strict';
  if(window.__JARVIS_STOP_VOICE_BUTTON_FIX_V11__)return;
  window.__JARVIS_STOP_VOICE_BUTTON_FIX_V11__=true;

  const synth=window.speechSynthesis||null;
  let stopping=false;

  const stopEverything=()=>{
    if(stopping)return;
    stopping=true;
    try{window.jarvisStopSpeechImmediately?.()}catch{}
    try{window.jarvisStopSpeaking?.()}catch{}
    try{window.jarvisCinematicStop?.()}catch{}
    try{window.jarvisVoiceAuthorityStop?.()}catch{}
    try{synth?.cancel()}catch{}
    try{window.jarvisStopAllVoiceSessions?.()}catch{}
    try{window.jarvisStopIOSVoice?.()}catch{}
    try{window.jarvisStopVoice?.()}catch{}
    try{window.jarvisForceStopVoice?.()}catch{}
    try{window.jarvisArmVoiceRelease?.(2500)}catch{}
    try{document.querySelector('#voiceBtn')?.classList.remove('listening')}catch{}
    try{window.dispatchEvent(new CustomEvent('jarvis:voice-stop',{detail:{source:'stop-button-v11'}}))}catch{}
    window.setTimeout(()=>{try{synth?.cancel()}catch{};try{window.jarvisStopAllVoiceSessions?.()}catch{}},80);
    window.setTimeout(()=>{try{synth?.cancel()}catch{}},220);
    window.setTimeout(()=>{try{synth?.cancel()}catch{};stopping=false},500);
  };

  const locate=()=>{
    const candidates=[...document.querySelectorAll('button,[role="button"],input')];
    return candidates.find(el=>{
      const text=`${el.textContent||''} ${el.getAttribute?.('aria-label')||''} ${el.getAttribute?.('id')||''}`.replace(/\s+/g,' ').trim();
      return /\bstop\s+voice\b/i.test(text);
    })||null;
  };

  const mark=button=>{
    if(!(button instanceof HTMLElement))return;
    button.dataset.jarvisStopBound='v11';
    button.style.pointerEvents='auto';
    button.style.touchAction='manipulation';
    button.style.position='relative';
    button.style.zIndex='2147483647';
    button.style.cursor='pointer';
    button.style.webkitTapHighlightColor='transparent';
    if(!document.getElementById('jarvis-stop-v11-style')){
      const style=document.createElement('style');
      style.id='jarvis-stop-v11-style';
      style.textContent='.jarvis-stop-v11-pressed{filter:brightness(1.8)!important;transform:scale(.96)!important;outline:2px solid currentColor!important;box-shadow:0 0 0 5px rgba(255,255,255,.22),0 0 30px currentColor!important;transition:none!important}';
      document.head.appendChild(style);
    }
    const press=e=>{
      e.preventDefault();
      e.stopImmediatePropagation();
      button.classList.add('jarvis-stop-v11-pressed');
      button.setAttribute('aria-pressed','true');
      stopEverything();
      window.setTimeout(()=>button.classList.remove('jarvis-stop-v11-pressed'),350);
    };
    if(button.__jarvisV11)return;
    button.__jarvisV11=true;
    button.addEventListener('pointerdown',press,{capture:true,passive:false});
    button.addEventListener('touchstart',press,{capture:true,passive:false});
    button.addEventListener('click',press,{capture:true,passive:false});
  };

  const scan=()=>{const b=locate();if(b)mark(b)};
  scan();
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  window.setInterval(scan,500);
})();
