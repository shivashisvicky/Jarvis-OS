(()=>{
'use strict';
if(window.__JARVIS_MAP_FOLLOWUP_AUTHORITY_V5__)return;
window.__JARVIS_MAP_FOLLOWUP_AUTHORITY_V5__=true;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const isNearest=q=>{
 const s=clean(q).replace(/[?.!]+$/,'').trim();
 return /^(?:what(?:'s|s| is)\s+(?:the\s+)?(?:nearest|closest)(?:\s+(?:one|restaurant|place|option))?|which\s+is\s+(?:the\s+)?(?:nearest|closest)(?:\s+(?:one|restaurant|place|option))?|what\s+is\s+(?:the\s+)?(?:nearest|closest)(?:\s+(?:one|restaurant|place|option))?|(?:which|what)\s+(?:one|restaurant|place|option)(?:\s+of\s+(?:these|them))?\s+(?:is\s+)?(?:the\s+)?(?:nearest|closest)(?:\s+(?:one|restaurant|place|option))?|(?:which|what)\s+(?:restaurant|place|option)\s+(?:is\s+)?(?:the\s+)?(?:nearest|closest)|(?:which|what)\s+(?:one|restaurant|place|option)\s+is\s+(?:the\s+)?(?:nearest|closest)|(?:which|what)\s+(?:of\s+(?:these|them)\s+)?(?:the\s+)?(?:nearest|closest)\s+(?:one|restaurant|place|option)?|(?:the\s+)?(?:nearest|closest)\s+(?:one|restaurant|place|option)\s+to\s+(?:me|here))$/i.test(s);
};
const isThere=q=>/^(?:take|bring)\s+me\s+(?:there|to\s+that\s+one|to\s+the\s+(?:nearest|closest)\s+one)|^(?:navigate|go)\s+(?:there|to\s+that\s+one)|^(?:show|open)\s+(?:that\s+one|the\s+(?:nearest|closest)\s+one)\s+(?:on\s+maps?|in\s+maps?)?$/i.test(clean(q).replace(/[?.!]+$/,'').trim()) || /^(?:there|that one|that)$/i.test(clean(q).replace(/[?.!]+$/,'').trim());
const context=()=>{try{return window.jarvisContextEngine?.get?.()||null}catch{return null}};
const mapContext=()=>{try{return window.jarvisMapAuthority?.getContext?.()||null}catch{return null}};
const nearestFrom=results=>Array.isArray(results)&&results.length?results.reduce((best,x)=>{const bd=Number(best?.distance),xd=Number(x?.distance);return Number.isFinite(xd)&&(!Number.isFinite(bd)||xd<bd)?x:best},results[0]):null;
const selectedFrom=(ctx,mc)=>ctx?.selected||mc?.selected||null;
const speak=text=>{const cleanText=clean(text);if(!cleanText)return;const el=document.querySelector('#jarvisReply');if(el){el.textContent=cleanText;el.classList.add('visible')}try{window.jarvisVoiceAuthoritySpeak?.(cleanText)||window.jarvisCinematicSpeak?.(cleanText)||window.jarvisSpeak?.(cleanText)}catch{}};
const stop=()=>{try{window.jarvisStopAllVoiceSessions?.()}catch{}try{window.jarvisStopIOSVoice?.()}catch{}try{window.speechSynthesis?.cancel()}catch{}};
const focusExact=result=>{
 const name=clean(result?.name||result?.title||result?.display_name||'');
 const lat=Number(result?.lat),lon=Number(result?.lon);
 if(!name||!Number.isFinite(lat)||!Number.isFinite(lon))return false;
 const nav=document.querySelector('.nav[data-app="maps"]');
 if(nav instanceof HTMLElement&&!nav.classList.contains('selected'))nav.click();
 let tries=0;
 const apply=()=>{
  const input=document.querySelector('#mapQuery');
  const frame=document.querySelector('#mapFrame');
  if(!(input instanceof HTMLInputElement)||!(frame instanceof HTMLElement)){
   if(++tries<100)window.setTimeout(apply,40);
   return;
  }
  input.value=name;
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
  const z=.006,b=`${lon-z},${lat-z},${lon+z},${lat+z}`;
  frame.style.display='block';
  frame.innerHTML=`<iframe title="JARVIS pinpoint for ${name.replace(/"/g,'&quot;')}" loading="eager" style="border:0;width:100%;height:100%;min-height:280px" src="https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(b)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lon}`)}"></iframe>`;
 };
 window.setTimeout(apply,0);
 return true;
};
const navigateTo=result=>{
 const name=clean(result?.name||result?.title||result?.display_name||'');
 if(!name)return false;
 stop();
 try{window.jarvisContextEngine?.set?.({domain:'MAPS',active:true,selected:{...result}},'merge')}catch{}
 if(focusExact(result))return true;
 const input=document.querySelector('#mapQuery');
 if(input instanceof HTMLInputElement){input.value=name;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))}
 try{window.dispatchEvent(new CustomEvent('jarvis:map-intent',{detail:{place:name,query:name,source:'map-followup'}}));return true}catch{return false}
};
const handle=raw=>{
 const q=clean(raw);const ctx=context();const mc=mapContext();
 const activeMaps=(ctx?.active&&ctx.domain==='MAPS')||mc?.domain==='MAPS';
 if(!activeMaps)return false;
 if(isThere(q)){
  const selected=selectedFrom(ctx,mc)||nearestFrom((ctx?.results?.length?ctx.results:mc?.results)||[]);
  if(selected&&navigateTo(selected)){speak(`Taking you to ${clean(selected.name||selected.title||selected.display_name)}.`);return true}
  stop();speak('I do not have a selected map result to navigate to yet.');return true;
 }
 if(!isNearest(q))return false;
 const result=nearestFrom((ctx?.results?.length?ctx.results:mc?.results)||[]);
 if(result){stop();try{window.jarvisContextEngine?.set?.({domain:'MAPS',active:true,selected:{...result}},'merge')}catch{}speak(`The nearest option is ${clean(result.name)}${Number.isFinite(Number(result.distance))?`, ${Number(result.distance)<1?(Number(result.distance)*1000).toFixed(0)+' metres':Number(result.distance).toFixed(1)+' kilometres'} away`:''}.`);return true}
 stop();speak('I have not got a restaurant result to compare yet.');return true
};
const submit=e=>{const form=e.target?.closest?.('#commandForm');if(!form)return;const input=form.querySelector('#commandInput');const q=input?.value||'';if(!handle(q))return;e.preventDefault();e.stopImmediatePropagation()};
const voice=e=>{const q=e.detail?.text||'';if(handle(q)){e.preventDefault();e.stopImmediatePropagation()}};
document.addEventListener('submit',submit,true);window.addEventListener('jarvis:voice-command',voice,true);
window.jarvisMapFollowup={handle};
})();
