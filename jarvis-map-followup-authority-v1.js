(()=>{
'use strict';
if(window.__JARVIS_MAP_FOLLOWUP_AUTHORITY_V1__)return;
window.__JARVIS_MAP_FOLLOWUP_AUTHORITY_V1__=true;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const isNearest=q=>/^(?:what(?:'s| is)\s+)?(?:the\s+)?(?:nearest|closest)\s+(?:one|restaurant|place|option)s?\s*[?.!]*$/i.test(clean(q))||/^(?:which|what)\s+(?:one|restaurant|place|option)\s+is\s+(?:the\s+)?(?:nearest|closest)\s*[?.!]*$/i.test(clean(q));
const context=()=>{try{return window.jarvisContextEngine?.get?.()||null}catch{return null}};
const speak=text=>{const cleanText=clean(text);if(!cleanText)return;const el=document.querySelector('#jarvisReply');if(el){el.textContent=cleanText;el.classList.add('visible')}try{window.jarvisVoiceAuthoritySpeak?.(cleanText)||window.jarvisCinematicSpeak?.(cleanText)||window.jarvisSpeak?.(cleanText)}catch{}};
const stop=()=>{try{window.jarvisStopAllVoiceSessions?.()}catch{}try{window.jarvisStopIOSVoice?.()}catch{}try{window.speechSynthesis?.cancel()}catch{}};
const handle=raw=>{const q=clean(raw);if(!isNearest(q))return false;const ctx=context();if(ctx?.active&&ctx.domain==='MAPS'){
 const results=[...document.querySelectorAll('#mapResults .place-result[data-jarvis-map-v25]')];
 if(results.length){const first=results[0],name=clean(first.querySelector('strong')?.textContent||'').replace(/^\d+\.\s*/,'');stop();first.click();speak(name?`The nearest option is ${name}.`:'The nearest option is the first result.');return true}
 stop();speak('I have not got a restaurant result to compare yet.');return true;
 }
 return false;
};
const submit=e=>{const form=e.target?.closest?.('#commandForm');if(!form)return;const input=form.querySelector('#commandInput');const q=input?.value||'';if(!handle(q))return;e.preventDefault();e.stopImmediatePropagation()};
const voice=e=>{const q=e.detail?.text||'';if(!handle(q))return;e.preventDefault();e.stopImmediatePropagation()};
document.addEventListener('submit',submit,true);window.addEventListener('jarvis:voice-command',voice,true);
window.jarvisMapFollowup={handle};
})();
