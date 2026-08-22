(()=>{
'use strict';
if(window.__JARVIS_WEATHER_INTENT_FIX__)return;
window.__JARVIS_WEATHER_INTENT_FIX__=true;
const currentLocation=/\b(on me|near me|around me|by me|where i am|where i\s*am|my location|current location|here|nearby)\b/i;
const weatherWords=/\b(weather|temperature|forecast|how hot|how cold)\b/gi;
const questionWords=/\b(what|what's|whats|is|the|how|today|right now|like|on)\b/gi;
const extract=raw=>{
 const q=String(raw||'').trim();
 if(!q)return 'current location';
 if(currentLocation.test(q)){
   const cleaned=q.replace(weatherWords,' ').replace(questionWords,' ').replace(currentLocation,' ').replace(/[?!.,]+/g,' ').replace(/\s+/g,' ').trim();
   const explicit=cleaned.match(/\b(?:in|at|for)\s+(.+)$/i)?.[1]?.trim();
   return explicit||'current location';
 }
 let p=q.replace(weatherWords,' ').replace(/\b(what(?:\s+is|['’]s|s)?|how|today|right now|like)\b/gi,' ').replace(/^\s*(in|at|for|of)\s+/i,'').replace(/\s+/g,' ').trim();
 return p||'current location';
};
const wrap=()=>{
 const eventName='jarvis:weather';
 if(window.__JARVIS_WEATHER_DISPATCH_WRAPPED__)return;
 window.__JARVIS_WEATHER_DISPATCH_WRAPPED__=true;
 const original=window.dispatchEvent.bind(window);
 window.dispatchEvent=event=>{
   try{if(event?.type===eventName&&event.detail){event.detail={...event.detail,place:extract(event.detail.place||event.detail.text||'')}}}catch{}
   return original(event);
 };
};
const fixCommandInput=()=>{
 const form=document.querySelector('#commandForm'),input=form?.querySelector('#commandInput');
 if(!form||!input||form.dataset.weatherIntentFix==='1')return;
 form.dataset.weatherIntentFix='1';
 form.addEventListener('submit',()=>{
   const q=input.value||'';
   if(/\b(weather|temperature|forecast|how hot|how cold)\b/i.test(q)&&currentLocation.test(q)){
     window.setTimeout(()=>{try{window.dispatchEvent(new CustomEvent('jarvis:weather',{detail:{place:extract(q)}}))}catch{}},0);
   }
 },true);
};
wrap();fixCommandInput();new MutationObserver(()=>{fixCommandInput()}).observe(document.documentElement,{childList:true,subtree:true});
window.jarvisExtractWeatherLocation=extract;
})();
