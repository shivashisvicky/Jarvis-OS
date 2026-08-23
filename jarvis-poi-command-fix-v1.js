(()=>{
'use strict';
if(window.__JARVIS_POI_COMMAND_FIX_V1__)return;
window.__JARVIS_POI_COMMAND_FIX_V1__=true;
const poi=/\b(?:restaurants?|caf(?:e|es)|hospitals?|pharmacies?|hotels?|schools?|banks?|atms?|petrol(?:\s+stations?)?|fuel|gyms?|supermarkets?|temples?)\b/i;
const localVerb=/\b(?:show me|show|find|locate|where are|nearby|look for)\b/i;
const placeCue=/\b(?:in|near|around|at)\s+.+/i;
const alreadyMaps=/\b(?:take me to|navigate(?: me)?(?: to)?|directions? to|go to|open maps?)\b/i;
document.addEventListener('submit',event=>{
 const form=event.target;
 if(!(form instanceof HTMLFormElement)||form.id!=='commandForm')return;
 const input=form.querySelector('#commandInput');
 if(!(input instanceof HTMLInputElement))return;
 const raw=input.value.trim();
 if(!raw||alreadyMaps.test(raw)||!localVerb.test(raw)||!poi.test(raw)||!placeCue.test(raw))return;
 // Turn a local POI request into a map-intent command while preserving the
 // original keyword and place. The map authority then performs a nearby OSM
 // keyword query instead of sending the phrase to generic web search.
 const normalized=raw.replace(/^\s+/,'').replace(/\s+/g,' ').trim();
 const stripped=normalized.replace(/^(?:please\s+)?(?:show me|show|find|locate|where are|look for)\s+/i,'').trim();
 input.value=`navigate to ${stripped}`;
 input.dataset.jarvisPoiRouted='1';
},true);
})();
