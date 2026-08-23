(()=>{
'use strict';
if(window.__JARVIS_COMMAND_FINAL_ROUTING_V3__)return;
window.__JARVIS_COMMAND_FINAL_ROUTING_V3__=true;

// POI voice/text commands stay entirely inside the JARVIS Maps module.
// "to <place>" is valid POI destination phrasing (e.g. "show me restaurants to Jagannath Nagar").
// Never hand these searches off to the external Web/Search Hub.
const isPoi=/\b(?:show\s+me|show|find|locate|where\s+are|look\s+for)\b[\s\S]*\b(?:restaurants?|resturants?|caf(?:e|es)|hospitals?|pharmacies?|hotels?|schools?|banks?|atms?|petrol(?:\s+stations?)?|fuel|gyms?|supermarkets?|temples?)\b[\s\S]*\b(?:in|near|around|at|to)\b/i;
const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
const extract=s=>{
  let q=normalize(s).replace(/^\s*(?:please\s+)?(?:show\s+me|show|find|locate|where\s+are|look\s+for)\s+/i,'').trim();
  q=q.replace(/\bresturants?\b/ig,'restaurants');
  return q;
};
const stopVoice=()=>{try{window.jarvisStopIOSVoice?.()}catch{};try{window.dispatchEvent(new Event('jarvis:force-stop-voice'))}catch{}};
const openJarvisMaps=query=>{
  stopVoice();
  const nav=document.querySelector('.nav[data-app="maps"]);
  if(nav instanceof HTMLElement)nav.click();
  window.setTimeout(()=>window.dispatchEvent(new CustomEvent('jarvis:map-intent',{detail:{place:query,query,source:'poi-command'},cancelable:true})),0);
};
const interceptSubmit=e=>{
  const form=e.target;
  if(!(form instanceof HTMLFormElement)||form.id!=='commandForm')return;
  const input=form.querySelector('#commandInput');
  const raw=input instanceof HTMLInputElement?normalize(input.value):'';
  if(!raw||!isPoi.test(raw))return;
  e.preventDefault();
  e.stopImmediatePropagation();
  openJarvisMaps(extract(raw));
};
const interceptVoice=e=>{
  const raw=normalize(e.detail?.text);
  if(!raw||!isPoi.test(raw))return;
  e.preventDefault();
  e.stopImmediatePropagation();
  openJarvisMaps(extract(raw));
};
document.addEventListener('submit',interceptSubmit,true);
window.addEventListener('jarvis:voice-command',interceptVoice,true);
})();
