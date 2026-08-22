(()=>{
'use strict';
if(window.__JARVIS_MAP_HARD_OVERRIDE__)return;
window.__JARVIS_MAP_HARD_OVERRIDE__=true;

// LAST-LINE MAP AUTHORITY: local Bhubaneswar aliases must beat every
// third-party geocoder result, including stale/cached Nominatim results.
const A=[
 {k:/^jagannath\s+nagar$/i,n:'Jagannath Nagar',d:'Jharapada, Bhubaneswar, Odisha 751010',lat:20.2923,lon:85.8638},
 {k:/^jagannath\s+nagar\s+(?:bhubaneswar|bbsr)$/i,n:'Jagannath Nagar',d:'Jharapada, Bhubaneswar, Odisha 751010',lat:20.2923,lon:85.8638},
 {k:/^ggp\s+colony$/i,n:'GGP Colony',d:'Jagannath Nagar, Rasulgarh, Bhubaneswar, Odisha 751025',lat:20.2934,lon:85.8659},
 {k:/^maa\s+enclave$/i,n:'Maa Enclave',d:'Jagannath Nagar, Jharapada, Bhubaneswar, Odisha',lat:20.2923,lon:85.8638},
 {k:/^jharapada$/i,n:'Jharapada',d:'Bhubaneswar, Odisha',lat:20.2910,lon:85.8680}
];
const norm=s=>String(s||'').replace(/^(?:please\s+)?(?:search|find|look up|show me|show|locate|open maps? for|take me to|take me|navigate me to|navigate to|directions? to|go to)\s+/i,'').replace(/\s+/g,' ').trim();
const hit=s=>A.find(a=>a.k.test(norm(s)))||null;
const render=()=>{
 const input=document.querySelector('#mapQuery'),results=document.querySelector('#mapResults'),frame=document.querySelector('#mapFrame');
 if(!(input instanceof HTMLInputElement)||!results||!frame)return;
 const a=hit(input.value);if(!a)return;
 const signature=`${a.n}|${a.lat}|${a.lon}`;
 if(input.dataset.jarvisCanonical===signature && results.dataset.jarvisCanonical===signature)return;
 input.dataset.jarvisCanonical=signature;
 results.dataset.jarvisCanonical=signature;
 results.innerHTML=`<div style="margin:7px 2px;color:var(--muted,#78939c);font-size:11px">1 LOCATION FOUND · JARVIS LOCAL AUTHORITY</div><button type="button" class="place-result" data-jarvis-canonical><strong>1. ${a.n}</strong><small>${a.d}</small></button>`;
 const d=.012,bbox=`${a.lon-d},${a.lat-d},${a.lon+d},${a.lat+d}`;
 frame.innerHTML=`<iframe title="JARVIS map for ${a.n}" loading="lazy" style="border:0;width:100%;height:100%;min-height:280px" src="https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${a.lat},${a.lon}`)}"></iframe>`;
};
const reset=()=>{const i=document.querySelector('#mapQuery');if(i instanceof HTMLInputElement&&!hit(i.value)){delete i.dataset.jarvisCanonical;}};
const guardClick=e=>{const t=e.target instanceof Element?e.target.closest('#mapSearch'):null;if(!t)return;const i=document.querySelector('#mapQuery');if(i instanceof HTMLInputElement&&hit(i.value)){e.preventDefault();e.stopImmediatePropagation();render();}};
document.addEventListener('input',()=>{reset();requestAnimationFrame(render)},true);
document.addEventListener('change',()=>requestAnimationFrame(render),true);
document.addEventListener('click',guardClick,true);
new MutationObserver(()=>requestAnimationFrame(render)).observe(document.documentElement,{childList:true,subtree:true});
window.setInterval(render,150);
window.addEventListener('pageshow',()=>requestAnimationFrame(render));
window.addEventListener('load',()=>requestAnimationFrame(render));
})();
