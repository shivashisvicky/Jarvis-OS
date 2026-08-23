(()=>{
'use strict';
if(window.__JARVIS_POI_COMMAND_FIX_V2__)return;
window.__JARVIS_POI_COMMAND_FIX_V2__=true;

const poi=/\b(?:restaurants?|caf(?:e|es)|hospitals?|pharmacies?|hotels?|schools?|banks?|atms?|petrol(?:\s+stations?)?|fuel|gyms?|supermarkets?|temples?)\b/i;
const localVerb=/\b(?:show me|show|find|locate|where are|nearby|look for)\b/i;
const placeCue=/\b(?:in|near|around|at)\s+.+/i;
const alreadyMaps=/\b(?:take me to|navigate(?: me)?(?: to)?|directions? to|go to|open maps?)\b/i;

const route=(raw,event)=>{
 const normalized=String(raw||'').replace(/\s+/g,' ').trim();
 if(!normalized||alreadyMaps.test(normalized)||!localVerb.test(normalized)||!poi.test(normalized)||!placeCue.test(normalized))return false;
 const stripped=normalized.replace(/^\s*(?:please\s+)?(?:show me|show|find|locate|where are|look for)\s+/i,'').trim();
 if(!stripped)return false;
 event?.preventDefault();
 event?.stopImmediatePropagation();
 const nav=document.querySelector('.nav[data-app="maps"]');
 if(nav instanceof HTMLElement)nav.click();
 window.setTimeout(()=>{
   window.dispatchEvent(new CustomEvent('jarvis:map-intent',{detail:{place:stripped,query:normalized,source:'poi-command'},cancelable:true}));
 },0);
 return true;
};

document.addEventListener('submit',event=>{
 const form=event.target;
 if(!(form instanceof HTMLFormElement)||form.id!=='commandForm')return;
 const input=form.querySelector('#commandInput');
 if(!(input instanceof HTMLInputElement))return;
 route(input.value,event);
},true);

window.addEventListener('jarvis:voice-command',event=>{
 const raw=String(event.detail?.text||'').trim();
 if(route(raw,event))event.preventDefault();
},true);
})();
