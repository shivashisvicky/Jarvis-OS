(()=>{
'use strict';
if(window.__JARVIS_MAP_COMMAND_RACE_FIX_V1__)return;
window.__JARVIS_MAP_COMMAND_RACE_FIX_V1__=true;

const clean=s=>String(s||'').replace(/^(?:please\s+)?(?:search|find|look up|show me|show|locate|open maps? for|take me to|take me|navigate me to|navigate to|directions? to|go to)\s+/i,'').replace(/\s+/g,' ').trim();
const mapIntent=s=>/\b(map|maps|directions|navigate|location|take me to|go to)\b/i.test(String(s||''));
let pending='';let settleTimer=0;let lastInput=null;
const apply=()=>{
 if(!pending)return;
 const input=document.querySelector('#mapQuery');
 if(!(input instanceof HTMLInputElement))return;
 if(input!==lastInput){lastInput=input;if(settleTimer)window.clearTimeout(settleTimer);settleTimer=window.setTimeout(()=>{
   settleTimer=0;
   const current=document.querySelector('#mapQuery');
   if(current instanceof HTMLInputElement&&current===lastInput&&pending){
     const q=pending;
     current.value=q;
     current.dataset.jarvisMapRaceFix='v1';
     const results=document.querySelector('#mapResults');
     const button=document.querySelector('#mapSearch');
     if(results)results.dataset.jarvisMapRaceQuery=q;
     if(button instanceof HTMLButtonElement){
       button.click();
     }else{
       const event=new Event('input',{bubbles:true,cancelable:true});
       current.dispatchEvent(event);
     }
     pending='';
   }
 },250);
 }
};
const queue=q=>{pending=clean(q);lastInput=null;if(settleTimer)window.clearTimeout(settleTimer);apply();};

const originalDispatch=window.dispatchEvent.bind(window);
window.dispatchEvent=function(event){
 try{
  if(event instanceof CustomEvent){
   if(event.type==='jarvis:maps'){
    const q=clean(String(event.detail?.place||event.detail?.query||''));
    if(q){queue(q);return true;}
   }
   if(event.type==='jarvis:map-intent'){
    const q=clean(String(event.detail?.place||event.detail?.query||''));
    if(q){queue(q);return true;}
   }
   if(event.type==='jarvis:voice-command'){
    const raw=String(event.detail?.text||'').trim();
    if(mapIntent(raw)){
      const q=clean(raw);
      if(q)queue(q);
      return true;
    }
   }
  }
 }catch{}
 return originalDispatch(event);
};

new MutationObserver(()=>apply()).observe(document.documentElement,{childList:true,subtree:true});
window.setTimeout(apply,0);
window.setTimeout(apply,300);
window.setTimeout(apply,800);
})();
