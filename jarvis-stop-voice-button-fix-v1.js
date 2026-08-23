(()=>{
  'use strict';
  if(window.__JARVIS_STOP_VOICE_BUTTON_FIX_V2__)return;
  window.__JARVIS_STOP_VOICE_BUTTON_FIX_V2__=true;
  const C=window.SpeechRecognition||window.webkitSpeechRecognition;
  const sessions=new Set();
  let blockedUntil=0;
  if(C?.prototype){try{const nativeStart=C.prototype.start;C.prototype.start=function(...args){if(Date.now()<blockedUntil)return;sessions.add(this);try{this.addEventListener('end',()=>sessions.delete(this),{once:true})}catch{}try{this.addEventListener('error',()=>sessions.delete(this),{once:true})}catch{}return nativeStart.apply(this,args)}}catch{}}
  const stopRecognition=r=>{if(!r)return;try{r.onresult=null}catch{}try{r.onspeechend=null}catch{}try{r.onerror=null}catch{}try{r.onend=null}catch{}try{r.abort()}catch{}try{r.stop()}catch{}};
  const hardStop=()=>{blockedUntil=Date.now()+6000;for(const r of Array.from(sessions))stopRecognition(r);sessions.clear();try{window.jarvisArmVoiceRelease?.(6000)}catch{}try{window.jarvisStopAllVoiceSessions?.()}catch{}try{window.jarvisStopIOSVoice?.()}catch{}try{window.jarvisStopVoice?.()}catch{}try{window.jarvisForceStopVoice?.()}catch{}try{window.speechSynthesis?.cancel()}catch{}try{window.speechSynthesis?.resume()}catch{}try{document.querySelector('#voiceBtn')?.classList.remove('listening')}catch{}try{const b=document.querySelector('#jarvisIOSStopVoice');if(b instanceof HTMLElement)b.hidden=true}catch{}try{window.dispatchEvent(new CustomEvent('jarvis:force-stop-voice'))}catch{}};
  const isStopVoiceButton=target=>{const el=target?.closest?.('button,[role="button"],input');if(!el)return false;const label=`${el.textContent||''} ${el.getAttribute?.('aria-label')||''} ${el.getAttribute?.('id')||''}`.replace(/\s+/g,' ').trim();return /\bstop\s+voice\b/i.test(label)};
  const bindButton=button=>{if(!(button instanceof HTMLElement)||button.dataset.jarvisStopBound==='v2')return;button.dataset.jarvisStopBound='v2';const handler=event=>{event.preventDefault();event.stopImmediatePropagation();hardStop()};button.addEventListener('pointerdown',handler,{capture:true});button.addEventListener('touchstart',handler,{capture:true,passive:false});button.addEventListener('click',handler,{capture:true})};
  const scan=()=>document.querySelectorAll('button,[role="button"],input').forEach(el=>{if(isStopVoiceButton(el))bindButton(el)});
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});scan();
  document.addEventListener('pointerdown',event=>{if(isStopVoiceButton(event.target))hardStop()},true);document.addEventListener('touchstart',event=>{if(isStopVoiceButton(event.target))hardStop()},true);document.addEventListener('click',event=>{if(isStopVoiceButton(event.target))hardStop()},true);window.addEventListener('jarvis:force-stop-voice',hardStop,true);
})();
