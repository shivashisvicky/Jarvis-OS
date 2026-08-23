(()=>{
'use strict';
if(window.__JARVIS_COMMAND_FINAL_ROUTING_V1__)return;
window.__JARVIS_COMMAND_FINAL_ROUTING_V1__=true;

const isPoi=/\b(?:show\s+me|show|find|locate|where\s+are|look\s+for)\b[\s\S]*\b(?:restaurants?|resturants?|caf(?:e|es)|hospitals?|pharmacies?|hotels?|schools?|banks?|atms?|petrol(?:\s+stations?)?|fuel|gyms?|supermarkets?|temples?)\b[\s\S]*\b(?:in|near|around|at)\b/i;
const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
const extract=s=>{
 let q=normalize(s).replace(/^\s*(?:please\s+)?(?:show\s+me|show|find|locate|where\s+are|look\s+for)\s+/i,'').trim();
 q=q.replace(/\bresturants?\b/ig,'restaurants');
 return q;
};
const waitForMaps=async query=>{
 const deadline=Date.now()+4000;
 while(Date.now()<deadline){
  const nav=document.querySelector('.nav[data-app="maps"]');
  if(nav instanceof HTMLElement){
   nav.click();
   let tries=0;
   while(tries++<80){
    const input=document.querySelector('#mapQuery');
    const button=document.querySelector('#mapSearch');
    if(input instanceof HTMLInputElement && button instanceof HTMLButtonElement){
      input.value=query;
      input.dispatchEvent(new Event('input',{bubbles:true}));
      button.click();
      return true;
    }
    await new Promise(r=>setTimeout(r,50));
   }
   return false;
  }
  await new Promise(r=>setTimeout(r,50));
 }
 return false;
};
const interceptSubmit=e=>{
 const form=e.target;
 if(!(form instanceof HTMLFormElement)||form.id!=='commandForm')return;
 const input=form.querySelector('#commandInput');
 const raw=input instanceof HTMLInputElement?normalize(input.value):'';
 if(!raw||!isPoi.test(raw))return;
 e.preventDefault();
 e.stopImmediatePropagation();
 const query=extract(raw);
 void waitForMaps(query);
};
const interceptVoice=e=>{
 const raw=normalize(e.detail?.text);
 if(!raw||!isPoi.test(raw))return;
 e.preventDefault();
 e.stopImmediatePropagation();
 const query=extract(raw);
 void waitForMaps(query);
};
document.addEventListener('submit',interceptSubmit,true);
window.addEventListener('jarvis:voice-command',interceptVoice,true);
})();
