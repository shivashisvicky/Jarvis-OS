(()=>{
'use strict';
if(window.__JARVIS_MAP_FOLLOWUP_AUTHORITY_V2__)return;
window.__JARVIS_MAP_FOLLOWUP_AUTHORITY_V2__=true;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const isNearest=q=>/^(?:what(?:'s| is)\s+)?(?:the\s+)?(?:nearest|closest)\s+(?:one|restaurant|place|option)s?\s*[?.!]*$/i.test(clean(q))||/^(?:which|what)\s+(?:one|restaurant|place|option)\s+is\s+(?:the\s+)?(?:nearest|closest)(?:\s+(?:one|restaurant|place|option))?\s*[?.!]*$/i.test(clean(q));
const context=()=>{try{return window.jarvisContextEngine?.get?.()||null}catch{return null}};
const mapContext=()=>{try{return window.jarvisMapAuthority?.getContext?.()||null}catch{return null}};
const nearestFrom=results=>Array.isArray(results)&&results.length?results.reduce((best,x)=>Number(x?.distance)<Number(best?.distance)?x:best,results[0]):null;
const speak=text=>{const cleanText=clean(text);if(!cleanText)return;const el=document.querySelector('#jarvisReply');if(el){el.textContent=cleanText;el.classList.add('visible')}try{window.jarvisVoiceAuthoritySpeak?.(cleanText)||window.jarvisCinematicSpeak?.(cleanText)||window.jarvisSpeak?.(cleanText)}catch{}};
const stop=()=>{try{window.jarvisStopAllVoiceSessions?.()}catch{}try{window.jarvisStopIOSVoice?.()}catch{}try{window.speechSynthesis?.cancel()}catch{}};
const handle=raw=>{const q=clean(raw);if(!isNearest(q))return false;const ctx=context();const mc=mapContext();const activeMaps=(ctx?.active&&ctx.domain==='MAPS')||mc?.domain==='MAPS';if(!activeMaps)return false;const result=nearestFrom((ctx?.results?.length?ctx.results:mc?.results)||[]);if(result){stop();try{window.jarvisContextEngine?.set?.({domain:'MAPS',selected:{...result}},'merge')}catch{}speak(`The nearest option is ${clean(result.name)}${Number.isFinite(Number(result.distance))?`, ${Number(result.distance)<1?(Number(result.distance)*1000).toFixed(0)+' metres':Number(result.distance).toFixed(1)+' kilometres'} away`:''}.`);return true}stop();speak('I have not got a restaurant result to compare yet.');return true};
const submit=e=>{const form=e.target?.closest?.('#commandForm');if(!form)return;const input=form.querySelector('#commandInput');const q=input?.value||'';if(!handle(q))return;e.preventDefault();e.stopImmediatePropagation()};
const voice=e=>{const q=e.detail?.text||'';if(handle(q)){e.preventDefault();e.stopImmediatePropagation()}};
document.addEventListener('submit',submit,true);window.addEventListener('jarvis:voice-command',voice,true);
window.jarvisMapFollowup={handle};
})();
