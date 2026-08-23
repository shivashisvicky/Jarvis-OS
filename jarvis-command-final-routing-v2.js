(()=>{
'use strict';
if(window.__JARVIS_COMMAND_FINAL_ROUTING_V4__)return;
window.__JARVIS_COMMAND_FINAL_ROUTING_V4__=true;
const isPoi=/\b(?:show\s+me|show|find|locate|where\s+are|look\s+for)\b[\s\S]*\b(?:restaurants?|resturants?|restaraunts?|restaurents?|restuarants?|resturents?|caf(?:e|es)|hospitals?|pharmacies?|hotels?|schools?|banks?|atms?|petrol(?:\s+stations?)?|fuel|gyms?|supermarkets?|temples?)\b[\s\S]*\b(?:in|near|around|at|to)\b/i;
const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
const extract=s=>{
 let q=normalize(s).replace(/^\s*(?:please\s+)?(?:show\s+me|show|find|locate|where\s+are|look\s+for)\s+/i,'').trim();
 q=q.replace(/\bresturants?\b/ig,'restaurants').replace(/\brestaraunts?\b/ig,'restaurants').replace(/\brestaurents?\b/ig,'restaurants').replace(/\brestuarants?\b/ig,'restaurants').replace(/\bresturents?\b/ig,'restaurants');
 if(/\b(?:restaurants?|caf(?:e|es)|hospitals?|pharmacies?|hotels?|schools?|banks?|atms?|petrol(?:\s+stations?)?|fuel|gyms?|supermarkets?|temples?)\b[\s\S]*\bto\b/i.test(q))q=q.replace(/\bto\b/i,'in');
 return q;
};
const stopVoice=()=>{try{window.jarvisStopIOSVoice?.()}catch{}try{window.dispatchEvent(new Event('jarvis:force-stop-voice'))}catch{}};
const openJarvisMaps=query=>{stopVoice();const nav=document.querySelector('.nav[data-app="maps"]');if(nav instanceof HTMLElement&&!nav.classList.contains('selected'))nav.click();window.setTimeout(()=>window.dispatchEvent(new CustomEvent('jarvis:map-intent',{detail:{place:query,query,source:'poi-command'},cancelable:true})),0)};
const interceptSubmit=e=>{const form=e.target;if(!(form instanceof HTMLFormElement)||form.id!=='commandForm')return;const input=form.querySelector('#commandInput');const raw=input instanceof HTMLInputElement?normalize(input.value):'';if(!raw||!isPoi.test(raw))return;e.preventDefault();e.stopImmediatePropagation();openJarvisMaps(extract(raw))};
const interceptVoice=e=>{const raw=normalize(e.detail?.text);if(!raw||!isPoi.test(raw))return;e.preventDefault();e.stopImmediatePropagation();openJarvisMaps(extract(raw))};
document.addEventListener('submit',interceptSubmit,true);window.addEventListener('jarvis:voice-command',interceptVoice,true);
})();
