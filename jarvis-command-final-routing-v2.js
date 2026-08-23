(()=>{
'use strict';
if(window.__JARVIS_COMMAND_FINAL_ROUTING_V2__)return;
window.__JARVIS_COMMAND_FINAL_ROUTING_V2__=true;
const isPoi=/\b(?:show\s+me|show|find|locate|where\s+are|look\s+for)\b[\s\S]*\b(?:restaurants?|resturants?|caf(?:e|es)|hospitals?|pharmacies?|hotels?|schools?|banks?|atms?|petrol(?:\s+stations?)?|fuel|gyms?|supermarkets?|temples?)\b[\s\S]*\b(?:in|near|around|at)\b/i;
const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
const extract=s=>{let q=normalize(s).replace(/^\s*(?:please\s+)?(?:show\s+me|show|find|locate|where\s+are|look\s+for)\s+/i,'').trim();return q.replace(/\bresturants?\b/ig,'restaurants')};
const stopVoice=()=>{try{window.jarvisStopIOSVoice?.()}catch{};try{window.dispatchEvent(new Event('jarvis:force-stop-voice'))}catch{}};
const openGoogleMaps=query=>{stopVoice();window.location.assign('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query))};
const interceptSubmit=e=>{const form=e.target;if(!(form instanceof HTMLFormElement)||form.id!=='commandForm')return;const input=form.querySelector('#commandInput');const raw=input instanceof HTMLInputElement?normalize(input.value):'';if(!raw||!isPoi.test(raw))return;e.preventDefault();e.stopImmediatePropagation();openGoogleMaps(extract(raw))};
const interceptVoice=e=>{const raw=normalize(e.detail?.text);if(!raw||!isPoi.test(raw))return;e.preventDefault();e.stopImmediatePropagation();openGoogleMaps(extract(raw))};
document.addEventListener('submit',interceptSubmit,true);
window.addEventListener('jarvis:voice-command',interceptVoice,true);
})();