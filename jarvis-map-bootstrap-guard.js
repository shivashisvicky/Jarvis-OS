(()=>{
'use strict';
if(window.__JARVIS_MAP_BOOTSTRAP_GUARD__)return;
window.__JARVIS_MAP_BOOTSTRAP_GUARD__=true;
const A={name:'Jagannath Nagar',detail:'Jharapada, Bhubaneswar, Odisha 751010',lat:20.2923,lon:85.8638};
const clean=s=>String(s||'').replace(/^(?:please\s+)?(?:search|find|look up|show me|show|locate|open maps? for|take me to|take me|navigate me to|navigate to|directions? to|go to)\s+/i,'').replace(/\s+/g,' ').trim();
const isCanonical=s=>/^jagannath\s+nagar(?:\s+(?:bhubaneswar|bbsr))?$/i.test(clean(s));
const render=()=>{
 const input=document.querySelector('#mapQuery'),results=document.querySelector('#mapResults'),frame=document.querySelector('#mapFrame');
 if(!(input instanceof HTMLInputElement)||!results||!frame||!isCanonical(input.value))return false;
 input.value='jagannath nagar';
 const sig='jagannath-nagar-bhubaneswar';
 if(results.dataset.jarvisBootstrap===sig&&frame.dataset.jarvisBootstrap===sig)return true;
 results.dataset.jarvisBootstrap=sig;frame.dataset.jarvisBootstrap=sig;
 results.innerHTML='<div style="margin:7px 2px;color:var(--muted,#78939c);font-size:11px">1 LOCATION FOUND · JARVIS LOCAL AUTHORITY</div><button type="button" class="place-result" data-jarvis-bootstrap-canonical><strong>1. Jagannath Nagar</strong><small>Jharapada, Bhubaneswar, Odisha 751010</small></button>';
 const d=.012,bbox=`${A.lon-d},${A.lat-d},${A.lon+d},${A.lat+d}`;
 frame.innerHTML=`<iframe title="JARVIS map for Jagannath Nagar" loading="lazy" style="border:0;width:100%;height:100%;min-height:280px" src="https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${A.lat},${A.lon}`)}"></iframe>`;
 return true;
};
const guard=e=>{
 const t=e.target instanceof Element?e.target.closest('#mapSearch'):null;
 if(!t)return;
 const input=document.querySelector('#mapQuery');
 if(input instanceof HTMLInputElement&&isCanonical(input.value)){e.preventDefault();e.stopImmediatePropagation();render();}
};
document.addEventListener('click',guard,true);
document.addEventListener('input',e=>{
 const t=e.target;
 if(!(t instanceof HTMLInputElement)||t.id!=='mapQuery'||!isCanonical(t.value))return;
 e.stopImmediatePropagation();
 requestAnimationFrame(render);
},true);
document.addEventListener('change',()=>requestAnimationFrame(render),true);
new MutationObserver(()=>requestAnimationFrame(render)).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',()=>requestAnimationFrame(render));
window.addEventListener('load',()=>requestAnimationFrame(render));
})();
